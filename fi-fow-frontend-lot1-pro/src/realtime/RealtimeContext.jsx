import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { io } from 'socket.io-client'
import { API_ORIGIN } from '../api/config.js'
import { getAccessToken, refreshAccessToken } from '../api/http.js'
import { useAuth } from '../auth/AuthContext.jsx'
import {
  initialRealtimeQueryKeys,
  queryKeysForRealtimeEvent,
  realtimeEvents,
} from './realtimeInvalidation.js'

const RealtimeContext = createContext(null)
const socketAuthErrors = new Set(['AUTH_REQUIRED', 'INVALID_TOKEN', 'SESSION_NOT_AVAILABLE'])
const invalidationBatchDelay = 80

function browserIsOnline() {
  return typeof navigator === 'undefined' || navigator.onLine !== false
}

function socketErrorCode(error) {
  return error?.data?.code || error?.code || error?.message || ''
}

export function RealtimeProvider({ children }) {
  const auth = useAuth()
  const queryClient = useQueryClient()
  const socketRef = useRef(null)
  const pendingKeysRef = useRef(new Map())
  const invalidationTimerRef = useRef(null)
  const onlineRef = useRef(browserIsOnline())
  const [status, setStatus] = useState('disconnected')
  const [isOnline, setIsOnline] = useState(onlineRef.current)
  const [lastEventAt, setLastEventAt] = useState(null)

  const clearPendingInvalidations = useCallback(() => {
    if (invalidationTimerRef.current) clearTimeout(invalidationTimerRef.current)
    invalidationTimerRef.current = null
    pendingKeysRef.current.clear()
  }, [])

  const scheduleInvalidations = useCallback((keys) => {
    keys.forEach((queryKey) => {
      if (!Array.isArray(queryKey)) return
      pendingKeysRef.current.set(JSON.stringify(queryKey), queryKey)
    })

    if (!pendingKeysRef.current.size || invalidationTimerRef.current) return

    invalidationTimerRef.current = setTimeout(() => {
      const pendingKeys = [...pendingKeysRef.current.values()]
      pendingKeysRef.current.clear()
      invalidationTimerRef.current = null
      pendingKeys.forEach((queryKey) => {
        void queryClient.invalidateQueries({ queryKey })
      })
    }, invalidationBatchDelay)
  }, [queryClient])

  useEffect(() => clearPendingInvalidations, [clearPendingInvalidations])

  useEffect(() => {
    if (!auth.isAuthenticated) {
      clearPendingInvalidations()
      socketRef.current?.disconnect()
      socketRef.current = null
      setStatus('disconnected')
      setLastEventAt(null)
      return undefined
    }

    const socket = io(API_ORIGIN, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      auth: (callback) => callback({ token: getAccessToken() }),
      reconnectionDelay: 800,
      reconnectionDelayMax: 5_000,
      randomizationFactor: 0.35,
    })
    socketRef.current = socket
    let refreshingToken = false

    const reconnectWithFreshToken = async () => {
      if (refreshingToken || socketRef.current !== socket || !onlineRef.current) return
      refreshingToken = true
      try {
        await refreshAccessToken()
        if (socketRef.current === socket && !socket.connected && onlineRef.current) {
          setStatus('connecting')
          socket.connect()
        }
      } catch {
        // AuthProvider handles the session when a refresh is no longer possible.
      } finally {
        refreshingToken = false
      }
    }

    const refreshRealtimeData = () => {
      setStatus('connected')
      setLastEventAt(new Date())
      scheduleInvalidations(initialRealtimeQueryKeys())
    }

    const markDisconnected = (reason) => {
      setStatus(onlineRef.current ? 'disconnected' : 'offline')
      if (reason === 'io server disconnect') void reconnectWithFreshToken()
    }

    const markReconnecting = () => {
      if (onlineRef.current) setStatus('reconnecting')
    }

    const handleConnectionError = (error) => {
      setStatus(onlineRef.current ? 'disconnected' : 'offline')
      if (socketAuthErrors.has(socketErrorCode(error))) void reconnectWithFreshToken()
    }

    const handleRealtimeEvent = (event) => (payload) => {
      setLastEventAt(new Date())
      scheduleInvalidations(queryKeysForRealtimeEvent(event, payload))
    }

    const reconnectWhenOnline = () => {
      onlineRef.current = true
      setIsOnline(true)
      if (socketRef.current !== socket || socket.connected) return
      setStatus('connecting')
      socket.connect()
    }

    const pauseWhenOffline = () => {
      onlineRef.current = false
      setIsOnline(false)
      setStatus('offline')
      socket.disconnect()
    }

    const reconnectWhenVisible = () => {
      if (document.visibilityState !== 'visible' || !onlineRef.current || socket.connected) return
      setStatus('connecting')
      socket.connect()
    }

    socket.on('connect', refreshRealtimeData)
    socket.io.on('reconnect', refreshRealtimeData)
    socket.io.on('reconnect_attempt', markReconnecting)
    socket.on('disconnect', markDisconnected)
    socket.on('connect_error', handleConnectionError)
    realtimeEvents.forEach((event) => socket.on(event, handleRealtimeEvent(event)))

    window.addEventListener('online', reconnectWhenOnline)
    window.addEventListener('offline', pauseWhenOffline)
    document.addEventListener('visibilitychange', reconnectWhenVisible)

    if (onlineRef.current) {
      setStatus('connecting')
      socket.connect()
    } else {
      setStatus('offline')
    }

    return () => {
      window.removeEventListener('online', reconnectWhenOnline)
      window.removeEventListener('offline', pauseWhenOffline)
      document.removeEventListener('visibilitychange', reconnectWhenVisible)
      socket.removeAllListeners()
      socket.io.removeAllListeners()
      socket.disconnect()
      if (socketRef.current === socket) socketRef.current = null
    }
  }, [auth.isAuthenticated, clearPendingInvalidations, scheduleInvalidations])

  const joinConversation = useCallback((conversationId) => {
    const socket = socketRef.current
    if (!socket?.connected || !conversationId) return () => {}
    socket.emit('conversation:join', { conversationId }, () => {})
    return () => socket.emit('conversation:leave', { conversationId })
  }, [])

  const emitTyping = useCallback((conversationId, typing) => {
    const socket = socketRef.current
    if (!socket?.connected || !conversationId) return
    socket.emit('conversation:typing', { conversationId, isTyping: Boolean(typing) })
  }, [])

  const subscribe = useCallback((event, handler) => {
    const socket = socketRef.current
    socket?.on(event, handler)
    return () => socket?.off(event, handler)
  }, [])

  const value = useMemo(() => ({
    status,
    isConnected: status === 'connected',
    isOnline,
    lastEventAt,
    joinConversation,
    emitTyping,
    subscribe,
  }), [status, isOnline, lastEventAt, joinConversation, emitTyping, subscribe])

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>
}

export function useRealtime() {
  const context = useContext(RealtimeContext)
  if (!context) throw new Error('useRealtime must be used inside RealtimeProvider.')
  return context
}

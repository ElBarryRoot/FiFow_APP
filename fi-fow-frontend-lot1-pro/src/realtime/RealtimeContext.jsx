import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { io } from 'socket.io-client'
import { API_ORIGIN } from '../api/config.js'
import { getAccessToken, refreshAccessToken } from '../api/http.js'
import { queryKeys } from '../api/queryKeys.js'
import { useAuth } from '../auth/AuthContext.jsx'

const RealtimeContext = createContext(null)
const socketAuthErrors = new Set(['AUTH_REQUIRED', 'INVALID_TOKEN', 'SESSION_NOT_AVAILABLE'])

export function RealtimeProvider({ children }) {
  const auth = useAuth()
  const queryClient = useQueryClient()
  const socketRef = useRef(null)
  const [status, setStatus] = useState('disconnected')

  useEffect(() => {
    if (!auth.isAuthenticated) {
      socketRef.current?.disconnect()
      socketRef.current = null
      setStatus('disconnected')
      return undefined
    }

    const socket = io(API_ORIGIN, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      auth: (callback) => callback({ token: getAccessToken() }),
      reconnectionDelay: 800,
      reconnectionDelayMax: 5_000,
    })
    socketRef.current = socket
    let refreshingToken = false

    const reconnectWithFreshToken = async () => {
      if (refreshingToken || socketRef.current !== socket) return
      refreshingToken = true
      try {
        await refreshAccessToken()
        if (socketRef.current === socket && !socket.connected) socket.connect()
      } catch {
        // Le client HTTP notifie AuthProvider si la session n’est plus récupérable.
      } finally {
        refreshingToken = false
      }
    }

    const refreshRealtimeData = () => {
      setStatus('connected')
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations })
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications })
    }
    const markDisconnected = (reason) => {
      setStatus('disconnected')
      if (reason === 'io server disconnect') void reconnectWithFreshToken()
    }
    const handleConnectionError = (error) => {
      setStatus('disconnected')
      if (socketAuthErrors.has(error?.message)) void reconnectWithFreshToken()
    }
    const invalidateConversations = (event) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversationList })
      if (event?.conversationId) queryClient.invalidateQueries({ queryKey: queryKeys.conversation(event.conversationId) })
    }
    const invalidateNotifications = (notification) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications })
      if (notification?.data?.conversationId) invalidateConversations(notification.data)
    }

    socket.on('connect', refreshRealtimeData)
    socket.io.on('reconnect', refreshRealtimeData)
    socket.on('disconnect', markDisconnected)
    socket.on('connect_error', handleConnectionError)
    socket.on('message:new', invalidateConversations)
    socket.on('message:read', invalidateConversations)
    socket.on('offer:new', invalidateConversations)
    socket.on('offer:updated', invalidateConversations)
    socket.on('notification:new', invalidateNotifications)
    socket.connect()

    return () => {
      socket.removeAllListeners()
      socket.io.removeAllListeners()
      socket.disconnect()
      if (socketRef.current === socket) socketRef.current = null
    }
  }, [auth.isAuthenticated, queryClient])

  const joinConversation = useCallback((conversationId) => {
    const socket = socketRef.current
    if (!socket?.connected) return () => {}
    socket.emit('conversation:join', { conversationId }, () => {})
    return () => socket.emit('conversation:leave', { conversationId })
  }, [])

  const emitTyping = useCallback((conversationId, typing) => {
    socketRef.current?.emit('conversation:typing', { conversationId, isTyping: Boolean(typing) })
  }, [])

  const subscribe = useCallback((event, handler) => {
    const socket = socketRef.current
    socket?.on(event, handler)
    return () => socket?.off(event, handler)
  }, [])

  const value = useMemo(() => ({ status, joinConversation, emitTyping, subscribe }), [status, joinConversation, emitTyping, subscribe])
  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>
}

export function useRealtime() {
  const context = useContext(RealtimeContext)
  if (!context) throw new Error('useRealtime doit être utilisé dans RealtimeProvider.')
  return context
}

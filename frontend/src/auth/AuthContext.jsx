import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { authApi } from '../api/auth.js'
import { clearAccessToken, onSessionExpired, setAccessToken } from '../api/http.js'
import { queryKeys } from '../api/queryKeys.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const queryClient = useQueryClient()
  const [state, setState] = useState({ status: 'booting', user: null, requiresEmailVerification: false })

  const becomeAnonymous = useCallback(() => {
    clearAccessToken()
    setState({ status: 'anonymous', user: null, requiresEmailVerification: false })
    queryClient.removeQueries({ queryKey: queryKeys.session })
  }, [queryClient])

  const applySession = useCallback((session) => {
    setAccessToken(session.accessToken)
    setState({
      status: 'authenticated',
      user: session.user,
      requiresEmailVerification: session.emailVerificationRequired ?? !session.user?.emailVerified,
    })
    if (session.user) queryClient.setQueryData(queryKeys.session, session.user)
  }, [queryClient])

  const refreshUser = useCallback(async () => {
    const user = await authApi.me()
    setState((current) => ({ ...current, user, requiresEmailVerification: !user.emailVerified }))
    queryClient.setQueryData(queryKeys.session, user)
    return user
  }, [queryClient])

  useEffect(() => onSessionExpired(becomeAnonymous), [becomeAnonymous])

  useEffect(() => {
    let active = true
    async function bootstrap() {
      try {
        const tokenSession = await authApi.refresh({ notify: false })
        if (!active) return
        const user = await authApi.me()
        if (!active) return
        applySession({ ...tokenSession, user })
      } catch {
        if (active) becomeAnonymous()
      }
    }
    bootstrap()
    return () => { active = false }
  }, [applySession, becomeAnonymous])

  const login = useCallback(async (credentials) => {
    const session = await authApi.login(credentials)
    applySession(session)
    return session
  }, [applySession])

  const register = useCallback(async (input) => {
    const session = await authApi.register(input)
    applySession(session)
    return session
  }, [applySession])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      becomeAnonymous()
      queryClient.clear()
    }
  }, [becomeAnonymous, queryClient])

  const logoutAll = useCallback(async () => {
    try {
      await authApi.logoutAll()
    } finally {
      becomeAnonymous()
      queryClient.clear()
    }
  }, [becomeAnonymous, queryClient])

  const changePassword = useCallback(async (input) => {
    const result = await authApi.changePassword(input)
    setAccessToken(result.accessToken)
    return result
  }, [])

  const value = useMemo(() => ({
    ...state,
    isAuthenticated: state.status === 'authenticated',
    login,
    register,
    logout,
    logoutAll,
    changePassword,
    refreshUser,
    setUser: (user) => setState((current) => ({ ...current, user })),
  }), [state, login, register, logout, logoutAll, changePassword, refreshUser])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth doit être utilisé dans AuthProvider.')
  return context
}

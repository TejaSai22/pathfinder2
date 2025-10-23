import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import * as api from './api'

export type AuthState = {
  user: api.User | null
  loading: boolean
  error: string | null
}

export type AuthContextValue = AuthState & {
  refresh: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string, role?: api.User['role']) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<api.User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      const u = await api.me()
      setUser(u)
    } catch (e: any) {
      setError(e?.message || 'Failed to load session')
    } finally {
      setLoading(false)
    }
  }

  async function doLogin(email: string, password: string) {
    setLoading(true)
    setError(null)
    try {
      const u = await api.login({ email, password })
      setUser(u)
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || 'Login failed')
      throw e
    } finally {
      setLoading(false)
    }
  }

  async function doRegister(name: string, email: string, password: string, role?: api.User['role']) {
    setLoading(true)
    setError(null)
    try {
      const u = await api.register({ name, email, password, role })
      setUser(u)
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || 'Registration failed')
      throw e
    } finally {
      setLoading(false)
    }
  }

  async function doLogout() {
    setLoading(true)
    setError(null)
    try {
      await api.logout()
      setUser(null)
    } catch (e: any) {
      setError(e?.message || 'Logout failed')
      throw e
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, error, refresh, login: doLogin, register: doRegister, logout: doLogout }),
    [user, loading, error],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

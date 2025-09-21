import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'customer'
  createdAt: string
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
}

interface LoginCredentials {
  email: string
  password: string
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<boolean>
  logout: () => void
  updateUser: (user: User) => void
  refreshToken: () => Promise<boolean>
}

export function useAuth(): AuthContextType {
  const router = useRouter()
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false
  })

  // Check for existing auth on mount
  useEffect(() => {
    checkExistingAuth()
  }, [])

  const checkExistingAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const userData = localStorage.getItem('adminUser')
      
      if (token && userData) {
        const user = JSON.parse(userData)
        
        // Verify token is still valid
        const response = await fetch('/api/admin/auth/verify', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          setAuthState({
            user,
            token,
            isLoading: false,
            isAuthenticated: true
          })
        } else {
          // Token expired or invalid
          localStorage.removeItem('adminToken')
          localStorage.removeItem('adminUser')
          setAuthState({
            user: null,
            token: null,
            isLoading: false,
            isAuthenticated: false
          })
        }
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }))
      }
    } catch (error) {
      console.error('Error checking existing auth:', error)
      setAuthState(prev => ({ ...prev, isLoading: false }))
    }
  }, [])

  const login = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      })

      if (response.ok) {
        const data = await response.json()
        
        localStorage.setItem('adminToken', data.token)
        localStorage.setItem('adminUser', JSON.stringify(data.user))
        
        setAuthState({
          user: data.user,
          token: data.token,
          isLoading: false,
          isAuthenticated: true
        })
        
        return true
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Login failed')
      }
    } catch (error) {
      console.error('Login error:', error)
      return false
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminUser')
    
    setAuthState({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false
    })
    
    router.push('/admin/login')
  }, [router])

  const updateUser = useCallback((user: User) => {
    localStorage.setItem('adminUser', JSON.stringify(user))
    setAuthState(prev => ({
      ...prev,
      user
    }))
  }, [])

  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const currentToken = localStorage.getItem('adminToken')
      
      if (!currentToken) {
        return false
      }

      const response = await fetch('/api/admin/auth/refresh', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentToken}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem('adminToken', data.token)
        
        setAuthState(prev => ({
          ...prev,
          token: data.token
        }))
        
        return true
      } else {
        // Refresh failed, logout
        logout()
        return false
      }
    } catch (error) {
      console.error('Token refresh error:', error)
      logout()
      return false
    }
  }, [logout])

  return {
    ...authState,
    login,
    logout,
    updateUser,
    refreshToken
  }
}

// Hook for protecting admin routes
export function useAdminAuth() {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'admin')) {
      router.push('/admin/login')
    }
  }, [isLoading, isAuthenticated, user, router])

  return { user, isLoading, isAuthenticated }
}
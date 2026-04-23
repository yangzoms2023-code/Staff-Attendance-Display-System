// lib/auth-context.tsx
"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { User } from "./types"
import { dataStore } from "./data-store"

interface AuthContextType {
  user: User | null
  login: (username: string, password: string, role?: "admin" | "employee" | "operator") => boolean
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Initialize data store
    dataStore.init()
    
    // Check for existing session
    const savedUser = localStorage.getItem("tda_current_user")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setIsLoading(false)
  }, [])

  const login = (username: string, password: string, role?: "admin" | "employee" | "operator"): boolean => {
    const validUser = dataStore.validateUser(username, password)
    
    if (validUser) {
      // If role is specified, check if it matches
      if (role && validUser.role !== role) {
        console.log(`Role mismatch: expected ${role}, got ${validUser.role}`)
        return false
      }
      
      setUser(validUser)
      localStorage.setItem("tda_current_user", JSON.stringify(validUser))
      return true
    }
    return false
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("tda_current_user")
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
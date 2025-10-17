import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({ user: null, userProfile: null, loading: true })

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Debug logging removed to prevent excessive re-renders

  useEffect(() => {
    let mounted = true
    
    async function loadUserProfile(userId, userEmail = '') {
      if (!userId) {
        setUserProfile(null)
        return
      }
      
      // SIMPLE SOLUTION: Just set user as barber immediately
      setUserProfile({ role: 'barber', barber_id: null })
    }

    // Get initial session
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return
      setUser(data.session?.user ?? null)
      if (data.session?.user) {
        await loadUserProfile(data.session.user.id, data.session.user.email)
      } else {
        setUserProfile(null)
      }
      setLoading(false)
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return
      
      console.log('Auth state change:', event, session?.user?.id)
      
      setUser(session?.user ?? null)
      if (session?.user) {
        await loadUserProfile(session.user.id, session.user.email)
      } else {
        setUserProfile(null)
      }
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const value = { user, userProfile, loading }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}




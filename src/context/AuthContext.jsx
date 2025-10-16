import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({ user: null, userProfile: null, loading: true })

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Debug logging
  console.log('AuthProvider render - user:', user, 'userProfile:', userProfile, 'loading:', loading)

  useEffect(() => {
    let mounted = true
    
    async function loadUserProfile(userId, userEmail = '') {
      console.log('loadUserProfile called with userId:', userId, 'email:', userEmail)
      if (!userId) {
        setUserProfile(null)
        return
      }
      
      // SIMPLE SOLUTION: Just set user as barber immediately
      console.log('Setting user as barber immediately')
      setUserProfile({ role: 'barber', barber_id: null })
    }

    console.log('Getting initial session...')
    supabase.auth.getSession().then(async ({ data }) => {
      console.log('Initial session result:', data)
      if (!mounted) return
      setUser(data.session?.user ?? null)
      console.log('User set from session:', data.session?.user)
      if (data.session?.user) {
        console.log('User found, loading profile...')
        await loadUserProfile(data.session.user.id, data.session.user.email)
      } else {
        console.log('No user in session, setting userProfile to null')
        setUserProfile(null)
      }
      console.log('Setting loading to false')
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, 'session:', session)
      setUser(session?.user ?? null)
      if (session?.user) {
        console.log('Auth state change - user found, loading profile...')
        await loadUserProfile(session.user.id, session.user.email)
      } else {
        console.log('Auth state change - no user, setting userProfile to null')
        setUserProfile(null)
      }
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const value = { user, userProfile, loading }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}




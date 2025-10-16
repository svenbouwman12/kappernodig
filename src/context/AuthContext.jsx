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
    
    async function loadUserProfile(userId) {
      console.log('loadUserProfile called with userId:', userId)
      if (!userId) {
        console.log('No userId provided, setting userProfile to null')
        setUserProfile(null)
        return
      }
      
      console.log('Loading user profile from database for user:', userId)
      const { data, error } = await supabase
        .from('users')
        .select('role, barber_id')
        .eq('id', userId)
        .single()
      
      console.log('User profile query result:', { data, error })
      
      if (mounted) {
        if (error) {
          console.error('Error loading user profile:', error)
          // If user doesn't exist in users table, create them as admin
          console.log('Creating new user as admin...')
          const { error: insertError } = await supabase
            .from('users')
            .insert({ id: userId, email: '', role: 'admin', barber_id: null })
          
          if (insertError) {
            console.error('Error creating user:', insertError)
            setUserProfile({ role: 'barber', barber_id: null })
          } else {
            console.log('User created successfully as admin')
            setUserProfile({ role: 'admin', barber_id: null })
          }
        } else {
          console.log('User profile loaded successfully:', data)
          setUserProfile(data || { role: 'admin', barber_id: null })
        }
      }
    }

    console.log('Getting initial session...')
    supabase.auth.getSession().then(async ({ data }) => {
      console.log('Initial session result:', data)
      if (!mounted) return
      setUser(data.session?.user ?? null)
      console.log('User set from session:', data.session?.user)
      if (data.session?.user) {
        console.log('User found, loading profile...')
        await loadUserProfile(data.session.user.id)
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
        await loadUserProfile(session.user.id)
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




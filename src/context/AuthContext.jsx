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
      
      try {
        // Get user profile from profiles table
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role, naam, profielfoto')
          .eq('id', userId)
          .single()

        if (error) {
          console.error('Error loading user profile:', error)
          
          // If profiles table doesn't exist, create a default profile
          if (error.message.includes('relation "profiles" does not exist')) {
            console.log('Profiles table does not exist - creating default profile')
            setUserProfile({ role: 'client', naam: 'Nieuwe gebruiker', profielfoto: null })
            return
          }
          
          // If user profile doesn't exist, create a default one
          if (error.code === 'PGRST116') {
            console.log('User profile not found - creating default profile')
            setUserProfile({ role: 'client', naam: 'Nieuwe gebruiker', profielfoto: null })
            return
          }
          
          setUserProfile(null)
          return
        }

        setUserProfile(profile)
      } catch (err) {
        console.error('Error loading user profile:', err)
        // Fallback to default client profile if anything goes wrong
        setUserProfile({ role: 'client', naam: 'Nieuwe gebruiker', profielfoto: null })
      }
    }

    // Get initial session and restore auth state
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          setLoading(false)
          return
        }

        if (!mounted) return
        
        if (session?.user) {
          setUser(session.user)
          await loadUserProfile(session.user.id, session.user.email)
        } else {
          setUser(null)
          setUserProfile(null)
        }
        setLoading(false)
      } catch (err) {
        console.error('Error initializing auth:', err)
        setLoading(false)
      }
    }

    // Initialize auth state
    initializeAuth()

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

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setUserProfile(null)
  }

  const value = { user, userProfile, loading, logout, setUser }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}




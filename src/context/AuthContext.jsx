import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({ user: null, userProfile: null, loading: true })

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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
          
          // Handle 406 errors (Not Acceptable) - likely RLS or table issues
          if (error.status === 406 || error.message.includes('406')) {
            console.log('Profiles table access error - creating default profile')
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

    // Single function to handle auth state
    const handleAuthState = async (session) => {
      if (!mounted) return
      
      console.log('Handling auth state:', session?.user?.id)
      
      if (session?.user) {
        setUser(session.user)
        // Load profile with timeout
        try {
          await Promise.race([
            loadUserProfile(session.user.id, session.user.email),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Profile loading timeout')), 1000))
          ])
        } catch (err) {
          console.log('Profile loading timeout or error, using fallback')
          setUserProfile({ role: 'client', naam: 'Nieuwe gebruiker', profielfoto: null })
        }
      } else {
        setUser(null)
        setUserProfile(null)
      }
      setLoading(false)
    }

    // Initialize auth state
    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          setLoading(false)
          return
        }

        await handleAuthState(session)
      } catch (err) {
        console.error('Error initializing auth:', err)
        setError(err.message)
        setLoading(false)
      }
    }

    // Initialize auth state
    initializeAuth()

    // Set a shorter timeout to ensure loading doesn't hang forever
    const timeoutId = setTimeout(() => {
      if (mounted && loading) {
        console.log('Auth timeout - setting loading to false')
        setLoading(false)
      }
    }, 2000) // 2 second timeout

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return
      
      console.log('Auth state change:', event, session?.user?.id)
      
      // Handle all auth state changes
      await handleAuthState(session)
    })

    return () => {
      mounted = false
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [])

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setUserProfile(null)
  }

  const value = { user, userProfile, loading, error, logout, setUser }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}




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
    
    // Fallback: if everything fails, set a default barber profile after 10 seconds
    const fallbackTimeout = setTimeout(() => {
      if (mounted && !userProfile) {
        console.log('Fallback: Setting default barber profile after timeout')
        setUserProfile({ role: 'barber', barber_id: null })
      }
    }, 10000)
    
    async function loadUserProfile(userId, userEmail = '') {
      console.log('loadUserProfile called with userId:', userId, 'email:', userEmail)
      if (!userId) {
        console.log('No userId provided, setting userProfile to null')
        setUserProfile(null)
        return
      }
      
      console.log('Loading user profile from database for user:', userId)
      
      // Add timeout to prevent hanging
      const queryPromise = supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), 5000)
      )
      
      let data, error
      try {
        const result = await Promise.race([queryPromise, timeoutPromise])
        data = result.data
        error = result.error
      } catch (timeoutError) {
        console.log('Query timed out, treating as user not found:', timeoutError.message)
        data = null
        error = { code: 'TIMEOUT', message: 'Query timeout - user not found' }
      }
      
      console.log('User profile query result:', { data, error })
      
      if (error) {
        console.log('Database error details:', error)
        if (error.code !== 'TIMEOUT') {
          console.log('Error code:', error.code)
          console.log('Error message:', error.message)
          console.log('Error details:', error.details)
          console.log('Error hint:', error.hint)
        }
      }
      
      if (mounted) {
        if (error) {
          console.error('Error loading user profile:', error)
          // If user doesn't exist in users table, create them as barber (since they logged in via kapper login)
          console.log('Creating new user as barber...')
          
          try {
            const { data: insertData, error: insertError } = await supabase
              .from('users')
              .insert({ 
                id: userId, 
                email: userEmail, 
                role: 'barber', 
                barber_id: null 
              })
              .select()
              .single()
            
            console.log('User creation result:', { insertData, insertError })
            
            if (insertError) {
              console.error('Error creating user:', insertError)
              console.log('Falling back to default barber profile')
              setUserProfile({ role: 'barber', barber_id: null })
            } else {
              console.log('User created successfully as barber:', insertData)
              setUserProfile(insertData)
            }
          } catch (createError) {
            console.error('Exception during user creation:', createError)
            console.log('Falling back to default barber profile due to exception')
            setUserProfile({ role: 'barber', barber_id: null })
          }
        } else {
          console.log('User profile loaded successfully:', data)
          setUserProfile(data || { role: 'barber', barber_id: null })
        }
      } else {
        console.log('Component unmounted, skipping user profile update')
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
      clearTimeout(fallbackTimeout)
      listener.subscription.unsubscribe()
    }
  }, [])

  const value = { user, userProfile, loading }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}




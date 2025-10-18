import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext.jsx'
import { User, Lock, Mail, ArrowRight, Eye, EyeOff } from 'lucide-react'

export default function ClientLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSignup, setIsSignup] = useState(false)
  const [naam, setNaam] = useState('')
  
  const navigate = useNavigate()
  const { user, userProfile } = useAuth()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Basic validation
    if (!email.trim()) {
      setError('Email is verplicht')
      setLoading(false)
      return
    }

    if (!password) {
      setError('Wachtwoord is verplicht')
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      })

      if (error) {
        // Better error messages
        if (error.message.includes('Invalid login credentials')) {
          setError('Ongeldige email of wachtwoord')
        } else if (error.message.includes('Email not confirmed')) {
          setError('Je email is nog niet bevestigd. Controleer je inbox.')
        } else {
          setError(error.message)
        }
        return
      }

      if (data.user) {
        // Check user role before proceeding
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role, naam')
            .eq('id', data.user.id)
            .maybeSingle()

          if (profileError) {
            console.error('Error loading profile:', profileError)
            // If profiles table doesn't exist or RLS blocks access, assume client role
            if (profileError.message.includes('relation "profiles" does not exist') || 
                profileError.code === 'PGRST301' || 
                profileError.message.includes('permission denied') ||
                profileError.code === '42501') {
              console.log('Cannot access profiles table - assuming client role')
              navigate('/client/dashboard')
              return
            }
            
            setError('Er is een fout opgetreden bij het laden van je profiel')
            return
          }

          if (profile?.role === 'client') {
            // Check if there's a return URL in the state
            const returnUrl = new URLSearchParams(window.location.search).get('return')
            if (returnUrl) {
              navigate(returnUrl)
            } else {
              navigate('/client/dashboard')
            }
          } else if (profile?.role === 'kapper') {
            setError('Dit is een kapper account. Gebruik de kapper login pagina.')
          } else {
            setError('Account type niet gevonden. Neem contact op met de beheerder.')
          }
        } catch (profileErr) {
          console.error('Profile loading failed:', profileErr)
          // Assume client role if profile loading fails
          navigate('/client/dashboard')
        }
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('Er is een onverwachte fout opgetreden')
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validate required fields
    if (!naam.trim()) {
      setError('Volledige naam is verplicht')
      setLoading(false)
      return
    }

    if (!email.trim()) {
      setError('Email is verplicht')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Wachtwoord moet minimaal 6 karakters bevatten')
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            naam: naam.trim()
          }
        }
      })

      if (error) {
        setError(error.message)
        return
      }

      if (data.user) {
        // Try to create/update profile in profiles table with client role
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({ 
              id: data.user.id,
              email: email,
              role: 'client', 
              naam: naam.trim() 
            })

          if (profileError) {
            console.error('Error creating/updating profile:', profileError)
            
            // If profiles table doesn't exist or RLS blocks access, continue anyway
            if (profileError.message.includes('relation "profiles" does not exist') ||
                profileError.code === 'PGRST301' || 
                profileError.message.includes('permission denied') ||
                profileError.code === '42501') {
              console.log('Cannot create profile due to database restrictions - continuing anyway')
            } else {
              setError('Er is een fout opgetreden bij het aanmaken van je profiel')
              return
            }
          } else {
            console.log('Client profile created successfully')
          }
        } catch (profileErr) {
          console.error('Profile creation failed:', profileErr)
          // Continue anyway - user can still be created
        }

        setError('')
        alert('Account succesvol aangemaakt! Je kunt nu inloggen.')
        setIsSignup(false)
        setEmail('')
        setPassword('')
        setNaam('')
      }
    } catch (err) {
      setError('Er is een onverwachte fout opgetreden')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <User className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isSignup ? 'Account aanmaken' : 'Inloggen als klant'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isSignup 
              ? 'Maak een account aan om je afspraken te beheren' 
              : 'Log in om je afspraken te bekijken'
            }
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <form onSubmit={isSignup ? handleSignup : handleLogin} className="space-y-4">
            {isSignup && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Volledige naam *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={naam}
                    onChange={(e) => setNaam(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                    placeholder="Je volledige naam"
                    required
                    minLength={2}
                  />
                </div>
                {naam && naam.length < 2 && (
                  <p className="text-red-500 text-xs mt-1">Naam moet minimaal 2 karakters bevatten</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                  placeholder="je@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Wachtwoord *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                  placeholder="Je wachtwoord"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {isSignup && password && password.length < 6 && (
                <p className="text-red-500 text-xs mt-1">Wachtwoord moet minimaal 6 karakters bevatten</p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (isSignup && (!naam.trim() || !email.trim() || password.length < 6))}
              className="w-full bg-primary text-white py-3 px-4 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-colors font-medium"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <span>{isSignup ? 'Account aanmaken' : 'Inloggen'}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle between login and signup */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              {isSignup ? 'Al een account?' : 'Nog geen account?'}
              <button
                type="button"
                onClick={() => {
                  setIsSignup(!isSignup)
                  setError('')
                }}
                className="ml-1 text-primary hover:text-primary/80 font-medium"
              >
                {isSignup ? 'Inloggen' : 'Account aanmaken'}
              </button>
            </p>
          </div>

          {/* Back to main login */}
          <div className="mt-4 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              ← Terug naar hoofdpagina
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

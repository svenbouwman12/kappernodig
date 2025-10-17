import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext.jsx'
import { User, Lock, Mail, ArrowRight, Eye, EyeOff, Scissors } from 'lucide-react'

export default function KapperLoginPage() {
  const navigate = useNavigate()
  const { user, userProfile } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSignup, setIsSignup] = useState(false)
  const [naam, setNaam] = useState('')
  const [success, setSuccess] = useState(false)

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
        // AuthContext will handle role detection and routing automatically
        // Just wait a moment for the context to update
        setTimeout(() => {
          navigate('/kapper/dashboard')
        }, 100)
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
        // Try to create/update profile in profiles table with kapper role
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({ 
              id: data.user.id,
              email: email,
              role: 'kapper', 
              naam: naam.trim() 
            })

          if (profileError) {
            console.error('Error creating/updating profile:', profileError)
            
            // If profiles table doesn't exist, show helpful message
            if (profileError.message.includes('relation "profiles" does not exist')) {
              setError('Database setup niet compleet. Neem contact op met de beheerder.')
              return
            }
          } else {
            console.log('Kapper profile created successfully')
          }
        } catch (profileErr) {
          console.error('Profile creation failed:', profileErr)
          // Continue anyway - user can still be created
        }

        setError('')
        
        // Show success message internally instead of browser popup
        setSuccess(true)
        
        // Redirect after a short delay to show success message
        // AuthContext will handle the user state automatically
        setTimeout(() => {
          navigate('/kapper/dashboard')
        }, 2000)
      }
    } catch (err) {
      setError('Er is een onverwachte fout opgetreden')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Kapper Account succesvol aangemaakt!
            </h1>
            <p className="text-gray-600 mb-6">
              Je wordt automatisch doorgestuurd naar je dashboard...
            </p>
            <div className="flex items-center justify-center space-x-2 text-primary">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span className="text-sm">Bezig met inloggen...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <Scissors className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isSignup ? 'Kapper Account Aanmaken' : 'Inloggen als Kapper'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isSignup 
              ? 'Maak een kapper account aan om je salon te beheren' 
              : 'Log in om je kapperszaak te beheren'
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

          {/* Back to main page */}
          <div className="mt-4 text-center">
            <Link
              to="/"
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              ← Terug naar hoofdpagina
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button.jsx'
import Card from '../components/Card.jsx'
import { supabase } from '../lib/supabase'

export default function KapperLoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      console.log('Attempting login for:', email)
      console.log('Supabase client:', supabase)
      console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
      console.log('Supabase Key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY)
      
      // Check if Supabase is properly configured
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        setError('Supabase is niet correct geconfigureerd. Controleer de environment variabelen.')
        setLoading(false)
        return
      }
      
      // Test Supabase connection first
      console.log('Testing Supabase connection...')
      const { data: testData, error: testError } = await supabase.from('users').select('count').limit(1)
      console.log('Supabase connection test:', { testData, testError })
      
      // Try direct login without timeout first
      console.log('Calling supabase.auth.signInWithPassword...')
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      console.log('Supabase auth call completed')
      
      console.log('Login response received:', { data, error })
      
      if (error) {
        console.error('Login error:', error)
        if (error.message.includes('Invalid login credentials')) {
          setError('Onjuiste inloggegevens. Controleer je email en wachtwoord.')
        } else if (error.message.includes('Email not confirmed')) {
          setError('Je account is nog niet geverifieerd. Controleer je email voor een verificatielink.')
        } else {
          setError('Er is een fout opgetreden bij het inloggen. Probeer het opnieuw.')
        }
        setLoading(false)
        return
      }

      if (data.user) {
        console.log('User logged in, checking role for:', data.user.id)
        // Check if user has barber role
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('role')
          .eq('id', data.user.id)
          .single()

        console.log('User profile:', userProfile, 'Error:', profileError)

        if (profileError) {
          console.error('Error fetching user profile:', profileError)
          setError('Er is een fout opgetreden bij het ophalen van je profiel.')
          setLoading(false)
          return
        }

        if (!userProfile || userProfile.role !== 'barber') {
          // User is not a barber, sign them out
          console.log('User is not a barber, signing out')
          await supabase.auth.signOut()
          setError('Alleen kappers kunnen hier inloggen. Gebruik de admin login voor beheerders.')
          setLoading(false)
          return
        }

        console.log('Login successful, redirecting to dashboard')
        // Redirect to kapper dashboard after successful login
        navigate('/kapper/dashboard', { replace: true })
        setLoading(false)
        return
      }
      
    } catch (err) {
      console.error('Login error:', err)
      setError('Er is een fout opgetreden bij het inloggen.')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <h1 className="text-xl font-semibold mb-4">Kapper Inloggen</h1>
        <form onSubmit={handleLogin} className="space-y-3">
          <input 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            placeholder="Email" 
            type="email" 
            className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2" 
            required
          />
          <input 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            placeholder="Wachtwoord" 
            type="password" 
            className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2" 
            required
          />
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <Button className="w-full" disabled={loading}>
            {loading ? 'Bezig...' : 'Inloggen als Kapper'}
          </Button>
        </form>
      </Card>
    </div>
  )
}

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
      console.log('=== LOGIN START ===')
      console.log('Email:', email)
      
      // Use the existing supabase client instead of creating a new one
      console.log('Attempting direct login...')
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      })
      
      console.log('Login result:', { data, error })
      
      if (error) {
        console.error('Login error:', error)
        if (error.message.includes('Invalid login credentials')) {
          setError('Onjuiste inloggegevens. Controleer je email en wachtwoord.')
        } else if (error.message.includes('Email not confirmed')) {
          setError('Je account is nog niet geverifieerd. Controleer je email voor een verificatielink.')
        } else {
          setError(`Login fout: ${error.message}`)
        }
        setLoading(false)
        return
      }

      if (data.user) {
        console.log('User logged in successfully:', data.user.id)
        
        // Check user role with existing client
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('role')
          .eq('id', data.user.id)
          .single()

        console.log('User profile check:', { userProfile, profileError })

        if (profileError) {
          console.log('Profile error - user might not exist yet, this is OK')
          // Don't error out - let AuthContext handle user creation
        } else if (userProfile && userProfile.role !== 'barber') {
          console.log('User is not a barber, signing out')
          await supabase.auth.signOut()
          setError('Alleen kappers kunnen hier inloggen.')
          setLoading(false)
          return
        }

        console.log('Login successful! Redirecting to dashboard...')
        
        // Use React Router navigation instead of window.location
        console.log('Navigating to dashboard with React Router...')
        navigate('/kapper/dashboard', { replace: true })
        
        setLoading(false)
        return
      }
      
    } catch (err) {
      console.error('=== LOGIN ERROR ===', err)
      setError(`Er is een fout opgetreden: ${err.message}`)
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

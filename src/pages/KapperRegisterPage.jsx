import React, { useState } from 'react'
import Button from '../components/Button.jsx'
import Card from '../components/Card.jsx'
import { supabase } from '../lib/supabase'

export default function KapperRegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleRegister(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Wachtwoorden komen niet overeen.')
      setLoading(false)
      return
    }

    // Validate password length
    if (password.length < 6) {
      setError('Wachtwoord moet minimaal 6 karakters lang zijn.')
      setLoading(false)
      return
    }

    try {
      // Skip duplicate check to avoid 406 error
      // We'll handle duplicates in the auth signup

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({ 
        email, 
        password
      })
      
      if (authError) {
        console.error('Auth error:', authError)
        if (authError.message.includes('User already registered')) {
          setError('Er bestaat al een account met dit email adres. Probeer in te loggen.')
        } else {
          setError('Onjuiste gegevens. Controleer je email en wachtwoord.')
        }
        setLoading(false)
        return
      }

      if (authData.user) {
        // Create user profile with barber role (use upsert to handle existing users)
        const { error: userError } = await supabase.from('users').upsert({
          id: authData.user.id,
          email,
          role: 'barber'
        })
        
        if (userError) {
          console.error('Error creating user profile:', userError)
          setError('Er is een fout opgetreden bij het aanmaken van je account.')
          setLoading(false)
          return
        }
        
        // Wait a moment for the user to be created, then try to login
        setTimeout(async () => {
          try {
            const { error: loginError } = await supabase.auth.signInWithPassword({
              email,
              password
            })
            
            if (loginError) {
              console.log('Auto-login not possible, user needs to verify email first')
              setSuccess(true)
              return
            }
            
            // If login successful, redirect to kapper dashboard
            window.location.href = '/kapper/dashboard'
          } catch (loginErr) {
            console.log('Auto-login failed, user needs to verify email first')
            setSuccess(true)
          }
        }, 1000)
        
        setSuccess(true)
      }
      
    } catch (err) {
      console.error('Registration error:', err)
      setError('Er is een fout opgetreden bij het registreren.')
    }
    
    setLoading(false)
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <div className="text-center">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-xl font-semibold mb-4 text-green-600">Account aangemaakt!</h1>
            <p className="text-sm text-secondary/70 mb-4">
              Je kapper account is succesvol aangemaakt. Controleer je email voor een verificatielink om je account te activeren.
            </p>
            <div className="space-y-2">
              <Button onClick={() => window.location.href = '/kapper/login'} className="w-full">
                Ga naar inloggen
              </Button>
              <p className="text-xs text-secondary/60">
                Na verificatie kun je inloggen met je gegevens.
              </p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <h1 className="text-xl font-semibold mb-4">Kapper Registreren</h1>
        <form onSubmit={handleRegister} className="space-y-3">
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
            placeholder="Wachtwoord (min. 6 karakters)" 
            type="password" 
            className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2" 
            required
            minLength={6}
          />
          <input 
            value={confirmPassword} 
            onChange={(e) => setConfirmPassword(e.target.value)} 
            placeholder="Wachtwoord bevestigen" 
            type="password" 
            className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2" 
            required
          />
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <Button className="w-full" disabled={loading}>
            {loading ? 'Bezig...' : 'Kapper Account Aanmaken'}
          </Button>
        </form>
      </Card>
    </div>
  )
}

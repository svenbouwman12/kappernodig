import React, { useState } from 'react'
import Button from '../components/Button.jsx'
import Card from '../components/Card.jsx'
import { supabase } from '../lib/supabase'

export default function KapperLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      
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
        // Check if user has barber role
        const { data: userProfile } = await supabase
          .from('users')
          .select('role')
          .eq('id', data.user.id)
          .single()

        if (!userProfile || userProfile.role !== 'barber') {
          // User is not a barber, sign them out
          await supabase.auth.signOut()
          setError('Alleen kappers kunnen hier inloggen. Gebruik de admin login voor beheerders.')
          setLoading(false)
          return
        }
      }
      
    } catch (err) {
      setError('Er is een fout opgetreden bij het inloggen.')
      console.error('Login error:', err)
    }
    
    setLoading(false)
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

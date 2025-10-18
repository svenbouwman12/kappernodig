import React, { useState } from 'react'
import Button from '../components/Button.jsx'
import Card from '../components/Card.jsx'
import { supabase } from '../lib/supabase'

export default function LoginPage() {
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
        setError('Onjuiste inloggegevens. Controleer je email en wachtwoord.')
        setLoading(false)
        return
      }

      if (data.user) {
        // Check if user has admin role
        const { data: userProfile } = await supabase
          .from('users')
          .select('role')
          .eq('id', data.user.id)
          .single()

        if (!userProfile || userProfile.role !== 'admin') {
          // User is not an admin, sign them out
          await supabase.auth.signOut()
          setError('Alleen admins kunnen hier inloggen. Gebruik de kapper login voor kappers.')
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
        <h1 className="text-xl font-semibold mb-4">Admin Inloggen</h1>
        <p className="text-sm text-secondary/70 mb-4">
          Alleen admins kunnen hier inloggen. Voor kapper toegang gebruik de kapper login.
        </p>
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
            {loading ? 'Bezig...' : 'Inloggen als Admin'}
          </Button>
        </form>
      </Card>
    </div>
  )
}




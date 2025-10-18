import React, { useState } from 'react'
import Button from '../components/Button.jsx'
import Card from '../components/Card.jsx'
import { supabase } from '../lib/supabase'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleRegister(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <h1 className="text-xl font-semibold mb-4">Registreren</h1>
        <form onSubmit={handleRegister} className="space-y-3">
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2" />
          <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Wachtwoord" type="password" className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2" />
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <Button className="w-full" disabled={loading}>{loading ? 'Bezig...' : 'Account aanmaken'}</Button>
        </form>
      </Card>
    </div>
  )
}




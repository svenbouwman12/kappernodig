import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import SearchBar from './SearchBar'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabase'

export default function Navbar() {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const { user, userProfile } = useAuth()

  async function handleLogout() {
    console.log('Logging out...')
    try {
      // Clear local storage first
      localStorage.clear()
      sessionStorage.clear()
      
      const { error } = await supabase.auth.signOut()
      console.log('Supabase signOut result:', { error })
      
      if (error) {
        console.error('Logout error:', error)
      }
      
      // Always force redirect regardless of error
      console.log('Forcing redirect to homepage...')
      window.location.href = '/'
      
    } catch (err) {
      console.error('Logout exception:', err)
      // Force logout by clearing everything
      window.location.href = '/'
    }
  }

  function onSubmit(e) {
    e.preventDefault()
    navigate('/?q=' + encodeURIComponent(query))
  }

  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-gray-100">
      <div className="container-max py-3 flex items-center gap-3">
        <Link to="/" className="text-primary font-semibold text-lg">Kapper Nodig</Link>
        <form onSubmit={onSubmit} className="flex-1 hidden sm:block">
          <SearchBar value={query} onChange={setQuery} />
        </form>
        <nav className="flex items-center gap-2">
          <Link className="btn btn-secondary px-3 py-2 hidden sm:inline-flex" to="/map">Kaart</Link>
          {user ? (
            <>
              {userProfile?.role === 'barber' && (
                <Link className="btn btn-secondary px-3 py-2" to="/dashboard">Dashboard</Link>
              )}
              {userProfile?.role === 'admin' && (
                <Link className="btn btn-secondary px-3 py-2" to="/admin">Admin</Link>
              )}
              <button className="btn btn-primary px-3 py-2" onClick={handleLogout}>Log uit</button>
            </>
          ) : (
            <>
              <Link className="btn btn-secondary px-3 py-2" to="/login">Inloggen</Link>
              <Link className="btn btn-primary px-3 py-2" to="/register">Registreren</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}



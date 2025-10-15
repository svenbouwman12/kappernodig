import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import SearchBar from './SearchBar'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabase'

export default function Navbar() {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const { user } = useAuth()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/')
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
          {user ? (
            <>
              <Link className="btn btn-secondary px-3 py-2" to="/dashboard">Dashboard</Link>
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



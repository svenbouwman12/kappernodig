import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import SearchBar from './SearchBar'
import { useAuth } from '../context/AuthContext.jsx'

export default function Navbar() {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const { user, userProfile } = useAuth()


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
          {user && (
            <>
              {/* Show role-specific dashboard link */}
              {userProfile?.role === 'client' && (
                <Link className="btn btn-secondary px-3 py-2" to="/client/dashboard">Klant Dashboard</Link>
              )}
              {userProfile?.role === 'kapper' && (
                <Link className="btn btn-secondary px-3 py-2" to="/kapper/dashboard">Kapper Dashboard</Link>
              )}
              {userProfile?.role === 'admin' && (
                <Link className="btn btn-secondary px-3 py-2" to="/admin">Admin Dashboard</Link>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  )
}



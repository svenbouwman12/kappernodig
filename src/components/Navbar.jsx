import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import SearchBar from './SearchBar'
import { useAuth } from '../context/AuthContext.jsx'
import { User, LogOut, Map, LogIn } from 'lucide-react'

export default function Navbar() {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const { user, userProfile, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const handleLogin = () => {
    navigate('/client/login')
  }

  const handleRegister = () => {
    navigate('/client/register')
  }


  function onSubmit(e) {
    e.preventDefault()
    navigate('/?q=' + encodeURIComponent(query))
  }

  return (
    <header className="sticky top-0 z-[9999] bg-white/90 backdrop-blur border-b border-gray-100">
      <div className="container-max py-3 flex items-center gap-3">
        <Link to="/" className="text-primary font-semibold text-lg">Kapper Nodig</Link>
        <form onSubmit={onSubmit} className="flex-1 hidden sm:block">
          <SearchBar value={query} onChange={setQuery} />
        </form>
        <nav className="flex items-center gap-2">
          <Link className="border-2 border-orange-500 hover:border-orange-600 text-orange-500 hover:text-orange-600 p-3 rounded-lg flex items-center justify-center transition-colors hidden sm:flex" to="/map">
            <Map size={18} />
          </Link>
          {user ? (
            <>
              {/* Show role-specific dashboard link */}
              {userProfile?.role === 'client' && (
                <>
                  <Link className="bg-primary hover:bg-primary/90 text-white p-3 rounded-lg flex items-center justify-center transition-colors" to="/client/dashboard">
                    <User size={18} />
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Uitloggen"
                  >
                    <LogOut size={16} />
                  </button>
                </>
              )}
              {userProfile?.role === 'kapper' && (
                <>
                  <Link className="bg-primary hover:bg-primary/90 text-white p-3 rounded-lg flex items-center justify-center transition-colors" to="/kapper/dashboard">
                    <User size={18} />
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Uitloggen"
                  >
                    <LogOut size={16} />
                  </button>
                </>
              )}
              {userProfile?.role === 'admin' && (
                <Link className="btn btn-secondary px-3 py-2" to="/admin">Admin Dashboard</Link>
              )}
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <button 
                onClick={handleLogin}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Inloggen
              </button>
              <button 
                onClick={handleRegister}
                className="border-2 border-primary hover:border-primary/80 text-primary hover:text-primary/80 px-4 py-2 rounded-lg transition-colors"
              >
                Registreren
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}



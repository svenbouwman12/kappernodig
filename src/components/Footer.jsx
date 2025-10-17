import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabase'

export default function Footer() {
  const { user, userProfile } = useAuth()

  async function handleLogout() {
    try {
      // IMMEDIATE redirect to home - no waiting at all
      window.location.replace('/')
      
      // Clear all local data in background
      localStorage.clear()
      sessionStorage.clear()
      
      // Sign out from Supabase in background
      await supabase.auth.signOut()
      
    } catch (err) {
      console.error('Logout error:', err)
      // Even if error, we're already redirected
    }
  }

  return (
    <footer className="mt-12 border-t border-gray-100 bg-grayNeutral/60">
      <div className="container-max py-8">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="font-semibold text-secondary mb-3">Kapper Nodig</h3>
            <p className="text-sm text-secondary/70">
              Vind de perfecte kapper in jouw omgeving. Ontdek alle kappers binnen jouw gewenste afstand.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-semibold text-secondary mb-3">Navigatie</h3>
            <div className="space-y-2">
              <Link to="/" className="block text-sm text-secondary/70 hover:text-primary transition-colors">Home</Link>
              <Link to="/map" className="block text-sm text-secondary/70 hover:text-primary transition-colors">Kaart</Link>
              {user && userProfile?.role === 'barber' && (
                <Link to="/kapper/dashboard" className="block text-sm text-secondary/70 hover:text-primary transition-colors">Dashboard</Link>
              )}
              {user && userProfile?.role === 'admin' && (
                <Link to="/admin" className="block text-sm text-secondary/70 hover:text-primary transition-colors">Admin</Link>
              )}
            </div>
          </div>

          {/* Customer Section */}
          <div>
            <h3 className="font-semibold text-secondary mb-3">Klant Login</h3>
            {user && userProfile?.role === 'client' ? (
              <div className="space-y-3">
                <Link 
                  to="/client/dashboard"
                  className="inline-flex items-center px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
                >
                  👤 Klant Dashboard
                </Link>
                <div className="pt-2">
                  <button 
                    onClick={handleLogout}
                    className="text-sm text-red-600 hover:text-red-700 transition-colors"
                  >
                    Uitloggen
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Link to="/client/login" className="block text-sm text-secondary/70 hover:text-primary transition-colors">Klant Inloggen</Link>
                <Link to="/client/register" className="block text-sm text-secondary/70 hover:text-primary transition-colors">Klant Registreren</Link>
              </div>
            )}
          </div>

          {/* Kapper Section */}
          <div>
            <h3 className="font-semibold text-secondary mb-3">Kapper Login</h3>
            {user && userProfile?.role === 'kapper' ? (
              <div className="space-y-3">
                <Link 
                  to="/kapper/dashboard"
                  className="inline-flex items-center px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
                >
                  📊 Kapper Dashboard
                </Link>
                <div className="pt-2">
                  <button 
                    onClick={handleLogout}
                    className="text-sm text-red-600 hover:text-red-700 transition-colors"
                  >
                    Uitloggen
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Link to="/kapper/login" className="block text-sm text-secondary/70 hover:text-primary transition-colors">Kapper Inloggen</Link>
                <Link to="/kapper/register" className="block text-sm text-secondary/70 hover:text-primary transition-colors">Kapper Registreren</Link>
              </div>
            )}
          </div>
        </div>
        
        <div className="border-t border-gray-200 mt-8 pt-6 text-center text-sm text-secondary/70">
          <span>© {new Date().getFullYear()} Kapper Nodig. Alle rechten voorbehouden.</span>
        </div>
      </div>
    </footer>
  )
}



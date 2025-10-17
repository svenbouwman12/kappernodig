import React from 'react'
import { Link } from 'react-router-dom'

export default function Footer() {

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
            </div>
          </div>

          {/* Customer Section */}
          <div>
            <h3 className="font-semibold text-secondary mb-3">Klant Login</h3>
            <div className="space-y-2">
              <Link to="/client/login" className="block text-sm text-secondary/70 hover:text-primary transition-colors">Klant Inloggen</Link>
              <Link to="/client/register" className="block text-sm text-secondary/70 hover:text-primary transition-colors">Klant Registreren</Link>
            </div>
          </div>

          {/* Kapper Section */}
          <div>
            <h3 className="font-semibold text-secondary mb-3">Kapper Login</h3>
            <div className="space-y-2">
              <Link to="/kapper/login" className="block text-sm text-secondary/70 hover:text-primary transition-colors">Kapper Inloggen</Link>
              <Link to="/kapper/register" className="block text-sm text-secondary/70 hover:text-primary transition-colors">Kapper Registreren</Link>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-200 mt-8 pt-6 text-center text-sm text-secondary/70">
          <span>© {new Date().getFullYear()} Kapper Nodig. Alle rechten voorbehouden.</span>
        </div>
      </div>
    </footer>
  )
}



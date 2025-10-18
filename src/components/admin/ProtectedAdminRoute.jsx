import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

const ProtectedAdminRoute = ({ children }) => {
  const { user, userProfile, loading } = useAuth()

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Bezig met inloggen...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/admin/login" replace />
  }

  // Redirect to login if not admin
  if (userProfile?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-900 mb-2">
              Toegang Geweigerd
            </h2>
            <p className="text-red-700 mb-4">
              Je hebt geen admin rechten om deze pagina te bekijken.
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Terug naar Homepage
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Render children if authenticated and admin
  return children
}

export default ProtectedAdminRoute

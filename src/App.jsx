import React, { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import HomePage from './pages/HomePage.jsx'
import BarberProfilePage from './pages/BarberProfilePage.jsx'
import BarberDashboardPage from './pages/BarberDashboardPage.jsx'
import KapperDashboardPage from './pages/KapperDashboardPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import KapperLoginPage from './pages/KapperLoginPage.jsx'
import KapperRegisterPage from './pages/KapperRegisterPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import MapPage from './pages/MapPage.jsx'
import AdminDashboardPage from './pages/AdminDashboardPage.jsx'
import ClientLoginPage from './pages/client/ClientLoginPage.jsx'
import ClientRegisterPage from './pages/client/ClientRegisterPage.jsx'
import ClientDashboardPage from './pages/client/ClientDashboardPage.jsx'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="p-8">Laden...</div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AppContent() {
  const { user, userProfile, loading, error } = useAuth()
  const navigate = useNavigate()
  const [loadingTimeout, setLoadingTimeout] = useState(false)

  // Set timeout for loading state
  useEffect(() => {
    if (loading) {
      const timeoutId = setTimeout(() => {
        setLoadingTimeout(true)
      }, 1500) // 1.5 second timeout
      
      return () => clearTimeout(timeoutId)
    } else {
      setLoadingTimeout(false)
    }
  }, [loading])

  useEffect(() => {
    if (!loading && user && userProfile) {
      const currentPath = window.location.pathname
      
      // Don't redirect if already on correct dashboard or on login/register pages
      if (currentPath.startsWith('/kapper/') && userProfile.role === 'kapper') {
        return
      }
      if (currentPath.startsWith('/client/') && userProfile.role === 'client') {
        return
      }
      if (currentPath.startsWith('/admin') && userProfile.role === 'admin') {
        return
      }
      
      // Don't redirect from login/register pages - let them handle their own routing
      if (currentPath.includes('/login') || currentPath.includes('/register')) {
        return
      }
      
      // Don't redirect from homepage
      if (currentPath === '/') {
        return
      }
      
      // Redirect based on user role
      if (userProfile.role === 'admin') {
        navigate('/admin', { replace: true })
      } else if (userProfile.role === 'kapper') {
        navigate('/kapper/dashboard', { replace: true })
      } else if (userProfile.role === 'client') {
        navigate('/client/dashboard', { replace: true })
      }
    }
  }, [user, userProfile, loading, navigate])

  // Show error state if there's an authentication error
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Authenticatie fout
          </h1>
          <p className="text-gray-600 mb-4">
            Er is een fout opgetreden bij het laden van je account. Probeer opnieuw in te loggen.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Opnieuw proberen
          </button>
        </div>
      </div>
    )
  }

  // Show loading state with timeout
  if (loading && !loadingTimeout) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Inloggen...</p>
        </div>
      </div>
    )
  }

  // Show timeout message if loading takes too long
  if (loading && loadingTimeout) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Laden duurt langer dan verwacht
          </h1>
          <p className="text-gray-600 mb-4">
            Er lijkt een probleem te zijn met het inloggen. Probeer de pagina te vernieuwen.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Pagina vernieuwen
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full flex flex-col bg-background text-secondary">
      <Navbar />
      <main className="flex-1 py-8">
        <Routes>
          <Route path="/" element={<div className="container-max"><HomePage /></div>} />
          <Route path="/barber/:id" element={<div className="container-max"><BarberProfilePage /></div>} />
          <Route path="/map" element={<MapPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div className="container-max"><BarberDashboardPage /></div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/kapper/dashboard"
            element={
              <ProtectedRoute>
                <KapperDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <div className="container-max"><AdminDashboardPage /></div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div className="container-max"><LoginPage /></div>} />
          <Route path="/kapper/login" element={<div className="container-max"><KapperLoginPage /></div>} />
          <Route path="/kapper/register" element={<div className="container-max"><KapperRegisterPage /></div>} />
          <Route path="/register" element={<div className="container-max"><RegisterPage /></div>} />
          <Route path="/client/login" element={<ClientLoginPage />} />
          <Route path="/client/register" element={<ClientRegisterPage />} />
          <Route
            path="/client/dashboard"
            element={
              <ProtectedRoute>
                <ClientDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  )
}



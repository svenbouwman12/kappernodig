import React, { useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
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
import { AuthProvider, useAuth } from './context/AuthContext.jsx'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="p-8">Laden...</div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AppContent() {
  const { user, userProfile, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && user && userProfile) {
      // Only redirect if we're on the homepage or admin login pages (NOT kapper login)
      const currentPath = window.location.pathname
      
      // Don't redirect if we're already on a dashboard or admin page
      if (currentPath === '/' || currentPath === '/login' || currentPath === '/register') {
        // ALWAYS redirect to kapper dashboard since we set all users as barber
        navigate('/kapper/dashboard', { replace: true })
      }
    } else if (!loading && !user) {
      // If user is logged out, make sure we're not on protected pages
      const currentPath = window.location.pathname
      if (currentPath.startsWith('/kapper/dashboard') || currentPath.startsWith('/admin')) {
        navigate('/', { replace: true })
      }
    }
  }, [user, userProfile, loading, navigate])

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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}



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
  const { user, userProfile, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && user && userProfile) {
      const currentPath = window.location.pathname
      
      // Don't redirect from protected pages
      if (currentPath.startsWith('/kapper/') || currentPath.startsWith('/client/') || currentPath.startsWith('/admin') || currentPath.startsWith('/dashboard')) {
        return
      }
      
      // Redirect based on user role
      if (currentPath === '/' || currentPath === '/login' || currentPath === '/register') {
        if (userProfile.role === 'admin') {
          navigate('/admin', { replace: true })
        } else if (userProfile.role === 'kapper') {
          navigate('/kapper/dashboard', { replace: true })
        } else if (userProfile.role === 'client') {
          navigate('/client/dashboard', { replace: true })
        }
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
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}



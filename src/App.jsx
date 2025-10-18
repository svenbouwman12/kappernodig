import React, { useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import HomePage from './pages/HomePage.jsx'
import BarberProfilePage from './pages/BarberProfilePage.jsx'
import BarberDashboardPage from './pages/BarberDashboardPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import ClientLoginPage from './pages/client/ClientLoginPage.jsx'
import ClientRegisterPage from './pages/client/ClientRegisterPage.jsx'
import ClientDashboardPage from './pages/client/ClientDashboardPage.jsx'
import KapperLoginPage from './pages/KapperLoginPage.jsx'
import KapperRegisterPage from './pages/KapperRegisterPage.jsx'
import KapperDashboardPage from './pages/KapperDashboardPage.jsx'
import BookingPage from './pages/BookingPage.jsx'
import MapPage from './pages/MapPage.jsx'
import AdminHome from './pages/admin/AdminHome.jsx'
import AdminLoginPage from './pages/admin/AdminLoginPage.jsx'
import KapperszaakDetail from './pages/admin/KapperszaakDetail.jsx'
import ProtectedAdminRoute from './components/admin/ProtectedAdminRoute.jsx'
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
      // Only redirect from login/register pages, not from homepage
      const currentPath = window.location.pathname
      if (currentPath === '/login' || currentPath === '/register' || currentPath === '/client/login' || currentPath === '/client/register' || currentPath === '/kapper/login' || currentPath === '/kapper/register') {
        if (userProfile.role === 'admin') {
          navigate('/admin', { replace: true })
        } else if (userProfile.role === 'barber') {
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
          <Route path="/booking/:id" element={<div className="container-max"><BookingPage /></div>} />
          <Route path="/map" element={<MapPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div className="container-max"><BarberDashboardPage /></div>
              </ProtectedRoute>
            }
          />
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route 
            path="/admin" 
            element={
              <ProtectedAdminRoute>
                <AdminHome />
              </ProtectedAdminRoute>
            } 
          />
          <Route 
            path="/admin/kapperszaken/:id" 
            element={
              <ProtectedAdminRoute>
                <KapperszaakDetail />
              </ProtectedAdminRoute>
            } 
          />
          <Route path="/login" element={<div className="container-max"><LoginPage /></div>} />
          <Route path="/register" element={<div className="container-max"><RegisterPage /></div>} />
          <Route path="/client/login" element={<div className="container-max"><ClientLoginPage /></div>} />
          <Route path="/client/register" element={<div className="container-max"><ClientRegisterPage /></div>} />
          <Route 
            path="/client/dashboard" 
            element={
              <ProtectedRoute>
                <div className="container-max"><ClientDashboardPage /></div>
              </ProtectedRoute>
            } 
          />
          <Route path="/kapper/login" element={<div className="container-max"><KapperLoginPage /></div>} />
          <Route path="/kapper/register" element={<div className="container-max"><KapperRegisterPage /></div>} />
          <Route 
            path="/kapper/dashboard" 
            element={
              <ProtectedRoute>
                <div className="container-max"><KapperDashboardPage /></div>
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



import React, { useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import HomePage from './pages/HomePage.jsx'
import BarberProfilePage from './pages/BarberProfilePage.jsx'
import BarberDashboardPage from './pages/BarberDashboardPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import MapPage from './pages/MapPage.jsx'
import AdminDashboardPage from './pages/AdminDashboardPage.jsx'
import AdminLoginPage from './pages/admin/AdminLoginPage.jsx'
import AdminKappersPage from './pages/admin/AdminKappersPage.jsx'
import AdminKlantenPage from './pages/admin/AdminKlantenPage.jsx'
import AdminKapperszakenPage from './pages/admin/AdminKapperszakenPage.jsx'
import AdminBoekingenPage from './pages/admin/AdminBoekingenPage.jsx'
import AdminDienstenPage from './pages/admin/AdminDienstenPage.jsx'
import AdminReviewsPage from './pages/admin/AdminReviewsPage.jsx'
import KapperszaakDetailPage from './pages/admin/KapperszaakDetailPage.jsx'
import AdminLayout from './components/admin/AdminLayout.jsx'
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
      if (currentPath === '/login' || currentPath === '/register') {
        if (userProfile.role === 'admin') {
          navigate('/admin', { replace: true })
        } else if (userProfile.role === 'barber') {
          navigate('/dashboard', { replace: true })
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
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route 
            path="/admin" 
            element={
              <ProtectedAdminRoute>
                <AdminDashboardPage />
              </ProtectedAdminRoute>
            } 
          />
          <Route 
            path="/admin/kapperszaken/:id" 
            element={
              <ProtectedAdminRoute>
                <KapperszaakDetailPage />
              </ProtectedAdminRoute>
            } 
          />
          <Route
            path="/admin/*"
            element={
              <ProtectedAdminRoute>
                <AdminLayout>
                  <Routes>
                    <Route path="/kappers" element={<AdminKappersPage />} />
                    <Route path="/klanten" element={<AdminKlantenPage />} />
                    <Route path="/kapperszaken" element={<AdminKapperszakenPage />} />
                    <Route path="/boekingen" element={<AdminBoekingenPage />} />
                    <Route path="/diensten" element={<AdminDienstenPage />} />
                    <Route path="/reviews" element={<AdminReviewsPage />} />
                    <Route path="/instellingen" element={<div>Instellingen - TODO: Implement</div>} />
                  </Routes>
                </AdminLayout>
              </ProtectedAdminRoute>
            }
          />
          <Route path="/login" element={<div className="container-max"><LoginPage /></div>} />
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



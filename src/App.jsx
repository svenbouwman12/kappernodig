import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import HomePage from './pages/HomePage.jsx'
import BarberProfilePage from './pages/BarberProfilePage.jsx'
import BarberDashboardPage from './pages/BarberDashboardPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="p-8">Laden...</div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-full flex flex-col bg-background text-secondary">
        <Navbar />
        <main className="flex-1 container-max py-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/barber/:id" element={<BarberProfilePage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <BarberDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </AuthProvider>
  )
}



import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import Card from '../../components/Card.jsx'
import { 
  Building2, 
  MapPin, 
  Star, 
  Wrench, 
  Calendar, 
  MessageSquare,
  User,
  Search,
  LogOut,
  Plus
} from 'lucide-react'

const AdminDashboardPage = () => {
  const [kapperszaken, setKapperszaken] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const navigate = useNavigate()
  const { user, userProfile, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    navigate('/admin/login')
  }

  const handleCardClick = (kapperszaak) => {
    console.log('=== CARD CLICKED ===')
    console.log('Kapperszaak ID:', kapperszaak.id)
    console.log('Kapperszaak Name:', kapperszaak.name)
    console.log('Navigating to:', `/admin/kapperszaken/${kapperszaak.id}`)
    
    // Force navigation
    window.location.href = `/admin/kapperszaken/${kapperszaak.id}`
  }

  useEffect(() => {
    loadKapperszaken()
  }, [])

  const loadKapperszaken = async () => {
    setLoading(true)
    try {
      // Load kapperszaken with owner info
      const { data: kapperszakenData, error: kapperszakenError } = await supabase
        .from('barbers')
        .select('*')
        .order('created_at', { ascending: false })

      if (kapperszakenError) {
        console.error('Error loading kapperszaken:', kapperszakenError)
        return
      }

      // Load owner info for each kapperszaak
      const kapperszakenWithOwners = await Promise.all(
        (kapperszakenData || []).map(async (kapperszaak) => {
          const { data: ownerData } = await supabase
            .from('profiles')
            .select('id, naam, email')
            .eq('id', kapperszaak.owner_id)
            .single()

          // Load reviews count
          const { count: reviewsCount } = await supabase
            .from('reviews')
            .select('*', { count: 'exact' })
            .eq('salon_id', kapperszaak.id)
            .eq('is_published', true)
            .eq('is_approved', true)

          // Load services count
          const { count: servicesCount } = await supabase
            .from('services')
            .select('*', { count: 'exact' })
            .eq('barber_id', kapperszaak.id)

          // Load appointments count
          const { count: appointmentsCount } = await supabase
            .from('appointments')
            .select('*', { count: 'exact' })
            .eq('barber_id', kapperszaak.id)

          return {
            ...kapperszaak,
            owner: ownerData,
            reviewsCount: reviewsCount || 0,
            servicesCount: servicesCount || 0,
            appointmentsCount: appointmentsCount || 0
          }
        })
      )

      setKapperszaken(kapperszakenWithOwners)
    } catch (err) {
      console.error('Error loading kapperszaken:', err)
    } finally {
      setLoading(false)
    }
  }

  // Filter kapperszaken based on search term
  const filteredKapperszaken = kapperszaken.filter(kapperszaak =>
    kapperszaak.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    kapperszaak.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (kapperszaak.owner && kapperszaak.owner.naam.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="flex items-center justify-between h-16 px-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-primary">Kapper Nodig</h1>
            <div className="relative">
              <input
                type="text"
                placeholder="Zoek kapper, locatie..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <User size={16} className="text-white" />
              </div>
              <span className="text-sm font-medium text-gray-900">
                {userProfile?.naam || 'Admin'}
              </span>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut size={16} />
              <span>Uitloggen</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Admin Dashboard</h2>
              <p className="mt-2 text-gray-600">
                Klik op een kapperszaak om deze te beheren
              </p>
            </div>
          </div>

      {/* Kapperszaken Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredKapperszaken.map((kapperszaak) => (
          <div
            key={kapperszaak.id}
            onClick={() => handleCardClick(kapperszaak)}
            className="cursor-pointer"
            style={{ pointerEvents: 'auto' }}
          >
            <Card 
              className="p-6 hover:shadow-lg hover:bg-gray-50 transition-all duration-200 border-2 hover:border-primary/20"
              style={{ pointerEvents: 'none' }}
            >
              <div className="flex items-start justify-between mb-4" style={{ pointerEvents: 'none' }}>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {kapperszaak.name}
                    </h3>
                    <p className="text-sm text-gray-600 flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {kapperszaak.location}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center text-yellow-500">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="ml-1 text-sm font-medium">{kapperszaak.rating || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Owner Info */}
              {kapperszaak.owner && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg" style={{ pointerEvents: 'none' }}>
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {kapperszaak.owner.naam}
                      </p>
                      <p className="text-xs text-gray-500">{kapperszaak.owner.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 text-center" style={{ pointerEvents: 'none' }}>
                <div className="flex flex-col items-center">
                  <Wrench className="h-5 w-5 text-blue-500 mb-1" />
                  <span className="text-sm font-medium text-gray-900">{kapperszaak.servicesCount}</span>
                  <span className="text-xs text-gray-500">Diensten</span>
                </div>
                <div className="flex flex-col items-center">
                  <Calendar className="h-5 w-5 text-green-500 mb-1" />
                  <span className="text-sm font-medium text-gray-900">{kapperszaak.appointmentsCount}</span>
                  <span className="text-xs text-gray-500">Afspraken</span>
                </div>
                <div className="flex flex-col items-center">
                  <MessageSquare className="h-5 w-5 text-purple-500 mb-1" />
                  <span className="text-sm font-medium text-gray-900">{kapperszaak.reviewsCount}</span>
                  <span className="text-xs text-gray-500">Reviews</span>
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>

          {filteredKapperszaken.length === 0 && (
            <Card className="p-12 text-center">
              <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Geen kapperszaken gevonden</h3>
              <p className="text-gray-500">
                {searchTerm ? 'Probeer een andere zoekterm.' : 'Er zijn nog geen kapperszaken geregistreerd.'}
              </p>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}

export default AdminDashboardPage
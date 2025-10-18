import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext.jsx'
import Card from '../../components/Card.jsx'
import { 
  Building2, 
  MapPin, 
  Star, 
  User, 
  Search,
  LogOut,
  Plus,
  Eye,
  Edit,
  Trash2,
  Calendar,
  MessageSquare,
  Wrench
} from 'lucide-react'

const AdminHome = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [kapperszaken, setKapperszaken] = useState([])
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadUserProfile()
    loadKapperszaken()
  }, [])

  const loadUserProfile = async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (error) {
        console.error('Error loading user profile:', error)
        return
      }
      
      setUserProfile(data)
    } catch (err) {
      console.error('Error loading user profile:', err)
    }
  }

  const loadKapperszaken = async () => {
    setLoading(true)
    try {
      // Load kapperszaken
      const { data: barbersData, error: barbersError } = await supabase
        .from('barbers')
        .select('*')
        .order('created_at', { ascending: false })

      if (barbersError) {
        console.error('Error loading kapperszaken:', barbersError)
        return
      }

      // Load related data for each kapperszaak
      const kapperszakenWithData = await Promise.all(
        (barbersData || []).map(async (kapperszaak) => {
          // Load owner profile
          const { data: ownerData } = await supabase
            .from('profiles')
            .select('id, naam, email')
            .eq('id', kapperszaak.owner_id)
            .single()

          // Load services count
          const { count: servicesCount } = await supabase
            .from('services')
            .select('*', { count: 'exact', head: true })
            .eq('barber_id', kapperszaak.id)

          // Load appointments count
          const { count: appointmentsCount } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('barber_id', kapperszaak.id)

          // Load reviews count
          const { count: reviewsCount } = await supabase
            .from('reviews')
            .select('*', { count: 'exact', head: true })
            .eq('salon_id', kapperszaak.id)

          // Determine status based on data
          const status = getKapperszaakStatus(kapperszaak, servicesCount, appointmentsCount)

          return {
            ...kapperszaak,
            owner: ownerData,
            servicesCount: servicesCount || 0,
            appointmentsCount: appointmentsCount || 0,
            reviewsCount: reviewsCount || 0,
            status
          }
        })
      )

      setKapperszaken(kapperszakenWithData)
    } catch (err) {
      console.error('Error loading kapperszaken:', err)
    } finally {
      setLoading(false)
    }
  }

  const getKapperszaakStatus = (kapperszaak, servicesCount, appointmentsCount) => {
    if (!kapperszaak.location || !kapperszaak.phone) return 'Incomplete'
    if (servicesCount === 0) return 'No Services'
    if (appointmentsCount === 0) return 'No Bookings'
    return 'Active'
  }

  const handleCardClick = (kapperszaak) => {
    console.log('Card clicked:', kapperszaak.name, kapperszaak.id)
    navigate(`/admin/kapperszaken/${kapperszaak.id}`)
  }

  const handleLogout = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800'
      case 'Incomplete': return 'bg-yellow-100 text-yellow-800'
      case 'No Services': return 'bg-orange-100 text-orange-800'
      case 'No Bookings': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredKapperszaken = kapperszaken.filter(kapperszaak =>
    kapperszaak.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    kapperszaak.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (kapperszaak.owner?.naam && kapperszaak.owner.naam.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Kapperszaken laden...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="flex items-center justify-between h-16 px-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-primary">Admin Dashboard</h1>
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
              
              {/* Test Button */}
              <button
                onClick={() => console.log('Test button clicked')}
                className="px-2 py-1 bg-blue-500 text-white text-xs rounded"
              >
                TEST
              </button>
            
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
      <main className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Kapperszaken Beheer</h2>
          <p className="text-gray-600">
            Beheer alle kapperszaken in het systeem. Klik op een card voor meer details.
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Zoek kapperszaak, locatie of eigenaar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        {/* Kapperszaken Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredKapperszaken.map((kapperszaak) => (
            <div
              key={kapperszaak.id}
              className="cursor-pointer"
              onClick={() => handleCardClick(kapperszaak)}
              style={{ pointerEvents: 'auto' }}
            >
              <Card 
                className="p-6 hover:shadow-lg hover:bg-gray-50 transition-all duration-200 border-2 hover:border-primary/20 h-full"
                style={{ pointerEvents: 'none' }}
              >
              {/* Header with Status */}
              <div className="flex items-start justify-between mb-4">
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
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(kapperszaak.status)}`}>
                  {kapperszaak.status}
                </span>
              </div>

              {/* Owner Info */}
              {kapperszaak.owner && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
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
              <div className="grid grid-cols-3 gap-4 text-center">
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

              {/* Rating */}
              {kapperszaak.rating && (
                <div className="mt-4 flex items-center justify-center">
                  <div className="flex items-center text-yellow-500">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="ml-1 text-sm font-medium">{kapperszaak.rating}</span>
                  </div>
                </div>
              )}
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
      </main>
    </div>
  )
}

export default AdminHome

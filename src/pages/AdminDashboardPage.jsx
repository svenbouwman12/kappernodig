import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext.jsx'
import Card from '../components/Card.jsx'
import DataTable from '../components/admin/DataTable.jsx'
import Button from '../components/Button.jsx'
import { 
  Building2, 
  MapPin, 
  Star, 
  User, 
  Wrench, 
  Calendar, 
  MessageSquare,
  LogOut,
  ArrowLeft,
  Plus,
  Eye,
  Edit,
  Trash2,
  Phone,
  Globe
} from 'lucide-react'

export default function AdminDashboardPage() {
  const { user, signOut } = useAuth()
  const [kapperszaken, setKapperszaken] = useState([])
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedKapperszaak, setSelectedKapperszaak] = useState(null)
  const [showModal, setShowModal] = useState(false)

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

          // Load services data
          const { data: servicesData } = await supabase
            .from('services')
            .select('id, name, price')
            .eq('barber_id', kapperszaak.id)

          // Load reviews data
          const { data: reviewsData } = await supabase
            .from('reviews')
            .select('id, rating, is_published, is_approved')
            .eq('salon_id', kapperszaak.id)

          return {
            ...kapperszaak,
            owner: ownerData,
            services: servicesData || [],
            reviews: reviewsData || [],
            servicesCount: servicesCount || 0,
            appointmentsCount: appointmentsCount || 0,
            reviewsCount: reviewsCount || 0
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


  const handleLogout = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleView = (kapperszaak) => {
    setSelectedKapperszaak(kapperszaak)
    setShowModal(true)
  }

  const handleEdit = (kapperszaak) => {
    // Navigate to detail page for editing
    window.location.href = `/dashboard/admin/kapperszaken/${kapperszaak.id}`
  }

  const handleDelete = async (kapperszaak) => {
    if (!confirm(`Weet je zeker dat je ${kapperszaak.name} wilt verwijderen?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('barbers')
        .delete()
        .eq('id', kapperszaak.id)

      if (error) {
        console.error('Error deleting kapperszaak:', error)
        alert('Er is een fout opgetreden bij het verwijderen van de kapperszaak.')
        return
      }

      loadKapperszaken()
      alert('Kapperszaak succesvol verwijderd!')
    } catch (err) {
      console.error('Error deleting kapperszaak:', err)
      alert('Er is een fout opgetreden bij het verwijderen van de kapperszaak.')
    }
  }

  const getAverageRating = (reviews) => {
    const publishedReviews = reviews?.filter(r => r.is_published && r.is_approved) || []
    if (publishedReviews.length === 0) return 0
    const sum = publishedReviews.reduce((acc, review) => acc + review.rating, 0)
    return (sum / publishedReviews.length).toFixed(1)
  }


  const columns = [
    {
      key: 'name',
      title: 'Naam',
      render: (value, row) => (
        <div className="flex items-center">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
            <Building2 size={16} className="text-primary" />
          </div>
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    {
      key: 'location',
      title: 'Locatie',
      render: (value) => (
        <div className="flex items-center">
          <MapPin size={16} className="text-gray-400 mr-1" />
          <span>{value}</span>
        </div>
      )
    },
    {
      key: 'owner',
      title: 'Eigenaar',
      render: (value) => (
        <span>{value?.naam || 'Onbekend'}</span>
      )
    },
    {
      key: 'rating',
      title: 'Rating',
      render: (value, row) => {
        const avgRating = getAverageRating(row.reviews)
        return (
          <div className="flex items-center">
            <Star size={16} className="text-yellow-400 fill-current mr-1" />
            <span>{avgRating || 'N/A'}</span>
          </div>
        )
      }
    },
    {
      key: 'services',
      title: 'Diensten',
      render: (value) => (
        <span>{value?.length || 0}</span>
      )
    },
    {
      key: 'reviews',
      title: 'Reviews',
      render: (value) => {
        const publishedCount = value?.filter(r => r.is_published && r.is_approved).length || 0
        return <span>{publishedCount}</span>
      }
    },
    {
      key: 'created_at',
      title: 'Aangemaakt',
      render: (value) => new Date(value).toLocaleDateString('nl-NL')
    }
  ]

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
            <h1 className="text-xl font-bold text-primary">Kapper Nodig</h1>
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
      <main className="max-w-7xl mx-auto p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Kapperszaken Beheer</h1>
              <p className="mt-2 text-gray-600">
                Beheer alle kapperszaken in het systeem
              </p>
            </div>
            <Button className="flex items-center gap-2">
              <Plus size={16} />
              Nieuwe Kapperszaak
            </Button>
          </div>

          {/* Data Table */}
          <DataTable
            data={kapperszaken}
            columns={columns}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            loading={loading}
            searchable={true}
            filterable={true}
            sortable={true}
            pagination={true}
            pageSize={10}
          />
        </div>
      </main>

      {/* Kapperszaak Detail Modal */}
      {showModal && selectedKapperszaak && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Kapperszaak Details
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Info */}
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <Building2 size={24} className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-medium text-gray-900">
                      {selectedKapperszaak.name}
                    </h4>
                    <p className="text-gray-600">{selectedKapperszaak.location}</p>
                    <div className="flex items-center mt-2">
                      <Star size={16} className="text-yellow-400 fill-current mr-1" />
                      <span className="text-sm text-gray-600">
                        {getAverageRating(selectedKapperszaak.reviews)} ({selectedKapperszaak.reviews?.filter(r => r.is_published && r.is_approved).length || 0} reviews)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Locatie
                    </label>
                    <div className="flex items-center">
                      <MapPin size={16} className="text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{selectedKapperszaak.location}</span>
                    </div>
                  </div>
                  {selectedKapperszaak.phone && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Telefoon
                      </label>
                      <div className="flex items-center">
                        <Phone size={16} className="text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{selectedKapperszaak.phone}</span>
                      </div>
                    </div>
                  )}
                  {selectedKapperszaak.website && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Website
                      </label>
                      <div className="flex items-center">
                        <Globe size={16} className="text-gray-400 mr-2" />
                        <a href={selectedKapperszaak.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                          {selectedKapperszaak.website}
                        </a>
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Eigenaar
                    </label>
                    <span className="text-sm text-gray-900">
                      {selectedKapperszaak.owner?.naam || 'Onbekend'}
                    </span>
                  </div>
                </div>

                {/* Description */}
                {selectedKapperszaak.description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Beschrijving
                    </label>
                    <p className="text-sm text-gray-900 leading-relaxed">
                      {selectedKapperszaak.description}
                    </p>
                  </div>
                )}

                {/* Services */}
                {selectedKapperszaak.services && selectedKapperszaak.services.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-3">
                      Diensten ({selectedKapperszaak.services.length})
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedKapperszaak.services.map((service) => (
                        <div key={service.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium text-gray-900">{service.name}</span>
                          <span className="text-sm text-gray-600">€{service.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Reviews */}
                {selectedKapperszaak.reviews && selectedKapperszaak.reviews.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-3">
                      Recente Reviews ({selectedKapperszaak.reviews.filter(r => r.is_published && r.is_approved).length})
                    </h5>
                    <div className="space-y-3 max-h-40 overflow-y-auto">
                      {selectedKapperszaak.reviews
                        .filter(r => r.is_published && r.is_approved)
                        .slice(0, 3)
                        .map((review) => (
                        <div key={review.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star 
                                  key={star}
                                  size={12} 
                                  className={star <= review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'} 
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-xs text-gray-600">{review.content?.substring(0, 100)}...</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                <Button
                  variant="secondary"
                  onClick={() => setShowModal(false)}
                >
                  Sluiten
                </Button>
                <Button
                  onClick={() => handleEdit(selectedKapperszaak)}
                >
                  Bewerken
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
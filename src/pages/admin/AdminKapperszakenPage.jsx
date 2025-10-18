import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import DataTable from '../../components/admin/DataTable.jsx'
import Button from '../../components/Button.jsx'
import { Plus, Eye, Edit, Trash2, Building2, Star, MapPin, Phone, Globe } from 'lucide-react'

const AdminKapperszakenPage = () => {
  const [kapperszaken, setKapperszaken] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedKapperszaak, setSelectedKapperszaak] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    loadKapperszaken()
  }, [])

  const loadKapperszaken = async () => {
    setLoading(true)
    try {
      // Load kapperszaken first
      const { data: barbersData, error: barbersError } = await supabase
        .from('barbers')
        .select('*')
        .order('created_at', { ascending: false })

      if (barbersError) {
        console.error('Error loading kapperszaken:', barbersError)
        return
      }

      // Load related data for each kapperszaak
      const barbersWithData = await Promise.all(
        (barbersData || []).map(async (barber) => {
          // Load owner profile
          const { data: ownerData } = await supabase
            .from('profiles')
            .select('id, naam, email')
            .eq('id', barber.owner_id)
            .single()

          // Load services
          const { data: servicesData } = await supabase
            .from('services')
            .select('id, name, price')
            .eq('barber_id', barber.id)

          // Load reviews
          const { data: reviewsData } = await supabase
            .from('reviews')
            .select('id, rating, is_published, is_approved')
            .eq('salon_id', barber.id)

          return {
            ...barber,
            profiles: ownerData,
            services: servicesData || [],
            reviews: reviewsData || []
          }
        })
      )

      setKapperszaken(barbersWithData)
    } catch (err) {
      console.error('Error loading kapperszaken:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleView = (kapperszaak) => {
    setSelectedKapperszaak(kapperszaak)
    setShowModal(true)
  }

  const handleEdit = (kapperszaak) => {
    // TODO: Implement edit functionality
    console.log('Edit kapperszaak:', kapperszaak)
  }

  const handleDelete = async (kapperszaak) => {
    if (!confirm(`Weet je zeker dat je ${kapperszaak.name} wilt verwijderen?`)) {
      return
    }

    try {
      // Delete kapperszaak
      const { error } = await supabase
        .from('barbers')
        .delete()
        .eq('id', kapperszaak.id)

      if (error) {
        console.error('Error deleting kapperszaak:', error)
        alert('Er is een fout opgetreden bij het verwijderen van de kapperszaak.')
        return
      }

      // Reload kapperszaken list
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
      key: 'profiles',
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

  return (
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
                      {selectedKapperszaak.profiles?.naam || 'Onbekend'}
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

export default AdminKapperszakenPage

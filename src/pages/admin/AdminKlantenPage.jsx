import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import DataTable from '../../components/admin/DataTable.jsx'
import Button from '../../components/Button.jsx'
import { Eye, Edit, Trash2, User, Calendar, MessageSquare, Star } from 'lucide-react'

const AdminKlantenPage = () => {
  const [klanten, setKlanten] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedKlant, setSelectedKlant] = useState(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    loadKlanten()
  }, [])

  const loadKlanten = async () => {
    setLoading(true)
    try {
      // Load klanten first
      const { data: klantenData, error: klantenError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'client')
        .order('created_at', { ascending: false })

      if (klantenError) {
        console.error('Error loading klanten:', klantenError)
        return
      }

      // Load related data for each klant
      const klantenWithData = await Promise.all(
        (klantenData || []).map(async (klant) => {
          // Load appointments
          const { data: appointmentsData } = await supabase
            .from('appointments')
            .select(`
              id,
              appointment_date,
              appointment_time,
              barbers (
                name
              )
            `)
            .eq('client_id', klant.id)

          // Load reviews
          const { data: reviewsData } = await supabase
            .from('reviews')
            .select('id, rating, title, is_published, is_approved')
            .eq('user_id', klant.id)

          return {
            ...klant,
            appointments: appointmentsData || [],
            reviews: reviewsData || []
          }
        })
      )

      setKlanten(klantenWithData)
    } catch (err) {
      console.error('Error loading klanten:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleView = (klant) => {
    setSelectedKlant(klant)
    setShowModal(true)
  }

  const handleEdit = (klant) => {
    // TODO: Implement edit functionality
    console.log('Edit klant:', klant)
  }

  const handleDelete = async (klant) => {
    if (!confirm(`Weet je zeker dat je ${klant.naam} wilt verwijderen?`)) {
      return
    }

    try {
      // Delete klant profile
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', klant.id)

      if (error) {
        console.error('Error deleting klant:', error)
        alert('Er is een fout opgetreden bij het verwijderen van de klant.')
        return
      }

      // Reload klanten list
      loadKlanten()
      alert('Klant succesvol verwijderd!')
    } catch (err) {
      console.error('Error deleting klant:', err)
      alert('Er is een fout opgetreden bij het verwijderen van de klant.')
    }
  }

  const columns = [
    {
      key: 'naam',
      title: 'Naam',
      render: (value, row) => (
        <div className="flex items-center">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
            <User size={16} className="text-primary" />
          </div>
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    {
      key: 'email',
      title: 'Email'
    },
    {
      key: 'appointments',
      title: 'Boekingen',
      render: (value) => (
        <div className="flex items-center">
          <Calendar size={16} className="text-gray-400 mr-1" />
          <span>{value?.length || 0}</span>
        </div>
      )
    },
    {
      key: 'reviews',
      title: 'Reviews',
      render: (value) => (
        <div className="flex items-center">
          <MessageSquare size={16} className="text-gray-400 mr-1" />
          <span>{value?.length || 0}</span>
        </div>
      )
    },
    {
      key: 'created_at',
      title: 'Aangemaakt',
      render: (value) => new Date(value).toLocaleDateString('nl-NL')
    },
    {
      key: 'is_active',
      title: 'Status',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value ? 'Actief' : 'Inactief'}
        </span>
      )
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Klanten Beheer</h1>
          <p className="mt-2 text-gray-600">
            Beheer alle klantaccounts in het systeem
          </p>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={klanten}
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

      {/* Klant Detail Modal */}
      {showModal && selectedKlant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Klant Details
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <User size={24} className="text-primary" />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">
                      {selectedKlant.naam}
                    </h4>
                    <p className="text-gray-600">{selectedKlant.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <p className="text-sm text-gray-900">{selectedKlant.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Aangemaakt
                    </label>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedKlant.created_at).toLocaleDateString('nl-NL')}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedKlant.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedKlant.is_active ? 'Actief' : 'Inactief'}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Laatste bezoek
                    </label>
                    <p className="text-sm text-gray-900">
                      {selectedKlant.last_login ? new Date(selectedKlant.last_login).toLocaleDateString('nl-NL') : 'Onbekend'}
                    </p>
                  </div>
                </div>

                {/* Recent Bookings */}
                {selectedKlant.appointments && selectedKlant.appointments.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-3">
                      Recente Boekingen ({selectedKlant.appointments.length})
                    </h5>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {selectedKlant.appointments.slice(0, 5).map((appointment) => (
                        <div key={appointment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">
                              {appointment.barbers?.name || 'Onbekende kapper'}
                            </p>
                            <p className="text-sm text-gray-600">
                              {new Date(appointment.appointment_date).toLocaleDateString('nl-NL')} om {appointment.appointment_time}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reviews */}
                {selectedKlant.reviews && selectedKlant.reviews.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-3">
                      Reviews ({selectedKlant.reviews.length})
                    </h5>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {selectedKlant.reviews.slice(0, 3).map((review) => (
                        <div key={review.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <h6 className="font-medium text-gray-900">{review.title}</h6>
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
                          <div className="flex items-center justify-between mt-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              review.is_approved && review.is_published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {review.is_approved && review.is_published ? 'Gepubliceerd' : 'In behandeling'}
                            </span>
                          </div>
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
                  onClick={() => handleEdit(selectedKlant)}
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

export default AdminKlantenPage

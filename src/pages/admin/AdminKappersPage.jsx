import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import DataTable from '../../components/admin/DataTable.jsx'
import Button from '../../components/Button.jsx'
import { Plus, Eye, Edit, Trash2, User, Building2 } from 'lucide-react'

const AdminKappersPage = () => {
  const [kappers, setKappers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedKapper, setSelectedKapper] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    loadKappers()
  }, [])

  const loadKappers = async () => {
    setLoading(true)
    try {
      // Load kappers first
      const { data: kappersData, error: kappersError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'kapper')
        .order('created_at', { ascending: false })

      if (kappersError) {
        console.error('Error loading kappers:', kappersError)
        return
      }

      // Load barbers for each kapper
      const kappersWithBarbers = await Promise.all(
        (kappersData || []).map(async (kapper) => {
          const { data: barbersData } = await supabase
            .from('barbers')
            .select('id, name, location, rating')
            .eq('owner_id', kapper.id)
          
          return {
            ...kapper,
            barbers: barbersData || []
          }
        })
      )

      setKappers(kappersWithBarbers)
    } catch (err) {
      console.error('Error loading kappers:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleView = (kapper) => {
    setSelectedKapper(kapper)
    setShowModal(true)
  }

  const handleEdit = (kapper) => {
    // TODO: Implement edit functionality
    console.log('Edit kapper:', kapper)
  }

  const handleDelete = async (kapper) => {
    if (!confirm(`Weet je zeker dat je ${kapper.naam} wilt verwijderen?`)) {
      return
    }

    try {
      // Delete kapper profile
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', kapper.id)

      if (error) {
        console.error('Error deleting kapper:', error)
        alert('Er is een fout opgetreden bij het verwijderen van de kapper.')
        return
      }

      // Reload kappers list
      loadKappers()
      alert('Kapper succesvol verwijderd!')
    } catch (err) {
      console.error('Error deleting kapper:', err)
      alert('Er is een fout opgetreden bij het verwijderen van de kapper.')
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
      key: 'created_at',
      title: 'Aangemaakt',
      render: (value) => new Date(value).toLocaleDateString('nl-NL')
    },
    {
      key: 'barbers',
      title: 'Kapperszaken',
      render: (value) => (
        <div className="flex items-center">
          <Building2 size={16} className="text-gray-400 mr-1" />
          <span>{value?.length || 0}</span>
        </div>
      )
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
          <h1 className="text-3xl font-bold text-gray-900">Kappers Beheer</h1>
          <p className="mt-2 text-gray-600">
            Beheer alle kappersaccounts in het systeem
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus size={16} />
          Nieuwe Kapper
        </Button>
      </div>

      {/* Data Table */}
      <DataTable
        data={kappers}
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

      {/* Kapper Detail Modal */}
      {showModal && selectedKapper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Kapper Details
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
                      {selectedKapper.naam}
                    </h4>
                    <p className="text-gray-600">{selectedKapper.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <p className="text-sm text-gray-900">{selectedKapper.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Aangemaakt
                    </label>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedKapper.created_at).toLocaleDateString('nl-NL')}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedKapper.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedKapper.is_active ? 'Actief' : 'Inactief'}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kapperszaken
                    </label>
                    <p className="text-sm text-gray-900">
                      {selectedKapper.barbers?.length || 0}
                    </p>
                  </div>
                </div>

                {/* Kapperszaken lijst */}
                {selectedKapper.barbers && selectedKapper.barbers.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">
                      Kapperszaken
                    </h5>
                    <div className="space-y-2">
                      {selectedKapper.barbers.map((barber) => (
                        <div key={barber.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{barber.name}</p>
                            <p className="text-sm text-gray-600">{barber.location}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {barber.rating && (
                              <span className="text-sm text-gray-600">
                                ⭐ {barber.rating}
                              </span>
                            )}
                            <button
                              onClick={() => navigate(`/admin/kapperszaken/${barber.id}`)}
                              className="text-primary hover:text-primary/80 text-sm"
                            >
                              Bekijk
                            </button>
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
                  onClick={() => handleEdit(selectedKapper)}
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

export default AdminKappersPage

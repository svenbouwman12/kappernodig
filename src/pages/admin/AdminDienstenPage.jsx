import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import DataTable from '../../components/admin/DataTable.jsx'
import Button from '../../components/Button.jsx'
import { Plus, Eye, Edit, Trash2, Scissors, Building2, Clock } from 'lucide-react'

const AdminDienstenPage = () => {
  const [diensten, setDiensten] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDienst, setSelectedDienst] = useState(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    loadDiensten()
  }, [])

  const loadDiensten = async () => {
    setLoading(true)
    try {
      // Load diensten first
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false })

      if (servicesError) {
        console.error('Error loading diensten:', servicesError)
        return
      }

      // Load related data for each service
      const servicesWithData = await Promise.all(
        (servicesData || []).map(async (service) => {
          // Load barber info
          const { data: barberData } = await supabase
            .from('barbers')
            .select('id, name, location')
            .eq('id', service.barber_id)
            .single()

          return {
            ...service,
            barbers: barberData
          }
        })
      )

      setDiensten(servicesWithData)
    } catch (err) {
      console.error('Error loading diensten:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleView = (dienst) => {
    setSelectedDienst(dienst)
    setShowModal(true)
  }

  const handleEdit = (dienst) => {
    // TODO: Implement edit functionality
    console.log('Edit dienst:', dienst)
  }

  const handleDelete = async (dienst) => {
    if (!confirm(`Weet je zeker dat je de dienst "${dienst.name}" wilt verwijderen?`)) {
      return
    }

    try {
      // Delete dienst
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', dienst.id)

      if (error) {
        console.error('Error deleting dienst:', error)
        alert('Er is een fout opgetreden bij het verwijderen van de dienst.')
        return
      }

      // Reload diensten list
      loadDiensten()
      alert('Dienst succesvol verwijderd!')
    } catch (err) {
      console.error('Error deleting dienst:', err)
      alert('Er is een fout opgetreden bij het verwijderen van de dienst.')
    }
  }

  const columns = [
    {
      key: 'name',
      title: 'Naam',
      render: (value, row) => (
        <div className="flex items-center">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
            <Scissors size={16} className="text-primary" />
          </div>
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    {
      key: 'barbers',
      title: 'Kapperszaak',
      render: (value) => (
        <div className="flex items-center">
          <Building2 size={16} className="text-gray-400 mr-2" />
          <span>{value?.name || 'Onbekend'}</span>
        </div>
      )
    },
    {
      key: 'price',
      title: 'Prijs',
      render: (value) => (
        <span className="font-medium">€{value}</span>
      )
    },
    {
      key: 'duration_minutes',
      title: 'Duur',
      render: (value) => (
        <div className="flex items-center">
          <Clock size={16} className="text-gray-400 mr-1" />
          <span>{value || 'N/A'} min</span>
        </div>
      )
    },
    {
      key: 'description',
      title: 'Beschrijving',
      render: (value) => (
        <span className="truncate max-w-xs">{value || 'Geen beschrijving'}</span>
      )
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
          <h1 className="text-3xl font-bold text-gray-900">Diensten Beheer</h1>
          <p className="mt-2 text-gray-600">
            Beheer alle diensten van kapperszaken
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus size={16} />
          Nieuwe Dienst
        </Button>
      </div>

      {/* Data Table */}
      <DataTable
        data={diensten}
        columns={columns}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
        searchable={true}
        filterable={true}
        sortable={true}
        pagination={true}
        pageSize={15}
      />

      {/* Dienst Detail Modal */}
      {showModal && selectedDienst && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Dienst Details
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* Basic Info */}
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <Scissors size={24} className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-medium text-gray-900">
                      {selectedDienst.name}
                    </h4>
                    <div className="flex items-center mt-2">
                      <Building2 size={16} className="text-gray-400 mr-2" />
                      <span className="text-gray-600">{selectedDienst.barbers?.name}</span>
                    </div>
                  </div>
                </div>

                {/* Service Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prijs
                    </label>
                    <p className="text-lg font-semibold text-gray-900">€{selectedDienst.price}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duur
                    </label>
                    <div className="flex items-center">
                      <Clock size={16} className="text-gray-400 mr-2" />
                      <span className="text-gray-900">{selectedDienst.duration_minutes || 'N/A'} minuten</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kapperszaak
                    </label>
                    <div className="flex items-center">
                      <Building2 size={16} className="text-gray-400 mr-2" />
                      <span className="text-gray-900">{selectedDienst.barbers?.name}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Locatie
                    </label>
                    <p className="text-gray-900">{selectedDienst.barbers?.location}</p>
                  </div>
                </div>

                {/* Description */}
                {selectedDienst.description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Beschrijving
                    </label>
                    <p className="text-sm text-gray-900 leading-relaxed p-3 bg-gray-50 rounded-lg">
                      {selectedDienst.description}
                    </p>
                  </div>
                )}

                {/* Metadata */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h5 className="text-sm font-medium text-gray-700 mb-3">
                    Service Informatie
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Aangemaakt
                      </label>
                      <p className="text-sm text-gray-900">
                        {new Date(selectedDienst.created_at).toLocaleDateString('nl-NL')}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Laatst bijgewerkt
                      </label>
                      <p className="text-sm text-gray-900">
                        {new Date(selectedDienst.updated_at).toLocaleDateString('nl-NL')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                <Button
                  variant="secondary"
                  onClick={() => setShowModal(false)}
                >
                  Sluiten
                </Button>
                <Button
                  onClick={() => handleEdit(selectedDienst)}
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

export default AdminDienstenPage

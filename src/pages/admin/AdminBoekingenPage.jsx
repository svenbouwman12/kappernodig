import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import DataTable from '../../components/admin/DataTable.jsx'
import Button from '../../components/Button.jsx'
import { Eye, Edit, Trash2, Calendar, Clock, User, Building2, Check, X } from 'lucide-react'

const AdminBoekingenPage = () => {
  const [boekingen, setBoekingen] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, today, upcoming, past
  const [selectedBoeking, setSelectedBoeking] = useState(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    loadBoekingen()
  }, [filter])

  const loadBoekingen = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          barbers (
            id,
            name,
            location
          ),
          clients (
            id,
            naam,
            email
          )
        `)
        .order('appointment_date', { ascending: true })

      // Apply filter
      const today = new Date().toISOString().split('T')[0]
      if (filter === 'today') {
        query = query.eq('appointment_date', today)
      } else if (filter === 'upcoming') {
        query = query.gte('appointment_date', today)
      } else if (filter === 'past') {
        query = query.lt('appointment_date', today)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error loading boekingen:', error)
        return
      }

      setBoekingen(data || [])
    } catch (err) {
      console.error('Error loading boekingen:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleView = (boeking) => {
    setSelectedBoeking(boeking)
    setShowModal(true)
  }

  const handleEdit = (boeking) => {
    // TODO: Implement edit functionality
    console.log('Edit boeking:', boeking)
  }

  const handleCancel = async (boeking) => {
    if (!confirm(`Weet je zeker dat je deze afspraak wilt annuleren?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('appointments')
        .update({
          status: 'cancelled'
        })
        .eq('id', boeking.id)

      if (error) {
        console.error('Error cancelling appointment:', error)
        alert('Er is een fout opgetreden bij het annuleren van de afspraak.')
        return
      }

      loadBoekingen()
      alert('Afspraak geannuleerd!')
    } catch (err) {
      console.error('Error cancelling appointment:', err)
      alert('Er is een fout opgetreden bij het annuleren van de afspraak.')
    }
  }

  const handleComplete = async (boeking) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({
          status: 'completed'
        })
        .eq('id', boeking.id)

      if (error) {
        console.error('Error completing appointment:', error)
        alert('Er is een fout opgetreden bij het voltooien van de afspraak.')
        return
      }

      loadBoekingen()
      alert('Afspraak voltooid!')
    } catch (err) {
      console.error('Error completing appointment:', err)
      alert('Er is een fout opgetreden bij het voltooien van de afspraak.')
    }
  }

  const getStatusBadge = (status, appointmentDate) => {
    const today = new Date().toISOString().split('T')[0]
    const isPast = appointmentDate < today

    if (status === 'completed') {
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Voltooid</span>
    } else if (status === 'cancelled') {
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Geannuleerd</span>
    } else if (isPast) {
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Verlopen</span>
    } else {
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Gepland</span>
    }
  }

  const columns = [
    {
      key: 'clients',
      title: 'Klant',
      render: (value, row) => (
        <div className="flex items-center">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
            <User size={16} className="text-primary" />
          </div>
          <span className="font-medium">{value?.naam || 'Onbekend'}</span>
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
      key: 'appointment_date',
      title: 'Datum',
      render: (value) => (
        <div className="flex items-center">
          <Calendar size={16} className="text-gray-400 mr-2" />
          <span>{new Date(value).toLocaleDateString('nl-NL')}</span>
        </div>
      )
    },
    {
      key: 'appointment_time',
      title: 'Tijd',
      render: (value) => (
        <div className="flex items-center">
          <Clock size={16} className="text-gray-400 mr-2" />
          <span>{value}</span>
        </div>
      )
    },
    {
      key: 'status',
      title: 'Status',
      render: (value, row) => getStatusBadge(value, row.appointment_date)
    },
    {
      key: 'created_at',
      title: 'Aangemaakt',
      render: (value) => new Date(value).toLocaleDateString('nl-NL')
    }
  ]

  const filterButtons = [
    { key: 'all', label: 'Alle Afspraken', count: boekingen.length },
    { key: 'today', label: 'Vandaag', count: boekingen.filter(b => b.appointment_date === new Date().toISOString().split('T')[0]).length },
    { key: 'upcoming', label: 'Toekomst', count: boekingen.filter(b => b.appointment_date >= new Date().toISOString().split('T')[0] && b.status !== 'cancelled').length },
    { key: 'past', label: 'Verleden', count: boekingen.filter(b => b.appointment_date < new Date().toISOString().split('T')[0]).length }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Boekingen Beheer</h1>
          <p className="mt-2 text-gray-600">
            Beheer alle afspraken en boekingen
          </p>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        {filterButtons.map((button) => (
          <button
            key={button.key}
            onClick={() => setFilter(button.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === button.key
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {button.label} ({button.count})
          </button>
        ))}
      </div>

      {/* Data Table */}
      <DataTable
        data={boekingen}
        columns={columns}
        onView={handleView}
        onEdit={handleEdit}
        loading={loading}
        searchable={true}
        filterable={true}
        sortable={true}
        pagination={true}
        pageSize={15}
      />

      {/* Boeking Detail Modal */}
      {showModal && selectedBoeking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Afspraak Details
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Klant
                    </label>
                    <div className="flex items-center">
                      <User size={16} className="text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">
                        {selectedBoeking.clients?.naam || 'Onbekend'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <p className="text-sm text-gray-900">
                      {selectedBoeking.clients?.email || 'Niet opgegeven'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kapperszaak
                    </label>
                    <div className="flex items-center">
                      <Building2 size={16} className="text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">
                        {selectedBoeking.barbers?.name || 'Onbekend'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Locatie
                    </label>
                    <p className="text-sm text-gray-900">
                      {selectedBoeking.barbers?.location || 'Niet opgegeven'}
                    </p>
                  </div>
                </div>

                {/* Appointment Details */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h5 className="text-sm font-medium text-gray-700 mb-3">
                    Afspraak Details
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Datum
                      </label>
                      <div className="flex items-center">
                        <Calendar size={16} className="text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {new Date(selectedBoeking.appointment_date).toLocaleDateString('nl-NL')}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tijd
                      </label>
                      <div className="flex items-center">
                        <Clock size={16} className="text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {selectedBoeking.appointment_time}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      {getStatusBadge(selectedBoeking.status, selectedBoeking.appointment_date)}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Aangemaakt
                      </label>
                      <p className="text-sm text-gray-900">
                        {new Date(selectedBoeking.created_at).toLocaleDateString('nl-NL')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedBoeking.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Opmerkingen
                    </label>
                    <p className="text-sm text-gray-900 p-3 bg-gray-50 rounded-lg">
                      {selectedBoeking.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between mt-6 pt-6 border-t border-gray-200">
                <div className="flex space-x-2">
                  {selectedBoeking.status === 'scheduled' && (
                    <>
                      <Button
                        onClick={() => handleComplete(selectedBoeking)}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                      >
                        <Check size={16} />
                        Voltooien
                      </Button>
                      <Button
                        onClick={() => handleCancel(selectedBoeking)}
                        variant="secondary"
                        className="flex items-center gap-2 text-red-600 bg-red-50 hover:bg-red-100"
                      >
                        <X size={16} />
                        Annuleren
                      </Button>
                    </>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    variant="secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Sluiten
                  </Button>
                  <Button
                    onClick={() => handleEdit(selectedBoeking)}
                  >
                    Bewerken
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminBoekingenPage

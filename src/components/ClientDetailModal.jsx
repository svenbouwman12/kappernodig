import React, { useState, useEffect } from 'react'
import { X, User, Phone, Mail, Calendar, Clock, Plus, Edit, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import AddAppointmentModal from './AddAppointmentModal.jsx'

export default function ClientDetailModal({ 
  client, 
  isOpen, 
  onClose, 
  salonId,
  onClientUpdated,
  onAppointmentAdded 
}) {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddAppointment, setShowAddAppointment] = useState(false)
  const [showEditClient, setShowEditClient] = useState(false)
  const [editForm, setEditForm] = useState({
    naam: '',
    telefoon: '',
    email: ''
  })

  useEffect(() => {
    if (isOpen && client && salonId) {
      loadAppointments()
      setEditForm({
        naam: client.naam || '',
        telefoon: client.telefoon || '',
        email: client.email || ''
      })
    }
  }, [isOpen, client, salonId])

  async function loadAppointments() {
    if (!client || !salonId) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          clients!inner(naam, telefoon, email)
        `)
        .eq('salon_id', salonId)
        .eq('klant_id', client.id)
        .order('start_tijd', { ascending: true })

      if (error) {
        console.error('Error loading appointments:', error)
        setAppointments([])
      } else {
        setAppointments(data || [])
      }
    } catch (err) {
      console.error('Error loading appointments:', err)
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdateClient() {
    if (!client) return

    try {
      const { error } = await supabase
        .from('clients')
        .update({
          naam: editForm.naam,
          telefoon: editForm.telefoon,
          email: editForm.email || null
        })
        .eq('id', client.id)

      if (error) {
        console.error('Error updating client:', error)
        alert('Er is een fout opgetreden bij het bijwerken van de klant')
        return
      }

      if (onClientUpdated) {
        onClientUpdated()
      }
      setShowEditClient(false)
    } catch (err) {
      console.error('Error updating client:', err)
      alert('Er is een onverwachte fout opgetreden')
    }
  }

  async function handleDeleteAppointment(appointmentId) {
    if (!confirm('Weet je zeker dat je deze afspraak wilt verwijderen?')) return

    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId)

      if (error) {
        console.error('Error deleting appointment:', error)
        alert('Er is een fout opgetreden bij het verwijderen van de afspraak')
        return
      }

      // Reload appointments
      loadAppointments()
    } catch (err) {
      console.error('Error deleting appointment:', err)
      alert('Er is een onverwachte fout opgetreden')
    }
  }

  const formatDateTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('nl-NL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('nl-NL', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getDuration = (startTime, endTime) => {
    const start = new Date(startTime)
    const end = new Date(endTime)
    const durationMs = end.getTime() - start.getTime()
    const durationMinutes = Math.round(durationMs / (1000 * 60))
    return durationMinutes
  }

  const getServiceColor = (service) => {
    const colors = {
      'Knippen': 'bg-blue-100 text-blue-800',
      'Wassen': 'bg-green-100 text-green-800',
      'Styling': 'bg-purple-100 text-purple-800',
      'Baard': 'bg-orange-100 text-orange-800',
      'Highlights': 'bg-pink-100 text-pink-800'
    }
    return colors[service] || 'bg-gray-100 text-gray-800'
  }

  const isUpcoming = (dateString) => {
    return new Date(dateString) > new Date()
  }

  if (!isOpen || !client) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{client.naam}</h2>
              <p className="text-sm text-gray-500">Klant details en afspraken</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Client Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <User className="h-5 w-5 mr-2 text-gray-500" />
                Contactgegevens
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center space-x-3">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">{client.naam}</span>
                </div>
                {client.telefoon && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{client.telefoon}</span>
                  </div>
                )}
                {client.email && (
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{client.email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Acties</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setShowAddAppointment(true)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Nieuwe afspraak</span>
                </button>
                <button
                  onClick={() => setShowEditClient(true)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Edit className="h-4 w-4" />
                  <span>Klant bewerken</span>
                </button>
              </div>
            </div>
          </div>

          {/* Appointments */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-gray-500" />
              Afspraken ({appointments.length})
            </h3>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-gray-500">Laden...</p>
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Geen afspraken</h4>
                <p className="text-gray-500 mb-4">Deze klant heeft nog geen afspraken</p>
                <button
                  onClick={() => setShowAddAppointment(true)}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Eerste afspraak inplannen
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.map((appointment) => (
                  <div key={appointment.id} className={`p-4 rounded-lg border ${
                    isUpcoming(appointment.start_tijd) 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getServiceColor(appointment.dienst)}`}>
                            {appointment.dienst}
                          </span>
                          <span className="text-sm text-gray-500">
                            {formatDateTime(appointment.start_tijd)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{formatTime(appointment.start_tijd)} - {formatTime(appointment.eind_tijd)}</span>
                          </div>
                          <span>({getDuration(appointment.start_tijd, appointment.eind_tijd)} min)</span>
                        </div>
                        {appointment.notities && (
                          <p className="text-sm text-gray-600 mt-2 italic">"{appointment.notities}"</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {isUpcoming(appointment.start_tijd) && (
                          <button
                            onClick={() => handleDeleteAppointment(appointment.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Afspraak verwijderen"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Edit Client Modal */}
        {showEditClient && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Klant bewerken</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Naam *
                  </label>
                  <input
                    type="text"
                    value={editForm.naam}
                    onChange={(e) => setEditForm({...editForm, naam: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefoon *
                  </label>
                  <input
                    type="tel"
                    value={editForm.telefoon}
                    onChange={(e) => setEditForm({...editForm, telefoon: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowEditClient(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Annuleren
                </button>
                <button
                  onClick={handleUpdateClient}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Opslaan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Appointment Modal */}
        {showAddAppointment && (
          <AddAppointmentModal
            isOpen={showAddAppointment}
            onClose={() => setShowAddAppointment(false)}
            salonId={salonId}
            onAppointmentAdded={(newAppointment) => {
              if (onAppointmentAdded) {
                onAppointmentAdded(newAppointment)
              }
              loadAppointments()
              setShowAddAppointment(false)
            }}
            preSelectedClient={client}
          />
        )}
      </div>
    </div>
  )
}

import React, { useState } from 'react'
import { X, Edit, Trash2, Clock, User, Phone, Mail, Calendar } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function AppointmentModal({ 
  appointment, 
  isOpen, 
  onClose, 
  onEdit, 
  onDelete 
}) {
  const [isDeleting, setIsDeleting] = useState(false)

  if (!isOpen || !appointment) return null

  const handleDelete = async () => {
    if (!confirm('Weet je zeker dat je deze afspraak wilt verwijderen?')) return
    
    setIsDeleting(true)
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointment.id)

      if (error) {
        console.error('Error deleting appointment:', error)
        alert('Fout bij verwijderen van afspraak: ' + error.message)
      } else {
        onDelete(appointment.id)
        onClose()
      }
    } catch (err) {
      console.error('Error deleting appointment:', err)
      alert('Er is een fout opgetreden bij het verwijderen van de afspraak.')
    } finally {
      setIsDeleting(false)
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

  const getDuration = () => {
    const start = new Date(appointment.start_tijd)
    const end = new Date(appointment.eind_tijd)
    const durationMs = end.getTime() - start.getTime()
    const durationMinutes = Math.round(durationMs / (1000 * 60))
    return durationMinutes
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Afspraak details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Client info */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <User className="h-5 w-5 mr-2 text-gray-500" />
              Klantgegevens
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-400" />
                <span className="font-medium">{appointment.clients?.naam || 'Onbekende klant'}</span>
              </div>
              {appointment.clients?.telefoon && (
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{appointment.clients.telefoon}</span>
                </div>
              )}
              {appointment.clients?.email && (
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{appointment.clients.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Appointment details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-gray-500" />
              Afspraak informatie
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Dienst:</span>
                <span className="font-medium">{appointment.dienst}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Datum & tijd:</span>
                <span className="font-medium">{formatDateTime(appointment.start_tijd)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Duur:</span>
                <span className="font-medium">{getDuration()} minuten</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Van:</span>
                <span className="font-medium">{formatTime(appointment.start_tijd)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Tot:</span>
                <span className="font-medium">{formatTime(appointment.eind_tijd)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {appointment.notities && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Notities</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700">{appointment.notities}</p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Sluiten
          </button>
          <button
            onClick={() => onEdit(appointment)}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center space-x-2"
          >
            <Edit className="h-4 w-4" />
            <span>Bewerken</span>
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
          >
            <Trash2 className="h-4 w-4" />
            <span>{isDeleting ? 'Verwijderen...' : 'Verwijderen'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

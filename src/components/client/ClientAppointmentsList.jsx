import React, { useState, useEffect } from 'react'
import { Calendar, Clock, MapPin, User, Phone, Mail } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext.jsx'

export default function ClientAppointmentsList() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedAppointment, setSelectedAppointment] = useState(null)

  useEffect(() => {
    if (user) {
      loadAppointments()
    }
  }, [user])

  async function loadAppointments() {
    if (!user) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          barbers!inner(
            id,
            name,
            location,
            address,
            phone,
            website
          )
        `)
        .eq('client_profile_id', user.id)
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

  const isUpcoming = (dateString) => {
    return new Date(dateString) > new Date()
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

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-gray-500">Afspraken laden...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Mijn afspraken</h2>
        <p className="text-gray-600 mt-1">
          Overzicht van al je afspraken bij verschillende kappers
        </p>
      </div>

      {/* Appointments List */}
      {appointments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Geen afspraken</h3>
          <p className="text-gray-500">
            Je hebt nog geen afspraken. Vraag je kapper om een afspraak in te plannen.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {appointments.map((appointment) => (
            <div
              key={appointment.id}
              onClick={() => setSelectedAppointment(appointment)}
              className={`p-6 bg-white rounded-xl shadow-sm border cursor-pointer hover:shadow-md transition-shadow ${
                isUpcoming(appointment.start_tijd) 
                  ? 'border-blue-200 bg-blue-50/30' 
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getServiceColor(appointment.dienst)}`}>
                      {appointment.dienst}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      isUpcoming(appointment.start_tijd) 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {isUpcoming(appointment.start_tijd) ? 'Komend' : 'Afgerond'}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">{formatDateTime(appointment.start_tijd)}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>{formatTime(appointment.start_tijd)} - {formatTime(appointment.eind_tijd)}</span>
                      <span className="text-gray-400">({getDuration(appointment.start_tijd, appointment.eind_tijd)} min)</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-gray-600">
                      <User className="h-4 w-4" />
                      <span className="font-medium">{appointment.barbers?.name}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{appointment.barbers?.location}</span>
                    </div>
                  </div>
                  
                  {appointment.notities && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700 italic">"{appointment.notities}"</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Appointment Detail Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Afspraak details</h3>
                <button
                  onClick={() => setSelectedAppointment(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Dienst</h4>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getServiceColor(selectedAppointment.dienst)}`}>
                    {selectedAppointment.dienst}
                  </span>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Datum & tijd</h4>
                  <p className="text-gray-600">{formatDateTime(selectedAppointment.start_tijd)}</p>
                  <p className="text-sm text-gray-500">
                    {formatTime(selectedAppointment.start_tijd)} - {formatTime(selectedAppointment.eind_tijd)} 
                    ({getDuration(selectedAppointment.start_tijd, selectedAppointment.eind_tijd)} min)
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Kapper</h4>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{selectedAppointment.barbers?.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{selectedAppointment.barbers?.address}</span>
                    </div>
                    {selectedAppointment.barbers?.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{selectedAppointment.barbers.phone}</span>
                      </div>
                    )}
                    {selectedAppointment.barbers?.website && (
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <a 
                          href={selectedAppointment.barbers.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:text-primary/80"
                        >
                          {selectedAppointment.barbers.website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
                
                {selectedAppointment.notities && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Notities</h4>
                    <p className="text-gray-600 italic">"{selectedAppointment.notities}"</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

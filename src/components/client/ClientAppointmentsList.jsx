import React, { useState, useEffect } from 'react'
import { Calendar, Clock, MapPin, User, Phone, Mail, Plus, Search, Heart } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext.jsx'

export default function ClientAppointmentsList() {
  const { user, userProfile } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingTimeout, setLoadingTimeout] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [showBookAppointment, setShowBookAppointment] = useState(false)
  const [bookmarks, setBookmarks] = useState([])
  const [loadingBookmarks, setLoadingBookmarks] = useState(false)

  useEffect(() => {
    if (user && userProfile) {
      loadAppointments()
    }
  }, [user, userProfile])

  // Set timeout for loading state
  useEffect(() => {
    if (loading) {
      const timeoutId = setTimeout(() => {
        setLoadingTimeout(true)
      }, 1000) // 1 second timeout
      
      return () => clearTimeout(timeoutId)
    } else {
      setLoadingTimeout(false)
    }
  }, [loading])

  async function loadBookmarks() {
    if (!user || !userProfile) return

    setLoadingBookmarks(true)
    try {
      console.log('Loading bookmarks for user:', user.id)
      
      const { data, error } = await supabase
        .from('bookmarks')
        .select(`
          *,
          barbers!inner(
            id,
            name,
            description,
            location,
            address,
            phone,
            website,
            rating,
            image_url
          )
        `)
        .eq('klant_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading bookmarks:', error)
        setBookmarks([])
      } else {
        console.log('Loaded bookmarks:', data?.length || 0)
        setBookmarks(data || [])
      }
    } catch (err) {
      console.error('Error loading bookmarks:', err)
      setBookmarks([])
    } finally {
      setLoadingBookmarks(false)
    }
  }

  async function loadAppointments() {
    if (!user || !userProfile) return

    setLoading(true)
    try {
      console.log('Loading appointments for user:', user.id, 'profile:', userProfile)
      
      // Use Promise.race to timeout the database query
      const loadData = async () => {
        // First try to get appointments by client_profile_id (new system)
        let { data, error } = await supabase
          .from('appointments')
          .select(`
            *,
            barbers!salon_id(
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

        // If no appointments found with client_profile_id, try the new booking system
        if (!data || data.length === 0) {
          console.log('No appointments found with client_profile_id, trying new booking system...')
          
          // Try new booking system with client_email
          const { data: newBookings, error: newError } = await supabase
            .from('appointments')
            .select(`
              *,
              barbers!salon_id(
                id,
                name,
                location,
                address,
                phone,
                website
              )
            `)
            .eq('client_email', user.email)
            .order('start_tijd', { ascending: true })
          
          if (!newError && newBookings && newBookings.length > 0) {
            data = newBookings
            error = null
          }
        }

        return { data, error }
      }

      // Race between data loading and timeout
      const { data, error } = await Promise.race([
        loadData(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Appointments loading timeout')), 2000))
      ])

      if (error) {
        console.error('Error loading appointments:', error)
        setAppointments([])
      } else {
        console.log('Loaded appointments:', data?.length || 0)
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

  if (loading && !loadingTimeout) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-gray-500">Afspraken ophalen...</p>
      </div>
    )
  }

  if (loading && loadingTimeout) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Laden duurt langer dan verwacht
          </h3>
          <p className="text-gray-600 mb-4">
            Er lijkt een probleem te zijn met het laden van je afspraken.
          </p>
          <button
            onClick={() => {
              setLoading(false)
              setLoadingTimeout(false)
              loadAppointments()
            }}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Opnieuw proberen
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mijn afspraken</h2>
          <p className="text-gray-600 mt-1">
            Overzicht van al je afspraken bij verschillende kappers
          </p>
        </div>
        <button
          onClick={() => {
            setShowBookAppointment(true)
            loadBookmarks()
          }}
          className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Afspraak maken</span>
        </button>
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

      {/* Book Appointment Modal */}
      {showBookAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Afspraak maken</h3>
                <button
                  onClick={() => setShowBookAppointment(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Bookmarked Kappers */}
                {bookmarks.length > 0 && (
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <Heart className="h-5 w-5 text-red-500 mr-2" />
                      Je favoriete kappers
                    </h4>
                    <div className="grid gap-4 md:grid-cols-2">
                      {bookmarks.map((bookmark) => (
                        <div
                          key={bookmark.id}
                          className="p-4 border border-gray-200 rounded-lg hover:border-primary hover:shadow-md transition-all cursor-pointer"
                          onClick={() => {
                            // Navigate to barber profile or booking page
                            window.open(`/barber/${bookmark.barbers.id}`, '_blank')
                          }}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                              <User className="h-6 w-6 text-gray-600" />
                            </div>
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900">{bookmark.barbers.name}</h5>
                              <p className="text-sm text-gray-600">{bookmark.barbers.location}</p>
                              {bookmark.barbers.rating && (
                                <div className="flex items-center mt-1">
                                  <span className="text-yellow-500 text-sm">★</span>
                                  <span className="text-sm text-gray-600 ml-1">{bookmark.barbers.rating}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Search New Kappers */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <Search className="h-5 w-5 text-primary mr-2" />
                    Nieuwe kapper zoeken
                  </h4>
                  <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-primary hover:bg-primary/5 transition-all cursor-pointer"
                       onClick={() => {
                         setShowBookAppointment(false)
                         window.open('/', '_blank')
                       }}>
                    <Search className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                    <h5 className="font-medium text-gray-900 mb-2">Zoek nieuwe kappers</h5>
                    <p className="text-sm text-gray-600">
                      Ontdek kappers in jouw omgeving en voeg ze toe aan je favorieten
                    </p>
                  </div>
                </div>

                {bookmarks.length === 0 && (
                  <div className="text-center py-8">
                    <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Geen favoriete kappers</h4>
                    <p className="text-gray-600 mb-4">
                      Voeg kappers toe aan je favorieten om hier snelle toegang te krijgen
                    </p>
                    <button
                      onClick={() => {
                        setShowBookAppointment(false)
                        window.open('/', '_blank')
                      }}
                      className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      Kappers zoeken
                    </button>
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

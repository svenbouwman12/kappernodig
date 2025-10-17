import React, { useState, useEffect } from 'react'
import { Calendar, Clock, Plus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext.jsx'

export default function AgendaView({ salonId, onAppointmentClick }) {
  const { user } = useAuth()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  // Load appointments for selected date
  useEffect(() => {
    if (salonId) {
      loadAppointments()
    }
  }, [salonId, selectedDate])

  async function loadAppointments() {
    if (!salonId) return

    setLoading(true)
    try {
      const startOfDay = new Date(selectedDate)
      startOfDay.setHours(0, 0, 0, 0)
      
      const endOfDay = new Date(selectedDate)
      endOfDay.setHours(23, 59, 59, 999)

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          clients:klant_id (
            naam,
            telefoon,
            email
          )
        `)
        .eq('salon_id', salonId)
        .gte('start_tijd', startOfDay.toISOString())
        .lte('start_tijd', endOfDay.toISOString())
        .order('start_tijd')

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

  // Generate time slots (8:00 - 20:00)
  const generateTimeSlots = () => {
    const slots = []
    for (let hour = 8; hour < 20; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = new Date()
        time.setHours(hour, minute, 0, 0)
        slots.push(time)
      }
    }
    return slots
  }

  const timeSlots = generateTimeSlots()

  // Check if current time is within the selected date
  const isCurrentDate = () => {
    const today = new Date()
    const selected = new Date(selectedDate)
    return today.toDateString() === selected.toDateString()
  }

  // Get appointment for a specific time slot
  const getAppointmentForSlot = (slotTime) => {
    return appointments.find(apt => {
      const startTime = new Date(apt.start_tijd)
      return startTime.getHours() === slotTime.getHours() && 
             startTime.getMinutes() === slotTime.getMinutes()
    })
  }

  // Get service color based on service type
  const getServiceColor = (serviceName) => {
    const colors = {
      'Knippen': 'bg-blue-100 border-blue-300 text-blue-800',
      'Baard': 'bg-orange-100 border-orange-300 text-orange-800',
      'Wassen & knippen': 'bg-green-100 border-green-300 text-green-800',
      'Highlights': 'bg-purple-100 border-purple-300 text-purple-800',
      'Permanent': 'bg-pink-100 border-pink-300 text-pink-800'
    }
    return colors[serviceName] || 'bg-gray-100 border-gray-300 text-gray-800'
  }

  // Format time for display
  const formatTime = (date) => {
    return date.toLocaleTimeString('nl-NL', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  // Check if current time line should be shown
  const shouldShowCurrentTime = (slotTime) => {
    if (!isCurrentDate()) return false
    
    const now = currentTime
    const slotStart = new Date(slotTime)
    const slotEnd = new Date(slotTime.getTime() + 30 * 60000) // 30 minutes later
    
    return now >= slotStart && now < slotEnd
  }

  const handleAppointmentClick = (appointment) => {
    if (onAppointmentClick) {
      onAppointmentClick(appointment)
    }
  }

  const handleDateChange = (date) => {
    setSelectedDate(date)
  }

  const formatDate = (date) => {
    return date.toLocaleDateString('nl-NL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (!salonId) {
    return (
      <div className="p-8 text-center">
        <div className="text-gray-500">Geen salon geselecteerd</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header with date selector */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Calendar className="h-5 w-5 text-gray-500" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {formatDate(selectedDate)}
              </h2>
              <p className="text-sm text-gray-500">Agenda overzicht</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={selectedDate.toISOString().split('T')[0]}
              onChange={(e) => handleDateChange(new Date(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Nieuwe afspraak</span>
            </button>
          </div>
        </div>
      </div>

      {/* Agenda grid */}
      <div className="relative">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-gray-500">Laden...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-1 p-4">
            {timeSlots.map((slot, index) => {
              const appointment = getAppointmentForSlot(slot)
              const isCurrentTime = shouldShowCurrentTime(slot)
              
              return (
                <div key={index} className="relative">
                  {/* Current time indicator */}
                  {isCurrentTime && (
                    <div className="absolute left-0 right-0 h-0.5 bg-red-500 z-10">
                      <div className="absolute -left-2 -top-1 w-3 h-3 bg-red-500 rounded-full"></div>
                    </div>
                  )}
                  
                  <div className="flex items-center h-12 border-b border-gray-100">
                    <div className="w-20 text-sm text-gray-500 font-medium">
                      {formatTime(slot)}
                    </div>
                    
                    <div className="flex-1 ml-4">
                      {appointment ? (
                        <button
                          onClick={() => handleAppointmentClick(appointment)}
                          className={`w-full p-2 rounded-lg border text-left hover:shadow-md transition-shadow ${getServiceColor(appointment.dienst)}`}
                        >
                          <div className="font-medium">
                            {appointment.clients?.naam || 'Onbekende klant'}
                          </div>
                          <div className="text-sm opacity-75">
                            {appointment.dienst}
                          </div>
                        </button>
                      ) : (
                        <div className="w-full p-2 text-gray-400 text-sm">
                          Vrij
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Legenda</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
            <span className="text-sm text-gray-600">Knippen</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-orange-100 border border-orange-300 rounded"></div>
            <span className="text-sm text-gray-600">Baard</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
            <span className="text-sm text-gray-600">Wassen & knippen</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-purple-100 border border-purple-300 rounded"></div>
            <span className="text-sm text-gray-600">Highlights</span>
          </div>
        </div>
      </div>
    </div>
  )
}

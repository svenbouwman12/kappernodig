import React, { useState, useEffect } from 'react'
import { Calendar, Clock, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext.jsx'
import AddAppointmentModal from './AddAppointmentModal.jsx'
import AppointmentModal from './AppointmentModal.jsx'

export default function AgendaView({ salonId, onAppointmentClick }) {
  const { user } = useAuth()
  const [selectedWeek, setSelectedWeek] = useState(new Date())
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState(null)
  const [selectedAppointment, setSelectedAppointment] = useState(null)

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  // Load appointments for selected week
  useEffect(() => {
    if (salonId) {
      loadAppointments()
    }
  }, [salonId, selectedWeek])

  async function loadAppointments() {
    if (!salonId) return

    setLoading(true)
    try {
      const weekStart = getWeekStart(selectedWeek)
      const weekEnd = getWeekEnd(selectedWeek)

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
        .gte('start_tijd', weekStart.toISOString())
        .lte('start_tijd', weekEnd.toISOString())
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

  // Helper functions for week navigation
  const getWeekStart = (date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
    d.setDate(diff)
    d.setHours(0, 0, 0, 0)
    return d
  }

  const getWeekEnd = (date) => {
    const weekStart = getWeekStart(date)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)
    return weekEnd
  }

  const getWeekDays = () => {
    const weekStart = getWeekStart(selectedWeek)
    const days = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart)
      day.setDate(weekStart.getDate() + i)
      days.push(day)
    }
    return days
  }

  // Generate time slots (8:00 - 20:00) in 15-minute intervals
  const generateTimeSlots = () => {
    const slots = []
    for (let hour = 8; hour < 20; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const time = new Date()
        time.setHours(hour, minute, 0, 0)
        slots.push(time)
      }
    }
    return slots
  }

  const timeSlots = generateTimeSlots()
  const weekDays = getWeekDays()

  // Check if current time is within the selected week
  const isCurrentWeek = () => {
    const today = new Date()
    const weekStart = getWeekStart(selectedWeek)
    const weekEnd = getWeekEnd(selectedWeek)
    return today >= weekStart && today <= weekEnd
  }

  // Get appointment for a specific time slot and day (only at start time)
  const getAppointmentForSlot = (slotTime, day) => {
    return appointments.find(apt => {
      const startTime = new Date(apt.start_tijd)
      const aptDate = new Date(startTime)
      aptDate.setHours(0, 0, 0, 0)
      const dayDate = new Date(day)
      dayDate.setHours(0, 0, 0, 0)
      
      // Check if it's the same day
      if (aptDate.getTime() !== dayDate.getTime()) return false
      
      // Only show appointment at its start time
      return startTime.getHours() === slotTime.getHours() && 
             startTime.getMinutes() === slotTime.getMinutes()
    })
  }

  // Check if this slot is the start of an appointment (now always true if appointment exists)
  const isAppointmentStart = (slotTime, day) => {
    const appointment = getAppointmentForSlot(slotTime, day)
    return !!appointment
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
  const shouldShowCurrentTime = (slotTime, day) => {
    if (!isCurrentWeek()) return false
    
    const now = currentTime
    const today = new Date()
    const dayDate = new Date(day)
    
    // Check if it's the same day
    if (today.toDateString() !== dayDate.toDateString()) return false
    
    const slotStart = new Date(slotTime)
    const slotEnd = new Date(slotTime.getTime() + 15 * 60000) // 15 minutes later
    
    return now >= slotStart && now < slotEnd
  }

  // Check if current time line should be shown for any day in the week
  const shouldShowCurrentTimeForWeek = (slotTime) => {
    if (!isCurrentWeek()) return false
    
    const now = new Date()
    
    // Get current time in local timezone
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    
    // Get slot time in local timezone
    const slotHour = slotTime.getHours()
    const slotMinute = slotTime.getMinutes()
    
    // Check if current time falls within this 15-minute slot
    const currentTimeInMinutes = currentHour * 60 + currentMinute
    const slotStartInMinutes = slotHour * 60 + slotMinute
    const slotEndInMinutes = slotStartInMinutes + 15
    
    return currentTimeInMinutes >= slotStartInMinutes && currentTimeInMinutes < slotEndInMinutes
  }

  // Get the exact position of the current time within a slot (0-1)
  const getCurrentTimePosition = (slotTime) => {
    if (!isCurrentWeek()) return 0
    
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const currentSecond = now.getSeconds()
    
    const slotHour = slotTime.getHours()
    const slotMinute = slotTime.getMinutes()
    
    const currentTimeInMinutes = currentHour * 60 + currentMinute + (currentSecond / 60)
    const slotStartInMinutes = slotHour * 60 + slotMinute
    
    // Calculate position within the 15-minute slot (0-1)
    const positionInSlot = (currentTimeInMinutes - slotStartInMinutes) / 15
    return Math.max(0, Math.min(1, positionInSlot))
  }

  const handleAppointmentClick = (appointment) => {
    setSelectedAppointment(appointment)
  }

  const handleAppointmentAdded = (newAppointment) => {
    // Reload appointments to show the new one
    loadAppointments()
  }

  const handleEditAppointment = (appointment) => {
    setSelectedAppointment(null) // Close details modal first
    setEditingAppointment(appointment)
    setShowEditModal(true)
  }

  const handleAppointmentUpdated = (updatedAppointment) => {
    // Reload appointments to show the updated one
    loadAppointments()
    setShowEditModal(false)
    setEditingAppointment(null)
  }

  const handleWeekNavigation = (direction) => {
    const newWeek = new Date(selectedWeek)
    newWeek.setDate(selectedWeek.getDate() + (direction === 'next' ? 7 : -7))
    setSelectedWeek(newWeek)
  }

  const formatWeekRange = () => {
    const weekStart = getWeekStart(selectedWeek)
    const weekEnd = getWeekEnd(selectedWeek)
    
    const startStr = weekStart.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
    const endStr = weekEnd.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
    
    return `${startStr} - ${endStr}`
  }

  const formatDayName = (date) => {
    return date.toLocaleDateString('nl-NL', { weekday: 'short' })
  }

  const formatDayNumber = (date) => {
    return date.getDate()
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
      {/* Header with week navigation */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Calendar className="h-5 w-5 text-gray-500" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Week {formatWeekRange()}
              </h2>
              <p className="text-sm text-gray-500">Agenda overzicht</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleWeekNavigation('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Vorige week"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <button
              onClick={() => setSelectedWeek(new Date())}
              className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Deze week
            </button>
            <button
              onClick={() => handleWeekNavigation('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Volgende week"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
            <button 
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Nieuwe afspraak</span>
            </button>
          </div>
        </div>
      </div>

      {/* Week header with days */}
      <div className="border-b border-gray-200">
        <div className="grid grid-cols-8 gap-1">
          <div className="p-3 text-sm font-medium text-gray-500 bg-gray-50">
            Tijd
          </div>
          {weekDays.map((day, index) => (
            <div key={index} className="p-3 text-center">
              <div className="text-sm font-medium text-gray-900">
                {formatDayName(day)}
              </div>
              <div className="text-lg font-semibold text-gray-700">
                {formatDayNumber(day)}
              </div>
            </div>
          ))}
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
          <div className="grid grid-cols-8 gap-1">
            {timeSlots.map((slot, slotIndex) => {
              const shouldShowTimeLine = shouldShowCurrentTimeForWeek(slot)
              
              return (
                <React.Fragment key={slotIndex}>
                  {/* Time column */}
                  <div className="p-2 text-sm text-gray-500 font-medium bg-gray-50 border-r border-gray-200">
                    {formatTime(slot)}
                  </div>
                  
                  {/* Day columns */}
                  {weekDays.map((day, dayIndex) => {
                    const appointment = getAppointmentForSlot(slot, day)
                    const isCurrentTime = shouldShowCurrentTime(slot, day)
                    const isStart = isAppointmentStart(slot, day)
                    
                    return (
                      <div key={dayIndex} className="relative p-0.5 border-r border-gray-100">
                        {/* Current time line for this day */}
                        {shouldShowTimeLine && (
                          <div 
                            className="absolute left-0 right-0 h-0.5 bg-red-500 z-20"
                            style={{
                              top: `${8 + (getCurrentTimePosition(slot) * 16)}px` // 8px base + position within 32px slot
                            }}
                          >
                            <div className="absolute -left-2 -top-1 w-3 h-3 bg-red-500 rounded-full"></div>
                          </div>
                        )}
                        
                        <div className="h-8">
                          {appointment ? (
                            <button
                              onClick={() => handleAppointmentClick(appointment)}
                              className={`w-full h-full p-1 rounded text-left hover:shadow-md transition-shadow ${getServiceColor(appointment.dienst)} ${
                                isStart ? 'border-l-2 border-l-blue-500' : ''
                              }`}
                            >
                              {isStart && (
                                <>
                                  <div className="text-xs font-medium truncate">
                                    {appointment.clients?.naam || 'Onbekende klant'}
                                  </div>
                                  <div className="text-xs opacity-75 truncate">
                                    {appointment.dienst}
                                  </div>
                                </>
                              )}
                            </button>
                          ) : (
                            <div className="w-full h-full p-1 text-gray-200 text-xs">
                              ·
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </React.Fragment>
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

      {/* Add Appointment Modal */}
      <AddAppointmentModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        salonId={salonId}
        onAppointmentAdded={handleAppointmentAdded}
      />

      {/* Edit Appointment Modal */}
      {editingAppointment && (
        <AddAppointmentModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setEditingAppointment(null)
          }}
          salonId={salonId}
          onAppointmentAdded={handleAppointmentUpdated}
          editingAppointment={editingAppointment}
        />
      )}

      {/* Appointment Details Modal */}
      {selectedAppointment && (
        <AppointmentModal
          appointment={selectedAppointment}
          isOpen={!!selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onEdit={handleEditAppointment}
          onDelete={(appointmentId) => {
            // Remove appointment from list and close modal
            setAppointments(appointments.filter(apt => apt.id !== appointmentId))
            setSelectedAppointment(null)
          }}
        />
      )}
    </div>
  )
}

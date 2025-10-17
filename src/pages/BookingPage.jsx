import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext.jsx'
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import Card from '../components/Card.jsx'
import Button from '../components/Button.jsx'

export default function BookingPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, userProfile } = useAuth()
  
  const [barber, setBarber] = useState(null)
  const [services, setServices] = useState([])
  const [salonHours, setSalonHours] = useState([])
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState({
    serviceId: '',
    date: '',
    time: '',
    notes: '',
    clientFirstName: '',
    clientLastName: '',
    clientEmail: '',
    clientPhone: ''
  })
  const [availableSlots, setAvailableSlots] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [bookedAppointment, setBookedAppointment] = useState(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)

  useEffect(() => {
    // Allow both logged in clients and anonymous users
    loadBarberData()
  }, [id])

  useEffect(() => {
    if (booking.serviceId && booking.date) {
      loadAvailableSlots()
    }
  }, [booking.serviceId, booking.date])

  async function loadBarberData() {
    try {
      setLoading(true)
      
      // Load barber info
      const { data: barberData, error: barberError } = await supabase
        .from('barbers')
        .select('*')
        .eq('id', id)
        .single()

      if (barberError) throw barberError
      setBarber(barberData)

      // Load services
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('barber_id', id)

      if (servicesError) throw servicesError
      setServices(servicesData || [])

      // Load salon hours
      const { data: hoursData, error: hoursError } = await supabase
        .from('salon_hours')
        .select('*')
        .eq('salon_id', id)

      if (hoursError) throw hoursError
      setSalonHours(hoursData || [])

    } catch (error) {
      console.error('Error loading barber data:', error)
      setError('Er is een fout opgetreden bij het laden van de gegevens')
    } finally {
      setLoading(false)
    }
  }

  async function loadAvailableSlots() {
    if (!booking.serviceId || !booking.date) return

    try {
      setLoadingSlots(true)
      const selectedService = services.find(s => s.id === booking.serviceId)
      if (!selectedService) return

      const slots = await generateTimeSlots(booking.date, selectedService.duration_minutes || 30)
      setAvailableSlots(slots)
    } catch (error) {
      console.error('Error loading available slots:', error)
    } finally {
      setLoadingSlots(false)
    }
  }

  async function generateTimeSlots(date, duration) {
    const selectedDate = new Date(date)
    const dayOfWeek = selectedDate.getDay()
    
    // Get salon hours for this day
    const dayHours = salonHours.find(h => h.day_of_week === dayOfWeek)
    if (!dayHours || dayHours.is_closed) return []

    const slots = []
    const startTime = new Date(selectedDate)
    const [startHour, startMinute] = dayHours.open_time.split(':').map(Number)
    startTime.setHours(startHour, startMinute, 0, 0)

    const endTime = new Date(selectedDate)
    const [endHour, endMinute] = dayHours.close_time.split(':').map(Number)
    endTime.setHours(endHour, endMinute, 0, 0)

    // Get existing appointments for this date
    const { data: existingAppointments } = await supabase
      .from('appointments')
      .select('start_tijd, eind_tijd')
      .eq('salon_id', id)
      .eq('status', 'confirmed')
      .gte('start_tijd', startTime.toISOString())
      .lt('start_tijd', endTime.toISOString())

    // Get current time to filter out past slots
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const isToday = selectedDate.getTime() === today.getTime()

    // Generate time slots
    const currentTime = new Date(startTime)
    while (currentTime.getTime() + (duration * 60000) <= endTime.getTime()) {
      const slotEnd = new Date(currentTime.getTime() + (duration * 60000))
      
      // Skip slots in the past (only for today)
      if (isToday && currentTime < now) {
        currentTime.setMinutes(currentTime.getMinutes() + 30)
        continue
      }
      
      // Check if this slot conflicts with existing appointments
      const hasConflict = existingAppointments?.some(apt => {
        const aptStart = new Date(apt.start_tijd)
        const aptEnd = new Date(apt.eind_tijd)
        return (currentTime < aptEnd && slotEnd > aptStart)
      })

      slots.push({
        time: currentTime.toTimeString().slice(0, 5),
        available: !hasConflict,
        isPast: isToday && currentTime < now
      })

      currentTime.setMinutes(currentTime.getMinutes() + 30) // 30-minute intervals
    }

    return slots
  }

  // Calendar helper functions
  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    const days = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month, day)
      days.push(dateObj)
    }
    
    return days
  }

  const isDateAvailable = (date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date >= today
  }

  const isDateSelected = (date) => {
    if (!selectedDate) return false
    return date.toDateString() === selectedDate.toDateString()
  }

  const handleDateClick = (date) => {
    if (!isDateAvailable(date)) return
    
    setSelectedDate(date)
    const dateString = date.toISOString().split('T')[0]
    setBooking({ ...booking, date: dateString, time: '' })
    setAvailableSlots([])
  }

  const handleServiceChange = (serviceId) => {
    setBooking({ ...booking, serviceId, time: '' })
    setAvailableSlots([])
  }

  const handleTimeClick = (time) => {
    setBooking({ ...booking, time })
  }

  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth)
    newMonth.setMonth(newMonth.getMonth() + direction)
    setCurrentMonth(newMonth)
  }

  async function handleBookingSubmit() {
    // Validate required fields
    if (!booking.serviceId || !booking.date || !booking.time) {
      setError('Vul alle verplichte velden in')
      return
    }

    // For non-logged in users, validate client info
    if (!user && (!booking.clientFirstName || !booking.clientLastName || !booking.clientEmail)) {
      setError('Vul je voor- en achternaam en e-mailadres in')
      return
    }

    setBookingLoading(true)
    setError('')

    try {
      const selectedService = services.find(s => s.id === booking.serviceId)
      if (!selectedService) {
        setError('Geselecteerde dienst niet gevonden')
        return
      }

      // Create appointment datetime
      const appointmentDate = new Date(booking.date)
      const [hours, minutes] = booking.time.split(':')
      appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)
      
      const endTime = new Date(appointmentDate.getTime() + (selectedService.duration_minutes || 30) * 60000)

      // Get client info
      const clientName = user ? (userProfile?.naam || user.email?.split('@')[0] || 'Klant') : `${booking.clientFirstName} ${booking.clientLastName}`
      const clientEmail = user ? user.email : booking.clientEmail
      const clientPhone = user ? (userProfile?.telefoon || '') : booking.clientPhone

      // Create appointment directly with client info
      const appointmentData = {
        salon_id: id,
        client_name: clientName,
        client_email: clientEmail,
        client_phone: clientPhone || null,
        service_id: booking.serviceId,
        dienst: selectedService.name, // Add service name to dienst column
        start_tijd: appointmentDate.toISOString(),
        eind_tijd: endTime.toISOString(),
        status: 'confirmed',
        opmerkingen: booking.notes || null
      }

      // Create client record for anonymous users or find existing for logged in users
      let clientId = null
      
      if (user && userProfile?.role === 'client') {
        // For logged in users, find existing client record
        const { data: existingClient } = await supabase
          .from('clients')
          .select('id')
          .eq('salon_id', id)
          .eq('email', user.email)
          .single()

        if (existingClient) {
          clientId = existingClient.id
        }
      } else {
        // For anonymous users, create a new client record
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert({
            salon_id: id,
            naam: clientName,
            email: clientEmail,
            telefoon: clientPhone || null,
            adres: null, // Will be filled later if needed
            stad: null,
            postcode: null,
            geboortedatum: null,
            geslacht: null,
            notities: `Klant aangemaakt via anonieme booking op ${new Date().toLocaleDateString('nl-NL')}`
          })
          .select('id')
          .single()

        if (clientError) {
          console.error('Error creating client:', clientError)
          // Continue without client record - appointment will still be created
        } else {
          clientId = newClient.id
        }
      }

      // Add client ID to appointment if we have one
      if (clientId) {
        appointmentData.klant_id = clientId
      }

      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert(appointmentData)
        .select()
        .single()

      if (appointmentError) {
        console.error('Error creating appointment:', appointmentError)
        setError('Er is een fout opgetreden bij het boeken van de afspraak')
        return
      }

      // Store appointment details for confirmation popup
      setBookedAppointment({
        service: selectedService.name,
        date: booking.date,
        time: booking.time,
        duration: selectedService.duration_minutes || 30,
        clientName: clientName,
        clientEmail: clientEmail,
        barberName: barber?.naam || 'Kapper',
        barberAddress: barber?.adres || '',
        notes: booking.notes
      })
      
      setShowConfirmation(true)
      setSuccess(true)
      setBooking({ 
        serviceId: '', 
        date: '', 
        time: '', 
        notes: '',
        clientFirstName: '',
        clientLastName: '',
        clientEmail: '',
        clientPhone: ''
      })
      setSelectedDate(null)
      setAvailableSlots([])

    } catch (error) {
      console.error('Error booking appointment:', error)
      setError('Er is een onverwachte fout opgetreden')
    } finally {
      setBookingLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-max">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <button 
              onClick={() => navigate(-1)}
              className="text-primary hover:text-primary/80 mb-4 flex items-center"
            >
              ← Terug
            </button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Afspraak boeken
            </h1>
            {barber && (
              <p className="text-gray-600">
                Boek een afspraak bij <span className="font-semibold">{barber.name}</span>
              </p>
            )}
          </div>

          {loading ? (
            <Card className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Gegevens laden...</p>
            </Card>
          ) : (
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Service Selection */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Kies een dienst
                </h2>
                <div className="space-y-3">
                  {services.map(service => (
                    <button
                      key={service.id}
                      onClick={() => handleServiceChange(service.id)}
                      className={`w-full p-4 text-left border rounded-lg transition-colors ${
                        booking.serviceId === service.id
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-medium">{service.name}</div>
                      <div className="text-sm text-gray-600">
                        €{service.price} • {service.duration_minutes || 30} minuten
                      </div>
                    </button>
                  ))}
                </div>
              </Card>

              {/* Calendar */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Kies een datum
                </h2>
                
                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => navigateMonth(-1)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <h3 className="text-lg font-semibold">
                    {currentMonth.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })}
                  </h3>
                  <button
                    onClick={() => navigateMonth(1)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'].map(day => (
                    <div key={day} className="text-center text-sm font-medium text-gray-500 p-2">
                      {day}
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 gap-1">
                  {getDaysInMonth(currentMonth).map((date, index) => (
                    <button
                      key={index}
                      onClick={() => date && handleDateClick(date)}
                      disabled={!date || !isDateAvailable(date)}
                      className={`p-2 text-sm rounded-lg transition-colors ${
                        !date 
                          ? 'invisible'
                          : !isDateAvailable(date)
                          ? 'text-gray-300 cursor-not-allowed'
                          : isDateSelected(date)
                          ? 'bg-primary text-white'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {date?.getDate()}
                    </button>
                  ))}
                </div>
              </Card>

              {/* Time Slots */}
              {selectedDate && booking.serviceId && (
                <Card className="p-6 lg:col-span-2">
                  <h2 className="text-xl font-semibold mb-4 flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    Beschikbare tijden voor {selectedDate.toLocaleDateString('nl-NL', { 
                      weekday: 'long', 
                      day: 'numeric', 
                      month: 'long' 
                    })}
                  </h2>
                  
                  {loadingSlots ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-gray-600">Beschikbare tijden laden...</p>
                    </div>
                  ) : availableSlots.length > 0 ? (
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                      {availableSlots.map(slot => (
                        <button
                          key={slot.time}
                          onClick={() => slot.available ? handleTimeClick(slot.time) : null}
                          disabled={!slot.available}
                          className={`p-3 text-center border rounded-lg transition-colors ${
                            !slot.available
                              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                              : booking.time === slot.time 
                                ? 'bg-primary text-white border-primary' 
                                : 'border-gray-300 hover:bg-primary hover:text-white'
                          }`}
                          title={!slot.available ? 'Deze tijd is al geboekt' : ''}
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600 text-center py-4">
                      Geen beschikbare tijden voor deze datum
                    </p>
                  )}
                </Card>
              )}

              {/* Booking Form */}
              {booking.serviceId && booking.date && booking.time && (
                <Card className="p-6 lg:col-span-2">
                  <h2 className="text-xl font-semibold mb-4">Afspraak bevestigen</h2>
                  
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Dienst:</span>
                        <p>{services.find(s => s.id === booking.serviceId)?.name}</p>
                      </div>
                      <div>
                        <span className="font-medium">Datum:</span>
                        <p>{selectedDate?.toLocaleDateString('nl-NL', { 
                          weekday: 'long', 
                          day: 'numeric', 
                          month: 'long' 
                        })}</p>
                      </div>
                      <div>
                        <span className="font-medium">Tijd:</span>
                        <p>{booking.time}</p>
                      </div>
                    </div>
                  </div>

                  {/* Client Information - only show for non-logged in users */}
                  {!user && (
                    <div className="mb-4">
                      <h3 className="text-lg font-medium mb-3">Jouw gegevens</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Voornaam *
                          </label>
                          <input
                            type="text"
                            value={booking.clientFirstName}
                            onChange={(e) => setBooking({ ...booking, clientFirstName: e.target.value })}
                            placeholder="Je voornaam"
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Achternaam *
                          </label>
                          <input
                            type="text"
                            value={booking.clientLastName}
                            onChange={(e) => setBooking({ ...booking, clientLastName: e.target.value })}
                            placeholder="Je achternaam"
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            E-mailadres *
                          </label>
                          <input
                            type="email"
                            value={booking.clientEmail}
                            onChange={(e) => setBooking({ ...booking, clientEmail: e.target.value })}
                            placeholder="jouw@email.com"
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            required
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Telefoonnummer (optioneel)
                          </label>
                          <input
                            type="tel"
                            value={booking.clientPhone}
                            onChange={(e) => setBooking({ ...booking, clientPhone: e.target.value })}
                            placeholder="06-12345678"
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Opmerkingen (optioneel)
                    </label>
                    <textarea
                      value={booking.notes}
                      onChange={(e) => setBooking({ ...booking, notes: e.target.value })}
                      placeholder="Speciale wensen of opmerkingen..."
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      rows={3}
                    />
                  </div>

                  <Button
                    onClick={handleBookingSubmit}
                    disabled={bookingLoading}
                    className="w-full"
                  >
                    {bookingLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Afspraak boeken...
                      </>
                    ) : (
                      'Afspraak bevestigen'
                    )}
                  </Button>
                </Card>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <Card className="p-4 bg-red-50 border-red-200 mt-4">
              <div className="flex items-center">
                <XCircle className="h-5 w-5 text-red-500 mr-2" />
                <p className="text-red-700">{error}</p>
              </div>
            </Card>
          )}

          {/* Success Message */}
          {success && !showConfirmation && (
            <Card className="p-4 bg-green-50 border-green-200 mt-4">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <p className="text-green-700">Afspraak succesvol geboekt!</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Confirmation Popup */}
      {showConfirmation && bookedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Afspraak Bevestigd! 🎉
                </h2>
                <p className="text-gray-600">
                  Je afspraak is succesvol geboekt
                </p>
              </div>

              {/* Appointment Details */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Afspraakdetails</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dienst:</span>
                    <span className="font-medium">{bookedAppointment.service}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Datum:</span>
                    <span className="font-medium">{new Date(bookedAppointment.date).toLocaleDateString('nl-NL', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tijd:</span>
                    <span className="font-medium">{bookedAppointment.time} ({bookedAppointment.duration} min)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Kapper:</span>
                    <span className="font-medium">{bookedAppointment.barberName}</span>
                  </div>
                  {bookedAppointment.barberAddress && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Adres:</span>
                      <span className="font-medium text-right">{bookedAppointment.barberAddress}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Naam:</span>
                    <span className="font-medium">{bookedAppointment.clientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">E-mail:</span>
                    <span className="font-medium">{bookedAppointment.clientEmail}</span>
                  </div>
                  {bookedAppointment.notes && (
                    <div className="pt-2 border-t">
                      <span className="text-gray-600 block mb-1">Opmerkingen:</span>
                      <span className="font-medium">{bookedAppointment.notes}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Important Notes */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Belangrijke informatie:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Je ontvangt een bevestigingsmail op {bookedAppointment.clientEmail}</li>
                      <li>• Kom 5 minuten van tevoren</li>
                      <li>• Annuleren kan tot 24 uur van tevoren</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <Button
                  onClick={() => {
                    setShowConfirmation(false)
                    setBookedAppointment(null)
                    if (user && userProfile?.role === 'client') {
                      navigate('/client/dashboard')
                    } else {
                      navigate('/')
                    }
                  }}
                  className="flex-1"
                >
                  Naar Dashboard
                </Button>
                <Button
                  onClick={() => {
                    setShowConfirmation(false)
                    setBookedAppointment(null)
                    setBooking({
                      serviceId: '',
                      date: '',
                      time: '',
                      notes: '',
                      clientFirstName: '',
                      clientLastName: '',
                      clientEmail: '',
                      clientPhone: ''
                    })
                    setSelectedDate(null)
                    setAvailableSlots([])
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Nieuwe Afspraak
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
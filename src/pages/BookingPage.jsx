import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext.jsx'
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
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
    notes: ''
  })
  const [availableSlots, setAvailableSlots] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!user || userProfile?.role !== 'client') {
      navigate('/client/login?return=' + encodeURIComponent(window.location.pathname))
      return
    }
    
    loadBarberData()
  }, [id, user, userProfile])

  async function loadBarberData() {
    setLoading(true)
    try {
      // Load barber data
      const { data: barberData, error: barberError } = await supabase
        .from('barbers')
        .select('*')
        .eq('id', id)
        .single()

      if (barberError || !barberData) {
        setError('Kapperszaak niet gevonden')
        return
      }

      setBarber(barberData)

      // Load services
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('barber_id', id)
        .order('name')

      if (servicesError) {
        console.error('Error loading services:', servicesError)
      } else {
        setServices(servicesData || [])
      }

      // Load salon hours
      const { data: hoursData, error: hoursError } = await supabase
        .from('salon_hours')
        .select('*')
        .eq('salon_id', id)
        .order('day_of_week')

      if (hoursError) {
        console.error('Error loading salon hours:', hoursError)
      } else {
        setSalonHours(hoursData || [])
      }

    } catch (err) {
      console.error('Error loading barber data:', err)
      setError('Er is een fout opgetreden bij het laden van de gegevens')
    } finally {
      setLoading(false)
    }
  }

  async function loadAvailableSlots() {
    if (!booking.serviceId || !booking.date) return

    setLoadingSlots(true)
    try {
      const selectedService = services.find(s => s.id === booking.serviceId)
      if (!selectedService) return

      const selectedDate = new Date(booking.date)
      const dayOfWeek = selectedDate.getDay()

      // Get salon hours for this day
      const dayHours = salonHours.find(h => h.day_of_week === dayOfWeek)
      if (!dayHours || dayHours.is_closed) {
        setAvailableSlots([])
        setLoadingSlots(false)
        return
      }

      // Get existing appointments for this date
      const startOfDay = new Date(selectedDate)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(selectedDate)
      endOfDay.setHours(23, 59, 59, 999)

      const { data: existingAppointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('start_tijd, eind_tijd')
        .eq('salon_id', id)
        .eq('status', 'confirmed')
        .gte('start_tijd', startOfDay.toISOString())
        .lte('start_tijd', endOfDay.toISOString())

      if (appointmentsError) {
        console.error('Error loading appointments:', appointmentsError)
        setAvailableSlots([])
        return
      }

      // Generate time slots
      const slots = generateTimeSlots(dayHours, selectedService.duration_minutes || 30, existingAppointments || [])
      setAvailableSlots(slots)

    } catch (err) {
      console.error('Error loading available slots:', err)
      setAvailableSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }

  function generateTimeSlots(dayHours, serviceDuration, existingAppointments) {
    const slots = []
    const openTime = new Date(`2000-01-01T${dayHours.open_time}`)
    const closeTime = new Date(`2000-01-01T${dayHours.close_time}`)
    
    // Generate 15-minute slots
    const currentTime = new Date(openTime)
    while (currentTime < closeTime) {
      const slotStart = new Date(currentTime)
      const slotEnd = new Date(slotStart.getTime() + serviceDuration * 60000)
      
      // Check if this slot would end before salon closes
      if (slotEnd <= closeTime) {
        // Check for conflicts with existing appointments
        const hasConflict = existingAppointments.some(apt => {
          const aptStart = new Date(apt.start_tijd)
          const aptEnd = new Date(apt.eind_tijd)
          
          return (slotStart < aptEnd && slotEnd > aptStart)
        })
        
        if (!hasConflict) {
          slots.push({
            time: slotStart.toTimeString().slice(0, 5),
            startTime: slotStart,
            endTime: slotEnd
          })
        }
      }
      
      // Move to next 15-minute slot
      currentTime.setMinutes(currentTime.getMinutes() + 15)
    }
    
    return slots
  }

  function handleServiceChange(e) {
    const serviceId = e.target.value
    setBooking({ ...booking, serviceId, time: '' })
    setAvailableSlots([])
  }

  function handleDateChange(e) {
    const date = e.target.value
    setBooking({ ...booking, date, time: '' })
    setAvailableSlots([])
  }

  function handleTimeChange(e) {
    setBooking({ ...booking, time: e.target.value })
  }

  async function handleBookingSubmit(e) {
    e.preventDefault()
    
    if (!booking.serviceId || !booking.date || !booking.time) {
      setError('Vul alle velden in')
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

      // Create client record if it doesn't exist
      let clientId
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('salon_id', id)
        .eq('email', user.email)
        .single()

      if (existingClient) {
        clientId = existingClient.id
      } else {
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert({
            salon_id: id,
            naam: userProfile?.naam || user.email?.split('@')[0] || 'Klant',
            telefoon: userProfile?.telefoon || '',
            email: user.email
          })
          .select('id')
          .single()

        if (clientError) {
          console.error('Error creating client:', clientError)
          setError('Er is een fout opgetreden bij het aanmaken van het klantprofiel')
          return
        }

        clientId = newClient.id
      }

      // Create appointment
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          salon_id: id,
          klant_id: clientId,
          service_id: booking.serviceId,
          dienst: selectedService.name,
          start_tijd: appointmentDate.toISOString(),
          eind_tijd: endTime.toISOString(),
          notities: booking.notes,
          status: 'confirmed'
        })
        .select()
        .single()

      if (appointmentError) {
        console.error('Error creating appointment:', appointmentError)
        setError(appointmentError.message || 'Er is een fout opgetreden bij het boeken van de afspraak')
        return
      }

      setSuccess(true)
      setTimeout(() => {
        navigate('/client/dashboard')
      }, 2000)

    } catch (err) {
      console.error('Error booking appointment:', err)
      setError('Er is een onverwachte fout opgetreden')
    } finally {
      setBookingLoading(false)
    }
  }

  // Load available slots when service and date are selected
  useEffect(() => {
    if (booking.serviceId && booking.date) {
      loadAvailableSlots()
    }
  }, [booking.serviceId, booking.date])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Kapperszaak laden...</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Afspraak geboekt!
          </h1>
          <p className="text-gray-600 mb-4">
            Je afspraak is succesvol geboekt. Je wordt doorgestuurd naar je dashboard...
          </p>
          <div className="flex items-center justify-center space-x-2 text-primary">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm">Bezig met doorsturen...</span>
          </div>
        </Card>
      </div>
    )
  }

  if (!barber) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Kapperszaak niet gevonden
          </h1>
          <p className="text-gray-600 mb-4">
            De kapperszaak die je zoekt bestaat niet of is niet meer beschikbaar.
          </p>
          <Button
            onClick={() => navigate('/map')}
            className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90"
          >
            Terug naar kaart
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => navigate(`/barber/${id}`)}
            className="mb-4 text-gray-600 hover:text-gray-800"
          >
            ← Terug naar kapperszaak
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Afspraak boeken bij {barber.name}
          </h1>
          <p className="text-gray-600">
            Kies een dienst, datum en tijd voor je afspraak
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Booking Form */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Afspraak boeken
            </h2>

            <form onSubmit={handleBookingSubmit} className="space-y-6">
              {/* Service Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dienst *
                </label>
                <select
                  value={booking.serviceId}
                  onChange={handleServiceChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                >
                  <option value="">Selecteer een dienst</option>
                  {services.map(service => (
                    <option key={service.id} value={service.id}>
                      {service.name} - €{service.price} ({service.duration_minutes || 30} min)
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Datum *
                </label>
                <input
                  type="date"
                  value={booking.date}
                  onChange={handleDateChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

              {/* Time Selection */}
              {booking.serviceId && booking.date && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tijd *
                  </label>
                  {loadingSlots ? (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span>Beschikbare tijden laden...</span>
                    </div>
                  ) : availableSlots.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                      {availableSlots.map((slot, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setBooking({ ...booking, time: slot.time })}
                          className={`p-3 text-sm rounded-lg border transition-colors ${
                            booking.time === slot.time
                              ? 'bg-primary text-white border-primary'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-primary'
                          }`}
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p>Geen beschikbare tijden op deze datum</p>
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Opmerkingen (optioneel)
                </label>
                <textarea
                  value={booking.notes}
                  onChange={(e) => setBooking({ ...booking, notes: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Speciale wensen of opmerkingen..."
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={!booking.serviceId || !booking.date || !booking.time || bookingLoading}
                className="w-full bg-primary text-white py-3 px-4 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {bookingLoading ? 'Bezig met boeken...' : 'Afspraak bevestigen'}
              </Button>
            </form>
          </Card>

          {/* Salon Info */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Kapperszaak informatie
              </h3>
              <div className="space-y-3">
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-5 w-5 mr-3" />
                  <span>{barber.name}</span>
                </div>
                {barber.location && (
                  <div className="flex items-center text-gray-600">
                    <Clock className="h-5 w-5 mr-3" />
                    <span>{barber.location}</span>
                  </div>
                )}
                {barber.phone && (
                  <div className="flex items-center text-gray-600">
                    <Clock className="h-5 w-5 mr-3" />
                    <span>{barber.phone}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Opening Hours */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Openingstijden
              </h3>
              <div className="space-y-2">
                {salonHours.map((hour, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'][hour.day_of_week]}
                    </span>
                    <span className={hour.is_closed ? 'text-red-500' : 'text-gray-900'}>
                      {hour.is_closed ? 'Gesloten' : `${hour.open_time} - ${hour.close_time}`}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

import React, { useState, useEffect } from 'react'
import { X, Calendar, Clock, User, Scissors } from 'lucide-react'
import { supabase } from '../lib/supabase'
import Button from './Button.jsx'
import Card from './Card.jsx'

export default function AddAppointmentModal({ isOpen, onClose, salonId, onAppointmentAdded }) {
  const [formData, setFormData] = useState({
    klant_id: '',
    dienst: '',
    start_tijd: '',
    eind_tijd: '',
    notities: ''
  })
  const [clients, setClients] = useState([])
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [selectedDuration, setSelectedDuration] = useState(30)

  // Load clients and services when modal opens
  useEffect(() => {
    if (isOpen && salonId) {
      loadClients()
      loadServices()
      // Set default date to today
      const today = new Date()
      setSelectedDate(today.toISOString().split('T')[0])
    }
  }, [isOpen, salonId])

  async function loadClients() {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('salon_id', salonId)
        .order('naam')

      if (error) {
        console.error('Error loading clients:', error)
        setClients([])
      } else {
        setClients(data || [])
      }
    } catch (err) {
      console.error('Error loading clients:', err)
      setClients([])
    }
  }

  async function loadServices() {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('barber_id', salonId)
        .order('name')

      if (error) {
        console.error('Error loading services:', error)
        setServices([])
      } else {
        setServices(data || [])
      }
    } catch (err) {
      console.error('Error loading services:', err)
      setServices([])
    }
  }

  // Generate time slots (8:00 - 20:00) in 15-minute intervals
  const generateTimeSlots = () => {
    const slots = []
    for (let hour = 8; hour < 20; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        slots.push(time)
      }
    }
    return slots
  }

  const timeSlots = generateTimeSlots()

  // Calculate end time based on selected time and duration
  useEffect(() => {
    if (selectedTime && selectedDuration) {
      const [hours, minutes] = selectedTime.split(':').map(Number)
      const startMinutes = hours * 60 + minutes
      const endMinutes = startMinutes + selectedDuration
      const endHours = Math.floor(endMinutes / 60)
      const endMins = endMinutes % 60
      const endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`
      
      setFormData(prev => ({
        ...prev,
        start_tijd: selectedDate ? `${selectedDate}T${selectedTime}:00` : '',
        eind_tijd: selectedDate ? `${selectedDate}T${endTime}:00` : ''
      }))
    }
  }, [selectedTime, selectedDuration, selectedDate])

  // Update duration when service changes
  useEffect(() => {
    if (formData.dienst) {
      const service = services.find(s => s.name === formData.dienst)
      if (service && service.duration_minutes) {
        setSelectedDuration(service.duration_minutes)
      }
    }
  }, [formData.dienst, services])

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validation
    if (!formData.klant_id) {
      setError('Selecteer een klant')
      setLoading(false)
      return
    }
    if (!formData.dienst) {
      setError('Selecteer een dienst')
      setLoading(false)
      return
    }
    if (!formData.start_tijd || !formData.eind_tijd) {
      setError('Selecteer een tijd')
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('appointments')
        .insert({
          salon_id: salonId,
          klant_id: formData.klant_id,
          dienst: formData.dienst,
          start_tijd: formData.start_tijd,
          eind_tijd: formData.eind_tijd,
          notities: formData.notities || null
        })
        .select()

      if (error) {
        console.error('Error creating appointment:', error)
        setError('Er is een fout opgetreden bij het aanmaken van de afspraak')
        return
      }

      // Success - close modal and refresh
      if (onAppointmentAdded) {
        onAppointmentAdded(data[0])
      }
      handleClose()
    } catch (err) {
      console.error('Error creating appointment:', err)
      setError('Er is een onverwachte fout opgetreden')
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    setFormData({
      klant_id: '',
      dienst: '',
      start_tijd: '',
      eind_tijd: '',
      notities: ''
    })
    setSelectedDate('')
    setSelectedTime('')
    setSelectedDuration(30)
    setError('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Nieuwe afspraak</h2>
                <p className="text-sm text-gray-500">Voeg een nieuwe afspraak toe aan de agenda</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Client Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="h-4 w-4 inline mr-2" />
              Klant
            </label>
            <select
              value={formData.klant_id}
              onChange={(e) => setFormData({...formData, klant_id: e.target.value})}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            >
              <option value="">Selecteer een klant</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.naam} - {client.telefoon}
                </option>
              ))}
            </select>
          </div>

          {/* Service Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Scissors className="h-4 w-4 inline mr-2" />
              Dienst
            </label>
            <select
              value={formData.dienst}
              onChange={(e) => setFormData({...formData, dienst: e.target.value})}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            >
              <option value="">Selecteer een dienst</option>
              {services.map((service) => (
                <option key={service.id} value={service.name}>
                  {service.name} - €{service.price} ({service.duration_minutes} min)
                </option>
              ))}
            </select>
          </div>

          {/* Date and Time Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-2" />
                Datum
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="h-4 w-4 inline mr-2" />
                Tijd
              </label>
              <select
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              >
                <option value="">Selecteer tijd</option>
                {timeSlots.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duur (minuten)
              </label>
              <input
                type="number"
                value={selectedDuration}
                onChange={(e) => setSelectedDuration(parseInt(e.target.value) || 30)}
                min="15"
                max="300"
                step="15"
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notities (optioneel)
            </label>
            <textarea
              value={formData.notities}
              onChange={(e) => setFormData({...formData, notities: e.target.value})}
              rows={3}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Speciale wensen of opmerkingen..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Annuleren
            </button>
            <Button
              type="submit"
              disabled={loading}
              className="px-6 py-2"
            >
              {loading ? 'Bezig...' : 'Afspraak toevoegen'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

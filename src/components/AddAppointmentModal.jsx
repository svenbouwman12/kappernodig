import React, { useState, useEffect } from 'react'
import { X, Calendar, Clock, User, Scissors } from 'lucide-react'
import { supabase } from '../lib/supabase'
import Button from './Button.jsx'
import Card from './Card.jsx'

export default function AddAppointmentModal({ isOpen, onClose, salonId, onAppointmentAdded, editingAppointment = null, preSelectedClient = null }) {
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
  const [showNewClientForm, setShowNewClientForm] = useState(false)
  const [newClient, setNewClient] = useState({
    naam: '',
    telefoon: '',
    email: ''
  })

  // Load clients and services when modal opens
  useEffect(() => {
    if (isOpen && salonId) {
      loadClients()
      loadServices()
      
      if (editingAppointment) {
        // Pre-fill form with existing appointment data
        const startDate = new Date(editingAppointment.start_tijd)
        const startTime = startDate.toTimeString().slice(0, 5)
        const duration = Math.round((new Date(editingAppointment.eind_tijd) - startDate) / (1000 * 60))
        
        setFormData({
          klant_id: editingAppointment.klant_id,
          dienst: editingAppointment.dienst,
          start_tijd: editingAppointment.start_tijd,
          eind_tijd: editingAppointment.eind_tijd,
          notities: editingAppointment.notities || ''
        })
        setSelectedDate(startDate.toISOString().split('T')[0])
        setSelectedTime(startTime)
        setSelectedDuration(duration)
      } else {
        // Set default date to today for new appointments
        const today = new Date()
        setSelectedDate(today.toISOString().split('T')[0])
        setFormData({
          klant_id: preSelectedClient ? preSelectedClient.id : '',
          dienst: '',
          start_tijd: '',
          eind_tijd: '',
          notities: ''
        })
        setSelectedTime('')
        setSelectedDuration(30)
      }
    }
  }, [isOpen, salonId, editingAppointment])

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

  async function createNewClient() {
    if (!newClient.naam.trim() || !newClient.telefoon.trim()) {
      setError('Naam en telefoon zijn verplicht')
      return null
    }

    try {
      const { data, error } = await supabase
        .from('clients')
        .insert({
          salon_id: salonId,
          naam: newClient.naam.trim(),
          telefoon: newClient.telefoon.trim(),
          email: newClient.email.trim() || null
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating client:', error)
        setError('Er is een fout opgetreden bij het aanmaken van de klant')
        return null
      }

      // Add to clients list and select it
      setClients(prev => [...prev, data])
      setFormData(prev => ({ ...prev, klant_id: data.id }))
      setShowNewClientForm(false)
      setNewClient({ naam: '', telefoon: '', email: '' })
      setError('')
      return data
    } catch (err) {
      console.error('Error creating client:', err)
      setError('Er is een onverwachte fout opgetreden')
      return null
    }
  }

  // Generate time slots (8:00 - 20:00) in 15-minute intervals
  const generateTimeSlots = () => {
    const slots = []
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    for (let hour = 8; hour < 20; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        
        // Filter out past time slots
        if (selectedDate) {
          const selectedDateObj = new Date(selectedDate)
          const selectedDateOnly = new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth(), selectedDateObj.getDate())
          
          // Compare dates using local date strings to avoid timezone issues
          const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
          const selectedDateString = `${selectedDateOnly.getFullYear()}-${String(selectedDateOnly.getMonth() + 1).padStart(2, '0')}-${String(selectedDateOnly.getDate()).padStart(2, '0')}`
          
          const isPastDate = selectedDateString < todayString
          const isToday = todayString === selectedDateString
          
          // Skip all slots for past dates
          if (isPastDate) {
            continue
          }
          
          // For today, skip slots that are in the past
          if (isToday) {
            const slotTime = new Date(selectedDateOnly)
            slotTime.setHours(hour, minute, 0, 0)
            if (slotTime < now) {
              continue
            }
          }
        }
        
        slots.push(time)
      }
    }
    return slots
  }

  const timeSlots = generateTimeSlots()

  // Calculate end time based on selected time and duration
  useEffect(() => {
    if (selectedTime && selectedDuration && selectedDate) {
      const [hours, minutes] = selectedTime.split(':').map(Number)
      const startMinutes = hours * 60 + minutes
      const endMinutes = startMinutes + selectedDuration
      const endHours = Math.floor(endMinutes / 60)
      const endMins = endMinutes % 60
      const endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`
      
      // Create proper Date objects to handle timezone correctly
      const startDateTime = new Date(`${selectedDate}T${selectedTime}:00`)
      const endDateTime = new Date(`${selectedDate}T${endTime}:00`)
      
      setFormData(prev => ({
        ...prev,
        start_tijd: startDateTime.toISOString(),
        eind_tijd: endDateTime.toISOString()
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
      let data, error
      
      if (editingAppointment) {
        // Update existing appointment
        const result = await supabase
          .from('appointments')
          .update({
            klant_id: formData.klant_id,
            dienst: formData.dienst,
            start_tijd: formData.start_tijd,
            eind_tijd: formData.eind_tijd,
            notities: formData.notities || null
          })
          .eq('id', editingAppointment.id)
          .select()
        
        data = result.data
        error = result.error
      } else {
        // Create new appointment
        const result = await supabase
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
        
        data = result.data
        error = result.error
      }

      if (error) {
        console.error('Error saving appointment:', error)
        setError(editingAppointment ? 'Er is een fout opgetreden bij het bijwerken van de afspraak' : 'Er is een fout opgetreden bij het aanmaken van de afspraak')
        return
      }

      // Success - close modal and refresh
      if (onAppointmentAdded) {
        onAppointmentAdded(data[0])
      }
      handleClose()
    } catch (err) {
      console.error('Error saving appointment:', err)
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
    setShowNewClientForm(false)
    setNewClient({ naam: '', telefoon: '', email: '' })
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
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingAppointment ? 'Afspraak bewerken' : 'Nieuwe afspraak'}
                </h2>
                <p className="text-sm text-gray-500">
                  {editingAppointment ? 'Bewerk de afspraak gegevens' : 'Voeg een nieuwe afspraak toe aan de agenda'}
                </p>
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
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                <User className="h-4 w-4 inline mr-2" />
                Klant
              </label>
              <button
                type="button"
                onClick={() => setShowNewClientForm(!showNewClientForm)}
                className="text-sm text-primary hover:text-primary/80 font-medium"
              >
                {showNewClientForm ? 'Bestaande klant selecteren' : '+ Nieuwe klant toevoegen'}
              </button>
            </div>

            {!showNewClientForm ? (
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
            ) : (
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Naam *
                  </label>
                  <input
                    type="text"
                    value={newClient.naam}
                    onChange={(e) => setNewClient({...newClient, naam: e.target.value})}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Volledige naam"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefoon *
                  </label>
                  <input
                    type="tel"
                    value={newClient.telefoon}
                    onChange={(e) => setNewClient({...newClient, telefoon: e.target.value})}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="06-12345678"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email (optioneel)
                  </label>
                  <input
                    type="email"
                    value={newClient.email}
                    onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="klant@email.com"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={createNewClient}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 text-sm font-medium"
                  >
                    Klant toevoegen
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewClientForm(false)}
                    className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm font-medium"
                  >
                    Annuleren
                  </button>
                </div>
              </div>
            )}
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
              {loading ? (editingAppointment ? 'Bijwerken...' : 'Bezig...') : (editingAppointment ? 'Afspraak bijwerken' : 'Afspraak toevoegen')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

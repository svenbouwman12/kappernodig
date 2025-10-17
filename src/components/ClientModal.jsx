import React, { useState, useEffect } from 'react'
import { X, Save, User, Phone, Mail } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function ClientModal({ 
  client, 
  isOpen, 
  onClose, 
  salonId 
}) {
  const [formData, setFormData] = useState({
    naam: '',
    telefoon: '',
    email: ''
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (client) {
      setFormData({
        naam: client.naam || '',
        telefoon: client.telefoon || '',
        email: client.email || ''
      })
    } else {
      setFormData({
        naam: '',
        telefoon: '',
        email: ''
      })
    }
    setErrors({})
  }, [client])

  const validateForm = () => {
    const newErrors = {}

    if (!formData.naam.trim()) {
      newErrors.naam = 'Naam is verplicht'
    }

    if (!formData.telefoon.trim()) {
      newErrors.telefoon = 'Telefoonnummer is verplicht'
    } else {
      // Basic phone validation
      const phoneRegex = /^(\+31|0)[1-9][0-9]{8}$/
      if (!phoneRegex.test(formData.telefoon.replace(/\s/g, ''))) {
        newErrors.telefoon = 'Voer een geldig Nederlands telefoonnummer in'
      }
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Voer een geldig email adres in'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return

    setSaving(true)
    try {
      const clientData = {
        salon_id: salonId,
        naam: formData.naam.trim(),
        telefoon: formData.telefoon.trim(),
        email: formData.email.trim() || null
      }

      if (client) {
        // Update existing client
        const { error } = await supabase
          .from('clients')
          .update(clientData)
          .eq('id', client.id)

        if (error) {
          console.error('Error updating client:', error)
          alert('Fout bij bijwerken van klant: ' + error.message)
          return
        }
      } else {
        // Create new client
        const { error } = await supabase
          .from('clients')
          .insert(clientData)

        if (error) {
          console.error('Error creating client:', error)
          alert('Fout bij aanmaken van klant: ' + error.message)
          return
        }
      }

      onClose()
    } catch (err) {
      console.error('Error saving client:', err)
      alert('Er is een fout opgetreden bij het opslaan van de klant.')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {client ? 'Klant bewerken' : 'Nieuwe klant'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {/* Naam */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="h-4 w-4 inline mr-2" />
              Naam *
            </label>
            <input
              type="text"
              value={formData.naam}
              onChange={(e) => handleInputChange('naam', e.target.value)}
              placeholder="Volledige naam"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                errors.naam ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.naam && (
              <p className="mt-1 text-sm text-red-600">{errors.naam}</p>
            )}
          </div>

          {/* Telefoon */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Phone className="h-4 w-4 inline mr-2" />
              Telefoonnummer *
            </label>
            <input
              type="tel"
              value={formData.telefoon}
              onChange={(e) => handleInputChange('telefoon', e.target.value)}
              placeholder="0612345678 of +31612345678"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                errors.telefoon ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.telefoon && (
              <p className="mt-1 text-sm text-red-600">{errors.telefoon}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="h-4 w-4 inline mr-2" />
              Email (optioneel)
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="email@voorbeeld.nl"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                errors.email ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annuleren
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center space-x-2"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Opslaan...' : 'Opslaan'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

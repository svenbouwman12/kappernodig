import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Card from '../components/Card.jsx'
import Button from '../components/Button.jsx'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext.jsx'
import { 
  Plus, 
  MapPin, 
  Phone, 
  Globe, 
  Edit, 
  Trash2, 
  Star, 
  Clock,
  Users,
  Calendar,
  Settings,
  BarChart3
} from 'lucide-react'

export default function KapperDashboardPage() {
  const { user, userProfile } = useAuth()
  const [barbers, setBarbers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingBarber, setEditingBarber] = useState(null)

  useEffect(() => {
    loadBarbers()
  }, [])

  async function loadBarbers() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('barbers')
        .select('*')
        .eq('owner_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading barbers:', error)
        return
      }

      setBarbers(data || [])
    } catch (err) {
      console.error('Error loading barbers:', err)
    } finally {
      setLoading(false)
    }
  }

  async function saveBarber(barberData) {
    try {
      const dataWithOwner = {
        ...barberData,
        owner_id: user?.id
      }

      const { error } = await supabase
        .from('barbers')
        .upsert(dataWithOwner)

      if (error) {
        alert('Fout bij opslaan: ' + error.message)
        return
      }

      setShowAddForm(false)
      setEditingBarber(null)
      loadBarbers()
    } catch (err) {
      console.error('Error saving barber:', err)
      alert('Er is een fout opgetreden bij het opslaan.')
    }
  }

  async function deleteBarber(id) {
    if (!confirm('Weet je zeker dat je deze kapper wilt verwijderen?')) return

    try {
      const { error } = await supabase
        .from('barbers')
        .delete()
        .eq('id', id)

      if (error) {
        alert('Fout bij verwijderen: ' + error.message)
        return
      }

      loadBarbers()
    } catch (err) {
      console.error('Error deleting barber:', err)
      alert('Er is een fout opgetreden bij het verwijderen.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-secondary/70">Laden...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Kapper Dashboard</h1>
              <p className="text-gray-600 mt-1">Beheer je kapper zaken en afspraken</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setShowAddForm(true)}
                className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-medium flex items-center space-x-2"
              >
                <Plus size={20} />
                <span>Nieuwe Kapper Toevoegen</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Totaal Kappers</p>
                <p className="text-2xl font-bold text-gray-900">{barbers.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-xl">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Vandaag</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-xl">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Deze Week</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-xl">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Gem. Rating</p>
                <p className="text-2xl font-bold text-gray-900">
                  {barbers.length > 0 
                    ? (barbers.reduce((sum, b) => sum + (b.rating || 0), 0) / barbers.length).toFixed(1)
                    : '0.0'
                  }
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Add/Edit Form */}
        {(showAddForm || editingBarber) && (
          <BarberForm
            barber={editingBarber}
            onSave={saveBarber}
            onCancel={() => {
              setShowAddForm(false)
              setEditingBarber(null)
            }}
          />
        )}

        {/* Barbers List */}
        {barbers.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {barbers.map(barber => (
              <Card key={barber.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                      {barber.name?.charAt(0) || 'K'}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{barber.name}</h3>
                      <p className="text-sm text-gray-600">{barber.location || barber.address}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setEditingBarber(barber)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => deleteBarber(barber.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {barber.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone size={16} className="mr-2" />
                      {barber.phone}
                    </div>
                  )}
                  
                  {barber.website && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Globe size={16} className="mr-2" />
                      <a href={barber.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                        Website
                      </a>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {barber.price_range || '€€'}
                      </span>
                      {barber.rating && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Star size={16} className="mr-1 text-yellow-500" />
                          {barber.rating}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100">
                    <Link
                      to={`/barber/${barber.id}`}
                      className="text-primary hover:text-primary/80 text-sm font-medium"
                    >
                      Bekijk profiel →
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Nog geen kappers</h3>
            <p className="text-gray-600 mb-6">
              Voeg je eerste kapper toe om te beginnen met het beheren van je zaken.
            </p>
            <Button
              onClick={() => setShowAddForm(true)}
              className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-medium"
            >
              <Plus size={20} className="mr-2" />
              Eerste Kapper Toevoegen
            </Button>
          </Card>
        )}
      </div>
    </div>
  )
}

function BarberForm({ barber, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: barber?.name || '',
    description: barber?.description || '',
    location: barber?.location || '',
    address: barber?.address || '',
    phone: barber?.phone || '',
    website: barber?.website || '',
    price_range: barber?.price_range || '€€',
    rating: barber?.rating || '',
    image_url: barber?.image_url || '',
    latitude: barber?.latitude || '',
    longitude: barber?.longitude || '',
    gender_served: barber?.gender_served || 'both',
    services_offered: barber?.services_offered || []
  })
  const [saving, setSaving] = useState(false)

  const services = {
    'knippen': { name: 'Knippen', icon: '✂️' },
    'baard': { name: 'Baard trimmen', icon: '🧔' },
    'kleuren': { name: 'Haar kleuren', icon: '🎨' },
    'wassen': { name: 'Wassen & föhnen', icon: '💧' },
    'styling': { name: 'Styling', icon: '💇' },
    'highlights': { name: 'Highlights', icon: '✨' },
    'balayage': { name: 'Balayage', icon: '🌈' },
    'permanent': { name: 'Permanent', icon: '🌊' },
    'keratine': { name: 'Keratine behandeling', icon: '💫' },
    'extensions': { name: 'Hair extensions', icon: '💫' }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    
    const data = {
      ...formData,
      id: barber?.id,
      rating: formData.rating ? parseFloat(formData.rating) : null,
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
    }
    
    await onSave(data)
    setSaving(false)
  }

  function handleServiceToggle(serviceKey) {
    const currentServices = formData.services_offered || []
    const newServices = currentServices.includes(serviceKey)
      ? currentServices.filter(s => s !== serviceKey)
      : [...currentServices, serviceKey]
    
    setFormData({ ...formData, services_offered: newServices })
  }

  return (
    <Card className="p-8 mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {barber ? 'Kapper Bewerken' : 'Nieuwe Kapper Toevoegen'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Naam *</label>
            <input
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Kapper naam"
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Locatie</label>
            <input
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              placeholder="Stad, dorp"
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Adres</label>
            <input
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              placeholder="Straat en huisnummer"
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Telefoon</label>
            <input
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              placeholder="06-12345678"
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
            <input
              value={formData.website}
              onChange={(e) => setFormData({...formData, website: e.target.value})}
              placeholder="https://www.kapper.nl"
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Prijsniveau</label>
            <select
              value={formData.price_range}
              onChange={(e) => setFormData({...formData, price_range: e.target.value})}
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="€">€ (Budget)</option>
              <option value="€€">€€ (Gemiddeld)</option>
              <option value="€€€">€€€ (Premium)</option>
              <option value="€€€€">€€€€ (Luxury)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rating (1-5)</label>
            <input
              value={formData.rating}
              onChange={(e) => setFormData({...formData, rating: e.target.value})}
              placeholder="4.5"
              type="number"
              min="1"
              max="5"
              step="0.1"
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Geslacht</label>
            <select
              value={formData.gender_served}
              onChange={(e) => setFormData({...formData, gender_served: e.target.value})}
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="both">Beide geslachten</option>
              <option value="man">Alleen mannen</option>
              <option value="vrouw">Alleen vrouwen</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Diensten</label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {Object.entries(services).map(([key, service]) => (
              <label
                key={key}
                className={`flex items-center p-3 border-2 rounded-xl cursor-pointer transition-colors ${
                  formData.services_offered?.includes(key)
                    ? 'border-primary bg-primary/10'
                    : 'border-gray-200 hover:border-primary'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.services_offered?.includes(key) || false}
                  onChange={() => handleServiceToggle(key)}
                  className="form-checkbox h-4 w-4 text-primary focus:ring-primary mr-2"
                />
                <span className="text-sm font-medium">{service.icon} {service.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Beschrijving</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="Beschrijf je kapper..."
            rows={4}
            className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50"
          >
            Annuleren
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? 'Opslaan...' : 'Opslaan'}
          </Button>
        </div>
      </form>
    </Card>
  )
}

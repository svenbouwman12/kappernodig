import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Card from '../components/Card.jsx'
import Button from '../components/Button.jsx'
import { supabase } from '../lib/supabase'
import { Edit, Trash2, Plus, MapPin, Phone, Globe } from 'lucide-react'

export default function AdminDashboardPage() {
  const [barbers, setBarbers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingBarber, setEditingBarber] = useState(null)

  useEffect(() => {
    loadBarbers()
  }, [])

  async function loadBarbers() {
    setLoading(true)
    const { data, error } = await supabase.from('barbers').select('*').order('created_at', { ascending: false })
    if (error) console.error('Error loading barbers:', error)
    setBarbers(data || [])
    setLoading(false)
  }

  async function deleteBarber(id) {
    if (!confirm('Weet je zeker dat je deze kapper wilt verwijderen?')) return
    
    const { error } = await supabase.from('barbers').delete().eq('id', id)
    if (error) {
      alert('Fout bij verwijderen: ' + error.message)
      return
    }
    loadBarbers()
  }

  async function saveBarber(barberData) {
    const { error } = await supabase.from('barbers').upsert(barberData)
    if (error) {
      alert('Fout bij opslaan: ' + error.message)
      return
    }
    setShowAddForm(false)
    setEditingBarber(null)
    loadBarbers()
  }

  if (loading) return <div className="p-8">Laden...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus size={16} className="mr-2" />
          Kapper toevoegen
        </Button>
      </div>

      {showAddForm && (
        <BarberForm 
          onSave={saveBarber} 
          onCancel={() => setShowAddForm(false)} 
        />
      )}

      {editingBarber && (
        <BarberForm 
          barber={editingBarber}
          onSave={saveBarber} 
          onCancel={() => setEditingBarber(null)} 
        />
      )}

      <div className="grid gap-4">
        {barbers.map(barber => (
          <Card key={barber.id}>
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <img 
                  src={barber.image_url} 
                  alt={barber.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{barber.name}</h3>
                  <p className="text-secondary/70 text-sm mb-2">{barber.description}</p>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-secondary/60">
                    {barber.location && (
                      <div className="flex items-center gap-1">
                        <MapPin size={14} />
                        {barber.location}
                      </div>
                    )}
                    {barber.phone && (
                      <div className="flex items-center gap-1">
                        <Phone size={14} />
                        {barber.phone}
                      </div>
                    )}
                    {barber.website && (
                      <div className="flex items-center gap-1">
                        <Globe size={14} />
                        <a href={barber.website} target="_blank" rel="noreferrer" className="hover:underline">
                          Website
                        </a>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-2 text-sm">
                    <span className="text-primary font-medium">{barber.price_range}</span>
                    {barber.rating && <span className="ml-2">★ {barber.rating}</span>}
                    {barber.latitude && barber.longitude && (
                      <span className="ml-2 text-success">📍 Geocoded</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="secondary" 
                  onClick={() => setEditingBarber(barber)}
                >
                  <Edit size={16} />
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => deleteBarber(barber.id)}
                  className="text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={16} />
                </Button>
                <Link to={`/barber/${barber.id}`}>
                  <Button variant="secondary">Bekijk</Button>
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {barbers.length === 0 && (
        <Card>
          <div className="text-center py-8 text-secondary/60">
            Geen kappers gevonden. Voeg er een toe om te beginnen.
          </div>
        </Card>
      )}
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
    image_url: barber?.image_url || '',
    rating: barber?.rating || '',
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    
    const data = {
      ...formData,
      id: barber?.id,
      rating: formData.rating ? parseFloat(formData.rating) : null,
    }
    
    await onSave(data)
    setSaving(false)
  }

  return (
    <Card>
      <h2 className="text-xl font-semibold mb-4">
        {barber ? 'Kapper bewerken' : 'Nieuwe kapper toevoegen'}
      </h2>
      
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          placeholder="Naam"
          className="bg-white border border-gray-200 rounded-xl px-3 py-2"
          required
        />
        
        <input
          value={formData.location}
          onChange={(e) => setFormData({...formData, location: e.target.value})}
          placeholder="Locatie"
          className="bg-white border border-gray-200 rounded-xl px-3 py-2"
        />
        
        <input
          value={formData.address}
          onChange={(e) => setFormData({...formData, address: e.target.value})}
          placeholder="Adres (voor geocoding)"
          className="bg-white border border-gray-200 rounded-xl px-3 py-2"
        />
        
        <input
          value={formData.phone}
          onChange={(e) => setFormData({...formData, phone: e.target.value})}
          placeholder="Telefoon"
          className="bg-white border border-gray-200 rounded-xl px-3 py-2"
        />
        
        <input
          value={formData.website}
          onChange={(e) => setFormData({...formData, website: e.target.value})}
          placeholder="Website"
          className="bg-white border border-gray-200 rounded-xl px-3 py-2"
        />
        
        <select
          value={formData.price_range}
          onChange={(e) => setFormData({...formData, price_range: e.target.value})}
          className="bg-white border border-gray-200 rounded-xl px-3 py-2"
        >
          <option value="€">€</option>
          <option value="€€">€€</option>
          <option value="€€€">€€€</option>
        </select>
        
        <input
          value={formData.rating}
          onChange={(e) => setFormData({...formData, rating: e.target.value})}
          placeholder="Rating (1-5)"
          type="number"
          min="1"
          max="5"
          step="0.1"
          className="bg-white border border-gray-200 rounded-xl px-3 py-2"
        />
        
        <input
          value={formData.image_url}
          onChange={(e) => setFormData({...formData, image_url: e.target.value})}
          placeholder="Afbeelding URL"
          className="bg-white border border-gray-200 rounded-xl px-3 py-2 md:col-span-2"
        />
        
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          placeholder="Beschrijving"
          rows={3}
          className="bg-white border border-gray-200 rounded-xl px-3 py-2 md:col-span-2"
        />
        
        <div className="md:col-span-2 flex gap-3 justify-end">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Annuleren
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Opslaan...' : 'Opslaan'}
          </Button>
        </div>
      </form>
    </Card>
  )
}

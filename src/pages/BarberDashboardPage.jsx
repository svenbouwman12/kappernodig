import React, { useEffect, useState } from 'react'
import Card from '../components/Card.jsx'
import Button from '../components/Button.jsx'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext.jsx'

export default function BarberDashboardPage() {
  const [profile, setProfile] = useState({ name: '', description: '', location: '', price_range: '€€', image_url: '', address: '', phone: '', website: '' })
  const [saving, setSaving] = useState(false)
  const { user, userProfile } = useAuth()

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (userProfile?.barber_id) {
        const { data } = await supabase.from('barbers').select('*').eq('id', userProfile.barber_id).single()
        if (!cancelled && data) setProfile(data)
      }
    }
    load()
    return () => { cancelled = true }
  }, [userProfile])

  async function saveProfile(e) {
    e.preventDefault()
    setSaving(true)
    const upsert = { 
      ...profile, 
      id: profile.id || userProfile?.barber_id,
      owner_id: user?.id 
    }
    await supabase.from('barbers').upsert(upsert).select()
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="font-semibold mb-4">Profiel bewerken</h2>
        <form onSubmit={saveProfile} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} placeholder="Naam" className="bg-white border border-gray-200 rounded-xl px-3 py-2" />
          <input value={profile.location} onChange={(e) => setProfile({ ...profile, location: e.target.value })} placeholder="Locatie" className="bg-white border border-gray-200 rounded-xl px-3 py-2" />
          <input value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} placeholder="Adres" className="bg-white border border-gray-200 rounded-xl px-3 py-2 col-span-1 sm:col-span-2" />
          <select value={profile.price_range} onChange={(e) => setProfile({ ...profile, price_range: e.target.value })} className="bg-white border border-gray-200 rounded-xl px-3 py-2">
            <option>€</option>
            <option>€€</option>
            <option>€€€</option>
          </select>
          <input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="Telefoon" className="bg-white border border-gray-200 rounded-xl px-3 py-2" />
          <input value={profile.website} onChange={(e) => setProfile({ ...profile, website: e.target.value })} placeholder="Website (https://)" className="bg-white border border-gray-200 rounded-xl px-3 py-2" />
          <input value={profile.image_url} onChange={(e) => setProfile({ ...profile, image_url: e.target.value })} placeholder="Afbeelding URL" className="bg-white border border-gray-200 rounded-xl px-3 py-2 col-span-1 sm:col-span-2" />
          <textarea value={profile.description} onChange={(e) => setProfile({ ...profile, description: e.target.value })} placeholder="Beschrijving" className="bg-white border border-gray-200 rounded-xl px-3 py-2 col-span-1 sm:col-span-2" rows={4} />
          <div className="col-span-1 sm:col-span-2 flex justify-end">
            <Button disabled={saving}>{saving ? 'Opslaan...' : 'Opslaan'}</Button>
          </div>
        </form>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <div className="text-secondary/70 text-sm">Bezoeken</div>
          <div className="text-2xl font-semibold">1.2k</div>
        </Card>
        <Card>
          <div className="text-secondary/70 text-sm">Favorieten</div>
          <div className="text-2xl font-semibold">340</div>
        </Card>
        <Card>
          <div className="text-secondary/70 text-sm">Boekingen</div>
          <div className="text-2xl font-semibold">82</div>
        </Card>
      </div>
    </div>
  )
}



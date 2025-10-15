import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Card from '../components/Card.jsx'
import Button from '../components/Button.jsx'
import { supabase } from '../lib/supabase'

const DUMMY = {
  id: '1',
  name: 'Studio Sharp',
  description: 'Moderne kapsalon in centrum',
  location: 'Amsterdam',
  price_range: '€€',
  image_url: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=1200&auto=format&fit=crop',
  rating: 4.8,
  services: [
    { id: 's1', name: 'Knippen', price: 25 },
    { id: 's2', name: 'Baard', price: 15 },
  ],
}

export default function BarberProfilePage() {
  const { id } = useParams()
  const [barber, setBarber] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function fetchData() {
      const { data, error } = await supabase.from('barbers').select('*').eq('id', id).single()
      if (cancelled) return
      if (error || !data) {
        setBarber({ ...DUMMY, id })
      } else {
        setBarber(data)
      }
    }
    fetchData()
    return () => { cancelled = true }
  }, [id])

  if (!barber) return <div className="p-8">Laden...</div>

  return (
    <div className="space-y-6">
      <div className="flex gap-4 items-center">
        <img src={barber.image_url} alt={barber.name} className="w-28 h-28 rounded-xl object-cover" />
        <div>
          <h1 className="text-2xl font-semibold">{barber.name}</h1>
          <div className="text-secondary/70">{barber.location} • {barber.price_range}</div>
          {barber.rating && <div className="text-success mt-1">★ {barber.rating}</div>}
        </div>
      </div>

      <Card>
        <h2 className="font-semibold mb-2">Over</h2>
        <p className="text-secondary/80">{barber.description}</p>
      </Card>

      <Card>
        <h2 className="font-semibold mb-3">Diensten</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(barber.services || DUMMY.services).map((s) => (
            <div key={s.id} className="flex items-center justify-between bg-grayNeutral rounded-xl px-3 py-2">
              <span>{s.name}</span>
              <span className="font-medium">€ {s.price}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex gap-3">
        <Button>Favoriet</Button>
        <Button variant="secondary">Contact</Button>
      </div>
    </div>
  )
}



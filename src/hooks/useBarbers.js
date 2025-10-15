import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

const DUMMY_BARBERS = [
  { id: '1', name: 'Studio Sharp', description: 'Moderne kapsalon in centrum', location: 'Amsterdam', price_range: '€€', image_url: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=1200&auto=format&fit=crop', rating: 4.8, type: 'Heren', address: 'Damrak 1, 1012 LG Amsterdam', phone: '+31 20 123 4567', website: 'https://example.com' },
  { id: '2', name: 'Kapper Noord', description: 'Gezellig en betaalbaar', location: 'Rotterdam', price_range: '€', image_url: 'https://images.unsplash.com/photo-1593702288056-7927b442542d?q=80&w=1200&auto=format&fit=crop', rating: 4.5, type: 'Dames', address: 'Hofplein 10, Rotterdam', phone: '+31 10 222 3344', website: 'https://example.com' },
  { id: '3', name: 'Fade Factory', description: 'Specialist in fades', location: 'Utrecht', price_range: '€€€', image_url: 'https://images.unsplash.com/photo-1621605815971-fbc98d7a2115?q=80&w=1200&auto=format&fit=crop', rating: 4.9, type: 'Barbershop', address: 'Neude 5, Utrecht', phone: '+31 30 987 6543', website: 'https://example.com' },
]

export function useBarbers(filters) {
  const [barbers, setBarbers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function fetchBarbers() {
      setLoading(true)
      const { data, error } = await supabase.from('barbers').select('*')
      if (cancelled) return
      if (error) {
        setBarbers(DUMMY_BARBERS)
      } else {
        setBarbers(data?.length ? data : DUMMY_BARBERS)
      }
      setLoading(false)
    }
    fetchBarbers()
    return () => { cancelled = true }
  }, [])

  const filtered = useMemo(() => {
    const name = filters?.name?.toLowerCase() ?? ''
    const location = filters?.location?.toLowerCase() ?? ''
    const type = filters?.type ?? ''
    const price = filters?.price ?? ''
    return barbers.filter(b => (
      (!name || b.name.toLowerCase().includes(name)) &&
      (!location || (b.location || '').toLowerCase().includes(location)) &&
      (!type || (b.type || '') === type) &&
      (!price || (b.price_range || '') === price)
    ))
  }, [barbers, filters])

  return { barbers: filtered, loading }
}



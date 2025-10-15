import React, { useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import SearchBar from '../components/SearchBar.jsx'
import FilterBar from '../components/FilterBar.jsx'
import Card from '../components/Card.jsx'
import { useBarbers } from '../hooks/useBarbers.js'

export default function HomePage() {
  const { search } = useLocation()
  const params = new URLSearchParams(search)
  const initialQuery = params.get('q') || ''
  const [filters, setFilters] = useState({ name: initialQuery, location: '', type: '', price: '' })
  const { barbers, loading } = useBarbers(filters)

  const content = useMemo(() => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card animate-pulse h-40" />
          ))}
        </div>
      )
    }
    if (!barbers.length) {
      return <div className="text-secondary/60">Geen kappers gevonden.</div>
    }
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {barbers.map((b) => (
          <Link to={`/barber/${b.id}`} key={b.id}>
            <Card>
              <div className="flex gap-3">
                <img src={b.image_url} alt={b.name} className="w-24 h-24 object-cover rounded-xl" />
                <div className="flex-1">
                  <div className="font-semibold">{b.name}</div>
                  <div className="text-sm text-secondary/70">{b.location} • {b.price_range}</div>
                  {b.rating && <div className="text-sm text-success mt-1">★ {b.rating}</div>}
                  <p className="text-sm mt-1 line-clamp-2">{b.description}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    )
  }, [barbers, loading])

  return (
    <div className="space-y-6">
      <div className="sm:hidden">
        <SearchBar value={filters.name} onChange={(v) => setFilters({ ...filters, name: v })} />
      </div>
      <FilterBar filters={filters} onChange={setFilters} />
      {content}
    </div>
  )
}



import React from 'react'

export default function FilterBar({ filters, onChange }) {
  const set = (key, value) => onChange?.({ ...filters, [key]: value })
  return (
    <div className="flex gap-3 overflow-x-auto py-2">
      <select value={filters.type || ''} onChange={(e) => set('type', e.target.value)} className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm min-w-[140px]">
        <option value="">Type kapper</option>
        <option>Heren</option>
        <option>Dames</option>
        <option>Barbershop</option>
      </select>
      <select value={filters.price || ''} onChange={(e) => set('price', e.target.value)} className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm min-w-[120px]">
        <option value="">Prijs</option>
        <option>€</option>
        <option>€€</option>
        <option>€€€</option>
      </select>
      <input value={filters.location || ''} onChange={(e) => set('location', e.target.value)} placeholder="Locatie" className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm min-w-[160px]" />
    </div>
  )
}




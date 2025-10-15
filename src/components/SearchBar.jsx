import React from 'react'
import { Search } from 'lucide-react'

export default function SearchBar({ value, onChange, placeholder = 'Zoek kapper, locatie...' }) {
  return (
    <div className="flex items-center gap-2 bg-grayNeutral rounded-xl px-3 py-2 border border-gray-200 focus-within:border-primary transition">
      <Search size={18} className="text-secondary/60" />
      <input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent outline-none text-sm"
      />
    </div>
  )}



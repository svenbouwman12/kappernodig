import React from 'react'

export default function Footer() {
  return (
    <footer className="mt-12 border-t border-gray-100 bg-grayNeutral/60">
      <div className="container-max py-6 text-sm text-secondary/70 flex items-center justify-between">
        <span>© {new Date().getFullYear()} Kapper Nodig</span>
        <a href="https://supabase.com" target="_blank" rel="noreferrer" className="hover:text-secondary transition">Powered by Supabase</a>
      </div>
    </footer>
  )
}



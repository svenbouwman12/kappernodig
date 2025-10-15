import React from 'react'

export default function Footer() {
  return (
    <footer className="mt-12 border-t border-gray-100 bg-grayNeutral/60">
      <div className="container-max py-6 text-sm text-secondary/70 flex items-center justify-center">
        <span>© {new Date().getFullYear()} Kapper Nodig</span>
      </div>
    </footer>
  )
}



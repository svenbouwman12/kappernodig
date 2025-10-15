import React from 'react'

export default function Card({ className = '', children }) {
  return (
    <div className={`card transition duration-300 hover:shadow-md ${className}`}>
      {children}
    </div>
  )
}



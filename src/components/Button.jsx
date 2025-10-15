import React from 'react'

export default function Button({ variant = 'primary', className = '', children, ...props }) {
  const base = 'btn px-4 py-2 rounded-xl shadow-sm hover:scale-[1.01] active:scale-[0.99]'
  const style = variant === 'secondary' ? 'btn-secondary' : 'btn-primary'
  return (
    <button className={`${base} ${style} ${className}`} {...props}>
      {children}
    </button>
  )
}



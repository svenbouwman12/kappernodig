import React from 'react'

export default function Greeting({ name, className = '' }) {
  function getGreeting() {
    const hour = new Date().getHours()
    if (hour < 12) return 'Goedemorgen'
    if (hour < 18) return 'Goedemiddag'
    return 'Goedeavond'
  }

  const greeting = getGreeting()
  const displayName = name || 'Gebruiker'

  return (
    <span className={className}>
      {greeting}, {displayName}!
    </span>
  )
}

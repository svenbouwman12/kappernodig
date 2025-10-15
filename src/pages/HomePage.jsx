import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Card from '../components/Card.jsx'
import Button from '../components/Button.jsx'
import { supabase } from '../lib/supabase'

export default function HomePage() {
  const navigate = useNavigate()
  const [barbers, setBarbers] = useState([])
  const [selectedCity, setSelectedCity] = useState('')
  const [selectedRadius, setSelectedRadius] = useState(5)
  const [filteredBarbers, setFilteredBarbers] = useState([])

  // City coordinates for major Dutch cities
  const cities = {
    'Amsterdam': { lat: 52.3676, lng: 4.9041 },
    'Rotterdam': { lat: 51.9225, lng: 4.4792 },
    'Utrecht': { lat: 52.0907, lng: 5.1214 },
    'Den Haag': { lat: 52.0766, lng: 4.3113 },
    'Eindhoven': { lat: 51.4416, lng: 5.4697 },
    'Groningen': { lat: 53.2194, lng: 6.5665 },
    'Tilburg': { lat: 51.5555, lng: 5.0913 },
    'Almere': { lat: 52.3508, lng: 5.2647 },
    'Breda': { lat: 51.5719, lng: 4.7683 },
    'Nijmegen': { lat: 51.8426, lng: 5.8520 },
    'Enschede': { lat: 52.2215, lng: 6.8937 },
    'Haarlem': { lat: 52.3792, lng: 4.6368 },
    'Arnhem': { lat: 51.9851, lng: 5.8987 },
    'Zaanstad': { lat: 52.4531, lng: 4.8296 },
    'Amersfoort': { lat: 52.1561, lng: 5.3878 }
  }

  // Load barbers on component mount
  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('barbers').select('id,name,latitude,longitude,price_range,rating')
      const withCoords = (data || [])
        .filter(b => b.latitude && b.longitude && !isNaN(Number(b.latitude)) && !isNaN(Number(b.longitude)))
        .map(b => ({
          id: b.id,
          name: b.name,
          lat: Number(b.latitude),
          lng: Number(b.longitude),
          price_range: b.price_range,
          rating: b.rating,
        }))
        .filter(b => !isNaN(b.lat) && !isNaN(b.lng) && isFinite(b.lat) && isFinite(b.lng))
      setBarbers(withCoords)
    }
    load()
  }, [])

  // Function to handle city selection and filter barbers
  const handleCitySelection = () => {
    if (selectedCity && cities[selectedCity]) {
      const cityCoords = cities[selectedCity]
      
      // Filter barbers within radius
      const radiusKm = selectedRadius
      const filtered = barbers.filter(barber => {
        const distance = Math.sqrt(
          Math.pow(barber.lat - cityCoords.lat, 2) + 
          Math.pow(barber.lng - cityCoords.lng, 2)
        ) * 111000 / 1000 // Convert to km
        
        return distance <= radiusKm
      })
      
      setFilteredBarbers(filtered)
    }
  }

  // Function to go to map with selected data
  const goToMap = () => {
    if (selectedCity && filteredBarbers.length > 0) {
      // Navigate to map with city and radius as URL params
      navigate(`/map?city=${encodeURIComponent(selectedCity)}&radius=${selectedRadius}`)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-primary mb-6">Kapper Nodig</h1>
        <p className="text-secondary/80 text-2xl max-w-3xl mx-auto">Vind de perfecte kapper in jouw omgeving. Selecteer je stad en ontdek alle kappers binnen jouw gewenste afstand.</p>
      </div>
      
      <div className="grid lg:grid-cols-2 gap-12 items-start">
        {/* Selection Form */}
        <Card className="p-10">
          <div className="space-y-10">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-secondary mb-4">🔍 Zoek je kapper</h2>
              <p className="text-secondary/70 text-lg">Begin hier om kappers in jouw omgeving te vinden</p>
            </div>
            
            <div>
              <label className="block text-xl font-semibold text-secondary mb-4">📍 Selecteer je stad</label>
              <select 
                value={selectedCity}
                onChange={(e) => {
                  setSelectedCity(e.target.value)
                  setFilteredBarbers([])
                }}
                className="w-full bg-white border-2 border-gray-200 rounded-xl px-6 py-4 text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-xl"
              >
                <option value="">Kies een stad...</option>
                {Object.keys(cities).map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xl font-semibold text-secondary mb-4">🔍 Zoekradius: {selectedRadius} km</label>
              <input 
                type="range"
                min="1"
                max="50"
                value={selectedRadius}
                onChange={(e) => {
                  setSelectedRadius(parseInt(e.target.value))
                  setFilteredBarbers([])
                }}
                className="w-full h-4 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-lg text-secondary/60 mt-3">
                <span>1 km (straat)</span>
                <span>25 km (regio)</span>
                <span>50 km (provincie)</span>
              </div>
            </div>
            
            <Button 
              onClick={handleCitySelection}
              disabled={!selectedCity}
              className="w-full py-5 text-2xl font-bold"
            >
              🔍 Zoek kappers in {selectedCity || 'jouw stad'}
            </Button>
          </div>
        </Card>

        {/* Results Preview */}
        <div>
          {filteredBarbers.length > 0 ? (
            <Card className="p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-3xl font-bold text-secondary">
                  🎯 {filteredBarbers.length} kapper{filteredBarbers.length !== 1 ? 's' : ''} gevonden
                </h3>
                <Button 
                  onClick={goToMap}
                  className="px-8 py-3 text-lg font-semibold"
                >
                  🗺️ Bekijk op kaart
                </Button>
              </div>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {filteredBarbers.map((barber, index) => (
                  <div key={barber.id} className="flex items-center justify-between p-5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <span className="bg-primary text-white text-sm font-bold px-3 py-1 rounded-full">#{index + 1}</span>
                        <div className="font-bold text-lg text-secondary">{barber.name}</div>
                      </div>
                      <div className="flex items-center gap-6 text-base text-secondary/70">
                        <span className="bg-orange-100 text-primary px-3 py-1 rounded-md font-semibold">{barber.price_range || '€€'}</span>
                        <span className="text-lg">★ {barber.rating || 'N/A'}</span>
                      </div>
                    </div>
                    <Link to={`/barber/${barber.id}`}>
                      <Button variant="secondary" className="text-base px-6 py-2">
                        Bekijk
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 p-6 bg-primary/10 rounded-xl">
                <p className="text-lg text-primary/80 text-center">
                  💡 <strong>Tip:</strong> Klik op "Bekijk op kaart" om alle kappers op de interactieve kaart te zien en jouw locatie te delen
                </p>
              </div>
            </Card>
          ) : selectedCity ? (
            <Card className="p-10 text-center">
              <div className="text-8xl mb-6">🔍</div>
              <h3 className="text-2xl font-bold text-secondary mb-4">Klaar om te zoeken</h3>
              <p className="text-secondary/70 text-lg">Klik op "Zoek kappers" om te zien welke kappers er in {selectedCity} binnen {selectedRadius} km zijn.</p>
            </Card>
          ) : (
            <Card className="p-10 text-center">
              <div className="text-8xl mb-6">📍</div>
              <h3 className="text-2xl font-bold text-secondary mb-4">Selecteer je stad</h3>
              <p className="text-secondary/70 text-lg">Kies eerst een stad uit de lijst om kappers in jouw omgeving te vinden.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}





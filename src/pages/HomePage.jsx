import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Card from '../components/Card.jsx'
import Button from '../components/Button.jsx'
import StedenDropdown from '../components/StedenDropdown.jsx'
import { supabase } from '../lib/supabase'

export default function HomePage() {
  const navigate = useNavigate()
  const [barbers, setBarbers] = useState([])
  const [selectedCity, setSelectedCity] = useState('')
  const [selectedRadius, setSelectedRadius] = useState(5)
  const [filteredBarbers, setFilteredBarbers] = useState([])

  // Load barbers on component mount
  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('barbers').select('id,name,latitude,longitude,price_range,rating')
      if (data) {
        // Filter out barbers without coordinates
        const withCoords = data.filter(barber => 
          barber.latitude && barber.longitude && 
          !isNaN(barber.latitude) && !isNaN(barber.longitude)
        )
        setBarbers(withCoords)
      }
    }
    load()
  }, [])

  // Function to handle city selection and filter barbers
  const handleCitySelection = (selectedPlace) => {
    if (selectedPlace) {
      setSelectedCity(selectedPlace)
      // For now, show all barbers when a place is selected
      // In a real implementation, you would geocode the selected place
      // and filter barbers by distance
      setFilteredBarbers(barbers)
      console.log(`Selected place: ${selectedPlace}`)
    }
  }

  // Function to go to map with selected data
  const goToMap = () => {
    if (selectedCity && filteredBarbers.length > 0) {
      // Navigate to map with city and radius as URL params
      const params = new URLSearchParams({
        city: selectedCity,
        radius: selectedRadius.toString()
      })
      navigate(`/map?${params}`)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-primary mb-6">Kapper Nodig</h1>
        <p className="text-secondary/80 text-2xl max-w-3xl mx-auto">
          Vind de perfecte kapper in jouw omgeving. Selecteer je stad en ontdek alle kappers binnen jouw gewenste afstand.
        </p>
      </div>
      
      <div className="grid lg:grid-cols-2 gap-12 items-start">
        {/* Selection Form */}
        <Card className="p-10">
          <div className="space-y-10">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-secondary mb-4">🔍 Zoek je kapper</h2>
              <p className="text-secondary/70 text-lg">Begin hier om kappers in jouw omgeving te vinden</p>
            </div>
            
            <div className="relative">
              <label className="block text-xl font-semibold text-secondary mb-4">📍 Selecteer je stad</label>
              <StedenDropdown
                value={selectedCity}
                onChange={handleCitySelection}
                placeholder="Selecteer je stad (bijv. Amsterdam, Rotterdam...)"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xl font-semibold text-secondary mb-4">📏 Zoekradius</label>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={selectedRadius}
                    onChange={(e) => setSelectedRadius(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-2xl font-bold text-primary min-w-[80px]">
                    {selectedRadius} km
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>1 km</span>
                  <span>25 km</span>
                  <span>50 km</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Button
                onClick={goToMap}
                disabled={!selectedCity || filteredBarbers.length === 0}
                className="w-full py-4 text-xl font-semibold"
              >
                {selectedCity 
                  ? `🎯 Bekijk ${filteredBarbers.length} kapper${filteredBarbers.length !== 1 ? 's' : ''} op de kaart`
                  : '📍 Selecteer eerst een stad'
                }
              </Button>
              
              {selectedCity && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <p className="text-yellow-800 text-center">
                    💡 <strong>Tip:</strong> Selecteer een stad uit de suggesties hierboven om door te gaan
                  </p>
                </div>
              )}
            </div>
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
                <span className="text-lg text-secondary/70">
                  binnen {selectedRadius} km van {selectedCity}
                </span>
              </div>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {filteredBarbers.slice(0, 5).map((barber) => (
                  <div key={barber.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-primary font-bold text-lg">✂️</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-secondary">{barber.name}</h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>⭐ {barber.rating || 'N/A'}</span>
                          <span>💰 {barber.price_range || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                    <Link
                      to={`/barber/${barber.id}`}
                      className="text-primary hover:text-primary/80 font-medium"
                    >
                      Bekijk →
                    </Link>
                  </div>
                ))}
                
                {filteredBarbers.length > 5 && (
                  <div className="text-center text-gray-500 py-4">
                    En nog {filteredBarbers.length - 5} andere kappers...
                  </div>
                )}
              </div>
            </Card>
          ) : selectedCity ? (
            <Card className="p-8 text-center">
              <div className="text-6xl mb-6">🔍</div>
              <h3 className="text-2xl font-bold text-secondary mb-4">Geen kappers gevonden</h3>
              <p className="text-secondary/70 text-lg mb-6">
                Er zijn geen kappers gevonden binnen {selectedRadius} km van {selectedCity}.
              </p>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Probeer:</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Een grotere zoekradius te selecteren</li>
                  <li>• Een andere stad te kiezen</li>
                  <li>• De kaart te bekijken voor een overzicht</li>
                </ul>
              </div>
            </Card>
          ) : (
            <Card className="p-8 text-center">
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
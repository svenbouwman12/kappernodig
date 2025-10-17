import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Card from '../components/Card.jsx'
import Button from '../components/Button.jsx'
import { supabase } from '../lib/supabase'

export default function HomePage() {
  const navigate = useNavigate()
  const [barbers, setBarbers] = useState([])
  const [selectedCity, setSelectedCity] = useState('')
  const [selectedRadius, setSelectedRadius] = useState(5)
  const [selectedGender, setSelectedGender] = useState('')
  const [selectedServices, setSelectedServices] = useState([])
  const [filteredBarbers, setFilteredBarbers] = useState([])
  const [hasSearched, setHasSearched] = useState(false)

  // Load barbers on component mount
  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('barbers').select('*')
      if (data) {
        // Filter out barbers without coordinates and normalize field names
        const withCoords = data.filter(barber => 
          barber.latitude && barber.longitude && 
          !isNaN(barber.latitude) && !isNaN(barber.longitude)
        ).map(barber => ({
          ...barber,
          lat: parseFloat(barber.latitude),
          lng: parseFloat(barber.longitude),
          // Ensure services_offered is an array
          services_offered: barber.services_offered || [],
          // Ensure gender_served has a default value
          gender_served: barber.gender_served || 'both'
        }))
        setBarbers(withCoords)
        console.log('Loaded barbers:', withCoords.length)
        if (withCoords.length > 0) {
          console.log('Sample barber data:', withCoords[0])
          console.log('Available fields:', Object.keys(withCoords[0]))
          console.log('Services offered:', withCoords[0].services_offered)
          console.log('Gender served:', withCoords[0].gender_served)
        }
      }
    }
    load()
  }, [])

  // Auto-filter when barbers are loaded and all required fields are selected
  useEffect(() => {
    if (barbers.length > 0 && selectedCity && selectedGender) {
      filterBarbers(selectedCity, selectedRadius, selectedGender, selectedServices)
    }
  }, [barbers, selectedCity, selectedRadius, selectedGender, selectedServices])

  // Available services
  const services = {
    'knippen': { name: 'Knippen', icon: '✂️', gender: 'both' },
    'baard': { name: 'Baard trimmen', icon: '🧔', gender: 'man' },
    'kleuren': { name: 'Haar kleuren', icon: '🎨', gender: 'both' },
    'wassen': { name: 'Wassen & föhnen', icon: '💧', gender: 'both' },
    'styling': { name: 'Styling', icon: '💇', gender: 'both' },
    'highlights': { name: 'Highlights', icon: '✨', gender: 'woman' },
    'balayage': { name: 'Balayage', icon: '🌈', gender: 'woman' },
    'permanent': { name: 'Permanent', icon: '🌊', gender: 'woman' },
    'keratine': { name: 'Keratine behandeling', icon: '💫', gender: 'woman' },
    'extensions': { name: 'Hair extensions', icon: '💫', gender: 'woman' }
  }

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

  // Function to filter barbers based on current city, radius, gender and services
  const filterBarbers = (city, radius, gender, services) => {
    if (city && cities[city] && barbers.length > 0) {
      const cityCoords = cities[city]
      console.log('Searching in:', city, 'at', cityCoords)
      console.log('Filters:', { gender, services })
      console.log('Total barbers available:', barbers.length)
      
      // Filter barbers within radius and calculate distances
      let filtered = barbers.map(barber => {
        const distance = Math.sqrt(
          Math.pow(barber.lat - cityCoords.lat, 2) + 
          Math.pow(barber.lng - cityCoords.lng, 2)
        ) * 111000 / 1000 // Convert to km
        
        console.log(`Barber ${barber.name}: distance ${distance.toFixed(2)}km`)
        return {
          ...barber,
          distance: distance
        }
      }).filter(barber => barber.distance <= radius)

      // Filter by gender if selected
      if (gender) {
        filtered = filtered.filter(barber => {
          // Check if barber serves the selected gender
          return barber.gender_served === 'both' || barber.gender_served === gender
        })
      }

      // Filter by services if selected
      if (services && services.length > 0) {
        filtered = filtered.filter(barber => {
          // Check if barber offers any of the selected services
          if (!barber.services_offered || barber.services_offered.length === 0) {
            return false // No services listed, exclude
          }
          
          // Check if barber offers at least one of the selected services
          return services.some(selectedService => 
            barber.services_offered.includes(selectedService)
          )
        })
      }
      
      // Sort by distance (closest first)
      filtered.sort((a, b) => a.distance - b.distance)
      
      console.log('Filtered barbers:', filtered.length)
      console.log('Sorted by distance:', filtered.map(b => `${b.name}: ${b.distance.toFixed(2)}km`))
      setFilteredBarbers(filtered)
      setHasSearched(true)
    } else if (city && cities[city] && barbers.length === 0) {
      console.log('Barbers not loaded yet, waiting...')
    }
  }

  // Function to handle city selection and filter barbers
  const handleCitySelection = () => {
    if (selectedCity && selectedGender) {
      filterBarbers(selectedCity, selectedRadius, selectedGender, selectedServices)
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
        <p className="text-secondary/80 text-2xl max-w-3xl mx-auto mb-4">
          Vind de perfecte kapper in jouw omgeving. Selecteer je stad en ontdek alle kappers binnen jouw gewenste afstand.
        </p>
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
          <span>🔍</span>
          <span>Zoek en vind je perfecte kapper</span>
        </div>
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
              <select 
                value={selectedCity}
                        onChange={(e) => {
                          const newCity = e.target.value
                          setSelectedCity(newCity)
                          // Direct filter when city changes (only if gender is also selected)
                          if (newCity && selectedGender) {
                            filterBarbers(newCity, selectedRadius, selectedGender, selectedServices)
                          } else {
                            setHasSearched(false)
                            setFilteredBarbers([])
                          }
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
              <label className="block text-xl font-semibold text-secondary mb-4">👤 Geslacht</label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center p-3 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-primary transition-colors">
                  <input
                    type="radio"
                    name="gender"
                    value="man"
                    checked={selectedGender === 'man'}
                    onChange={(e) => {
                      setSelectedGender(e.target.value)
                      setSelectedServices([]) // Reset services when gender changes
                      setHasSearched(false)
                      setFilteredBarbers([])
                    }}
                    className="form-radio h-4 w-4 text-primary focus:ring-primary mr-3"
                  />
                  <span className="text-lg">👨 Man</span>
                </label>
                <label className="flex items-center p-3 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-primary transition-colors">
                  <input
                    type="radio"
                    name="gender"
                    value="vrouw"
                    checked={selectedGender === 'vrouw'}
                    onChange={(e) => {
                      setSelectedGender(e.target.value)
                      setSelectedServices([]) // Reset services when gender changes
                      setHasSearched(false)
                      setFilteredBarbers([])
                    }}
                    className="form-radio h-4 w-4 text-primary focus:ring-primary mr-3"
                  />
                  <span className="text-lg">👩 Vrouw</span>
                </label>
              </div>
            </div>

            {selectedGender && (
              <div>
                <label className="block text-xl font-semibold text-secondary mb-4">💇 Diensten</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(services)
                    .filter(([key, service]) => {
                      // Filter services based on selected gender
                      return service.gender === 'both' || service.gender === selectedGender
                    })
                    .map(([key, service]) => (
                      <label
                        key={key}
                        className={`flex items-center p-2 border-2 rounded-lg cursor-pointer transition-colors ${
                          selectedServices.includes(key)
                            ? 'border-primary bg-primary/10'
                            : 'border-gray-200 hover:border-primary'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedServices.includes(key)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedServices([...selectedServices, key])
                            } else {
                              setSelectedServices(selectedServices.filter(s => s !== key))
                            }
                            setHasSearched(false)
                            setFilteredBarbers([])
                          }}
                          className="form-checkbox h-4 w-4 text-primary focus:ring-primary mr-2"
                        />
                        <span className="text-sm">{service.icon} {service.name}</span>
                      </label>
                    ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xl font-semibold text-secondary mb-4">📏 Zoekradius: {selectedRadius} km</label>
              <div className="space-y-4">
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={selectedRadius}
                  onChange={(e) => {
                    const newRadius = parseInt(e.target.value)
                    setSelectedRadius(newRadius)
                    // Direct filter when slider changes
                    if (selectedCity) {
                      filterBarbers(selectedCity, newRadius, selectedGender, selectedServices)
                    }
                  }}
                  className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #FF6B00 0%, #FF6B00 ${(selectedRadius / 50) * 100}%, #e5e7eb ${(selectedRadius / 50) * 100}%, #e5e7eb 100%)`
                  }}
                />
                <div className="flex justify-between text-sm text-secondary/60">
                  <span>1 km</span>
                  <span>25 km</span>
                  <span>50 km</span>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <Button 
                onClick={() => {
                  if (selectedCity && selectedGender) {
                    filterBarbers(selectedCity, selectedRadius, selectedGender, selectedServices)
                  }
                }}
                disabled={!selectedCity || !selectedGender}
                className="w-full py-4 text-lg"
              >
                🔍 Zoek kappers
              </Button>
            </div>

          </div>
        </Card>

        {/* Results Preview */}
        <div>
          {hasSearched ? (
            filteredBarbers.length > 0 ? (
              <Card className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-3xl font-bold text-secondary">
                    🎯 {filteredBarbers.length} kapper{filteredBarbers.length !== 1 ? 's' : ''} gevonden
                  </h3>
                  <Button 
                    onClick={goToMap}
                    className="px-6 py-2"
                  >
                    🗺️ Bekijk op kaart
                  </Button>
                </div>
                <div className="space-y-6 max-h-96 overflow-y-auto">
                  {filteredBarbers.map(barber => (
                    <Link to={`/barber/${barber.id}`} key={barber.id} className="block">
                      <div className="flex items-center p-4 bg-gray-50 rounded-xl shadow-sm hover:shadow-md transition-all">
                        <div className="flex-shrink-0 w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-xl font-bold text-gray-600 mr-4">
                          {barber.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-xl font-semibold text-secondary">{barber.name}</h4>
                          <p className="text-gray-600 text-sm">{barber.price_range}</p>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            {barber.rating && (
                              <>
                                <span className="text-yellow-500 mr-1">★</span> {barber.rating}
                              </>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 mt-2">
                            📍 {barber.address || barber.street || barber.location || 'Locatie beschikbaar op kaart'}
                          </div>
                          <div className="text-sm text-primary font-medium mt-1">
                            📏 {barber.distance ? `${barber.distance.toFixed(1)} km` : 'Afstand onbekend'}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </Card>
            ) : (
              <Card className="p-8 text-center">
                <div className="text-8xl mb-6">🔍</div>
                <h3 className="text-2xl font-bold text-secondary mb-4">Geen kappers gevonden</h3>
                <p className="text-secondary/70 text-lg">Probeer een andere stad of vergroot je zoekradius.</p>
              </Card>
            )
          ) : (
            <Card className="p-10 text-center h-full flex flex-col items-center justify-center">
              <div className="text-8xl mb-6">💇</div>
              <h3 className="text-2xl font-bold text-secondary mb-4">Vul je voorkeuren in</h3>
              <p className="text-secondary/70 text-lg mb-6">Selecteer je geslacht, diensten en stad om kappers te vinden.</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/client/login">
                  <Button variant="primary" size="lg">
                    Heb je al een account? Inloggen
                  </Button>
                </Link>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}



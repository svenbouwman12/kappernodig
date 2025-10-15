import React, { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import Card from '../components/Card.jsx'
import Button from '../components/Button.jsx'
import { supabase } from '../lib/supabase'
import { Link, useLocation } from 'react-router-dom'

// Smooth progressive clustering with gradual breakdown
function clusterPoints(points, zoom) {
  if (points.length === 0) return []
  
  // At very low zoom, show everything as one cluster
  if (zoom < 7) {
    const centerLat = points.reduce((sum, p) => sum + p.lat, 0) / points.length
    const centerLng = points.reduce((sum, p) => sum + p.lng, 0) / points.length
    return [{ type: 'cluster', lat: centerLat, lng: centerLng, count: points.length, points: points }]
  }
  
  // At high zoom, show individual points
  if (zoom >= 14) {
    return points.map(point => ({ type: 'point', ...point }))
  }
  
  // Progressive distance thresholds for smooth clustering
  let maxDistance
  if (zoom < 8) {
    maxDistance = 1.0 // Very large clusters
  } else if (zoom < 9) {
    maxDistance = 0.8 // Large clusters
  } else if (zoom < 10) {
    maxDistance = 0.6 // Medium-large clusters
  } else if (zoom < 11) {
    maxDistance = 0.4 // Medium clusters
  } else if (zoom < 12) {
    maxDistance = 0.3 // Small-medium clusters
  } else if (zoom < 13) {
    maxDistance = 0.2 // Small clusters
  } else if (zoom < 14) {
    maxDistance = 0.15 // Very small clusters
  } else if (zoom < 15) {
    maxDistance = 0.1 // Tiny clusters
  } else if (zoom < 16) {
    maxDistance = 0.08 // Micro clusters
  } else if (zoom < 17) {
    maxDistance = 0.05 // Nano clusters
  } else {
    maxDistance = 0.03 // Individual points
  }
  
  const clusters = []
  
  for (const point of points) {
    let addedToCluster = false
    
    // Try to add to existing cluster
    for (const cluster of clusters) {
      if (cluster.type === 'cluster') {
        const distance = Math.sqrt(
          Math.pow(point.lat - cluster.lat, 2) + 
          Math.pow(point.lng - cluster.lng, 2)
        )
        
        if (distance < maxDistance) {
          // Add to existing cluster
          cluster.points.push(point)
          cluster.count++
          // Update cluster center smoothly
          cluster.lat = cluster.points.reduce((sum, p) => sum + p.lat, 0) / cluster.points.length
          cluster.lng = cluster.points.reduce((sum, p) => sum + p.lng, 0) / cluster.points.length
          addedToCluster = true
          break
        }
      }
    }
    
    // If not added to existing cluster, create new one
    if (!addedToCluster) {
      clusters.push({
        type: 'cluster',
        lat: point.lat,
        lng: point.lng,
        count: 1,
        points: [point]
      })
    }
  }
  
  // Smooth transition: if cluster has only 1-2 points and zoom is high, show as individual
  if (zoom >= 12) {
    const result = []
    for (const cluster of clusters) {
      if (cluster.count <= 2) {
        // Show individual points instead of tiny clusters
        cluster.points.forEach(point => {
          result.push({ type: 'point', ...point })
        })
      } else {
        result.push(cluster)
      }
    }
    return result
  }
  
  return clusters
}

export default function MapPage() {
  const { search } = useLocation()
  const params = new URLSearchParams(search)
  const initialCity = params.get('city') || ''
  const initialRadius = parseInt(params.get('radius')) || 5
  
  const mapRef = useRef(null)
  const [map, setMap] = useState(null)
  const [barbers, setBarbers] = useState([])
  const [zoom, setZoom] = useState(6)
  const [userLocation, setUserLocation] = useState(null)
  const [locationPermission, setLocationPermission] = useState(null)
  const [closestBarber, setClosestBarber] = useState(null)
  const [isRequestingLocation, setIsRequestingLocation] = useState(false)
  const [showLocationSetup, setShowLocationSetup] = useState(!initialCity) // Only show setup if no city from URL
  const [selectedCity, setSelectedCity] = useState(initialCity)
  const [selectedRadius, setSelectedRadius] = useState(initialRadius)
  const [filteredBarbers, setFilteredBarbers] = useState([])

  // Function to request location again
  const requestLocationAgain = () => {
    if (navigator.geolocation) {
      setIsRequestingLocation(true)
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setUserLocation({ lat: latitude, lng: longitude })
          setLocationPermission('granted')
          setIsRequestingLocation(false)
          
          // Center map on user location
          if (map) {
            map.setView([latitude, longitude], 12)
          }
        },
        (error) => {
          console.log('Geolocation error:', error)
          setLocationPermission('denied')
          setIsRequestingLocation(false)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0 // Don't use cached location
        }
      )
    }
  }

  // Function to show manual location input
  const showManualLocationInput = () => {
    const lat = prompt('Voer je latitude in (bijv. 52.3676):')
    const lng = prompt('Voer je longitude in (bijv. 4.9041):')
    
    if (lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng))) {
      const latitude = parseFloat(lat)
      const longitude = parseFloat(lng)
      
      // Validate coordinates (rough Netherlands bounds)
      if (latitude >= 50.5 && latitude <= 53.7 && longitude >= 3.0 && longitude <= 7.5) {
        setUserLocation({ lat: latitude, lng: longitude })
        setLocationPermission('granted')
        
        // Center map on user location
        if (map) {
          map.setView([latitude, longitude], 12)
        }
      } else {
        alert('Deze coördinaten liggen buiten Nederland. Probeer opnieuw.')
      }
    }
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

  // Function to handle city selection and filter barbers
  const handleCitySelection = () => {
    if (selectedCity && cities[selectedCity]) {
      const cityCoords = cities[selectedCity]
      setUserLocation(cityCoords)
      setLocationPermission('granted')
      setShowLocationSetup(false)
      
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
      
      // Center map on selected city
      if (map) {
        map.setView([cityCoords.lat, cityCoords.lng], 12)
      }
    }
  }

  useEffect(() => {
    if (mapRef.current || typeof window === 'undefined') return
    const m = L.map('map', { 
      center: [52.1326, 5.2913], 
      zoom: 7,
      zoomControl: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      boxZoom: true,
      keyboard: true,
      dragging: true,
      touchZoom: true
    })
    
    // Modern map style with CartoDB
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(m)
    
    // Hide Leaflet attribution and other elements
    setTimeout(() => {
      const attribution = document.querySelector('.leaflet-control-attribution')
      if (attribution) {
        attribution.style.display = 'none'
      }
      
      // Hide any other Leaflet controls that might show flags or unwanted elements
      const controls = document.querySelectorAll('.leaflet-control')
      controls.forEach(control => {
        if (control.classList.contains('leaflet-control-attribution') || 
            control.classList.contains('leaflet-control-zoom')) {
          // Keep zoom controls, hide attribution
          if (control.classList.contains('leaflet-control-attribution')) {
            control.style.display = 'none'
          }
        }
      })
    }, 100)
    m.on('zoomend', () => setZoom(m.getZoom()))
    mapRef.current = m
    setMap(m)
    
    // Trigger resize after a short delay to ensure proper sizing
    setTimeout(() => {
      m.invalidateSize()
    }, 100)
  }, [])

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

      // Auto-filter barbers if URL parameters are provided
      useEffect(() => {
        if (initialCity && cities[initialCity] && barbers.length > 0) {
          const cityCoords = cities[initialCity]
          const radiusKm = initialRadius
          const filtered = barbers.filter(barber => {
            const distance = Math.sqrt(
              Math.pow(barber.lat - cityCoords.lat, 2) + 
              Math.pow(barber.lng - cityCoords.lng, 2)
            ) * 111000 / 1000 // Convert to km
            
            return distance <= radiusKm
          })
          
          setFilteredBarbers(filtered)
          setUserLocation(cityCoords)
          setLocationPermission('granted')
        }
      }, [barbers, initialCity, initialRadius])

      // Request user location on component mount
      useEffect(() => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords
              setUserLocation({ lat: latitude, lng: longitude })
              setLocationPermission('granted')
              
              // Center map on user location
              if (map) {
                map.setView([latitude, longitude], 12)
              }
            },
            (error) => {
              console.log('Geolocation error:', error)
              setLocationPermission('denied')
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 300000 // 5 minutes
            }
          )
        } else {
          setLocationPermission('not-supported')
        }
      }, [map])

      // Calculate closest barber when user location is available
      useEffect(() => {
        if (userLocation && barbers.length > 0) {
          let closest = null
          let closestDistance = Infinity
          
          barbers.forEach(barber => {
            const distance = Math.sqrt(
              Math.pow(barber.lat - userLocation.lat, 2) + 
              Math.pow(barber.lng - userLocation.lng, 2)
            ) * 111000 // Convert to meters (rough approximation)
            
            if (distance < closestDistance) {
              closestDistance = distance
              // Format distance: under 1000m show in meters, above show in km
              const formattedDistance = distance < 1000 
                ? `${Math.round(distance)}m` 
                : `${(distance / 1000).toFixed(1)}km`
              closest = { ...barber, distance: formattedDistance }
            }
          })
          
          setClosestBarber(closest)
        }
      }, [userLocation, barbers])

  const clusters = useMemo(() => clusterPoints(filteredBarbers.length > 0 ? filteredBarbers : barbers, zoom), [filteredBarbers, barbers, zoom])

  useEffect(() => {
    if (!map) return
    // Clear existing layers group
    if (map._barberLayer) {
      map.removeLayer(map._barberLayer)
    }
    const layer = L.layerGroup()
        // Add user location marker if available
        if (userLocation) {
          const userIcon = L.divIcon({
            html: `
              <div style="
                background: #00C46A;
                color: #fff;
                border-radius: 50%;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 700;
                font-size: 12px;
                box-shadow: 0 2px 8px rgba(0, 196, 106, 0.4);
                border: 3px solid #fff;
              ">📍</div>
            `,
            className: 'user-location-marker',
            iconSize: [20, 20]
          })
          L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
            .bindPopup(`
              <div style="text-align: center; padding: 8px;">
                <div style="color: #00C46A; font-weight: 700; font-size: 14px;">Jouw locatie</div>
              </div>
            `)
            .addTo(layer)
        }

        clusters.forEach(item => {
          // Validate coordinates before creating markers
          if (isNaN(item.lat) || isNaN(item.lng) || !isFinite(item.lat) || !isFinite(item.lng)) {
            console.warn('Invalid coordinates for item:', item)
            return
          }
          
      if (item.type === 'cluster') {
        // Dynamic cluster size based on count and zoom
        const baseSize = zoom < 8 ? 50 : zoom < 10 ? 45 : 40
        const size = Math.min(baseSize + (item.count * 2), 80)
        const fontSize = zoom < 8 ? 16 : zoom < 10 ? 14 : 12
        
        const html = `
          <div style="
            background: linear-gradient(135deg, #FF6B00, #FF8A3D);
            color: #fff;
            border-radius: 50%;
            width: ${size}px;
            height: ${size}px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: ${fontSize}px;
            box-shadow: 0 4px 12px rgba(255, 107, 0, 0.3);
            border: 3px solid #fff;
            cursor: pointer;
            transition: all 0.2s ease;
          " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
            ${item.count}
          </div>
        `
        const icon = L.divIcon({ html, className: 'cluster-icon', iconSize: [size, size] })
        const marker = L.marker([item.lat, item.lng], { icon })
        marker.bindPopup(`
          <div style="text-align: center; padding: 12px;">
            <div style="color: #FF6B00; font-size: 18px; font-weight: 700; margin-bottom: 4px;">${item.count} kappers</div>
            <div style="color: #666; font-size: 13px;">in deze regio</div>
          </div>
        `)
        marker.addTo(layer)
      } else {
        // Show pin first, then label when zoomed in enough
        if (zoom < 17) {
          // Classic location pin icon
          const html = `
            <div style="
              width: 24px;
              height: 32px;
              position: relative;
              cursor: pointer;
              transition: all 0.2s ease;
              filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
            " onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">
              <svg width="24" height="32" viewBox="0 0 24 32" style="position: absolute; top: 0; left: 0;">
                <path d="M12 0C5.4 0 0 5.4 0 12c0 7.2 12 20 12 20s12-12.8 12-20c0-6.6-5.4-12-12-12z" fill="#FF6B00"/>
                <circle cx="12" cy="12" r="6" fill="#fff"/>
              </svg>
            </div>
          `
          const icon = L.divIcon({ html, className: 'barber-pin', iconSize: [24, 32], iconAnchor: [12, 32] })
          const marker = L.marker([item.lat, item.lng], { icon })
          marker.bindPopup(`
            <div style="min-width: 180px; padding: 10px;">
              <div style="font-weight: 700; color: #FF6B00; font-size: 15px; margin-bottom: 4px;">${item.name}</div>
              <div style="color: #666; font-size: 12px;">Zoom verder in voor details</div>
            </div>
          `)
          marker.addTo(layer)
        } else {
          // Show labels at zoom 17-19, auto-open popup at zoom 20+
          const html = `
            <div style="
              background: #fff;
              border-radius: 20px;
              padding: 8px 12px;
              border: 2px solid #FF6B00;
              box-shadow: 0 3px 10px rgba(255, 107, 0, 0.2);
              font-weight: 600;
              font-size: 12px;
              color: #FF6B00;
              white-space: nowrap;
              cursor: pointer;
              transition: all 0.2s ease;
              max-width: none;
              min-width: fit-content;
              width: max-content;
            " onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 5px 15px rgba(255, 107, 0, 0.3)'" onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 3px 10px rgba(255, 107, 0, 0.2)'">
              ${item.name}
            </div>
          `
          const icon = L.divIcon({ html, className: 'barber-label' })
          const marker = L.marker([item.lat, item.lng], { icon })
          
          const popupContent = `
            <div style="min-width: 220px; padding: 12px;">
              <div style="font-weight: 700; color: #FF6B00; font-size: 16px; margin-bottom: 6px;">${item.name}</div>
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <span style="background: #FF6B00; color: #fff; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">${item.price_range || '€€'}</span>
                <span style="color: #666; font-size: 12px;">★ ${item.rating || 'N/A'}</span>
              </div>
              <a href="/barber/${item.id}" style="
                display: inline-block;
                background: #FF6B00;
                color: #fff;
                padding: 6px 12px;
                border-radius: 6px;
                text-decoration: none;
                font-size: 12px;
                font-weight: 600;
                margin-top: 4px;
              ">Bekijk profiel</a>
            </div>
          `
          
          marker.bindPopup(popupContent)
          
          // Auto-open popup at zoom 20+ for the marker closest to center
          if (zoom >= 20) {
            const mapCenter = map.getCenter()
            const markerDistance = mapCenter.distanceTo([item.lat, item.lng])
            
            // Store distance for comparison
            marker._distanceToCenter = markerDistance
          }
          
          marker.addTo(layer)
        }
      }
    })
    layer.addTo(map)
    map._barberLayer = layer
    
    // Auto-open popup for closest marker at zoom 20+
    if (zoom >= 20) {
      const mapCenter = map.getCenter()
      let closestMarker = null
      let closestDistance = Infinity
      
      layer.eachLayer((marker) => {
        if (marker._distanceToCenter !== undefined) {
          if (marker._distanceToCenter < closestDistance) {
            closestDistance = marker._distanceToCenter
            closestMarker = marker
          }
        }
      })
      
      if (closestMarker) {
        closestMarker.openPopup()
      }
    }
  }, [clusters, map])

  // Show location setup interface
  if (showLocationSetup) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-primary mb-4">Vind je kapper</h1>
          <p className="text-secondary/80 text-xl max-w-2xl mx-auto">Selecteer je stad en zoekradius om kappers in jouw omgeving te vinden. Bekijk eerst de lijst en ga daarna naar de interactieve kaart.</p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Selection Form */}
          <Card className="p-8">
            <div className="space-y-8">
              <div>
                <label className="block text-lg font-semibold text-secondary mb-3">📍 Selecteer je stad</label>
                <select 
                  value={selectedCity}
                  onChange={(e) => {
                    setSelectedCity(e.target.value)
                    // Reset filtered barbers when city changes
                    setFilteredBarbers([])
                  }}
                  className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-4 text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-lg"
                >
                  <option value="">Kies een stad...</option>
                  {Object.keys(cities).map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-lg font-semibold text-secondary mb-3">🔍 Zoekradius: {selectedRadius} km</label>
                <input 
                  type="range"
                  min="1"
                  max="50"
                  value={selectedRadius}
                  onChange={(e) => {
                    setSelectedRadius(parseInt(e.target.value))
                    // Reset filtered barbers when radius changes
                    setFilteredBarbers([])
                  }}
                  className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-sm text-secondary/60 mt-2">
                  <span>1 km (straat)</span>
                  <span>25 km (regio)</span>
                  <span>50 km (provincie)</span>
                </div>
              </div>
              
              <Button 
                onClick={handleCitySelection}
                disabled={!selectedCity}
                className="w-full py-4 text-xl font-semibold"
              >
                🔍 Zoek kappers in {selectedCity || 'jouw stad'}
              </Button>
            </div>
          </Card>

          {/* Results Preview */}
          <div>
            {filteredBarbers.length > 0 ? (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-secondary">
                    🎯 {filteredBarbers.length} kapper{filteredBarbers.length !== 1 ? 's' : ''} gevonden in {selectedCity}
                  </h3>
                  <Button 
                    onClick={() => setShowLocationSetup(false)}
                    className="px-6 py-2"
                  >
                    🗺️ Bekijk op kaart
                  </Button>
                </div>
                
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredBarbers.map((barber, index) => (
                    <div key={barber.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="bg-primary text-white text-xs font-bold px-2 py-1 rounded-full">#{index + 1}</span>
                          <div className="font-semibold text-secondary">{barber.name}</div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-secondary/70">
                          <span className="bg-orange-100 text-primary px-2 py-1 rounded-md font-medium">{barber.price_range || '€€'}</span>
                          <span>★ {barber.rating || 'N/A'}</span>
                        </div>
                      </div>
                      <Link to={`/barber/${barber.id}`}>
                        <Button variant="secondary" className="text-sm px-4 py-2">
                          Bekijk
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 p-4 bg-primary/10 rounded-lg">
                  <p className="text-sm text-primary/80 text-center">
                    💡 <strong>Tip:</strong> Klik op "Bekijk op kaart" om alle kappers op de interactieve kaart te zien
                  </p>
                </div>
              </Card>
            ) : selectedCity ? (
              <Card className="p-8 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-secondary mb-2">Klaar om te zoeken</h3>
                <p className="text-secondary/70">Klik op "Zoek kappers" om te zien welke kappers er in {selectedCity} binnen {selectedRadius} km zijn.</p>
              </Card>
            ) : (
              <Card className="p-8 text-center">
                <div className="text-6xl mb-4">📍</div>
                <h3 className="text-xl font-semibold text-secondary mb-2">Selecteer je stad</h3>
                <p className="text-secondary/70">Kies eerst een stad uit de lijst om kappers in jouw omgeving te vinden.</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="font-semibold text-xl">🗺️ Interactieve Kaart</div>
            <Button 
              onClick={() => setShowLocationSetup(true)}
              variant="secondary"
              className="text-sm px-4 py-2"
            >
              📍 Wijzig locatie
            </Button>
          </div>
          <div className="flex items-center gap-3">
            {locationPermission === 'granted' && userLocation && (
              <div className="text-sm text-success bg-green-50 px-3 py-1 rounded-full">
                📍 {selectedCity || 'Locatie gedeeld'}
              </div>
            )}
            {locationPermission === 'denied' && (
              <div className="flex items-center gap-2">
                <div className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded-full">
                  ❌ Locatie geweigerd
                </div>
                <button 
                  onClick={requestLocationAgain}
                  disabled={isRequestingLocation}
                  className="text-sm text-primary hover:text-primary/80 underline disabled:opacity-50"
                >
                  {isRequestingLocation ? 'Bezig...' : 'Opnieuw proberen'}
                </button>
                <button 
                  onClick={showManualLocationInput}
                  className="text-sm text-secondary hover:text-secondary/80 underline"
                >
                  Handmatig invoeren
                </button>
              </div>
            )}
            <div className="text-sm text-secondary/70 bg-gray-100 px-3 py-1 rounded-full">
              Zoom: {zoom.toFixed(1)} | 
              {             zoom < 7 ? ' Heel Nederland' : 
               zoom < 8 ? ' Grote regios' : 
               zoom < 9 ? ' Meerdere clusters' : 
               zoom < 10 ? ' Regio overzicht' : 
               zoom < 11 ? ' Stad niveau' : 
               zoom < 12 ? ' Wijk niveau' : 
               zoom < 13 ? ' Buurt niveau' : 
               zoom < 14 ? ' Kleine clusters' : 
               zoom < 15 ? ' Zeer kleine clusters' : 
               zoom < 16 ? ' Mini clusters' : 
               zoom < 17 ? ' Micro clusters' : 
               zoom < 18 ? ' Nano clusters' : 
               zoom < 19 ? ' Pin markers' : 
               zoom < 20 ? ' Labels' : ' Auto-popup'}
            </div>
          </div>
        </div>
        
        {closestBarber && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-green-800">Dichtstbijzijnde kapper</div>
                <div className="text-green-700">{closestBarber.name}</div>
                <div className="text-sm text-green-600">{closestBarber.distance} van jouw locatie</div>
              </div>
              <Link to={`/barber/${closestBarber.id}`}>
                <Button variant="primary" className="text-sm">
                  Bekijk profiel
                </Button>
              </Link>
            </div>
          </div>
        )}
        
        <div id="map" style={{ height: '70vh', minHeight: '500px', width: '100%', borderRadius: 12, overflow: 'hidden' }} />
      </Card>
    </div>
  )
}




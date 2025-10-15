import React, { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import Card from '../components/Card.jsx'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'

// Smart clustering based on zoom level and city proximity
function clusterPoints(points, zoom) {
  // Progressive clustering - start with one big cluster, then break down
  let clusterSize
  if (zoom < 6) {
    clusterSize = 500 // One big cluster for all Netherlands
  } else if (zoom < 7) {
    clusterSize = 300 // Few large clusters
  } else if (zoom < 8) {
    clusterSize = 200 // More clusters
  } else if (zoom < 9) {
    clusterSize = 150 // Regional clusters
  } else if (zoom < 10) {
    clusterSize = 100 // City clusters
  } else if (zoom < 11) {
    clusterSize = 80 // District clusters
  } else if (zoom < 12) {
    clusterSize = 60 // Neighborhood clusters
  } else if (zoom < 13) {
    clusterSize = 40 // Small area clusters
  } else if (zoom < 15) {
    clusterSize = 25 // Very small clusters
  } else {
    clusterSize = 15 // Individual points or tiny clusters
  }
  
  const buckets = new Map()
  
  for (const p of points) {
    const key = `${Math.round(p.lat * clusterSize)}:${Math.round(p.lng * clusterSize)}`
    const list = buckets.get(key) || []
    list.push(p)
    buckets.set(key, list)
  }
  
  const clusters = []
  buckets.forEach((list) => {
    if (list.length === 1 && zoom >= 15) {
      // Show individual markers only when very zoomed in
      clusters.push({ type: 'point', ...list[0] })
    } else {
      // Always cluster when zoomed out or multiple points
      const lat = list.reduce((a,b)=>a+b.lat,0)/list.length
      const lng = list.reduce((a,b)=>a+b.lng,0)/list.length
      clusters.push({ type: 'cluster', lat, lng, count: list.length, points: list })
    }
  })
  
  // Force single cluster at very low zoom levels
  if (zoom < 6) {
    // One big cluster for all Netherlands
    const totalCount = points.length
    const centerLat = points.reduce((sum, p) => sum + p.lat, 0) / totalCount
    const centerLng = points.reduce((sum, p) => sum + p.lng, 0) / totalCount
    return [{ type: 'cluster', lat: centerLat, lng: centerLng, count: totalCount, points: points }]
  }
  
  // Merge clusters at low zoom levels
  if (zoom < 8 && clusters.length > 1) {
    const mergedClusters = []
    const mergeThreshold = zoom < 7 ? 300 : 200 // Larger threshold for more merging
    
    for (const cluster of clusters) {
      if (cluster.type === 'cluster') {
        // Find nearby clusters to merge
        let merged = false
        for (const mergedCluster of mergedClusters) {
          if (mergedCluster.type === 'cluster') {
            const distance = Math.sqrt(
              Math.pow(cluster.lat - mergedCluster.lat, 2) + 
              Math.pow(cluster.lng - mergedCluster.lng, 2)
            ) * 111000 // Rough conversion to meters
            
            if (distance < mergeThreshold) {
              // Merge clusters
              const totalCount = cluster.count + mergedCluster.count
              const newLat = (cluster.lat * cluster.count + mergedCluster.lat * mergedCluster.count) / totalCount
              const newLng = (cluster.lng * cluster.count + mergedCluster.lng * mergedCluster.count) / totalCount
              
              mergedCluster.lat = newLat
              mergedCluster.lng = newLng
              mergedCluster.count = totalCount
              mergedCluster.points = [...mergedCluster.points, ...cluster.points]
              merged = true
              break
            }
          }
        }
        
        if (!merged) {
          mergedClusters.push(cluster)
        }
      } else {
        mergedClusters.push(cluster)
      }
    }
    
    return mergedClusters
  }
  
  return clusters
}

export default function MapPage() {
  const mapRef = useRef(null)
  const [map, setMap] = useState(null)
  const [barbers, setBarbers] = useState([])
  const [zoom, setZoom] = useState(6)

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
      const withCoords = (data || []).filter(b => b.latitude && b.longitude).map(b => ({
        id: b.id,
        name: b.name,
        lat: Number(b.latitude),
        lng: Number(b.longitude),
        price_range: b.price_range,
        rating: b.rating,
      }))
      setBarbers(withCoords)
    }
    load()
  }, [])

  const clusters = useMemo(() => clusterPoints(barbers, zoom), [barbers, zoom])

  useEffect(() => {
    if (!map) return
    // Clear existing layers group
    if (map._barberLayer) {
      map.removeLayer(map._barberLayer)
    }
    const layer = L.layerGroup()
    clusters.forEach(item => {
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

  return (
    <div className="max-w-6xl mx-auto px-4">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="font-semibold">Kaart</div>
          <div className="text-sm text-secondary/70 bg-gray-100 px-3 py-1 rounded-full">
            Zoom: {zoom.toFixed(1)} | 
            {zoom < 6 ? ' Heel Nederland' : 
             zoom < 7 ? ' Grote regios' : 
             zoom < 8 ? ' Meerdere clusters' : 
             zoom < 9 ? ' Regio overzicht' : 
             zoom < 10 ? ' Stad niveau' : 
             zoom < 11 ? ' Wijk niveau' : 
             zoom < 12 ? ' Buurt niveau' : 
             zoom < 13 ? ' Kleine clusters' : 
             zoom < 15 ? ' Zeer kleine clusters' : 
             zoom < 17 ? ' Pin markers' : 
             zoom < 20 ? ' Labels' : ' Auto-popup'}
          </div>
        </div>
        <div id="map" style={{ height: '70vh', minHeight: '500px', width: '100%', borderRadius: 12, overflow: 'hidden' }} />
      </Card>
    </div>
  )
}




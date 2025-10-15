import React, { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import Card from '../components/Card.jsx'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'

// Simple client-side clustering using Leaflet markercluster-like logic with grid clustering per zoom level
function clusterPoints(points, zoom) {
  const clusterSize = 80 / (zoom / 4 + 1) // rough grid size scaling
  const buckets = new Map()
  for (const p of points) {
    const key = `${Math.round(p.lat * clusterSize)}:${Math.round(p.lng * clusterSize)}`
    const list = buckets.get(key) || []
    list.push(p)
    buckets.set(key, list)
  }
  const clusters = []
  buckets.forEach((list) => {
    if (list.length === 1) {
      clusters.push({ type: 'point', ...list[0] })
    } else {
      const lat = list.reduce((a,b)=>a+b.lat,0)/list.length
      const lng = list.reduce((a,b)=>a+b.lng,0)/list.length
      clusters.push({ type: 'cluster', lat, lng, count: list.length, points: list })
    }
  })
  return clusters
}

export default function MapPage() {
  const mapRef = useRef(null)
  const [map, setMap] = useState(null)
  const [barbers, setBarbers] = useState([])
  const [zoom, setZoom] = useState(6)

  useEffect(() => {
    if (mapRef.current || typeof window === 'undefined') return
    const m = L.map('map', { center: [52.1326, 5.2913], zoom: 7 })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(m)
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
        // Modern cluster design
        const html = `
          <div style="
            background: linear-gradient(135deg, #FF6B00, #FF8A3D);
            color: #fff;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(255, 107, 0, 0.3);
            border: 3px solid #fff;
            cursor: pointer;
            transition: all 0.2s ease;
          " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
            ${item.count}
          </div>
        `
        const icon = L.divIcon({ html, className: 'cluster-icon', iconSize: [40,40] })
        const marker = L.marker([item.lat, item.lng], { icon })
        marker.bindPopup(`
          <div style="text-align: center; padding: 8px;">
            <strong style="color: #FF6B00; font-size: 16px;">${item.count} kappers</strong><br/>
            <span style="color: #666; font-size: 12px;">in deze buurt</span>
          </div>
        `)
        marker.addTo(layer)
      } else {
        // Clean individual barber markers
        const html = `
          <div style="
            background: #fff;
            border-radius: 20px;
            padding: 8px 12px;
            border: 2px solid #00C46A;
            box-shadow: 0 3px 10px rgba(0, 196, 106, 0.2);
            font-weight: 600;
            font-size: 12px;
            color: #00C46A;
            white-space: nowrap;
            cursor: pointer;
            transition: all 0.2s ease;
            max-width: 120px;
            overflow: hidden;
            text-overflow: ellipsis;
          " onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 5px 15px rgba(0, 196, 106, 0.3)'" onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 3px 10px rgba(0, 196, 106, 0.2)'">
            ${item.name}
          </div>
        `
        const icon = L.divIcon({ html, className: 'barber-icon' })
        const marker = L.marker([item.lat, item.lng], { icon })
        marker.bindPopup(`
          <div style="min-width: 220px; padding: 12px;">
            <div style="font-weight: 700; color: #FF6B00; font-size: 16px; margin-bottom: 6px;">${item.name}</div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <span style="background: #FF6B00; color: #fff; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">${item.price_range || '€€'}</span>
              <span style="color: #666; font-size: 12px;">★ ${item.rating || 'N/A'}</span>
            </div>
            <a href="/barber/${item.id}" style="
              display: inline-block;
              background: #00C46A;
              color: #fff;
              padding: 6px 12px;
              border-radius: 6px;
              text-decoration: none;
              font-size: 12px;
              font-weight: 600;
              margin-top: 4px;
            ">Bekijk profiel</a>
          </div>
        `)
        marker.addTo(layer)
      }
    })
    layer.addTo(map)
    map._barberLayer = layer
  }, [clusters, map])

  return (
    <div className="max-w-6xl mx-auto px-4">
      <Card>
        <div className="font-semibold mb-4">Kaart</div>
        <div id="map" style={{ height: '70vh', minHeight: '500px', width: '100%', borderRadius: 12, overflow: 'hidden' }} />
        <div className="text-sm text-secondary/70 mt-4">OpenStreetMap tiles; clustering client-side.</div>
      </Card>
    </div>
  )
}




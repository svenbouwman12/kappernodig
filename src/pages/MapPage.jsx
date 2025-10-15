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
        const html = `<div style="background:#FF6B00;color:#fff;border-radius:9999px;padding:6px 10px;font-weight:600;box-shadow:0 2px 10px rgba(0,0,0,.15);">${item.count}</div>`
        const icon = L.divIcon({ html, className: 'cluster-icon', iconSize: [30,30] })
        L.marker([item.lat, item.lng], { icon }).addTo(layer)
      } else {
        const html = `<div style="background:#fff;border-radius:12px;padding:6px 10px;border:1px solid #eee;box-shadow:0 2px 8px rgba(0,0,0,.08);">${item.name}</div>`
        const icon = L.divIcon({ html, className: 'barber-icon' })
        const marker = L.marker([item.lat, item.lng], { icon })
        marker.bindPopup(`<div style='min-width:180px'>
          <strong>${item.name}</strong><br/>
          ${item.price_range || ''} ${item.rating ? `• ★ ${item.rating}` : ''}<br/>
          <a href="/barber/${item.id}">Bekijk profiel</a>
        </div>`)
        marker.addTo(layer)
      }
    })
    layer.addTo(map)
    map._barberLayer = layer
  }, [clusters, map])

  return (
    <div className="space-y-4">
      <Card>
        <div className="font-semibold mb-2">Kaart</div>
        <div id="map" style={{ height: 520, width: '100%', borderRadius: 12, overflow: 'hidden' }} />
      </Card>
      <div className="text-sm text-secondary/70">OpenStreetMap tiles; clustering client-side.</div>
    </div>
  )
}



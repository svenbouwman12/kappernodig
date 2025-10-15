/*
  Simple geocode script using OpenCage (free tier). One-off run:
  node scripts/geocode.js

  Required env:
  - VITE_SUPABASE_URL
  - SUPABASE_SERVICE_ROLE_KEY (server key for updates)
  - OPENCAGE_API_KEY
*/
import fetch from 'node-fetch'
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const openCageKey = process.env.OPENCAGE_API_KEY

if (!supabaseUrl || !serviceKey || !openCageKey) {
  console.error('Missing env. Set VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENCAGE_API_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey)

async function geocode(address) {
  const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(address)}&key=${openCageKey}&language=nl&countrycode=nl&limit=1`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Geocode failed: ${res.status}`)
  const json = await res.json()
  const best = json.results?.[0]
  if (!best) return null
  return { lat: best.geometry.lat, lng: best.geometry.lng }
}

async function main() {
  const { data: rows, error } = await supabase
    .from('barbers')
    .select('id, address, latitude, longitude')
    .is('latitude', null)
    .limit(2000)
  if (error) throw error

  let success = 0, skipped = 0
  for (const row of rows) {
    if (!row.address) { skipped++; continue }
    try {
      const res = await geocode(row.address)
      if (!res) { skipped++; continue }
      const { error: upErr } = await supabase
        .from('barbers')
        .update({ latitude: res.lat, longitude: res.lng })
        .eq('id', row.id)
      if (upErr) throw upErr
      success++
      await new Promise(r => setTimeout(r, 1100)) // be nice to free tier rate limits
    } catch (e) {
      console.error('Failed for', row.id, e.message)
    }
  }
  console.log(`Done. Updated: ${success}, skipped: ${skipped}`)
}

main().catch((e) => { console.error(e); process.exit(1) })



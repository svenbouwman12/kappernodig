export default async function handler(_req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache')
  try {
    const token = process.env.GEOCODE_JOB_TOKEN
    const supabaseUrl = process.env.VITE_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const openCageKey = process.env.OPENCAGE_API_KEY
    if (!token || !supabaseUrl || !serviceKey || !openCageKey) {
      return res.status(500).json({ error: 'env-missing' })
    }

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(supabaseUrl, serviceKey)

    async function geocode(address) {
      const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(address)}&key=${openCageKey}&language=nl&countrycode=nl&limit=1`
      const r = await fetch(url)
      if (!r.ok) throw new Error(`geocode failed ${r.status}`)
      const j = await r.json()
      const best = j.results?.[0]
      if (!best) return null
      return { lat: best.geometry.lat, lng: best.geometry.lng }
    }

    const { data: rows, error } = await supabase
      .from('barbers')
      .select('id, address, latitude, longitude')
      .is('latitude', null)
      .limit(50)
    if (error) throw error

    let updated = 0, skipped = 0
    for (const row of rows) {
      if (!row.address) { skipped++; continue }
      const coords = await geocode(row.address)
      if (!coords) { skipped++; continue }
      const { error: upErr } = await supabase
        .from('barbers')
        .update({ latitude: coords.lat, longitude: coords.lng })
        .eq('id', row.id)
      if (upErr) throw upErr
      updated++
      await new Promise(r => setTimeout(r, 1100))
    }

    return res.status(200).json({ updated, skipped })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}



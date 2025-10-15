export default async function handler(_req, res) {
  try {
    const token = process.env.GEOCODE_JOB_TOKEN
    const base = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : (typeof _req !== 'undefined' && _req.headers?.host ? `https://${_req.headers.host}` : '')
    if (!token || !base) {
      return res.status(500).json({ error: 'env-missing' })
    }
    const r = await fetch(`${base}/api/geocode`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const json = await r.json()
    return res.status(r.status).json(json)
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}



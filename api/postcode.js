// API route for postcode lookup to avoid CORS issues
// This runs on the server side, so no CORS problems

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { postcode, huisnummer } = req.query

  if (!postcode || !huisnummer) {
    return res.status(400).json({ error: 'Postcode en huisnummer zijn verplicht' })
  }

  try {
    // Clean postcode
    const cleanPostcode = postcode.replace(/\s/g, '').toUpperCase()
    
    // Validate Dutch postcode format
    const postcodeRegex = /^[1-9][0-9]{3}[A-Z]{2}$/
    if (!postcodeRegex.test(cleanPostcode)) {
      return res.status(400).json({ error: 'Ongeldig postcode formaat' })
    }

    // Try multiple APIs in order of preference
    const apis = [
      // Try a free Dutch postcode API first
      `https://api.postcode.tech/v1/postcode/${cleanPostcode}/${huisnummer}`,
      // Fallback to another API
      `https://api.postcode.eu/nl/v1/postcode/${cleanPostcode}/${huisnummer}`,
      // Final fallback to Nominatim
      `https://nominatim.openstreetmap.org/search?format=json&q=${huisnummer}, ${cleanPostcode.slice(0, 4)} ${cleanPostcode.slice(4)}, Netherlands&addressdetails=1&countrycodes=nl&limit=1`
    ]

    let response = null
    let data = null

    for (const apiUrl of apis) {
      try {
        console.log('Trying API:', apiUrl)
        
        if (apiUrl.includes('nominatim')) {
          // Nominatim needs different headers
          response = await fetch(apiUrl, {
            headers: {
              'User-Agent': 'KapperNodig/1.0',
              'Accept': 'application/json'
            }
          })
        } else {
          // Regular APIs
          response = await fetch(apiUrl, {
            headers: {
              'Accept': 'application/json'
            }
          })
        }

        if (response.ok) {
          data = await response.json()
          console.log('API response:', data)
          break
        }
      } catch (error) {
        console.log('API failed:', apiUrl, error.message)
        continue
      }
    }

    if (!response || !response.ok || !data) {
      return res.status(404).json({ error: 'Geen adres gevonden voor deze postcode en huisnummer' })
    }

    // Process response based on which API worked
    let result = null

    if (Array.isArray(data) && data.length > 0) {
      // Nominatim response
      const item = data[0]
      const addr = item.address || {}
      
      result = {
        street: addr.road || addr.street || '',
        houseNumber: huisnummer,
        houseNumberAddition: '',
        postcode: `${cleanPostcode.slice(0, 4)} ${cleanPostcode.slice(4)}`,
        city: addr.city || addr.town || addr.village || addr.municipality || '',
        province: addr.state || '',
        fullAddress: `${addr.road || addr.street || ''} ${huisnummer}, ${cleanPostcode.slice(0, 4)} ${cleanPostcode.slice(4)} ${addr.city || addr.town || addr.village || addr.municipality || ''}`.trim(),
        coordinates: {
          lat: parseFloat(item.lat) || null,
          lng: parseFloat(item.lon) || null
        }
      }
    } else if (data.street || data.straat) {
      // Regular API response
      result = {
        street: data.street || data.straat || '',
        houseNumber: huisnummer,
        houseNumberAddition: data.houseNumberAddition || data.huisnummer_toevoeging || '',
        postcode: `${cleanPostcode.slice(0, 4)} ${cleanPostcode.slice(4)}`,
        city: data.city || data.plaats || '',
        province: data.province || data.provincie || '',
        fullAddress: `${data.street || data.straat || ''} ${huisnummer}${data.houseNumberAddition || data.huisnummer_toevoeging || ''}, ${cleanPostcode.slice(0, 4)} ${cleanPostcode.slice(4)} ${data.city || data.plaats || ''}`.trim(),
        coordinates: {
          lat: data.latitude || data.lat || null,
          lng: data.longitude || data.lng || null
        }
      }
    }

    if (!result || !result.street) {
      return res.status(404).json({ error: 'Geen geldig adres gevonden' })
    }

    return res.status(200).json(result)

  } catch (error) {
    console.error('Postcode lookup error:', error)
    return res.status(500).json({ error: 'Er is een fout opgetreden bij het opzoeken van het adres' })
  }
}

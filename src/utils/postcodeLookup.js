// Postcode lookup utility for Dutch addresses
// Uses OpenPostcode.nl - FREE Dutch postcode API (no API key required)

export async function lookupAddress(postcode, houseNumber) {
  try {
    // Clean postcode (remove spaces, convert to uppercase)
    const cleanPostcode = postcode.replace(/\s/g, '').toUpperCase()
    
    // Validate Dutch postcode format (1234AB)
    const postcodeRegex = /^[1-9][0-9]{3}[A-Z]{2}$/
    if (!postcodeRegex.test(cleanPostcode)) {
      throw new Error('Ongeldig postcode formaat. Gebruik formaat: 1234AB')
    }

    // Validate house number
    if (!houseNumber || houseNumber.trim() === '') {
      throw new Error('Huisnummer is verplicht')
    }

    // Use a reliable Dutch postcode API
    const formattedPostcode = `${cleanPostcode.slice(0, 4)} ${cleanPostcode.slice(4)}`
    
    // Try multiple Dutch postcode APIs
    const apis = [
      {
        name: 'PostcodeAPI.nu',
        url: `https://api.postcodeapi.nu/v2/postcode/${cleanPostcode}/${houseNumber}`,
        parser: (data) => ({
          street: data.street || '',
          city: data.city || '',
          province: data.province || '',
          lat: data.latitude || null,
          lng: data.longitude || null
        })
      },
      {
        name: 'Postcode.eu',
        url: `https://api.postcode.eu/nl/v1/postcode/${cleanPostcode}/${houseNumber}`,
        parser: (data) => ({
          street: data.street || '',
          city: data.city || '',
          province: data.province || '',
          lat: data.latitude || null,
          lng: data.longitude || null
        })
      },
      {
        name: 'Nominatim (fallback)',
        url: `https://nominatim.openstreetmap.org/search?format=json&q=${houseNumber} ${formattedPostcode} Nederland&addressdetails=1&countrycodes=nl&limit=1`,
        parser: (data) => {
          if (data.length === 0) return null
          const item = data[0]
          const addr = item.address || {}
          return {
            street: addr.road || addr.street || '',
            city: addr.city || addr.town || addr.village || '',
            province: addr.state || '',
            lat: parseFloat(item.lat) || null,
            lng: parseFloat(item.lon) || null
          }
        }
      }
    ]
    
    let result = null
    let lastError = null
    
    for (const api of apis) {
      try {
        console.log(`Trying ${api.name}...`)
        
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout
        
        const response = await fetch(api.url, {
          mode: 'cors',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'KapperNodig/1.0'
          },
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        
        if (response.ok) {
          const data = await response.json()
          result = api.parser(data)
          
          if (result && result.street) {
            console.log(`Success with ${api.name}:`, result.street)
            break
          }
        } else {
          console.warn(`${api.name} failed with status:`, response.status)
        }
      } catch (err) {
        if (err.name === 'AbortError') {
          console.warn(`${api.name} timeout`)
        } else {
          console.warn(`${api.name} error:`, err.message)
        }
        lastError = err
        continue
      }
    }
    
    if (!result || !result.street) {
      throw new Error(`Geen adres gevonden voor postcode ${cleanPostcode} nummer ${houseNumber}. ${lastError ? 'Laatste error: ' + lastError.message : ''}`)
    }

    return {
      street: result.street,
      houseNumber: houseNumber,
      houseNumberAddition: '',
      postcode: formattedPostcode,
      city: result.city,
      province: result.province,
      fullAddress: `${result.street} ${houseNumber}, ${formattedPostcode} ${result.city}`.trim(),
      coordinates: {
        lat: result.lat,
        lng: result.lng
      }
    }
  } catch (error) {
    console.error('Postcode lookup error:', error)
    throw error
  }
}

// Main function
export async function findAddress(postcode, houseNumber) {
  return await lookupAddress(postcode, houseNumber)
}

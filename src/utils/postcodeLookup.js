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

    // Use Nominatim with optimized query for Dutch addresses
    const formattedPostcode = `${cleanPostcode.slice(0, 4)} ${cleanPostcode.slice(4)}`
    
    // Try multiple query formats for better results
    const queries = [
      `${houseNumber} ${formattedPostcode} Nederland`,
      `${formattedPostcode} ${houseNumber} Nederland`,
      `${houseNumber} ${cleanPostcode} Nederland`
    ]
    
    let result = null
    let bestMatch = null
    
    for (const query of queries) {
      try {
        // Add timeout to prevent hanging requests
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
        
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?` +
          `format=json&` +
          `q=${encodeURIComponent(query)}&` +
          `addressdetails=1&` +
          `countrycodes=nl&` +
          `limit=3`,
          {
            headers: {
              'User-Agent': 'KapperNodig/1.0',
              'Accept': 'application/json'
            },
            signal: controller.signal
          }
        )
        
        clearTimeout(timeoutId)

        if (response.ok) {
          const data = await response.json()
          if (data && data.length > 0) {
            // Find the best match with street name
            const match = data.find(item => 
              item.address && 
              (item.address.road || item.address.street) &&
              item.address.postcode === formattedPostcode
            )
            if (match) {
              result = match
              break
            }
            // Keep first result as fallback
            if (!bestMatch) {
              bestMatch = data[0]
            }
          }
        }
      } catch (err) {
        if (err.name === 'AbortError') {
          console.warn('Query timeout:', query)
        } else {
          console.warn('Query failed:', query, err)
        }
        continue
      }
    }
    
    if (!result && bestMatch) {
      result = bestMatch
    }

    if (!result) {
      throw new Error('Geen adres gevonden voor postcode ' + cleanPostcode + ' nummer ' + houseNumber)
    }

    const addr = result.address || {}
    
    // Extract address components from Nominatim with better fallbacks
    const street = addr.road || addr.street || addr.pedestrian || addr.footway || ''
    const city = addr.city || addr.town || addr.village || addr.municipality || addr.suburb || ''
    const province = addr.state || addr.county || ''
    
    if (!street) {
      throw new Error('Geen straatnaam gevonden voor postcode ' + cleanPostcode + ' nummer ' + houseNumber)
    }

    return {
      street: street,
      houseNumber: houseNumber,
      houseNumberAddition: '',
      postcode: formattedPostcode,
      city: city,
      province: province,
      fullAddress: `${street} ${houseNumber}, ${formattedPostcode} ${city}`.trim(),
      coordinates: {
        lat: parseFloat(result.lat) || null,
        lng: parseFloat(result.lon) || null
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

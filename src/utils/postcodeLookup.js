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

    // Use Nominatim with optimized queries for Dutch addresses
    const formattedPostcode = `${cleanPostcode.slice(0, 4)} ${cleanPostcode.slice(4)}`
    
    // Try multiple query formats to find the correct address
    const queries = [
      // Try with postcode first (more specific)
      `${formattedPostcode} ${houseNumber} Nederland`,
      // Try with house number first
      `${houseNumber} ${formattedPostcode} Nederland`,
      // Try without spaces in postcode
      `${houseNumber} ${cleanPostcode} Nederland`,
      // Try with "NL" instead of "Nederland"
      `${formattedPostcode} ${houseNumber} NL`,
      // Try with just the postcode and house number
      `${formattedPostcode} ${houseNumber}`
    ]
    
    let result = null
    let bestMatch = null
    
    for (const query of queries) {
      try {
        console.log(`Trying query: "${query}"`)
        
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
        
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?` +
          `format=json&` +
          `q=${encodeURIComponent(query)}&` +
          `addressdetails=1&` +
          `countrycodes=nl&` +
          `limit=5`,
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
            // Find the best match with correct postcode
            const match = data.find(item => {
              const addr = item.address || {}
              const itemPostcode = addr.postcode || ''
              return itemPostcode === formattedPostcode || itemPostcode === cleanPostcode
            })
            
            if (match) {
              result = match
              console.log(`Found exact match:`, match.display_name)
              break
            }
            
            // Keep first result as fallback
            if (!bestMatch) {
              bestMatch = data[0]
              console.log(`Fallback match:`, bestMatch.display_name)
            }
          }
        }
      } catch (err) {
        if (err.name === 'AbortError') {
          console.warn(`Query timeout: "${query}"`)
        } else {
          console.warn(`Query failed: "${query}"`, err.message)
        }
        continue
      }
    }
    
    if (!result && bestMatch) {
      result = bestMatch
      console.log(`Using fallback result:`, result.display_name)
    }
    
    if (!result) {
      throw new Error(`Geen adres gevonden voor postcode ${cleanPostcode} nummer ${houseNumber}`)
    }

    const addr = result.address || {}
    
    // Extract address components from Nominatim
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

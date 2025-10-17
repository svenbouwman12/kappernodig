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

    // Use Nominatim directly (supports CORS)
    const formattedPostcode = `${cleanPostcode.slice(0, 4)} ${cleanPostcode.slice(4)}`
    const query = `${houseNumber}, ${formattedPostcode}, Netherlands`
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?` +
      `format=json&` +
      `q=${encodeURIComponent(query)}&` +
      `addressdetails=1&` +
      `countrycodes=nl&` +
      `limit=1`,
      {
        headers: {
          'User-Agent': 'KapperNodig/1.0',
          'Accept': 'application/json'
        }
      }
    )

    if (!response.ok) {
      throw new Error('Adres lookup service niet beschikbaar. Probeer het later opnieuw.')
    }

    const data = await response.json()
    
    if (!data || data.length === 0) {
      throw new Error('Geen adres gevonden voor postcode ' + cleanPostcode + ' nummer ' + houseNumber)
    }

    const result = data[0]
    const addr = result.address || {}
    
    // Extract address components from Nominatim
    const street = addr.road || addr.street || ''
    const city = addr.city || addr.town || addr.village || addr.municipality || ''
    const province = addr.state || ''
    
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

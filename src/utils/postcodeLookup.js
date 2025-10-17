// Postcode lookup utility for Dutch addresses
// Uses the PDOK (Publieke Dienstverlening Op de Kaart) API

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

    // Use PDOK BAG (Basisregistratie Adressen en Gebouwen) API
    const response = await fetch(
      `https://api.pdok.nl/bag/v2/adressen?postcode=${cleanPostcode}&huisnummer=${houseNumber}&exacteMatch=true`,
      {
        headers: {
          'Accept': 'application/json'
        }
      }
    )

    if (!response.ok) {
      throw new Error('Adres niet gevonden. Controleer postcode en huisnummer.')
    }

    const data = await response.json()
    
    if (!data._embedded || !data._embedded.adressen || data._embedded.adressen.length === 0) {
      throw new Error('Geen adres gevonden voor deze postcode en huisnummer.')
    }

    const address = data._embedded.adressen[0]
    
    // Extract address components
    const result = {
      street: address.openbareRuimteNaam || '',
      houseNumber: address.huisnummer || houseNumber,
      houseNumberAddition: address.huisletter || address.huisnummertoevoeging || '',
      postcode: address.postcode || cleanPostcode,
      city: address.woonplaatsNaam || '',
      province: address.provincieNaam || '',
      fullAddress: `${address.openbareRuimteNaam || ''} ${address.huisnummer || houseNumber}${address.huisletter || address.huisnummertoevoeging || ''}, ${address.postcode || cleanPostcode} ${address.woonplaatsNaam || ''}`.trim(),
      coordinates: {
        lat: address.geoJSON?.coordinates?.[1] || null,
        lng: address.geoJSON?.coordinates?.[0] || null
      }
    }

    return result
  } catch (error) {
    console.error('Postcode lookup error:', error)
    throw error
  }
}

// Alternative fallback using Nominatim (OpenStreetMap)
export async function lookupAddressFallback(postcode, houseNumber) {
  try {
    const cleanPostcode = postcode.replace(/\s/g, '').toUpperCase()
    const query = `${houseNumber}, ${cleanPostcode}, Netherlands`
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=nl&limit=1`,
      {
        headers: {
          'User-Agent': 'KapperNodig/1.0'
        }
      }
    )

    if (!response.ok) {
      throw new Error('Adres lookup service niet beschikbaar')
    }

    const data = await response.json()
    
    if (!data || data.length === 0) {
      throw new Error('Geen adres gevonden voor deze postcode en huisnummer.')
    }

    const result = data[0]
    
    return {
      street: result.display_name.split(',')[0] || '',
      houseNumber: houseNumber,
      houseNumberAddition: '',
      postcode: cleanPostcode,
      city: result.address?.city || result.address?.town || result.address?.village || '',
      province: result.address?.state || '',
      fullAddress: result.display_name || '',
      coordinates: {
        lat: parseFloat(result.lat) || null,
        lng: parseFloat(result.lon) || null
      }
    }
  } catch (error) {
    console.error('Fallback postcode lookup error:', error)
    throw error
  }
}

// Main function that tries PDOK first, then fallback
export async function findAddress(postcode, houseNumber) {
  try {
    // Try PDOK first (more accurate for Dutch addresses)
    return await lookupAddress(postcode, houseNumber)
  } catch (error) {
    console.log('PDOK lookup failed, trying fallback:', error.message)
    try {
      // Try Nominatim as fallback
      return await lookupAddressFallback(postcode, houseNumber)
    } catch (fallbackError) {
      console.error('Both lookup methods failed:', fallbackError.message)
      throw new Error('Adres niet gevonden. Controleer postcode en huisnummer.')
    }
  }
}

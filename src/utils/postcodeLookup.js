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

    // Use a reliable CORS-enabled API
    const response = await fetch(
      `https://api.postcode.eu/nl/v1/postcode/${cleanPostcode}/${houseNumber}`,
      {
        mode: 'cors',
        headers: {
          'Accept': 'application/json'
        }
      }
    )

    if (!response.ok) {
      throw new Error('Adres lookup service niet beschikbaar. Probeer het later opnieuw.')
    }

    const data = await response.json()
    
    if (!data || !data.street) {
      throw new Error('Geen adres gevonden voor postcode ' + cleanPostcode + ' nummer ' + houseNumber)
    }

    // Format postcode with space (1234 AB)
    const formattedPostcode = `${cleanPostcode.slice(0, 4)} ${cleanPostcode.slice(4)}`
    
    return {
      street: data.street || '',
      houseNumber: houseNumber,
      houseNumberAddition: data.houseNumberAddition || '',
      postcode: formattedPostcode,
      city: data.city || '',
      province: data.province || '',
      fullAddress: `${data.street || ''} ${houseNumber}${data.houseNumberAddition || ''}, ${formattedPostcode} ${data.city || ''}`.trim(),
      coordinates: {
        lat: data.latitude || null,
        lng: data.longitude || null
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

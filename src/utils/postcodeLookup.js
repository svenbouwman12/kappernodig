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

    // Use OpenPostcode.nl API (FREE, no API key required)
    const response = await fetch(
      `https://openpostcode.nl/api/address?postcode=${cleanPostcode}&huisnummer=${houseNumber}`,
      {
        headers: {
          'Accept': 'application/json'
        }
      }
    )

    if (!response.ok) {
      throw new Error('Adres lookup service niet beschikbaar. Probeer het later opnieuw.')
    }

    const data = await response.json()
    
    if (!data || !data.straat) {
      throw new Error('Geen adres gevonden voor postcode ' + cleanPostcode + ' nummer ' + houseNumber)
    }

    // Format postcode with space (1234 AB)
    const formattedPostcode = `${cleanPostcode.slice(0, 4)} ${cleanPostcode.slice(4)}`
    
    return {
      street: data.straat || '',
      houseNumber: houseNumber,
      houseNumberAddition: data.huisnummer_toevoeging || '',
      postcode: formattedPostcode,
      city: data.plaats || '',
      province: data.provincie || '',
      fullAddress: `${data.straat || ''} ${houseNumber}${data.huisnummer_toevoeging || ''}, ${formattedPostcode} ${data.plaats || ''}`.trim(),
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

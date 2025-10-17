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

    // Use our own API route to avoid CORS issues
    const response = await fetch(
      `/api/postcode?postcode=${cleanPostcode}&huisnummer=${houseNumber}`,
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
    
    if (!data || !data.street) {
      throw new Error('Geen adres gevonden voor postcode ' + cleanPostcode + ' nummer ' + houseNumber)
    }

    // Return the data directly from our API
    return data
  } catch (error) {
    console.error('Postcode lookup error:', error)
    throw error
  }
}

// Main function
export async function findAddress(postcode, houseNumber) {
  return await lookupAddress(postcode, houseNumber)
}

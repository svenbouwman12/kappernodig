/**
 * Haalt een adres op via de PostcodeAPI.nu API
 * @param {string} postcode - Nederlandse postcode (bijv. "9711AC")
 * @param {number|string} huisnummer - Huisnummer
 * @returns {Promise<Object>} Adres object of error object
 */
async function getAdres(postcode, huisnummer) {
  try {
    // Valideer input
    if (!postcode || !huisnummer) {
      throw new Error('Postcode en huisnummer zijn verplicht')
    }

    // Format postcode (verwijder spaties en maak hoofdletters)
    const cleanPostcode = postcode.replace(/\s/g, '').toUpperCase()
    
    // Valideer postcode formaat (6 karakters: 4 cijfers + 2 letters)
    if (!/^\d{4}[A-Z]{2}$/.test(cleanPostcode)) {
      throw new Error('Ongeldig postcode formaat. Gebruik formaat: 1234AB')
    }

    // Maak API request naar PostcodeAPI.nu
    const url = `https://postcodeapi.nu/api/v3/lookup/${cleanPostcode}/${huisnummer}`
    
    console.log(`PostcodeAPI.nu request: ${url}`)
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Api-Key': '1TEsO6e2Fo2v6R6iTuGaS5lmaSuhNZZ32BkIUjJi',
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      if (response.status === 404) {
        return { error: "Geen adres gevonden voor deze combinatie van postcode en huisnummer." }
      }
      throw new Error(`PostcodeAPI.nu error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    // Controleer of er een adres is gevonden
    if (!data || !data.street) {
      return { error: "Geen adres gevonden voor deze combinatie van postcode en huisnummer." }
    }

    // Format postcode met spatie (1234 AB)
    const formattedPostcode = `${cleanPostcode.slice(0, 4)} ${cleanPostcode.slice(4)}`
    
    // Return gestructureerd adres object
    return {
      straatnaam: data.street || '',
      huisnummer: data.houseNumber || huisnummer,
      huisletter: data.houseNumberAddition || '',
      huisnummertoevoeging: data.houseNumberAddition || '',
      postcode: formattedPostcode,
      woonplaats: data.city || '',
      gemeente: data.municipality || '',
      provincie: data.province || '',
      // Extra informatie
      latitude: data.latitude,
      longitude: data.longitude,
      bagId: data.bagId
    }

  } catch (error) {
    console.error('PostcodeAPI.nu error:', error)
    return { 
      error: `Technische fout bij het ophalen van adres: ${error.message}` 
    }
  }
}

// Exporteer de functie
export default getAdres

// Voorbeeld aanroep
// getAdres("9743AB", 12).then(console.log);

/**
 * Haalt een adres op via de officiële BAG API van het Kadaster
 * @param {string} postcode - Nederlandse postcode (bijv. "9743AB")
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

    // Maak API request naar BAG API
    const url = `https://api.bag.kadaster.nl/lvbag/individuelebevragingen/v2/adressen?postcode=${encodeURIComponent(cleanPostcode)}&huisnummer=${encodeURIComponent(huisnummer)}`
    
    console.log(`BAG API request: ${url}`)
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'KapperNodig/1.0'
      }
    })

    if (!response.ok) {
      if (response.status === 404) {
        return { error: "Geen adres gevonden voor deze combinatie van postcode en huisnummer." }
      }
      throw new Error(`BAG API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    // Controleer of er adressen zijn gevonden
    if (!data._embedded || !data._embedded.adressen || data._embedded.adressen.length === 0) {
      return { error: "Geen adres gevonden voor deze combinatie van postcode en huisnummer." }
    }

    // Neem het eerste adres (meestal is er maar één)
    const adres = data._embedded.adressen[0]
    
    // Format postcode met spatie (1234 AB)
    const formattedPostcode = `${cleanPostcode.slice(0, 4)} ${cleanPostcode.slice(4)}`
    
    // Return gestructureerd adres object
    return {
      straatnaam: adres.straat || adres.openbareRuimte?.openbareRuimteNaam || '',
      huisnummer: adres.huisnummer,
      huisletter: adres.huisletter,
      huisnummertoevoeging: adres.huisnummertoevoeging,
      postcode: formattedPostcode,
      woonplaats: adres.woonplaats?.woonplaatsNaam || '',
      gemeente: adres.gemeente?.gemeentenaam || '',
      provincie: adres.provincie?.provincienaam || '',
      // Extra informatie
      adresseerbaarObjectIdentificatie: adres.adresseerbaarObjectIdentificatie,
      status: adres.nummeraanduiding?.status,
      typeOpenbareRuimte: adres.openbareRuimte?.typeOpenbareRuimte
    }

  } catch (error) {
    console.error('BAG API error:', error)
    return { 
      error: `Technische fout bij het ophalen van adres: ${error.message}` 
    }
  }
}

// Exporteer de functie
export default getAdres

// Voorbeeld aanroep
// getAdres("9743AB", 12).then(console.log);

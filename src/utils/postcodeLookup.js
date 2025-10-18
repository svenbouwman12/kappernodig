import getAdres from './bagApi.js'

/**
 * Zoekt een adres op basis van postcode en huisnummer via de officiële BAG API
 * @param {string} postcode - Nederlandse postcode (bijv. "9934 HE")
 * @param {string|number} houseNumber - Huisnummer
 * @returns {Promise<Object>} Adres object met straat, stad, coördinaten etc.
 */
export async function findAddress(postcode, houseNumber) {
  try {
    // Valideer input
    if (!postcode || !houseNumber) {
      throw new Error('Postcode en huisnummer zijn verplicht')
    }

    // Format postcode (verwijder spaties en maak hoofdletters)
    const cleanPostcode = postcode.replace(/\s/g, '').toUpperCase()
    
    // Valideer postcode formaat (6 karakters: 4 cijfers + 2 letters)
    if (!/^\d{4}[A-Z]{2}$/.test(cleanPostcode)) {
      throw new Error('Ongeldig postcode formaat. Gebruik formaat: 1234AB')
    }

    console.log(`BAG API lookup: ${cleanPostcode} ${houseNumber}`)
    
    // Gebruik BAG API voor adres lookup
    const result = await getAdres(cleanPostcode, houseNumber)
    
    // Controleer op error
    if (result.error) {
      throw new Error(result.error)
    }

    // Format postcode met spatie (1234 AB)
    const formattedPostcode = `${cleanPostcode.slice(0, 4)} ${cleanPostcode.slice(4)}`
    
    // Bouw huisnummer string (inclusief letter en toevoeging)
    let fullHouseNumber = result.huisnummer.toString()
    if (result.huisletter) {
      fullHouseNumber += result.huisletter
    }
    if (result.huisnummertoevoeging) {
      fullHouseNumber += result.huisnummertoevoeging
    }

    // Return gestructureerd adres object
    return {
      street: result.straatnaam,
      houseNumber: fullHouseNumber,
      houseNumberAddition: result.huisnummertoevoeging || '',
      postcode: formattedPostcode,
      city: result.woonplaats,
      province: result.provincie,
      fullAddress: `${result.straatnaam} ${fullHouseNumber}, ${formattedPostcode} ${result.woonplaats}`.trim(),
      coordinates: {
        lat: result.latitude || null, // PostcodeAPI.nu heeft coördinaten
        lng: result.longitude || null
      },
      // Extra informatie
      bagId: result.bagId,
      gemeente: result.gemeente
    }

  } catch (error) {
    console.error('Postcode lookup error:', error)
    throw error
  }
}
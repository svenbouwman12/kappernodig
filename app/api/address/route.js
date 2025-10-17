import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { postcode, huisnummer } = await request.json()

    // Valideer input
    if (!postcode || !huisnummer) {
      return NextResponse.json(
        { error: 'Postcode en huisnummer zijn verplicht' },
        { status: 400 }
      )
    }

    // Format postcode (verwijder spaties en maak hoofdletters)
    const cleanPostcode = postcode.replace(/\s/g, '').toUpperCase()
    
    // Valideer postcode formaat (6 karakters: 4 cijfers + 2 letters)
    if (!/^\d{4}[A-Z]{2}$/.test(cleanPostcode)) {
      return NextResponse.json(
        { error: 'Ongeldig postcode formaat. Gebruik formaat: 1234AB' },
        { status: 400 }
      )
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
        return NextResponse.json(
          { error: 'Geen adres gevonden voor deze combinatie van postcode en huisnummer' },
          { status: 404 }
        )
      }
      
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'API key ongeldig of verlopen' },
          { status: 401 }
        )
      }
      
      return NextResponse.json(
        { error: `PostcodeAPI.nu error: ${response.status} ${response.statusText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // Controleer of er een adres is gevonden
    if (!data || !data.street) {
      return NextResponse.json(
        { error: 'Geen adres gevonden voor deze combinatie van postcode en huisnummer' },
        { status: 404 }
      )
    }

    // Format postcode met spatie (1234 AB)
    const formattedPostcode = `${cleanPostcode.slice(0, 4)} ${cleanPostcode.slice(4)}`
    
    // Return gestructureerd adres object
    const addressResult = {
      straatnaam: data.street || '',
      huisnummer: data.houseNumber || huisnummer,
      postcode: formattedPostcode,
      plaats: data.city || '',
      provincie: data.province || '',
      gemeente: data.municipality || '',
      latitude: data.latitude || null,
      longitude: data.longitude || null,
      fullAddress: `${data.street || ''} ${data.houseNumber || huisnummer}, ${formattedPostcode} ${data.city || ''}`.trim()
    }

    return NextResponse.json(addressResult)

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: `Technische fout bij het ophalen van adres: ${error.message}` },
      { status: 500 }
    )
  }
}

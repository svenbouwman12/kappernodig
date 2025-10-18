/**
 * Backend Proxy voor PDOK Locatieserver API
 * Lost CORS-problemen op door server-side API calls
 * 
 * Endpoint: /api/plaatsen?query=<input>
 * PDOK API: https://geodata.nationaalgeoregister.nl/locatieserver/v3/free
 */

export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query } = req.query;
  
  if (!query || query.length < 2) {
    return res.status(400).json({ error: 'Query too short' });
  }

  // PDOK Locatieserver API endpoint
  const PDOK_API_URL = 'https://geodata.nationaalgeoregister.nl/locatieserver/v3/free';
  
  // Build API request parameters
  const params = new URLSearchParams({
    q: query,
    fq: 'type:plaats',
    rows: '20',
    wt: 'json'
  });

  const apiUrl = `${PDOK_API_URL}?${params}`;

  // Make request to PDOK API
  fetch(apiUrl, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'KapperNodig/1.0'
    }
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`PDOK API error: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    if (data.response && data.response.docs) {
      // Transform PDOK data to our format
      const places = data.response.docs.map(doc => ({
        id: doc.id,
        name: doc.weergavenaam || doc.display_name || '',
        municipality: doc.gemeentenaam || doc.municipality || '',
        province: doc.provincienaam || doc.province || '',
        coordinates: {
          lat: doc.centroide_ll ? doc.centroide_ll.split(' ')[1] : null,
          lng: doc.centroide_ll ? doc.centroide_ll.split(' ')[0] : null
        }
      })).filter(place => place.name);

      res.status(200).json({ 
        success: true,
        places: places,
        total: places.length
      });
    } else {
      res.status(200).json({ 
        success: true,
        places: [],
        total: 0
      });
    }
  })
  .catch(error => {
    console.error('Error fetching places from PDOK:', error);
    
    // Fallback to local data if API fails
    const localPlaces = getLocalPlaces(query);
    
    res.status(200).json({ 
      success: true,
      places: localPlaces,
      total: localPlaces.length,
      fallback: true
    });
  });
}

/**
 * Local fallback data for when PDOK API is not available
 */
function getLocalPlaces(query) {
  const allPlaces = [
    // Major cities
    { id: 'amsterdam', name: 'Amsterdam', municipality: 'Amsterdam', province: 'Noord-Holland' },
    { id: 'rotterdam', name: 'Rotterdam', municipality: 'Rotterdam', province: 'Zuid-Holland' },
    { id: 'utrecht', name: 'Utrecht', municipality: 'Utrecht', province: 'Utrecht' },
    { id: 'den-haag', name: 'Den Haag', municipality: 'Den Haag', province: 'Zuid-Holland' },
    { id: 'eindhoven', name: 'Eindhoven', municipality: 'Eindhoven', province: 'Noord-Brabant' },
    { id: 'groningen', name: 'Groningen', municipality: 'Groningen', province: 'Groningen' },
    { id: 'tilburg', name: 'Tilburg', municipality: 'Tilburg', province: 'Noord-Brabant' },
    { id: 'almere', name: 'Almere', municipality: 'Almere', province: 'Flevoland' },
    { id: 'breda', name: 'Breda', municipality: 'Breda', province: 'Noord-Brabant' },
    { id: 'nijmegen', name: 'Nijmegen', municipality: 'Nijmegen', province: 'Gelderland' },
    { id: 'enschede', name: 'Enschede', municipality: 'Enschede', province: 'Overijssel' },
    { id: 'haarlem', name: 'Haarlem', municipality: 'Haarlem', province: 'Noord-Holland' },
    { id: 'arnhem', name: 'Arnhem', municipality: 'Arnhem', province: 'Gelderland' },
    { id: 'zaanstad', name: 'Zaanstad', municipality: 'Zaanstad', province: 'Noord-Holland' },
    { id: 's-hertogenbosch', name: 'S-Hertogenbosch', municipality: 'S-Hertogenbosch', province: 'Noord-Brabant' },
    { id: 'amersfoort', name: 'Amersfoort', municipality: 'Amersfoort', province: 'Utrecht' },
    { id: 'apeldoorn', name: 'Apeldoorn', municipality: 'Apeldoorn', province: 'Gelderland' },
    { id: 'hoofddorp', name: 'Hoofddorp', municipality: 'Haarlemmermeer', province: 'Noord-Holland' },
    { id: 'maastricht', name: 'Maastricht', municipality: 'Maastricht', province: 'Limburg' },
    { id: 'leiden', name: 'Leiden', municipality: 'Leiden', province: 'Zuid-Holland' },
    { id: 'dordrecht', name: 'Dordrecht', municipality: 'Dordrecht', province: 'Zuid-Holland' },
    { id: 'zoetermeer', name: 'Zoetermeer', municipality: 'Zoetermeer', province: 'Zuid-Holland' },
    { id: 'zwolle', name: 'Zwolle', municipality: 'Zwolle', province: 'Overijssel' },
    { id: 'deventer', name: 'Deventer', municipality: 'Deventer', province: 'Overijssel' },
    { id: 'delft', name: 'Delft', municipality: 'Delft', province: 'Zuid-Holland' },
    { id: 'venlo', name: 'Venlo', municipality: 'Venlo', province: 'Limburg' },
    { id: 'leeuwarden', name: 'Leeuwarden', municipality: 'Leeuwarden', province: 'Friesland' },
    
    // Smaller places
    { id: 'schaapbulten', name: 'Schaapbulten', municipality: 'Groningen', province: 'Groningen' },
    { id: 'appingedam', name: 'Appingedam', municipality: 'Appingedam', province: 'Groningen' },
    { id: 'holwierde', name: 'Holwierde', municipality: 'Delfzijl', province: 'Groningen' },
    { id: 'midwolda', name: 'Midwolda', municipality: 'Oldambt', province: 'Groningen' },
    { id: 'drachten', name: 'Drachten', municipality: 'Smallingerland', province: 'Friesland' },
    { id: 'heerenveen', name: 'Heerenveen', municipality: 'Heerenveen', province: 'Friesland' },
    { id: 'emmen', name: 'Emmen', municipality: 'Emmen', province: 'Drenthe' },
    { id: 'hengelo', name: 'Hengelo', municipality: 'Hengelo', province: 'Overijssel' },
    { id: 'ede', name: 'Ede', municipality: 'Ede', province: 'Gelderland' },
    { id: 'vlaardingen', name: 'Vlaardingen', municipality: 'Vlaardingen', province: 'Zuid-Holland' },
    { id: 'rijswijk', name: 'Rijswijk', municipality: 'Rijswijk', province: 'Zuid-Holland' },
    { id: 'westland', name: 'Westland', municipality: 'Westland', province: 'Zuid-Holland' },
    { id: 'sittard', name: 'Sittard', municipality: 'Sittard-Geleen', province: 'Limburg' },
    { id: 'roermond', name: 'Roermond', municipality: 'Roermond', province: 'Limburg' },
    { id: 'purmerend', name: 'Purmerend', municipality: 'Purmerend', province: 'Noord-Holland' },
    { id: 'hilversum', name: 'Hilversum', municipality: 'Hilversum', province: 'Noord-Holland' },
    { id: 'velsen', name: 'Velsen', municipality: 'Velsen', province: 'Noord-Holland' },
    { id: 'alphen-rijn', name: 'Alphen aan den Rijn', municipality: 'Alphen aan den Rijn', province: 'Zuid-Holland' },
    { id: 'spijkenisse', name: 'Spijkenisse', municipality: 'Nissewaard', province: 'Zuid-Holland' },
    { id: 'capelle-ijssel', name: 'Capelle aan den IJssel', municipality: 'Capelle aan den IJssel', province: 'Zuid-Holland' },
    { id: 'veenendaal', name: 'Veenendaal', municipality: 'Veenendaal', province: 'Utrecht' },
    { id: 'zeist', name: 'Zeist', municipality: 'Zeist', province: 'Utrecht' },
    { id: 'hardenberg', name: 'Hardenberg', municipality: 'Hardenberg', province: 'Overijssel' },
    { id: 'oss', name: 'Oss', municipality: 'Oss', province: 'Noord-Brabant' },
    { id: 'schiedam', name: 'Schiedam', municipality: 'Schiedam', province: 'Zuid-Holland' },
    { id: 'helmond', name: 'Helmond', municipality: 'Helmond', province: 'Noord-Brabant' },
    { id: 'vught', name: 'Vught', municipality: 'Vught', province: 'Noord-Brabant' },
    { id: 'bergen-op-zoom', name: 'Bergen op Zoom', municipality: 'Bergen op Zoom', province: 'Noord-Brabant' },
    { id: 'katwijk', name: 'Katwijk', municipality: 'Katwijk', province: 'Zuid-Holland' },
    { id: 'barneveld', name: 'Barneveld', municipality: 'Barneveld', province: 'Gelderland' },
    { id: 'gouda', name: 'Gouda', municipality: 'Gouda', province: 'Zuid-Holland' },
    { id: 'driebergen', name: 'Driebergen-Rijsenburg', municipality: 'Utrechtse Heuvelrug', province: 'Utrecht' },
    { id: 'rijssen-holten', name: 'Rijssen-Holten', municipality: 'Rijssen-Holten', province: 'Overijssel' },
    { id: 'nieuwegein', name: 'Nieuwegein', municipality: 'Nieuwegein', province: 'Utrecht' },
    
    // Specific places mentioned by user
    { id: 'ten-boer', name: 'Ten Boer', municipality: 'Ten Boer', province: 'Groningen' },
    { id: 'ten-post', name: 'Ten Post', municipality: 'Groningen', province: 'Groningen' },
    { id: 'ten-arlo', name: 'Ten Arlo', municipality: 'Groningen', province: 'Groningen' },
    { id: 'bedum', name: 'Bedum', municipality: 'Bedum', province: 'Groningen' },
    { id: 'beek', name: 'Beek', municipality: 'Beek', province: 'Limburg' },
    { id: 'beek-en-donk', name: 'Beek en Donk', municipality: 'Laarbeek', province: 'Noord-Brabant' },
    { id: 'beekbergen', name: 'Beekbergen', municipality: 'Apeldoorn', province: 'Gelderland' },
    { id: 'beekdaelen', name: 'Beekdaelen', municipality: 'Beekdaelen', province: 'Limburg' },
    { id: 'beers', name: 'Beers', municipality: 'Cuijk', province: 'Noord-Brabant' },
    { id: 'beerta', name: 'Beerta', municipality: 'Oldambt', province: 'Groningen' },
    { id: 'beetsterzwaag', name: 'Beetsterzwaag', municipality: 'Opsterland', province: 'Friesland' },
    { id: 'beesd', name: 'Beesd', municipality: 'Geldermalsen', province: 'Gelderland' },
    { id: 'beesel', name: 'Beesel', municipality: 'Beesel', province: 'Limburg' },
    { id: 'beets', name: 'Beets', municipality: 'Zuidhorn', province: 'Groningen' },
    { id: 'beetgum', name: 'Beetgum', municipality: 'Leeuwarden', province: 'Friesland' },
    { id: 'beilen', name: 'Beilen', municipality: 'Midden-Drenthe', province: 'Drenthe' },
    { id: 'beinsdorp', name: 'Beinsdorp', municipality: 'Haarlemmermeer', province: 'Noord-Holland' },
    { id: 'bekveld', name: 'Bekveld', municipality: 'Groningen', province: 'Groningen' },
    { id: 'beltrum', name: 'Beltrum', municipality: 'Berkelland', province: 'Gelderland' },
    { id: 'bemmel', name: 'Bemmel', municipality: 'Lingewaard', province: 'Gelderland' },
    { id: 'beneden-leeuwen', name: 'Beneden-Leeuwen', municipality: 'West Maas en Waal', province: 'Gelderland' },
    { id: 'bennebroek', name: 'Bennebroek', municipality: 'Bennebroek', province: 'Noord-Holland' },
    { id: 'bennekom', name: 'Bennekom', municipality: 'Ede', province: 'Gelderland' },
    { id: 'berg-en-dal', name: 'Berg en Dal', municipality: 'Berg en Dal', province: 'Gelderland' },
    { id: 'bergambacht', name: 'Bergambacht', municipality: 'Krimpenerwaard', province: 'Zuid-Holland' },
    { id: 'bergeijk', name: 'Bergeijk', municipality: 'Bergeijk', province: 'Noord-Brabant' },
    { id: 'bergen', name: 'Bergen', municipality: 'Bergen', province: 'Noord-Holland' },
    { id: 'berkel-rodenrijs', name: 'Berkel en Rodenrijs', municipality: 'Lansingerland', province: 'Zuid-Holland' },
    { id: 'berkelland', name: 'Berkelland', municipality: 'Berkelland', province: 'Gelderland' },
    { id: 'berlicum', name: 'Berlicum', municipality: 'Sint-Michielsgestel', province: 'Noord-Brabant' },
    { id: 'best', name: 'Best', municipality: 'Best', province: 'Noord-Brabant' },
    { id: 'beuningen', name: 'Beuningen', municipality: 'Beuningen', province: 'Gelderland' },
    { id: 'beusichem', name: 'Beusichem', municipality: 'Buren', province: 'Gelderland' },
    { id: 'beveland', name: 'Beveland', municipality: 'Goes', province: 'Zeeland' },
    { id: 'beverwijk', name: 'Beverwijk', municipality: 'Beverwijk', province: 'Noord-Holland' },
    { id: 'biddinghuizen', name: 'Biddinghuizen', municipality: 'Dronten', province: 'Flevoland' },
    { id: 'bierum', name: 'Bierum', municipality: 'Delfzijl', province: 'Groningen' },
    { id: 'bilthoven', name: 'Bilthoven', municipality: 'De Bilt', province: 'Utrecht' },
    { id: 'binnenmaas', name: 'Binnenmaas', municipality: 'Hoeksche Waard', province: 'Zuid-Holland' }
  ];

  // Filter places based on query
  const queryLower = query.toLowerCase();
  return allPlaces
    .filter(place => 
      place.name.toLowerCase().includes(queryLower) ||
      place.municipality.toLowerCase().includes(queryLower) ||
      place.province.toLowerCase().includes(queryLower)
    )
    .slice(0, 20);
}


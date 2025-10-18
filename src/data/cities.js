// Smart Dutch cities search with progressive loading
// This implements Google Maps-style search with multiple strategies

// Cache for search results
const searchCache = new Map();
const DEBOUNCE_DELAY = 300; // 300ms debounce like Google Maps

// Debounced search function
let searchTimeout;
export const searchCities = async (query) => {
  if (!query || query.length < 2) return [];
  
  // Clear previous timeout
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  
  return new Promise((resolve) => {
    searchTimeout = setTimeout(async () => {
      try {
        const results = await performSearch(query);
        resolve(results);
      } catch (error) {
        console.error('Search error:', error);
        resolve(getLocalCities(query));
      }
    }, DEBOUNCE_DELAY);
  });
};

// Main search function with multiple strategies
const performSearch = async (query) => {
  // 1. Check cache first (like Google Maps)
  if (searchCache.has(query)) {
    console.log(`🎯 Cache hit for "${query}"`);
    return searchCache.get(query);
  }
  
  // 2. Try server-side API for full dataset
  try {
    console.log(`🔍 Searching "${query}" via API...`);
    const response = await fetch(`/api/search-places?q=${encodeURIComponent(query)}`, {
      timeout: 5000 // 5 second timeout
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.results && Array.isArray(data.results)) {
        console.log(`🎯 API found ${data.results.length} results`);
        searchCache.set(query, data.results);
        return data.results;
      }
    }
  } catch (error) {
    console.log('API failed, trying local search...');
  }
  
  // 3. Fallback to local search
  const localResults = getLocalCities(query);
  searchCache.set(query, localResults);
  return localResults;
};

// Local cities database for fallback
const localCities = {
  'Amsterdam': { lat: 52.3676, lng: 4.9041, municipality: 'Amsterdam', province: 'Noord-Holland' },
  'Rotterdam': { lat: 51.9225, lng: 4.4792, municipality: 'Rotterdam', province: 'Zuid-Holland' },
  'Utrecht': { lat: 52.0907, lng: 5.1214, municipality: 'Utrecht', province: 'Utrecht' },
  'Den Haag': { lat: 52.0766, lng: 4.3113, municipality: 'Den Haag', province: 'Zuid-Holland' },
  'Eindhoven': { lat: 51.4416, lng: 5.4697, municipality: 'Eindhoven', province: 'Noord-Brabant' },
  'Groningen': { lat: 53.2194, lng: 6.5665, municipality: 'Groningen', province: 'Groningen' },
  'Tilburg': { lat: 51.5555, lng: 5.0913, municipality: 'Tilburg', province: 'Noord-Brabant' },
  'Almere': { lat: 52.3508, lng: 5.2647, municipality: 'Almere', province: 'Flevoland' },
  'Breda': { lat: 51.5719, lng: 4.7683, municipality: 'Breda', province: 'Noord-Brabant' },
  'Nijmegen': { lat: 51.8426, lng: 5.8587, municipality: 'Nijmegen', province: 'Gelderland' },
  'Enschede': { lat: 52.2215, lng: 6.8937, municipality: 'Enschede', province: 'Overijssel' },
  'Haarlem': { lat: 52.3792, lng: 4.6368, municipality: 'Haarlem', province: 'Noord-Holland' },
  'Arnhem': { lat: 51.9851, lng: 5.8987, municipality: 'Arnhem', province: 'Gelderland' },
  'Zaanstad': { lat: 52.4520, lng: 4.8283, municipality: 'Zaanstad', province: 'Noord-Holland' },
  'S-Hertogenbosch': { lat: 51.6978, lng: 5.3037, municipality: 'S-Hertogenbosch', province: 'Noord-Brabant' },
  'Amersfoort': { lat: 52.1561, lng: 5.3878, municipality: 'Amersfoort', province: 'Utrecht' },
  'Apeldoorn': { lat: 52.2112, lng: 5.9699, municipality: 'Apeldoorn', province: 'Gelderland' },
  'Hoofddorp': { lat: 52.3025, lng: 4.6889, municipality: 'Haarlemmermeer', province: 'Noord-Holland' },
  'Maastricht': { lat: 50.8514, lng: 5.6910, municipality: 'Maastricht', province: 'Limburg' },
  'Leiden': { lat: 52.1601, lng: 4.4970, municipality: 'Leiden', province: 'Zuid-Holland' },
  'Dordrecht': { lat: 51.8133, lng: 4.6901, municipality: 'Dordrecht', province: 'Zuid-Holland' },
  'Zoetermeer': { lat: 52.0607, lng: 4.4940, municipality: 'Zoetermeer', province: 'Zuid-Holland' },
  'Zwolle': { lat: 52.5168, lng: 6.0830, municipality: 'Zwolle', province: 'Overijssel' },
  'Deventer': { lat: 52.2515, lng: 6.1639, municipality: 'Deventer', province: 'Overijssel' },
  'Delft': { lat: 52.0116, lng: 4.3571, municipality: 'Delft', province: 'Zuid-Holland' },
  'Venlo': { lat: 51.3704, lng: 6.1722, municipality: 'Venlo', province: 'Limburg' },
  'Leeuwarden': { lat: 53.2012, lng: 5.7999, municipality: 'Leeuwarden', province: 'Friesland' },
  'Schaapbulten': { lat: 52.5, lng: 6.0, municipality: 'Drenthe', province: 'Drenthe' },
  'Appingedam': { lat: 53.32167, lng: 6.85833, municipality: 'Appingedam', province: 'Groningen' },
  'Holwierde': { lat: 53.35833, lng: 6.87361, municipality: 'Delfzijl', province: 'Groningen' },
  'Midwolda': { lat: 53.1917, lng: 6.9917, municipality: 'Oldambt', province: 'Groningen' }
};

// Local search function
const getLocalCities = (query) => {
  const queryLower = query.toLowerCase();
  const results = [];
  
  Object.entries(localCities).forEach(([name, data]) => {
    const nameLower = name.toLowerCase();
    
    if (nameLower.includes(queryLower)) {
      results.push({
        city: name,
        coords: { lat: data.lat, lng: data.lng },
        score: nameLower.startsWith(queryLower) ? 90 : 70,
        match: nameLower.startsWith(queryLower) ? 'starts' : 'contains',
        municipality: data.municipality,
        province: data.province
      });
    }
  });
  
  return results.sort((a, b) => b.score - a.score);
};

// Fallback cities for when API fails
const getFallbackCities = (query) => {
  return getLocalCities(query);
};

export default searchCities;
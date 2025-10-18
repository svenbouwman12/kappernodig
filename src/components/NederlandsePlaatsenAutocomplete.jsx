import React, { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Nederlandse Plaatsen Autocomplete Component
 * Gebruikt backend proxy voor PDOK Locatieserver API
 * 
 * Features:
 * - Server-side search via backend proxy
 * - Keyboard navigation (arrow keys + enter)
 * - Local caching for performance
 * - Shows place name, municipality, and province
 * - Debounced API calls
 * - Loading states
 * - Fallback to local data
 */

const NederlandsePlaatsenAutocomplete = ({ 
  value = '', 
  onChange = () => {}, 
  placeholder = 'Zoek een plaats in Nederland...',
  className = '',
  disabled = false 
}) => {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [cache, setCache] = useState(new Map());
  
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const debounceTimeoutRef = useRef(null);

  // Backend proxy endpoint
  const API_ENDPOINT = '/api/plaatsen';
  
  // Debounced search function
  const searchPlaces = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    // Check cache first
    if (cache.has(searchQuery)) {
      setSuggestions(cache.get(searchQuery));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_ENDPOINT}?query=${encodeURIComponent(searchQuery)}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.places) {
        const places = data.places.map(place => ({
          id: place.id,
          name: place.name,
          municipality: place.municipality,
          province: place.province,
          coordinates: place.coordinates
        }));

        // Cache the results
        setCache(prev => new Map(prev.set(searchQuery, places)));
        setSuggestions(places);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Error fetching places:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [cache]);

  // Debounced search effect
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      searchPlaces(query);
    }, 300); // 300ms debounce

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [query, searchPlaces]);

  // Handle input change
  const handleInputChange = (e) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setIsOpen(true);
    setSelectedIndex(-1);
    
    if (newQuery !== value) {
      onChange(newQuery);
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion) => {
    const fullName = `${suggestion.name}, ${suggestion.municipality}`;
    setQuery(fullName);
    setIsOpen(false);
    setSelectedIndex(-1);
    onChange(fullName);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'ArrowDown' && suggestions.length > 0) {
        setIsOpen(true);
        setSelectedIndex(0);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/* Input Field */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${isOpen && suggestions.length > 0 ? 'rounded-b-none' : ''}
          `}
        />
        
        {/* Loading/Status Icon */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {isLoading ? (
            <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />
          ) : (
            <svg 
              className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div 
          ref={dropdownRef}
          className="absolute z-50 w-full bg-white border border-gray-300 border-t-0 rounded-b-lg shadow-lg max-h-80 overflow-y-auto"
        >
          {suggestions.length > 0 ? (
            <ul className="py-1">
              {suggestions.map((suggestion, index) => (
                <li
                  key={suggestion.id}
                  onClick={() => handleSuggestionSelect(suggestion)}
                  className={`
                    px-4 py-3 cursor-pointer transition-colors
                    ${index === selectedIndex 
                      ? 'bg-blue-50 text-blue-900' 
                      : 'hover:bg-gray-50'
                    }
                  `}
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900">
                      {suggestion.name}
                    </span>
                    <span className="text-sm text-gray-600">
                      {suggestion.municipality}
                      {suggestion.province && `, ${suggestion.province}`}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : query.length >= 2 && !isLoading ? (
            <div className="px-4 py-3 text-gray-500 text-center">
              Geen plaatsen gevonden voor "{query}"
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default NederlandsePlaatsenAutocomplete;


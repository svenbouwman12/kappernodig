import React, { useState } from 'react';

const StedenDropdown = ({ 
  value = '', 
  onChange = () => {}, 
  placeholder = 'Selecteer je stad...',
  className = '',
  disabled = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Lijst van belangrijke Nederlandse steden
  const steden = [
    'Amsterdam', 'Rotterdam', 'Den Haag', 'Utrecht', 'Eindhoven',
    'Tilburg', 'Groningen', 'Almere', 'Breda', 'Nijmegen',
    'Enschede', 'Haarlem', 'Arnhem', 'Zaanstad', 'Amersfoort',
    'Apeldoorn', 'Hoofddorp', 'Maastricht', 'Leiden', 'Dordrecht',
    'Zoetermeer', 'Zwolle', 'Deventer', 'Delft', 'Venlo',
    'Leeuwarden', 'Ede', 'West lans', 'Hilversum', 'Emmen',
    'Veldhoven', 'Alkmaar', 'Gouda', 'Amstelveen', 'Purmerend',
    'Spijkenisse', 'Alphen aan den Rijn', 'Vlaardingen', 'Veenendaal', 'Helmond',
    'Hengelo', 'Schiedam', 'Roosendaal', 'Oss', 'Assen',
    'Lelystad', 'Bergen op Zoom', 'Katwijk', 'Rijswijk', 'Sittard-Geleen',
    'Vlissingen', 'Nieuwegein', 'Capelle aan den IJssel', 'Hardenberg', 'Heerlen',
    'Vught', 'Weert', 'Diemen', 'Tiel', 'Doetinchem'
  ];

  const handleSelect = (stad) => {
    onChange(stad);
    setIsOpen(false);
  };

  const filteredSteden = steden.filter(stad => 
    stad.toLowerCase().includes(value.toLowerCase())
  );

  return (
    <div className={`relative ${className}`}>
      {/* Input Field */}
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg
            focus:ring-2 focus:ring-primary focus:border-primary
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${isOpen ? 'rounded-b-none' : ''}
          `}
        />
        
        {/* Dropdown Arrow */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <svg 
            className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full bg-white border border-gray-300 border-t-0 rounded-b-lg shadow-lg max-h-80 overflow-y-auto">
          {filteredSteden.length > 0 ? (
            <ul className="py-1">
              {filteredSteden.map((stad) => (
                <li
                  key={stad}
                  onClick={() => handleSelect(stad)}
                  className="px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-gray-900">{stad}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-3 text-gray-500 text-center">
              Geen steden gevonden
            </div>
          )}
        </div>
      )}

      {/* Overlay to close dropdown when clicking outside */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default StedenDropdown;

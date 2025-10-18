import React, { useState } from 'react';
import NederlandsePlaatsenAutocomplete from './NederlandsePlaatsenAutocomplete';

/**
 * Example usage of NederlandsePlaatsenAutocomplete component
 * Shows how to integrate the component in your app
 */

const NederlandsePlaatsenExample = () => {
  const [selectedPlace, setSelectedPlace] = useState('');
  const [selectedPlaceData, setSelectedPlaceData] = useState(null);

  const handlePlaceChange = (place) => {
    setSelectedPlace(place);
    console.log('Selected place:', place);
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Nederlandse Plaatsen Zoeken
      </h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Kies een plaats:
          </label>
          <NederlandsePlaatsenAutocomplete
            value={selectedPlace}
            onChange={handlePlaceChange}
            placeholder="Typ een plaatsnaam..."
            className="w-full"
          />
        </div>

        {selectedPlace && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">
              Geselecteerde plaats:
            </h3>
            <p className="text-blue-800">{selectedPlace}</p>
          </div>
        )}

        <div className="text-sm text-gray-600">
          <p className="mb-2">
            <strong>Functies:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Zoek in alle Nederlandse plaatsen (PDOK database via backend)</li>
            <li>Navigeer met pijltjestoetsen</li>
            <li>Selecteer met Enter</li>
            <li>Toont plaatsnaam, gemeente en provincie</li>
            <li>Automatische caching voor snelle herhaalde zoekopdrachten</li>
            <li>Fallback naar lokale data als API niet beschikbaar is</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NederlandsePlaatsenExample;


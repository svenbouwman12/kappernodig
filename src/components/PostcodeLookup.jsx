import React, { useState } from 'react'
import { MapPin, Search, AlertCircle, CheckCircle } from 'lucide-react'
import { findAddress } from '../utils/postcodeLookup.js'

export default function PostcodeLookup({ 
  onAddressFound, 
  initialPostcode = '', 
  initialHouseNumber = '',
  className = '' 
}) {
  const [postcode, setPostcode] = useState(initialPostcode)
  const [houseNumber, setHouseNumber] = useState(initialHouseNumber)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [foundAddress, setFoundAddress] = useState(null)

  const handleLookup = async () => {
    if (!postcode.trim() || !houseNumber.trim()) {
      setError('Vul postcode en huisnummer in')
      return
    }

    setLoading(true)
    setError('')
    setFoundAddress(null)

    try {
      const address = await findAddress(postcode.trim(), houseNumber.trim())
      setFoundAddress(address)
      onAddressFound(address)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePostcodeChange = (e) => {
    let value = e.target.value.toUpperCase()
    // Auto-format postcode (add space after 4 digits)
    if (value.length === 4 && !value.includes(' ')) {
      value = value + ' '
    }
    setPostcode(value)
    setError('')
    setFoundAddress(null)
  }

  const handleHouseNumberChange = (e) => {
    setHouseNumber(e.target.value)
    setError('')
    setFoundAddress(null)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Postcode *
          </label>
          <input
            type="text"
            value={postcode}
            onChange={handlePostcodeChange}
            placeholder="1234 AB"
            maxLength={7}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            disabled={loading}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Huisnummer *
          </label>
          <input
            type="text"
            value={houseNumber}
            onChange={handleHouseNumberChange}
            placeholder="123"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            disabled={loading}
          />
        </div>
        
        <div className="flex items-end">
          <button
            type="button"
            onClick={handleLookup}
            disabled={loading || !postcode.trim() || !houseNumber.trim()}
            className="w-full flex items-center justify-center px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Zoeken...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Adres zoeken
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      )}

      {foundAddress && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-green-800 mb-2">Adres gevonden:</h4>
              <div className="text-sm text-green-700 space-y-1">
                <div className="font-medium">{foundAddress.fullAddress}</div>
                <div className="text-green-600">
                  📍 {foundAddress.street} {foundAddress.houseNumber}{foundAddress.houseNumberAddition}
                </div>
                <div className="text-green-600">
                  📮 {foundAddress.postcode} {foundAddress.city}
                </div>
                {foundAddress.province && (
                  <div className="text-green-600">
                    🏛️ {foundAddress.province}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

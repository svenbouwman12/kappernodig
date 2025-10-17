'use client'

import { useState } from 'react'

export default function PostcodeLookup() {
  const [postcode, setPostcode] = useState('')
  const [huisnummer, setHuisnummer] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postcode, huisnummer }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Er is een fout opgetreden')
      }

      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleTestData = () => {
    setPostcode('9711AC')
    setHuisnummer('10')
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Adres Opzoeken</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="postcode" className="block text-sm font-medium text-gray-700 mb-1">
            Postcode *
          </label>
          <input
            type="text"
            id="postcode"
            value={postcode}
            onChange={(e) => setPostcode(e.target.value)}
            placeholder="bijv. 9711AC"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="huisnummer" className="block text-sm font-medium text-gray-700 mb-1">
            Huisnummer *
          </label>
          <input
            type="text"
            id="huisnummer"
            value={huisnummer}
            onChange={(e) => setHuisnummer(e.target.value)}
            placeholder="bijv. 10"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Zoeken...' : 'Zoek adres'}
          </button>
          
          <button
            type="button"
            onClick={handleTestData}
            className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Test
          </button>
        </div>
      </form>

      {loading && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-blue-800">Adres wordt opgezocht...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-red-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-red-800 font-medium">Fout:</span>
          </div>
          <p className="text-red-700 mt-1">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center mb-3">
            <svg className="h-5 w-5 text-green-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-green-800 font-medium">Adres gevonden:</span>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex">
              <span className="font-medium text-gray-700 w-20">Straat:</span>
              <span className="text-gray-900">{result.straatnaam} {result.huisnummer}</span>
            </div>
            <div className="flex">
              <span className="font-medium text-gray-700 w-20">Postcode:</span>
              <span className="text-gray-900">{result.postcode}</span>
            </div>
            <div className="flex">
              <span className="font-medium text-gray-700 w-20">Plaats:</span>
              <span className="text-gray-900">{result.plaats}</span>
            </div>
            <div className="flex">
              <span className="font-medium text-gray-700 w-20">Provincie:</span>
              <span className="text-gray-900">{result.provincie}</span>
            </div>
            {result.gemeente && (
              <div className="flex">
                <span className="font-medium text-gray-700 w-20">Gemeente:</span>
                <span className="text-gray-900">{result.gemeente}</span>
              </div>
            )}
            {result.latitude && result.longitude && (
              <div className="flex">
                <span className="font-medium text-gray-700 w-20">Coördinaten:</span>
                <span className="text-gray-900">{result.latitude.toFixed(6)}, {result.longitude.toFixed(6)}</span>
              </div>
            )}
          </div>
          
          <div className="mt-3 p-2 bg-white rounded border">
            <p className="text-sm text-gray-600">
              <strong>Volledig adres:</strong> {result.fullAddress}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

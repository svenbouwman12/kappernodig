import React, { useState, useEffect } from 'react'
import { Heart, MapPin, Phone, Globe, Star, Trash2, ExternalLink } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext.jsx'

export default function ClientBookmarksList() {
  const { user } = useAuth()
  const [bookmarks, setBookmarks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadBookmarks()
    }
  }, [user])

  async function loadBookmarks() {
    if (!user) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .select(`
          *,
          barbers!inner(
            id,
            name,
            description,
            location,
            address,
            phone,
            website,
            rating,
            image_url
          )
        `)
        .eq('klant_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading bookmarks:', error)
        setBookmarks([])
      } else {
        setBookmarks(data || [])
      }
    } catch (err) {
      console.error('Error loading bookmarks:', err)
      setBookmarks([])
    } finally {
      setLoading(false)
    }
  }

  async function removeBookmark(bookmarkId) {
    if (!confirm('Weet je zeker dat je deze kapper uit je favorieten wilt verwijderen?')) return

    try {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', bookmarkId)

      if (error) {
        console.error('Error removing bookmark:', error)
        alert('Er is een fout opgetreden bij het verwijderen van de favoriet')
        return
      }

      // Reload bookmarks
      loadBookmarks()
    } catch (err) {
      console.error('Error removing bookmark:', err)
      alert('Er is een onverwachte fout opgetreden')
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-gray-500">Favorieten laden...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Mijn kappers</h2>
        <p className="text-gray-600 mt-1">
          Je favoriete kapperszaken voor snelle toegang
        </p>
      </div>

      {/* Bookmarks List */}
      {bookmarks.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
          <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Geen favorieten</h3>
          <p className="text-gray-500">
            Je hebt nog geen kappers toegevoegd aan je favorieten. 
            Vraag je kapper om je toe te voegen aan hun klantenlijst.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {bookmarks.map((bookmark) => (
            <div key={bookmark.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              {/* Image */}
              {bookmark.barbers?.image_url && (
                <div className="h-48 bg-gray-200">
                  <img
                    src={bookmark.barbers.image_url}
                    alt={bookmark.barbers.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              {/* Content */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {bookmark.barbers?.name}
                    </h3>
                    <div className="flex items-center space-x-1 mb-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{bookmark.barbers?.location}</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => removeBookmark(bookmark.id)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Verwijder uit favorieten"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                
                {bookmark.barbers?.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {bookmark.barbers.description}
                  </p>
                )}
                
                {/* Rating */}
                {bookmark.barbers?.rating && (
                  <div className="flex items-center space-x-1 mb-4">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-medium text-gray-900">{bookmark.barbers.rating}</span>
                    <span className="text-sm text-gray-500">/ 5.0</span>
                  </div>
                )}
                
                {/* Contact Info */}
                <div className="space-y-2">
                  {bookmark.barbers?.address && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="truncate">{bookmark.barbers.address}</span>
                    </div>
                  )}
                  
                  {bookmark.barbers?.phone && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{bookmark.barbers.phone}</span>
                    </div>
                  )}
                  
                  {bookmark.barbers?.website && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Globe className="h-4 w-4 text-gray-400" />
                      <a
                        href={bookmark.barbers.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80 flex items-center space-x-1"
                      >
                        <span>Website</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>
                
                {/* Action Button */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <button className="w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center space-x-2">
                    <span>Afspraak maken</span>
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

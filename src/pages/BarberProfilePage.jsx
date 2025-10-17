import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Card from '../components/Card.jsx'
import Button from '../components/Button.jsx'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext.jsx'
import { MapPin, Phone, Globe, Star, Heart } from 'lucide-react'

const DUMMY = {
  id: '1',
  name: 'Studio Sharp',
  description: 'Moderne kapsalon in centrum',
  location: 'Amsterdam',
  price_range: '€€',
  image_url: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=1200&auto=format&fit=crop',
  rating: 4.8,
  address: 'Damrak 1, 1012 LG Amsterdam',
  phone: '+31 20 123 4567',
  website: 'https://example.com',
  services: [
    { id: 's1', name: 'Knippen', price: 25 },
    { id: 's2', name: 'Baard', price: 15 },
  ],
}

export default function BarberProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, userProfile } = useAuth()
  const [barber, setBarber] = useState(null)
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [bookmarkLoading, setBookmarkLoading] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function fetchData() {
      setLoading(true)
      try {
        // Load barber data
        const { data: barberData, error: barberError } = await supabase.from('barbers').select('*').eq('id', id).single()
        if (cancelled) return
        
        if (barberError || !barberData) {
          console.log('Barber not found, using dummy data')
          setBarber({ ...DUMMY, id })
          setServices(DUMMY.services)
        } else {
          setBarber(barberData)
          
          // Load services for this barber
          const { data: servicesData, error: servicesError } = await supabase
            .from('services')
            .select('*')
            .eq('barber_id', id)
            .order('name')
          
          if (!servicesError && servicesData) {
            setServices(servicesData)
          } else {
            console.error('Error loading services:', servicesError)
            setServices([])
          }
        }
      } catch (err) {
        console.error('Error loading barber profile:', err)
        setBarber({ ...DUMMY, id })
        setServices(DUMMY.services)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }
    fetchData()
    return () => { cancelled = true }
  }, [id])

  // Check if barber is bookmarked
  useEffect(() => {
    if (user && userProfile && barber) {
      checkBookmarkStatus()
    }
  }, [user, userProfile, barber])

  const checkBookmarkStatus = async () => {
    if (!user || !barber) return

    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('klant_id', user.id)
        .eq('salon_id', barber.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking bookmark status:', error)
        return
      }

      setIsBookmarked(!!data)
    } catch (err) {
      console.error('Error checking bookmark status:', err)
    }
  }

  const handleBookmark = async () => {
    // Check if user is logged in
    if (!user || !userProfile) {
      setShowLoginModal(true)
      return
    }

    // Check if user is a client
    if (userProfile.role !== 'client') {
      alert('Alleen klanten kunnen kappers toevoegen aan hun favorieten.')
      return
    }

    setBookmarkLoading(true)
    try {
      if (isBookmarked) {
        // Remove bookmark
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('klant_id', user.id)
          .eq('salon_id', barber.id)

        if (error) {
          console.error('Error removing bookmark:', error)
          alert('Er is een fout opgetreden bij het verwijderen van de favoriet.')
          return
        }

        setIsBookmarked(false)
        alert('Kapper verwijderd uit je favorieten.')
      } else {
        // Add bookmark
        const { error } = await supabase
          .from('bookmarks')
          .insert({
            klant_id: user.id,
            salon_id: barber.id
          })

        if (error) {
          console.error('Error adding bookmark:', error)
          alert('Er is een fout opgetreden bij het toevoegen van de favoriet.')
          return
        }

        setIsBookmarked(true)
        alert('Kapper toegevoegd aan je favorieten!')
      }
    } catch (err) {
      console.error('Error handling bookmark:', err)
      alert('Er is een onverwachte fout opgetreden.')
    } finally {
      setBookmarkLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-gray-500">Kapperszaak laden...</p>
      </div>
    )
  }

  if (!barber) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Kapperszaak niet gevonden</h2>
        <p className="text-gray-600">De gevraagde kapperszaak bestaat niet of is niet meer beschikbaar.</p>
      </div>
    )
  }

  const address = barber.address || `${barber.location || ''}`
  const phone = barber.phone || ''
  const website = barber.website || ''

  return (
    <div className="space-y-6 fade-in">
      <div className="flex gap-4 items-center">
        <img src={barber.image_url} alt={barber.name} className="w-28 h-28 rounded-xl object-cover" />
        <div>
          <h1 className="text-2xl font-semibold">{barber.name}</h1>
          <div className="text-secondary/70">{barber.location} • {barber.price_range}</div>
          {barber.rating && (
            <div className="flex items-center gap-1 text-success mt-1">
              <Star size={16} fill="currentColor" />
              <span className="font-medium">{barber.rating}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <h2 className="font-semibold mb-2">Over</h2>
            <p className="text-secondary/80 leading-relaxed">{barber.description}</p>
          </Card>

          <Card>
            <h2 className="font-semibold mb-3">Diensten</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {services.length > 0 ? (
                services.map((s) => (
                  <div key={s.id} className="flex items-center justify-between bg-grayNeutral rounded-xl px-3 py-2">
                    <div>
                      <span className="font-medium">{s.name}</span>
                      {s.duration_minutes && (
                        <div className="text-xs text-secondary/60">{s.duration_minutes} min</div>
                      )}
                    </div>
                    <span className="font-semibold">€ {s.price}</span>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center py-4 text-secondary/70">
                  <p>Geen diensten beschikbaar</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <h3 className="font-semibold mb-2">Adres & contact</h3>
            <div className="space-y-2 text-sm">
              {address && (
                <a
                  href={`https://www.google.com/maps/search/${encodeURIComponent(address)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 hover:underline"
                >
                  <MapPin size={16} className="text-secondary/70" />
                  <span>{address}</span>
                </a>
              )}
              {phone && (
                <a href={`tel:${phone.replace(/\s+/g,'')}`} className="flex items-center gap-2 hover:underline">
                  <Phone size={16} className="text-secondary/70" />
                  <span>{phone}</span>
                </a>
              )}
              {website && (
                <a href={website} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:underline">
                  <Globe size={16} className="text-secondary/70" />
                  <span>{website.replace(/^https?:\/\//,'')}</span>
                </a>
              )}
            </div>
          </Card>

          <div className="flex gap-3">
            <Button 
              onClick={handleBookmark}
              disabled={bookmarkLoading}
              className={`px-5 flex items-center gap-2 ${
                isBookmarked 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-primary hover:bg-primary/90 text-white'
              }`}
            >
              {bookmarkLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Heart size={16} fill={isBookmarked ? 'currentColor' : 'none'} />
              )}
              {isBookmarked ? 'Verwijder uit favorieten' : 'Favoriet'}
            </Button>
            <Button variant="secondary" className="px-5">Contact</Button>
          </div>
        </div>
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-md w-full mx-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Inloggen vereist</h3>
                <button
                  onClick={() => setShowLoginModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="text-center">
                  <Heart className="h-12 w-12 text-primary mx-auto mb-3" />
                  <p className="text-gray-600 mb-4">
                    Je moet ingelogd zijn om kappers toe te voegen aan je favorieten.
                  </p>
                </div>
                
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setShowLoginModal(false)
                      navigate(`/client/login?return=${encodeURIComponent(window.location.pathname)}`)
                    }}
                    className="w-full bg-primary text-white py-3 px-4 rounded-lg hover:bg-primary/90 transition-colors font-medium"
                  >
                    Inloggen
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowLoginModal(false)
                      navigate(`/client/register?return=${encodeURIComponent(window.location.pathname)}`)
                    }}
                    className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    Account aanmaken
                  </button>
                </div>
                
                <div className="text-center">
                  <button
                    onClick={() => setShowLoginModal(false)}
                    className="text-gray-500 hover:text-gray-700 text-sm"
                  >
                    Annuleren
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}



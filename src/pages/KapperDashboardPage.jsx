import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import Card from '../components/Card.jsx'
import Button from '../components/Button.jsx'
import AgendaView from '../components/AgendaView.jsx'
import AppointmentModal from '../components/AppointmentModal.jsx'
import ClientsTable from '../components/ClientsTable.jsx'
import ClientModal from '../components/ClientModal.jsx'
import Greeting from '../components/Greeting.jsx'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext.jsx'
import { 
  Plus, 
  MapPin, 
  Phone, 
  Globe, 
  Edit, 
  Trash2, 
  Star, 
  Clock,
  Users,
  Calendar,
  Settings,
  BarChart3,
  UserCheck
} from 'lucide-react'

export default function KapperDashboardPage() {
  const { user, userProfile } = useAuth()
  const [barbers, setBarbers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingBarber, setEditingBarber] = useState(null)
  const [geocoding, setGeocoding] = useState(false)
  const [kapperName, setKapperName] = useState('')
  const [activeTab, setActiveTab] = useState('overview') // overview, agenda, clients
  const [selectedSalon, setSelectedSalon] = useState(null)
  const [showAppointmentModal, setShowAppointmentModal] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [showClientModal, setShowClientModal] = useState(false)
  const [selectedClient, setSelectedClient] = useState(null)
  const hasLoadedRef = useRef(false)


  // Debug logging removed to prevent excessive re-renders

  useEffect(() => {
    // Only load barbers when both user and userProfile are available AND we haven't loaded yet
    if (user?.id && userProfile && !hasLoadedRef.current) {
      hasLoadedRef.current = true
      loadBarbers()
      loadKapperName()
    } else if (!user?.id || !userProfile) {
      // Keep loading state true while waiting for user and userProfile
      setLoading(true)
    }
  }, [user, userProfile]) // Add dependencies to react to userProfile changes

  function loadKapperName() {
    try {
      // Use the userProfile naam if available, otherwise fallback to email or generic name
      if (userProfile?.naam) {
        setKapperName(userProfile.naam)
      } else {
        // Fallback to user email or generic name
        setKapperName(userProfile?.email?.split('@')[0] || 'Kapper')
      }
    } catch (err) {
      console.log('Error loading kapper name, using fallback:', err)
      // Fallback to user email or generic name
      setKapperName(userProfile?.email?.split('@')[0] || 'Kapper')
    }
  }

  async function loadBarbers() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('barbers')
        .select('*')
        .eq('owner_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading barbers:', error)
        setLoading(false)
        return
      }

      setBarbers(data || [])
    } catch (err) {
      console.error('Error loading barbers:', err)
    } finally {
      setLoading(false)
    }
  }

  async function saveBarber(barberData, localServices = []) {
    try {
      // Geocode address to get coordinates
      let coordinates = { lat: null, lng: null }
      
      if (barberData.address && barberData.location) {
        setGeocoding(true)
        try {
          const fullAddress = `${barberData.address}, ${barberData.location}`
          console.log('Geocoding address:', fullAddress)
          
          // Use a simple geocoding service that doesn't require API key
          const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&countrycodes=nl&limit=1`)
          const data = await response.json()
          
          if (data && data.length > 0) {
            const result = data[0]
            coordinates = {
              lat: parseFloat(result.lat),
              lng: parseFloat(result.lon)
            }
            console.log('Geocoding successful:', coordinates)
          } else {
            console.log('Geocoding failed, using fallback coordinates')
            // Fallback to city center coordinates
            const cityCoords = getCityCoordinates(barberData.location)
            if (cityCoords) {
              coordinates = cityCoords
            }
          }
        } catch (geocodeError) {
          console.error('Geocoding error:', geocodeError)
          // Fallback to city center coordinates
          const cityCoords = getCityCoordinates(barberData.location)
          if (cityCoords) {
            coordinates = cityCoords
          }
        } finally {
          setGeocoding(false)
        }
      }

      const dataWithOwner = {
        ...barberData,
        owner_id: user?.id,
        latitude: coordinates.lat,
        longitude: coordinates.lng
      }

      const { data: barberResult, error } = await supabase
        .from('barbers')
        .upsert(dataWithOwner)
        .select()

      if (error) {
        alert('Fout bij opslaan: ' + error.message)
        return
      }

      // Save local services if any
      if (localServices.length > 0) {
        const barberId = barberResult[0]?.id
        if (barberId) {
          const servicesToSave = localServices.map(service => ({
            barber_id: barberId,
            name: service.name,
            price: service.price,
            duration_minutes: service.duration_minutes || 30
          }))

          const { error: servicesError } = await supabase
            .from('services')
            .insert(servicesToSave)

          if (servicesError) {
            console.error('Error saving services:', servicesError)
            alert('Kapperszaak opgeslagen, maar er was een fout bij het opslaan van de diensten.')
          }
          // Note: localServices are managed within BarberForm component
        }
      }

      setShowAddForm(false)
      setEditingBarber(null)
      loadBarbers()
    } catch (err) {
      console.error('Error saving barber:', err)
      alert('Er is een fout opgetreden bij het opslaan.')
    }
  }

  // Helper function to get city coordinates as fallback
  function getCityCoordinates(city) {
    const cities = {
      'Amsterdam': { lat: 52.3676, lng: 4.9041 },
      'Rotterdam': { lat: 51.9225, lng: 4.4792 },
      'Utrecht': { lat: 52.0907, lng: 5.1214 },
      'Den Haag': { lat: 52.0766, lng: 4.3113 },
      'Eindhoven': { lat: 51.4416, lng: 5.4697 },
      'Groningen': { lat: 53.2194, lng: 6.5665 },
      'Tilburg': { lat: 51.5555, lng: 5.0913 },
      'Almere': { lat: 52.3508, lng: 5.2647 },
      'Breda': { lat: 51.5719, lng: 4.7683 },
      'Nijmegen': { lat: 51.8426, lng: 5.8520 },
      'Enschede': { lat: 52.2215, lng: 6.8937 },
      'Haarlem': { lat: 52.3792, lng: 4.6368 },
      'Arnhem': { lat: 51.9851, lng: 5.8987 },
      'Zaanstad': { lat: 52.4531, lng: 4.8296 },
      'Amersfoort': { lat: 52.1561, lng: 5.3878 }
    }
    return cities[city] || null
  }

  async function deleteBarber(id) {
    if (!confirm('Weet je zeker dat je deze kapper wilt verwijderen?')) return

    try {
      const { error } = await supabase
        .from('barbers')
        .delete()
        .eq('id', id)

      if (error) {
        alert('Fout bij verwijderen: ' + error.message)
        return
      }

      loadBarbers()
    } catch (err) {
      console.error('Error deleting barber:', err)
      alert('Er is een fout opgetreden bij het verwijderen.')
    }
  }

  function clearLocalServices() {
    // This function is called from BarberForm but doesn't need to do anything
    // since localServices is managed within BarberForm component
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-secondary/70">
            {!user ? 'Gebruikersgegevens ophalen...' : !userProfile ? 'Profiel laden...' : 'Kapperszaken ophalen...'}
          </p>
          <div className="mt-4 text-xs text-gray-500">
            <div>User: {user ? '✅' : '❌'}</div>
            <div>UserProfile: {userProfile ? '✅' : '❌'}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {kapperName ? <Greeting name={kapperName} /> : 'Kapper Dashboard'}
              </h1>
              <p className="text-gray-600 mt-1">Beheer je kapperszaken en afspraken</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setShowAddForm(true)}
                className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-medium flex items-center space-x-2"
              >
                <Plus size={20} />
                <span>Nieuwe Kapperzaak Toevoegen</span>
              </Button>
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex space-x-1 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <BarChart3 className="h-4 w-4 inline mr-2" />
              Overzicht
            </button>
            <button
              onClick={() => setActiveTab('agenda')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'agenda'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Calendar className="h-4 w-4 inline mr-2" />
              Agenda
            </button>
            <button
              onClick={() => setActiveTab('clients')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'clients'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <UserCheck className="h-4 w-4 inline mr-2" />
              Klanten
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Content */}
        {activeTab === 'overview' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Totaal kapperszaken</p>
                <p className="text-2xl font-bold text-gray-900">{barbers.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-xl">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Vandaag</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-xl">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Deze Week</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-xl">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Gem. Rating</p>
                <p className="text-2xl font-bold text-gray-900">
                  {barbers.length > 0 
                    ? (barbers.reduce((sum, b) => sum + (b.rating || 0), 0) / barbers.length).toFixed(1)
                    : '0.0'
                  }
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Add/Edit Form */}
        {(showAddForm || editingBarber) && (
          <BarberForm
            barber={editingBarber}
            onSave={saveBarber}
            geocoding={geocoding}
            onCancel={() => {
              setShowAddForm(false)
              setEditingBarber(null)
              clearLocalServices()
            }}
          />
        )}

        {/* Barbers List */}
        {barbers.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {barbers.map(barber => (
              <Card key={barber.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                      {barber.name?.charAt(0) || 'K'}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{barber.name}</h3>
                      <p className="text-sm text-gray-600">{barber.location || barber.address}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setEditingBarber(barber)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => deleteBarber(barber.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {barber.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone size={16} className="mr-2" />
                      {barber.phone}
                    </div>
                  )}
                  
                  {barber.website && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Globe size={16} className="mr-2" />
                      <a href={barber.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                        Website
                      </a>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {barber.price_range || '€€'}
                      </span>
                      {barber.rating && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Star size={16} className="mr-1 text-yellow-500" />
                          {barber.rating}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100">
                    <Link
                      to={`/barber/${barber.id}`}
                      className="text-primary hover:text-primary/80 text-sm font-medium"
                    >
                      Bekijk profiel →
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Nog geen kapperszaken</h3>
            <p className="text-gray-600 mb-6">
              Voeg je eerste kapperzaak toe om te beginnen met het beheren van je zaken.
            </p>
            <Button
              onClick={() => setShowAddForm(true)}
              className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-medium"
            >
              <Plus size={20} className="mr-2" />
              Eerste Kapperzaak Toevoegen
            </Button>
          </Card>
        )}
          </>
        )}

        {/* Agenda Tab */}
        {activeTab === 'agenda' && (
          <div className="space-y-6">
            {barbers.length > 0 ? (
              <>
                {/* Salon Selector */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Selecteer kapperszaak</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {barbers.map((barber) => (
                      <button
                        key={barber.id}
                        onClick={() => setSelectedSalon(barber.id)}
                        className={`p-4 rounded-lg border text-left transition-colors ${
                          selectedSalon === barber.id
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <h4 className="font-medium text-gray-900">{barber.name}</h4>
                        <p className="text-sm text-gray-500">{barber.location}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Agenda View */}
                {selectedSalon && (
                  <AgendaView 
                    salonId={selectedSalon}
                    onAppointmentClick={(appointment) => {
                      setSelectedAppointment(appointment)
                      setShowAppointmentModal(true)
                    }}
                  />
                )}
              </>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Geen salons beschikbaar</h3>
                <p className="text-gray-500 mb-6">
                  Voeg eerst een kapperszaak toe om de agenda te kunnen gebruiken.
                </p>
                <Button
                  onClick={() => setShowAddForm(true)}
                  className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-medium"
                >
                  <Plus size={20} className="mr-2" />
                  Eerste Kapperzaak Toevoegen
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Clients Tab */}
        {activeTab === 'clients' && (
          <div className="space-y-6">
            {barbers.length > 0 ? (
              <>
                {/* Salon Selector */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Selecteer kapperszaak</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {barbers.map((barber) => (
                      <button
                        key={barber.id}
                        onClick={() => setSelectedSalon(barber.id)}
                        className={`p-4 rounded-lg border text-left transition-colors ${
                          selectedSalon === barber.id
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <h4 className="font-medium text-gray-900">{barber.name}</h4>
                        <p className="text-sm text-gray-500">{barber.location}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Clients Table */}
                {selectedSalon && (
                  <ClientsTable 
                    salonId={selectedSalon}
                    onEditClient={(client) => {
                      setSelectedClient(client)
                      setShowClientModal(true)
                    }}
                  />
                )}
              </>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Geen salons beschikbaar</h3>
                <p className="text-gray-500 mb-6">
                  Voeg eerst een kapperszaak toe om klanten te kunnen beheren.
                </p>
                <Button
                  onClick={() => setShowAddForm(true)}
                  className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-medium"
                >
                  <Plus size={20} className="mr-2" />
                  Eerste Kapperzaak Toevoegen
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showAppointmentModal && (
        <AppointmentModal
          appointment={selectedAppointment}
          isOpen={showAppointmentModal}
          onClose={() => {
            setShowAppointmentModal(false)
            setSelectedAppointment(null)
          }}
          onEdit={(appointment) => {
            // TODO: Implement edit appointment
            console.log('Edit appointment:', appointment)
          }}
          onDelete={(appointmentId) => {
            // TODO: Implement delete appointment
            console.log('Delete appointment:', appointmentId)
          }}
        />
      )}

      {showClientModal && (
        <ClientModal
          client={selectedClient}
          isOpen={showClientModal}
          onClose={() => {
            setShowClientModal(false)
            setSelectedClient(null)
          }}
          salonId={selectedSalon}
        />
      )}
    </div>
  )
}

function BarberForm({ barber, onSave, onCancel, geocoding }) {
  const [formData, setFormData] = useState({
    name: barber?.name || '',
    description: barber?.description || '',
    location: barber?.location || '',
    address: barber?.address || '',
    phone: barber?.phone || '',
    website: barber?.website || '',
    price_range: barber?.price_range || '€€',
    rating: barber?.rating || '',
    image_url: barber?.image_url || '',
    latitude: barber?.latitude || '',
    longitude: barber?.longitude || '',
    gender_served: barber?.gender_served || 'both'
  })
  
  const [services, setServices] = useState([])
  const [saving, setSaving] = useState(false)
  const [newService, setNewService] = useState({ name: '', price: '', duration_minutes: 30 })
  const [localServices, setLocalServices] = useState([]) // Services die nog niet opgeslagen zijn

  // Load services when barber changes
  useEffect(() => {
    if (barber?.id) {
      loadServices(barber.id)
    }
  }, []) // No dependencies - only run once

  async function loadServices(barberId) {
    if (!barberId) return
    
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('barber_id', barberId)
        .order('name')

      if (error) {
        console.error('Error loading services:', error)
      } else {
        setServices(data || [])
      }
    } catch (err) {
      console.error('Error loading services:', err)
    }
  }

  function addService() {
    if (!newService.name.trim() || !newService.price) return
    
    // Add service to local list
    const service = {
      id: `temp-${Date.now()}`, // Temporary ID
      name: newService.name.trim(),
      price: parseFloat(newService.price),
      duration_minutes: parseInt(newService.duration_minutes) || 30,
      isLocal: true // Flag to indicate it's not saved yet
    }
    
    setLocalServices(prev => [...prev, service])
    setNewService({ name: '', price: '', duration_minutes: 30 })
  }

  function updateLocalService(serviceId, updates) {
    setLocalServices(prev => prev.map(service => 
      service.id === serviceId ? { ...service, ...updates } : service
    ))
  }

  function removeLocalService(serviceId) {
    setLocalServices(prev => prev.filter(service => service.id !== serviceId))
  }

  function clearLocalServices() {
    setLocalServices([])
  }

  async function updateService(serviceId, updates) {
    try {
      const { data, error } = await supabase
        .from('services')
        .update(updates)
        .eq('id', serviceId)
        .select()

      if (error) {
        console.error('Error updating service:', error)
        alert('Fout bij bijwerken van dienst: ' + error.message)
      } else {
        setServices(prev => prev.map(s => s.id === serviceId ? data[0] : s))
      }
    } catch (err) {
      console.error('Error updating service:', err)
      alert('Er is een fout opgetreden bij het bijwerken van de dienst.')
    }
  }

  async function deleteService(serviceId) {
    if (!confirm('Weet je zeker dat je deze dienst wilt verwijderen?')) return
    
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId)

      if (error) {
        console.error('Error deleting service:', error)
        alert('Fout bij verwijderen van dienst: ' + error.message)
      } else {
        setServices(prev => prev.filter(s => s.id !== serviceId))
      }
    } catch (err) {
      console.error('Error deleting service:', err)
      alert('Er is een fout opgetreden bij het verwijderen van de dienst.')
    }
  }

  const serviceTypes = {
    'knippen': { name: 'Knippen', icon: '✂️' },
    'baard': { name: 'Baard trimmen', icon: '🧔' },
    'kleuren': { name: 'Haar kleuren', icon: '🎨' },
    'wassen': { name: 'Wassen & föhnen', icon: '💧' },
    'styling': { name: 'Styling', icon: '💇' },
    'highlights': { name: 'Highlights', icon: '✨' },
    'balayage': { name: 'Balayage', icon: '🌈' },
    'permanent': { name: 'Permanent', icon: '🌊' },
    'keratine': { name: 'Keratine behandeling', icon: '💫' },
    'extensions': { name: 'Hair extensions', icon: '💫' }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    
    const data = {
      ...formData,
      id: barber?.id,
      rating: formData.rating ? parseFloat(formData.rating) : null,
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
    }
    
    await onSave(data, localServices)
    
    // Clear local services after successful save
    setLocalServices([])
    setSaving(false)
  }


  return (
    <Card className="p-8 mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {barber ? 'Kapperzaak Bewerken' : 'Nieuwe Kapperzaak Toevoegen'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Naam *</label>
            <input
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Kapperzaak naam"
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Locatie</label>
            <input
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              placeholder="Stad, dorp"
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Adres</label>
            <input
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              placeholder="Straat en huisnummer"
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Telefoon</label>
            <input
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              placeholder="06-12345678"
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
            <input
              value={formData.website}
              onChange={(e) => setFormData({...formData, website: e.target.value})}
              placeholder="https://www.kapper.nl"
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Prijsniveau</label>
            <select
              value={formData.price_range}
              onChange={(e) => setFormData({...formData, price_range: e.target.value})}
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="€">€ (Budget)</option>
              <option value="€€">€€ (Gemiddeld)</option>
              <option value="€€€">€€€ (Premium)</option>
              <option value="€€€€">€€€€ (Luxury)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rating (1-5)</label>
            <input
              value={formData.rating}
              onChange={(e) => setFormData({...formData, rating: e.target.value})}
              placeholder="4.5"
              type="number"
              min="1"
              max="5"
              step="0.1"
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Geslacht</label>
            <select
              value={formData.gender_served}
              onChange={(e) => setFormData({...formData, gender_served: e.target.value})}
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="both">Beide geslachten</option>
              <option value="man">Alleen mannen</option>
              <option value="vrouw">Alleen vrouwen</option>
            </select>
          </div>
        </div>

        {/* Services Management */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Diensten & Prijzen</label>
          
          {/* Add new service */}
          <div className="bg-gray-50 p-4 rounded-xl mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Nieuwe dienst toevoegen</h4>
            <div className="flex gap-3">
              <input
                value={newService.name}
                onChange={(e) => setNewService({...newService, name: e.target.value})}
                placeholder="Dienst naam (bijv. Knippen)"
                className="flex-1 bg-white border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <input
                value={newService.price}
                onChange={(e) => setNewService({...newService, price: e.target.value})}
                placeholder="Prijs (€)"
                type="number"
                step="0.01"
                min="0"
                className="w-24 bg-white border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <input
                value={newService.duration_minutes}
                onChange={(e) => setNewService({...newService, duration_minutes: e.target.value})}
                placeholder="Duur (min)"
                type="number"
                min="1"
                max="300"
                className="w-24 bg-white border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <button
                type="button"
                onClick={addService}
                disabled={!newService.name.trim() || !newService.price}
                className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Toevoegen
              </button>
            </div>
          </div>

          {/* Existing services */}
          <div className="space-y-2">
            {/* Saved services */}
            {services.map((service) => (
              <ServiceItem 
                key={service.id}
                service={service}
                onUpdate={updateService}
                onDelete={deleteService}
              />
            ))}
            
            {/* Local services (not yet saved) */}
            {localServices.map((service) => (
              <ServiceItem 
                key={service.id}
                service={service}
                onUpdate={updateLocalService}
                onDelete={removeLocalService}
                isLocal={true}
              />
            ))}
            
            {services.length === 0 && localServices.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>Nog geen diensten toegevoegd</p>
                <p className="text-sm">Voeg je eerste dienst toe hierboven</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Beschrijving</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="Beschrijf je kapper..."
            rows={4}
            className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {geocoding && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
              <span className="text-sm text-blue-700">
                Locatie wordt automatisch opgezocht op basis van adres en stad...
              </span>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50"
          >
            Annuleren
          </Button>
          <Button
            type="submit"
            disabled={saving || geocoding}
            className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50"
          >
            {geocoding ? 'Locatie zoeken...' : saving ? 'Opslaan...' : 'Opslaan'}
          </Button>
        </div>
      </form>
    </Card>
  )
}

// ServiceItem component for editing individual services
function ServiceItem({ service, onUpdate, onDelete, isLocal = false }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    name: service.name,
    price: service.price.toString(),
    duration_minutes: service.duration_minutes?.toString() || '30'
  })

  function handleSave() {
    onUpdate(service.id, {
      name: editData.name.trim(),
      price: parseFloat(editData.price),
      duration_minutes: parseInt(editData.duration_minutes) || 30
    })
    setIsEditing(false)
  }

  function handleCancel() {
    setEditData({
      name: service.name,
      price: service.price.toString(),
      duration_minutes: service.duration_minutes?.toString() || '30'
    })
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-4 p-4 bg-white border border-gray-300 rounded-xl shadow-sm">
        <input
          value={editData.name}
          onChange={(e) => setEditData({...editData, name: e.target.value})}
          className="flex-1 bg-transparent border-none focus:outline-none font-medium text-gray-900"
          placeholder="Dienst naam"
        />
        <input
          value={editData.price}
          onChange={(e) => setEditData({...editData, price: e.target.value})}
          type="number"
          step="0.01"
          min="0"
          className="w-24 bg-transparent border-none focus:outline-none text-right font-semibold text-primary"
          placeholder="0.00"
        />
        <input
          value={editData.duration_minutes}
          onChange={(e) => setEditData({...editData, duration_minutes: e.target.value})}
          type="number"
          min="1"
          max="300"
          className="w-20 bg-transparent border-none focus:outline-none text-right text-sm text-gray-600"
          placeholder="30"
        />
        <span className="text-xs text-gray-500">min</span>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-primary text-white text-sm rounded-xl hover:bg-primary/90 transition-colors font-medium"
        >
          Opslaan
        </button>
        <button
          onClick={handleCancel}
          className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-xl hover:bg-gray-200 transition-colors font-medium"
        >
          Annuleren
        </button>
      </div>
    )
  }

  return (
    <div className={`flex items-center justify-between p-4 rounded-xl border ${
      isLocal 
        ? 'bg-blue-50 border-blue-200 shadow-sm' 
        : 'bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow'
    }`}>
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <span className="font-medium text-gray-900">{service.name}</span>
          {isLocal && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-lg font-medium">
              Nieuw
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="font-semibold text-primary text-lg">€{service.price.toFixed(2)}</div>
          <div className="text-xs text-gray-500">{service.duration_minutes || 30} min</div>
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="px-4 py-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors font-medium text-sm"
        >
          Bewerken
        </button>
        <button
          onClick={() => onDelete(service.id)}
          className="px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors font-medium text-sm"
        >
          Verwijderen
        </button>
      </div>
    </div>
  )
}

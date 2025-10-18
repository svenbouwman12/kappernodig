import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Card from '../../components/Card.jsx'
import Button from '../../components/Button.jsx'
import { 
  Building2, 
  MapPin, 
  Star, 
  Wrench, 
  Calendar, 
  MessageSquare,
  User,
  ArrowLeft,
  Edit,
  Trash2,
  Plus,
  Eye,
  Save,
  X,
  Phone,
  Globe,
  Mail
} from 'lucide-react'

const KapperszaakDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  
  // Main data
  const [kapperszaak, setKapperszaak] = useState(null)
  const [owner, setOwner] = useState(null)
  
  // Tab data
  const [services, setServices] = useState([])
  const [appointments, setAppointments] = useState([])
  const [reviews, setReviews] = useState([])
  const [clients, setClients] = useState([])
  
  // Edit states
  const [editingKapperszaak, setEditingKapperszaak] = useState(false)
  const [editingService, setEditingService] = useState(null)
  const [editingReview, setEditingReview] = useState(null)
  const [editingClient, setEditingClient] = useState(null)
  
  // Form states
  const [kapperszaakForm, setKapperszaakForm] = useState({})
  const [serviceForm, setServiceForm] = useState({})
  const [reviewForm, setReviewForm] = useState({})
  const [clientForm, setClientForm] = useState({})

  useEffect(() => {
    if (id) {
      loadAllData()
    }
  }, [id])

  const loadAllData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        loadKapperszaakData(),
        loadServices(),
        loadAppointments(),
        loadReviews(),
        loadClients()
      ])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadKapperszaakData = async () => {
    try {
      // Load kapperszaak details
      const { data: kapperszaakData, error: kapperszaakError } = await supabase
        .from('barbers')
        .select('*')
        .eq('id', id)
        .single()

      if (kapperszaakError) {
        console.error('Error loading kapperszaak:', kapperszaakError)
        return
      }

      setKapperszaak(kapperszaakData)
      setKapperszaakForm(kapperszaakData)

      // Load owner profile
      if (kapperszaakData.owner_id) {
        const { data: ownerData, error: ownerError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', kapperszaakData.owner_id)
          .single()

        if (ownerError) {
          console.error('Error loading owner:', ownerError)
          // Don't return, just continue without owner data
          setOwner(null)
        } else {
          setOwner(ownerData)
        }
      } else {
        setOwner(null)
      }
    } catch (error) {
      console.error('Error loading kapperszaak data:', error)
    }
  }

  const loadServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('barber_id', id)
        .order('name')

      if (error) {
        console.error('Error loading services:', error)
        return
      }

      setServices(data || [])
    } catch (error) {
      console.error('Error loading services:', error)
    }
  }

  const loadAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('barber_id', id)
        .order('start_tijd', { ascending: false })

      if (error) {
        console.error('Error loading appointments:', error)
        return
      }

      setAppointments(data || [])
    } catch (error) {
      console.error('Error loading appointments:', error)
    }
  }

  const loadReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('salon_id', id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading reviews:', error)
        return
      }

      setReviews(data || [])
    } catch (error) {
      console.error('Error loading reviews:', error)
    }
  }

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'client')
        .order('naam')

      if (error) {
        console.error('Error loading clients:', error)
        return
      }

      setClients(data || [])
    } catch (error) {
      console.error('Error loading clients:', error)
    }
  }

  // Save functions
  const saveKapperszaak = async () => {
    try {
      const { error } = await supabase
        .from('barbers')
        .update(kapperszaakForm)
        .eq('id', id)

      if (error) {
        console.error('Error saving kapperszaak:', error)
        alert('Er is een fout opgetreden bij het opslaan.')
        return
      }

      setKapperszaak(kapperszaakForm)
      setEditingKapperszaak(false)
      alert('Kapperszaak succesvol bijgewerkt!')
    } catch (error) {
      console.error('Error saving kapperszaak:', error)
      alert('Er is een fout opgetreden bij het opslaan.')
    }
  }

  const saveService = async () => {
    try {
      const serviceData = {
        ...serviceForm,
        barber_id: id
      }

      const { error } = await supabase
        .from('services')
        .upsert(serviceData)

      if (error) {
        console.error('Error saving service:', error)
        alert('Er is een fout opgetreden bij het opslaan van de dienst.')
        return
      }

      setEditingService(null)
      setServiceForm({})
      loadServices()
      alert('Dienst succesvol opgeslagen!')
    } catch (error) {
      console.error('Error saving service:', error)
      alert('Er is een fout opgetreden bij het opslaan van de dienst.')
    }
  }

  const saveReview = async () => {
    try {
      const reviewData = {
        ...reviewForm,
        salon_id: id
      }

      const { error } = await supabase
        .from('reviews')
        .upsert(reviewData)

      if (error) {
        console.error('Error saving review:', error)
        alert('Er is een fout opgetreden bij het opslaan van de review.')
        return
      }

      setEditingReview(null)
      setReviewForm({})
      loadReviews()
      alert('Review succesvol opgeslagen!')
    } catch (error) {
      console.error('Error saving review:', error)
      alert('Er is een fout opgetreden bij het opslaan van de review.')
    }
  }

  // Delete functions
  const deleteService = async (serviceId) => {
    if (!confirm('Weet je zeker dat je deze dienst wilt verwijderen?')) return

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId)

      if (error) {
        console.error('Error deleting service:', error)
        alert('Er is een fout opgetreden bij het verwijderen.')
        return
      }

      loadServices()
      alert('Dienst succesvol verwijderd!')
    } catch (error) {
      console.error('Error deleting service:', error)
      alert('Er is een fout opgetreden bij het verwijderen.')
    }
  }

  const deleteReview = async (reviewId) => {
    if (!confirm('Weet je zeker dat je deze review wilt verwijderen?')) return

    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId)

      if (error) {
        console.error('Error deleting review:', error)
        alert('Er is een fout opgetreden bij het verwijderen.')
        return
      }

      loadReviews()
      alert('Review succesvol verwijderd!')
    } catch (error) {
      console.error('Error deleting review:', error)
      alert('Er is een fout opgetreden bij het verwijderen.')
    }
  }

  const deleteClient = async (clientId) => {
    if (!confirm('Weet je zeker dat je deze klant wilt verwijderen?')) return

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', clientId)

      if (error) {
        console.error('Error deleting client:', error)
        alert('Er is een fout opgetreden bij het verwijderen.')
        return
      }

      loadClients()
      alert('Klant succesvol verwijderd!')
    } catch (error) {
      console.error('Error deleting client:', error)
      alert('Er is een fout opgetreden bij het verwijderen.')
    }
  }

  const tabs = [
    { id: 'overview', label: 'Algemene Info', icon: Building2 },
    { id: 'services', label: 'Diensten', icon: Wrench },
    { id: 'agenda', label: 'Agenda', icon: Calendar },
    { id: 'reviews', label: 'Reviews', icon: MessageSquare },
    { id: 'clients', label: 'Klanten', icon: User },
    { id: 'owner', label: 'Eigenaar', icon: User }
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Gegevens laden...</p>
        </div>
      </div>
    )
  }

  if (!kapperszaak) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Kapperszaak niet gevonden</h2>
          <Button onClick={() => navigate('/admin')}>
            Terug naar Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="flex items-center justify-between h-16 px-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/admin')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={20} />
              <span>Terug naar Dashboard</span>
            </button>
          </div>
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-primary">{kapperszaak.name}</h1>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm min-h-screen">
          <div className="p-6">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={20} />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {activeTab === 'overview' && (
            <OverviewTab 
              kapperszaak={kapperszaak}
              editingKapperszaak={editingKapperszaak}
              setEditingKapperszaak={setEditingKapperszaak}
              kapperszaakForm={kapperszaakForm}
              setKapperszaakForm={setKapperszaakForm}
              saveKapperszaak={saveKapperszaak}
            />
          )}
          
          {activeTab === 'services' && (
            <ServicesTab 
              services={services}
              editingService={editingService}
              setEditingService={setEditingService}
              serviceForm={serviceForm}
              setServiceForm={setServiceForm}
              saveService={saveService}
              deleteService={deleteService}
            />
          )}
          
          {activeTab === 'agenda' && (
            <AgendaTab appointments={appointments} />
          )}
          
          {activeTab === 'reviews' && (
            <ReviewsTab 
              reviews={reviews}
              editingReview={editingReview}
              setEditingReview={setEditingReview}
              reviewForm={reviewForm}
              setReviewForm={setReviewForm}
              saveReview={saveReview}
              deleteReview={deleteReview}
            />
          )}
          
          {activeTab === 'clients' && (
            <ClientsTab 
              clients={clients}
              editingClient={editingClient}
              setEditingClient={setEditingClient}
              clientForm={clientForm}
              setClientForm={setClientForm}
              deleteClient={deleteClient}
            />
          )}
          
          {activeTab === 'owner' && (
            <OwnerTab owner={owner} />
          )}
        </div>
      </div>
    </div>
  )
}

// Tab Components
const OverviewTab = ({ 
  kapperszaak, 
  editingKapperszaak, 
  setEditingKapperszaak, 
  kapperszaakForm, 
  setKapperszaakForm, 
  saveKapperszaak 
}) => (
  <Card className="p-6">
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-bold text-gray-900">Algemene Informatie</h2>
      <Button
        onClick={() => editingKapperszaak ? saveKapperszaak() : setEditingKapperszaak(true)}
        className="flex items-center space-x-2"
      >
        {editingKapperszaak ? <Save size={16} /> : <Edit size={16} />}
        <span>{editingKapperszaak ? 'Opslaan' : 'Bewerken'}</span>
      </Button>
    </div>

    {editingKapperszaak ? (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Naam</label>
          <input
            type="text"
            value={kapperszaakForm.name || ''}
            onChange={(e) => setKapperszaakForm({...kapperszaakForm, name: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Locatie</label>
          <input
            type="text"
            value={kapperszaakForm.location || ''}
            onChange={(e) => setKapperszaakForm({...kapperszaakForm, location: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Telefoon</label>
          <input
            type="text"
            value={kapperszaakForm.phone || ''}
            onChange={(e) => setKapperszaakForm({...kapperszaakForm, phone: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
          <input
            type="text"
            value={kapperszaakForm.website || ''}
            onChange={(e) => setKapperszaakForm({...kapperszaakForm, website: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Beschrijving</label>
          <textarea
            value={kapperszaakForm.description || ''}
            onChange={(e) => setKapperszaakForm({...kapperszaakForm, description: e.target.value})}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <div className="md:col-span-2 flex space-x-3">
          <Button onClick={saveKapperszaak}>
            <Save size={16} className="mr-2" />
            Opslaan
          </Button>
          <Button variant="secondary" onClick={() => setEditingKapperszaak(false)}>
            <X size={16} className="mr-2" />
            Annuleren
          </Button>
        </div>
      </div>
    ) : (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Basis Informatie</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <Building2 className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-gray-900">{kapperszaak.name}</span>
              </div>
              <div className="flex items-center">
                <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-gray-900">{kapperszaak.location}</span>
              </div>
              {kapperszaak.phone && (
                <div className="flex items-center">
                  <Phone className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-gray-900">{kapperszaak.phone}</span>
                </div>
              )}
              {kapperszaak.website && (
                <div className="flex items-center">
                  <Globe className="h-5 w-5 text-gray-400 mr-3" />
                  <a href={kapperszaak.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {kapperszaak.website}
                  </a>
                </div>
              )}
            </div>
          </div>
          
          {kapperszaak.description && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Beschrijving</h3>
              <p className="text-gray-700 leading-relaxed">{kapperszaak.description}</p>
            </div>
          )}
        </div>
      </div>
    )}
  </Card>
)

const ServicesTab = ({ 
  services, 
  editingService, 
  setEditingService, 
  serviceForm, 
  setServiceForm, 
  saveService, 
  deleteService 
}) => (
  <Card className="p-6">
    <div className syn="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-bold text-gray-900">Diensten</h2>
      <Button
        onClick={() => {
          setEditingService({})
          setServiceForm({})
        }}
        className="flex items-center space-x-2"
      >
        <Plus size={16} />
        <span>Nieuwe Dienst</span>
      </Button>
    </div>

    {editingService && (
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {editingService.id ? 'Dienst Bewerken' : 'Nieuwe Dienst'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Naam</label>
            <input
              type="text"
              value={serviceForm.name || ''}
              onChange={(e) => setServiceForm({...serviceForm, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prijs (€)</label>
            <input
              type="number"
              step="0.01"
              value={serviceForm.price || ''}
              onChange={(e) => setServiceForm({...serviceForm, price: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duur (minuten)</label>
            <input
              type="number"
              value={serviceForm.duration || ''}
              onChange={(e) => setServiceForm({...serviceForm, duration: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div className="md:col-span-2 flex space-x-3">
            <Button onClick={saveService}>
              <Save size={16} className="mr-2" />
              Opslaan
            </Button>
            <Button variant="secondary" onClick={() => setEditingService(null)}>
              <X size={16} className="mr-2" />
              Annuleren
            </Button>
          </div>
        </div>
      </div>
    )}

    <div className="space-y-4">
      {services.map((service) => (
        <div key={service.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h3 className="font-medium text-gray-900">{service.name}</h3>
            <p className="text-sm text-gray-600">€{service.price} • {service.duration} minuten</p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="secondary"
              onClick={() => {
                setEditingService(service)
                setServiceForm(service)
              }}
            >
              <Edit size={16} />
            </Button>
            <Button
              variant="secondary"
              onClick={() => deleteService(service.id)}
              className="text-red-600 hover:bg-red-50"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        </div>
      ))}
      
      {services.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Geen diensten gevonden. Voeg er een toe om te beginnen.
        </div>
      )}
    </div>
  </Card>
)

const AgendaTab = ({ appointments }) => (
  <Card className="p-6">
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-bold text-gray-900">Agenda</h2>
    </div>

    <div className="space-y-4">
      {appointments.map((appointment) => (
        <div key={appointment.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h3 className="font-medium text-gray-900">
              {new Date(appointment.start_tijd).toLocaleDateString('nl-NL')} om {new Date(appointment.start_tijd).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
            </h3>
            <p className="text-sm text-gray-600">{appointment.client_name} • {appointment.service_name}</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="secondary">
              <Eye size={16} />
            </Button>
            <Button variant="secondary">
              <Edit size={16} />
            </Button>
            <Button variant="secondary" className="text-red-600 hover:bg-red-50">
              <Trash2 size={16} />
            </Button>
          </div>
        </div>
      ))}
      
      {appointments.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Geen afspraken gevonden.
        </div>
      )}
    </div>
  </Card>
)

const ReviewsTab = ({ 
  reviews, 
  editingReview, 
  setEditingReview, 
  reviewForm, 
  setReviewForm, 
  saveReview, 
  deleteReview 
}) => (
  <Card className="p-6">
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-bold text-gray-900">Reviews</h2>
    </div>

    <div className="space-y-4">
      {reviews.map((review) => (
        <div key={review.id} className="p-4 border border-gray-200 rounded-lg">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center mb-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star}
                    size={16} 
                    className={star <= review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'} 
                  />
                ))}
                <span className="ml-2 text-sm font-medium">{review.rating}/5</span>
              </div>
              <p className="text-gray-900">{review.content}</p>
              <p className="text-sm text-gray-500 mt-1">
                Door {review.client_name} • {new Date(review.created_at).toLocaleDateString('nl-NL')}
              </p>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setEditingReview(review)
                  setReviewForm(review)
                }}
              >
                <Edit size={16} />
              </Button>
              <Button
                variant="secondary"
                onClick={() => deleteReview(review.id)}
                className="text-red-600 hover:bg-red-50"
              >
                <Trash2 size={16} />
              </Button>
            </div>
          </div>
        </div>
      ))}
      
      {reviews.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Geen reviews gevonden.
        </div>
      )}
    </div>
  </Card>
)

const ClientsTab = ({ 
  clients, 
  editingClient, 
  setEditingClient, 
  clientForm, 
  setClientForm, 
  deleteClient 
}) => (
  <Card className="p-6">
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-bold text-gray-900">Klanten</h2>
    </div>

    <div className="space-y-4">
      {clients.map((client) => (
        <div key={client.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h3 className="font-medium text-gray-900">{client.naam}</h3>
            <p className="text-sm text-gray-600">{client.email}</p>
            {client.phone && <p className="text-sm text-gray-600">{client.phone}</p>}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="secondary"
              onClick={() => {
                setEditingClient(client)
                setClientForm(client)
              }}
            >
              <Edit size={16} />
            </Button>
            <Button
              variant="secondary"
              onClick={() => deleteClient(client.id)}
              className="text-red-600 hover:bg-red-50"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        </div>
      ))}
      
      {clients.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Geen klanten gevonden.
        </div>
      )}
    </div>
  </Card>
)

const OwnerTab = ({ owner }) => (
  <Card className="p-6">
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-bold text-gray-900">Eigenaar Informatie</h2>
    </div>

    {owner ? (
      <div className="space-y-4">
        <div className="flex items-center">
          <User className="h-5 w-5 text-gray-400 mr-3" />
          <span className="text-gray-900">{owner.naam}</span>
        </div>
        <div className="flex items-center">
          <Mail className="h-5 w-5 text-gray-400 mr-3" />
          <span className="text-gray-900">{owner.email}</span>
        </div>
        {owner.phone && (
          <div className="flex items-center">
            <Phone className="h-5 w-5 text-gray-400 mr-3" />
            <span className="text-gray-900">{owner.phone}</span>
          </div>
        )}
      </div>
    ) : (
      <div className="text-center py-8 text-gray-500">
        Geen eigenaar informatie gevonden.
      </div>
    )}
  </Card>
)

export default KapperszaakDetail

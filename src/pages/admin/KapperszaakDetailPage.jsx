import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Card from '../../components/Card.jsx'
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
  Eye
} from 'lucide-react'

const KapperszaakDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [kapperszaak, setKapperszaak] = useState(null)
  const [owner, setOwner] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  
  // Data states
  const [services, setServices] = useState([])
  const [appointments, setAppointments] = useState([])
  const [reviews, setReviews] = useState([])
  const [clients, setClients] = useState([])

  useEffect(() => {
    if (id) {
      loadKapperszaakData()
    }
  }, [id])

  const loadKapperszaakData = async () => {
    setLoading(true)
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

      // Load owner info
      const { data: ownerData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', kapperszaakData.owner_id)
        .single()

      setOwner(ownerData)

      // Load all related data
      await loadRelatedData(id)

    } catch (err) {
      console.error('Error loading kapperszaak data:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadRelatedData = async (kapperszaakId) => {
    try {
      // Load services
      const { data: servicesData } = await supabase
        .from('services')
        .select('*')
        .eq('barber_id', kapperszaakId)
        .order('name')

      setServices(servicesData || [])

      // Load appointments
      const { data: appointmentsData } = await supabase
        .from('appointments')
        .select(`
          *,
          profiles!appointments_client_id_fkey (
            id,
            naam,
            email
          )
        `)
        .eq('barber_id', kapperszaakId)
        .order('appointment_date', { ascending: false })

      setAppointments(appointmentsData || [])

      // Load reviews
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('*')
        .eq('salon_id', kapperszaakId)
        .order('created_at', { ascending: false })

      setReviews(reviewsData || [])

      // Load unique clients
      const uniqueClientIds = [...new Set(appointments.map(apt => apt.client_id))]
      if (uniqueClientIds.length > 0) {
        const { data: clientsData } = await supabase
          .from('profiles')
          .select('*')
          .in('id', uniqueClientIds)

        setClients(clientsData || [])
      }

    } catch (err) {
      console.error('Error loading related data:', err)
    }
  }

  const sidebarItems = [
    { id: 'overview', label: 'Overzicht', icon: Building2 },
    { id: 'owner', label: 'Eigenaar', icon: User },
    { id: 'services', label: 'Diensten', icon: Wrench },
    { id: 'appointments', label: 'Afspraken', icon: Calendar },
    { id: 'clients', label: 'Klanten', icon: User },
    { id: 'reviews', label: 'Reviews', icon: MessageSquare }
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Wrench className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Diensten</p>
                    <p className="text-2xl font-bold text-gray-900">{services.length}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Calendar className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Afspraken</p>
                    <p className="text-2xl font-bold text-gray-900">{appointments.length}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <MessageSquare className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Reviews</p>
                    <p className="text-2xl font-bold text-gray-900">{reviews.length}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <User className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Klanten</p>
                    <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Kapperszaak Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Naam</label>
                  <p className="text-gray-900">{kapperszaak?.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Locatie</label>
                  <p className="text-gray-900">{kapperszaak?.location}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                    <span className="text-gray-900">{kapperszaak?.rating || 'N/A'}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Aangemaakt</label>
                  <p className="text-gray-900">
                    {kapperszaak?.created_at ? new Date(kapperszaak.created_at).toLocaleDateString('nl-NL') : 'N/A'}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )

      case 'owner':
        return (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Eigenaar Informatie</h3>
              <button className="flex items-center px-3 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90">
                <Edit className="h-4 w-4 mr-2" />
                Bewerken
              </button>
            </div>
            {owner ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Naam</label>
                  <p className="text-gray-900">{owner.naam}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <p className="text-gray-900">{owner.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                  <p className="text-gray-900">{owner.role}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Aangemaakt</label>
                  <p className="text-gray-900">
                    {owner.created_at ? new Date(owner.created_at).toLocaleDateString('nl-NL') : 'N/A'}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Geen eigenaar informatie gevonden</p>
            )}
          </Card>
        )

      case 'services':
        return (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Diensten</h3>
              <button className="flex items-center px-3 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Dienst Toevoegen
              </button>
            </div>
            <div className="space-y-4">
              {services.length > 0 ? (
                services.map((service) => (
                  <div key={service.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{service.name}</h4>
                      <p className="text-sm text-gray-600">{service.description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-gray-900">€{service.price}</span>
                      <button className="p-2 text-gray-400 hover:text-gray-600">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-red-400 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">Geen diensten gevonden</p>
              )}
            </div>
          </Card>
        )

      case 'appointments':
        return (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Afspraken</h3>
              <button className="flex items-center px-3 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Afspraak Toevoegen
              </button>
            </div>
            <div className="space-y-4">
              {appointments.length > 0 ? (
                appointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {appointment.profiles?.naam || 'Onbekende klant'}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {new Date(appointment.appointment_date).toLocaleDateString('nl-NL')} om {appointment.appointment_time}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                        appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {appointment.status || 'pending'}
                      </span>
                      <button className="p-2 text-gray-400 hover:text-gray-600">
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">Geen afspraken gevonden</p>
              )}
            </div>
          </Card>
        )

      case 'clients':
        return (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Klanten</h3>
              <button className="flex items-center px-3 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90">
                <Eye className="h-4 w-4 mr-2" />
                Alle Klanten Bekijken
              </button>
            </div>
            <div className="space-y-4">
              {clients.length > 0 ? (
                clients.map((client) => (
                  <div key={client.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{client.naam}</h4>
                      <p className="text-sm text-gray-600">{client.email}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">
                        {appointments.filter(apt => apt.client_id === client.id).length} afspraken
                      </span>
                      <button className="p-2 text-gray-400 hover:text-gray-600">
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">Geen klanten gevonden</p>
              )}
            </div>
          </Card>
        )

      case 'reviews':
        return (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Reviews</h3>
              <button className="flex items-center px-3 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90">
                <Eye className="h-4 w-4 mr-2" />
                Alle Reviews Bekijken
              </button>
            </div>
            <div className="space-y-4">
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <div key={review.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="font-medium text-gray-900">{review.reviewer_name}</span>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        review.is_approved ? 'bg-green-100 text-green-800' :
                        review.is_published ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {review.is_approved ? 'Goedgekeurd' : review.is_published ? 'Gepubliceerd' : 'In behandeling'}
                      </span>
                    </div>
                    <h4 className="font-medium text-gray-900 mb-1">{review.title}</h4>
                    <p className="text-sm text-gray-600">{review.content}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(review.created_at).toLocaleDateString('nl-NL')}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">Geen reviews gevonden</p>
              )}
            </div>
          </Card>
        )

      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!kapperszaak) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Kapperszaak niet gevonden</h3>
        <p className="text-gray-500 mb-4">De opgevraagde kapperszaak bestaat niet of is verwijderd.</p>
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center mx-auto px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Terug naar Overzicht
        </button>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 p-6">
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Terug naar Overzicht
          </button>
          <h2 className="text-xl font-bold text-gray-900">{kapperszaak.name}</h2>
          <p className="text-sm text-gray-600">{kapperszaak.location}</p>
        </div>

        <nav className="space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                  activeTab === item.id
                    ? 'bg-primary text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-4 w-4 mr-3" />
                {item.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-auto">
        {renderTabContent()}
      </div>
    </div>
  )
}

export default KapperszaakDetailPage

import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Link } from 'react-router-dom'
import Card from '../../components/Card.jsx'
import { 
  Building2, 
  MapPin, 
  Star, 
  Wrench, 
  Calendar, 
  MessageSquare,
  User
} from 'lucide-react'

const AdminDashboardPage = () => {
  const [kapperszaken, setKapperszaken] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadKapperszaken()
  }, [])

  const loadKapperszaken = async () => {
    setLoading(true)
    try {
      // Load kapperszaken with owner info
      const { data: kapperszakenData, error: kapperszakenError } = await supabase
        .from('barbers')
        .select('*')
        .order('created_at', { ascending: false })

      if (kapperszakenError) {
        console.error('Error loading kapperszaken:', kapperszakenError)
        return
      }

      // Load owner info for each kapperszaak
      const kapperszakenWithOwners = await Promise.all(
        (kapperszakenData || []).map(async (kapperszaak) => {
          const { data: ownerData } = await supabase
            .from('profiles')
            .select('id, naam, email')
            .eq('id', kapperszaak.owner_id)
            .single()

          // Load reviews count
          const { count: reviewsCount } = await supabase
            .from('reviews')
            .select('*', { count: 'exact' })
            .eq('salon_id', kapperszaak.id)
            .eq('is_published', true)
            .eq('is_approved', true)

          // Load services count
          const { count: servicesCount } = await supabase
            .from('services')
            .select('*', { count: 'exact' })
            .eq('barber_id', kapperszaak.id)

          // Load appointments count
          const { count: appointmentsCount } = await supabase
            .from('appointments')
            .select('*', { count: 'exact' })
            .eq('barber_id', kapperszaak.id)

          return {
            ...kapperszaak,
            owner: ownerData,
            reviewsCount: reviewsCount || 0,
            servicesCount: servicesCount || 0,
            appointmentsCount: appointmentsCount || 0
          }
        })
      )

      setKapperszaken(kapperszakenWithOwners)
    } catch (err) {
      console.error('Error loading kapperszaken:', err)
    } finally {
      setLoading(false)
    }
  }

  // Filter kapperszaken based on search term
  const filteredKapperszaken = kapperszaken.filter(kapperszaak =>
    kapperszaak.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    kapperszaak.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (kapperszaak.owner && kapperszaak.owner.naam.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 min-h-full">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Kapperszaken Beheer</h1>
        <p className="mt-2 text-gray-600">
          Beheer alle kapperszaken en hun details
        </p>
      </div>

      {/* Search Bar */}
      <Card className="p-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Zoek op naam, locatie of eigenaar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </Card>

      {/* Kapperszaken Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredKapperszaken.map((kapperszaak) => (
          <Link
            key={kapperszaak.id}
            to={`/admin/kapperszaken/${kapperszaak.id}`}
            className="block"
          >
            <Card className="p-6 hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {kapperszaak.name}
                    </h3>
                    <p className="text-sm text-gray-600 flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {kapperszaak.location}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center text-yellow-500">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="ml-1 text-sm font-medium">{kapperszaak.rating || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Owner Info */}
              {kapperszaak.owner && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {kapperszaak.owner.naam}
                      </p>
                      <p className="text-xs text-gray-500">{kapperszaak.owner.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="flex flex-col items-center">
                  <Wrench className="h-5 w-5 text-blue-500 mb-1" />
                  <span className="text-sm font-medium text-gray-900">{kapperszaak.servicesCount}</span>
                  <span className="text-xs text-gray-500">Diensten</span>
                </div>
                <div className="flex flex-col items-center">
                  <Calendar className="h-5 w-5 text-green-500 mb-1" />
                  <span className="text-sm font-medium text-gray-900">{kapperszaak.appointmentsCount}</span>
                  <span className="text-xs text-gray-500">Afspraken</span>
                </div>
                <div className="flex flex-col items-center">
                  <MessageSquare className="h-5 w-5 text-purple-500 mb-1" />
                  <span className="text-sm font-medium text-gray-900">{kapperszaak.reviewsCount}</span>
                  <span className="text-xs text-gray-500">Reviews</span>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {filteredKapperszaken.length === 0 && (
        <Card className="p-12 text-center">
          <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Geen kapperszaken gevonden</h3>
          <p className="text-gray-500">
            {searchTerm ? 'Probeer een andere zoekterm.' : 'Er zijn nog geen kapperszaken geregistreerd.'}
          </p>
        </Card>
      )}
    </div>
  )
}

export default AdminDashboardPage
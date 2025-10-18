import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Card from '../../components/Card.jsx'
import { 
  Users, 
  UserCheck, 
  Building2, 
  Calendar, 
  MessageSquare, 
  TrendingUp,
  Clock,
  Star
} from 'lucide-react'

const AdminDashboardPage = () => {
  const [stats, setStats] = useState({
    kappers: 0,
    klanten: 0,
    kapperszaken: 0,
    boekingen: 0,
    reviews: 0,
    diensten: 0,
    pendingReviews: 0,
    todayBookings: 0
  })
  const [loading, setLoading] = useState(true)
  const [recentBookings, setRecentBookings] = useState([])
  const [topKapperszaken, setTopKapperszaken] = useState([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      // Load all statistics in parallel
      const [
        kappersResult,
        klantenResult,
        kapperszakenResult,
        boekingenResult,
        reviewsResult,
        dienstenResult,
        pendingReviewsResult,
        todayBookingsResult
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'kapper'),
        supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'client'),
        supabase.from('barbers').select('id', { count: 'exact' }),
        supabase.from('appointments').select('id', { count: 'exact' }),
        supabase.from('reviews').select('id', { count: 'exact' }).eq('is_published', true),
        supabase.from('services').select('id', { count: 'exact' }),
        supabase.from('reviews').select('id', { count: 'exact' }).eq('is_approved', false),
        supabase.from('appointments').select('id', { count: 'exact' }).gte('created_at', new Date().toISOString().split('T')[0])
      ])

      setStats({
        kappers: kappersResult.count || 0,
        klanten: klantenResult.count || 0,
        kapperszaken: kapperszakenResult.count || 0,
        boekingen: boekingenResult.count || 0,
        reviews: reviewsResult.count || 0,
        diensten: dienstenResult.count || 0,
        pendingReviews: pendingReviewsResult.count || 0,
        todayBookings: todayBookingsResult.count || 0
      })

      // Load recent bookings
      const { data: bookings } = await supabase
        .from('appointments')
        .select(`
          *,
          barbers (name),
          clients (naam)
        `)
        .order('created_at', { ascending: false })
        .limit(5)

      setRecentBookings(bookings || [])

      // Load top kapperszaken by bookings
      const { data: topSalons } = await supabase
        .from('barbers')
        .select(`
          *,
          appointments (id)
        `)
        .order('created_at', { ascending: false })
        .limit(5)

      setTopKapperszaken(topSalons || [])

    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Kappers',
      value: stats.kappers,
      icon: Users,
      color: 'bg-blue-500',
      change: '+12%'
    },
    {
      title: 'Klanten',
      value: stats.klanten,
      icon: UserCheck,
      color: 'bg-green-500',
      change: '+8%'
    },
    {
      title: 'Kapperszaken',
      value: stats.kapperszaken,
      icon: Building2,
      color: 'bg-purple-500',
      change: '+5%'
    },
    {
      title: 'Boekingen',
      value: stats.boekingen,
      icon: Calendar,
      color: 'bg-orange-500',
      change: '+15%'
    },
    {
      title: 'Reviews',
      value: stats.reviews,
      icon: MessageSquare,
      color: 'bg-pink-500',
      change: '+23%'
    },
    {
      title: 'Diensten',
      value: stats.diensten,
      icon: TrendingUp,
      color: 'bg-indigo-500',
      change: '+3%'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Overzicht van je kapperssoftware platform
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-green-600">{stat.change}</p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Alert Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Reviews in behandeling</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingReviews}</p>
              <p className="text-sm text-yellow-600">Wachten op goedkeuring</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Boekingen vandaag</p>
              <p className="text-2xl font-bold text-gray-900">{stats.todayBookings}</p>
              <p className="text-sm text-green-600">Nieuwe afspraken</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recente Boekingen</h3>
          <div className="space-y-3">
            {recentBookings.length > 0 ? (
              recentBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {booking.clients?.naam || 'Onbekende klant'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {booking.barbers?.name || 'Onbekende kapper'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-900">
                      {new Date(booking.appointment_date).toLocaleDateString('nl-NL')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {booking.appointment_time}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">Geen recente boekingen</p>
            )}
          </div>
        </Card>

        {/* Top Kapperszaken */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Kapperszaken</h3>
          <div className="space-y-3">
            {topKapperszaken.length > 0 ? (
              topKapperszaken.map((salon) => (
                <div key={salon.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{salon.name}</p>
                    <p className="text-xs text-gray-500">{salon.location}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-900">
                      {salon.rating || 'N/A'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">Geen kapperszaken gevonden</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

export default AdminDashboardPage

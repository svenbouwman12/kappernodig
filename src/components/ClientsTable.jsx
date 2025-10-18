import React, { useState, useEffect } from 'react'
import { Search, Filter, Edit, Phone, Mail, Calendar, User, Eye } from 'lucide-react'
import { supabase } from '../lib/supabase'
import ClientDetailModal from './ClientDetailModal.jsx'

export default function ClientsTable({ salonId, onEditClient }) {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterBy, setFilterBy] = useState('all') // all, recent, frequent
  const [selectedClient, setSelectedClient] = useState(null)
  const [showClientDetail, setShowClientDetail] = useState(false)

  useEffect(() => {
    if (salonId) {
      loadClients()
    }
  }, [salonId])

  async function loadClients() {
    if (!salonId) return

    setLoading(true)
    try {
      // Load clients with appointment count
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .eq('salon_id', salonId)
        .order('naam')

      if (clientsError) {
        console.error('Error loading clients:', clientsError)
        setClients([])
        return
      }

      // Load appointment counts for each client
      const clientsWithCounts = await Promise.all(
        (clientsData || []).map(async (client) => {
          const { count } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('salon_id', salonId)
            .eq('klant_id', client.id)

          return {
            ...client,
            appointmentCount: count || 0
          }
        })
      )

      setClients(clientsWithCounts)
    } catch (err) {
      console.error('Error loading clients:', err)
      setClients([])
    } finally {
      setLoading(false)
    }
  }

  // Filter clients based on search and filter
  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.naam.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.telefoon.includes(searchTerm) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = (() => {
      switch (filterBy) {
        case 'recent':
          if (!client.laatste_afspraak) return false
          const lastAppointment = new Date(client.laatste_afspraak)
          const thirtyDaysAgo = new Date()
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
          return lastAppointment > thirtyDaysAgo
        case 'frequent':
          return client.appointmentCount >= 3
        default:
          return true
      }
    })()

    return matchesSearch && matchesFilter
  })

  const formatDate = (dateString) => {
    if (!dateString) return 'Geen afspraken'
    const date = new Date(dateString)
    return date.toLocaleDateString('nl-NL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleClientClick = (client) => {
    setSelectedClient(client)
    setShowClientDetail(true)
  }

  const handleClientUpdated = () => {
    loadClients()
  }

  const handleAppointmentAdded = () => {
    loadClients()
  }

  if (!salonId) {
    return (
      <div className="p-8 text-center">
        <div className="text-gray-500">Geen salon geselecteerd</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Klantenbeheer</h2>
            <p className="text-sm text-gray-500">Beheer je klanten en hun afspraken</p>
          </div>
          <div className="text-sm text-gray-500">
            {filteredClients.length} van {clients.length} klanten
          </div>
        </div>
      </div>

      {/* Search and filters */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Zoek op naam, telefoon of email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">Alle klanten</option>
              <option value="recent">Recente klanten</option>
              <option value="frequent">Frequente klanten</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-gray-500">Klanten ophalen...</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="p-8 text-center">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Geen klanten gevonden</h3>
            <p className="text-gray-500">
              {searchTerm || filterBy !== 'all' 
                ? 'Probeer je zoekterm of filter aan te passen'
                : 'Voeg je eerste klant toe om te beginnen'
              }
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Klant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Afspraken
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Laatste afspraak
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acties
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleClientClick(client)}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {client.naam}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      {client.telefoon && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-4 w-4 mr-2 text-gray-400" />
                          {client.telefoon}
                        </div>
                      )}
                      {client.email && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="h-4 w-4 mr-2 text-gray-400" />
                          {client.email}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {client.appointmentCount} afspraak{client.appointmentCount !== 1 ? 'en' : ''}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {formatDate(client.laatste_afspraak)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleClientClick(client)
                        }}
                        className="text-primary hover:text-primary/80 flex items-center space-x-1"
                        title="Bekijk details"
                      >
                        <Eye className="h-4 w-4" />
                        <span>Bekijk</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onEditClient(client)
                        }}
                        className="text-gray-600 hover:text-gray-800 flex items-center space-x-1"
                        title="Bewerken"
                      >
                        <Edit className="h-4 w-4" />
                        <span>Bewerken</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Client Detail Modal */}
      {selectedClient && (
        <ClientDetailModal
          client={selectedClient}
          isOpen={showClientDetail}
          onClose={() => {
            setShowClientDetail(false)
            setSelectedClient(null)
          }}
          salonId={salonId}
          onClientUpdated={handleClientUpdated}
          onAppointmentAdded={handleAppointmentAdded}
        />
      )}
    </div>
  )
}

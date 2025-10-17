import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react'

export default function NotificationSystem({ salonId }) {
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    if (!salonId) return

    // Set up realtime subscription for new appointments
    const channel = supabase
      .channel('appointment_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'appointments',
          filter: `salon_id=eq.${salonId}`
        },
        async (payload) => {
          console.log('New appointment detected:', payload)
          
          // Get client details for the notification
          try {
            const { data: clientData } = await supabase
              .from('clients')
              .select('naam')
              .eq('id', payload.new.klant_id)
              .single()

            const clientName = clientData?.naam || 'Onbekende klant'
            const appointmentTime = new Date(payload.new.start_tijd)
            const timeString = appointmentTime.toLocaleTimeString('nl-NL', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })

            // Add notification
            const notification = {
              id: Date.now(),
              type: 'new_appointment',
              message: `Nieuwe afspraak geboekt voor ${timeString} door ${clientName}`,
              timestamp: new Date()
            }

            setNotifications(prev => [notification, ...prev])

            // Auto-remove after 10 seconds
            setTimeout(() => {
              setNotifications(prev => prev.filter(n => n.id !== notification.id))
            }, 10000)

          } catch (err) {
            console.error('Error getting client details:', err)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'appointments',
          filter: `salon_id=eq.${salonId}`
        },
        async (payload) => {
          console.log('Appointment updated:', payload)
          
          // Check if appointment was cancelled
          if (payload.new.status === 'canceled' && payload.old.status !== 'canceled') {
            try {
              const { data: clientData } = await supabase
                .from('clients')
                .select('naam')
                .eq('id', payload.new.klant_id)
                .single()

              const clientName = clientData?.naam || 'Onbekende klant'
              const appointmentTime = new Date(payload.new.start_tijd)
              const timeString = appointmentTime.toLocaleTimeString('nl-NL', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })

              const notification = {
                id: Date.now(),
                type: 'cancelled_appointment',
                message: `Afspraak geannuleerd voor ${timeString} door ${clientName}`,
                timestamp: new Date()
              }

              setNotifications(prev => [notification, ...prev])

              // Auto-remove after 10 seconds
              setTimeout(() => {
                setNotifications(prev => prev.filter(n => n.id !== notification.id))
              }, 10000)

            } catch (err) {
              console.error('Error getting client details:', err)
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [salonId])

  function removeNotification(id) {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  if (notifications.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`max-w-sm bg-white rounded-lg shadow-lg border-l-4 p-4 animate-in slide-in-from-right duration-300 ${
            notification.type === 'new_appointment' 
              ? 'border-green-500' 
              : notification.type === 'cancelled_appointment'
              ? 'border-red-500'
              : 'border-blue-500'
          }`}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {notification.type === 'new_appointment' && (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
              {notification.type === 'cancelled_appointment' && (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              {notification.type === 'info' && (
                <AlertCircle className="h-5 w-5 text-blue-500" />
              )}
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900">
                {notification.message}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {notification.timestamp.toLocaleTimeString('nl-NL')}
              </p>
            </div>
            <div className="ml-4 flex-shrink-0">
              <button
                onClick={() => removeNotification(notification.id)}
                className="inline-flex text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

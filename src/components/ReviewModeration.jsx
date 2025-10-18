import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Card from './Card.jsx'
import Button from './Button.jsx'
import { Star, Check, X, AlertTriangle, User, Calendar } from 'lucide-react'

export default function ReviewModeration() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending') // pending, approved, rejected

  useEffect(() => {
    loadReviews()
  }, [filter])

  const loadReviews = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('reviews')
        .select(`
          *,
          barbers (
            name,
            location
          )
        `)
        .order('created_at', { ascending: false })

      if (filter === 'pending') {
        query = query.eq('is_approved', false).eq('is_published', false)
      } else if (filter === 'approved') {
        query = query.eq('is_approved', true).eq('is_published', true)
      } else if (filter === 'rejected') {
        query = query.eq('is_approved', false).eq('is_published', false).gt('spam_score', 0.5)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error loading reviews:', error)
      } else {
        setReviews(data || [])
      }
    } catch (err) {
      console.error('Error loading reviews:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (reviewId) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({
          is_approved: true,
          is_published: true
        })
        .eq('id', reviewId)

      if (error) {
        console.error('Error approving review:', error)
        alert('Er is een fout opgetreden bij het goedkeuren van de review.')
      } else {
        loadReviews()
        alert('Review goedgekeurd!')
      }
    } catch (err) {
      console.error('Error approving review:', err)
      alert('Er is een fout opgetreden bij het goedkeuren van de review.')
    }
  }

  const handleReject = async (reviewId) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({
          is_approved: false,
          is_published: false
        })
        .eq('id', reviewId)

      if (error) {
        console.error('Error rejecting review:', error)
        alert('Er is een fout opgetreden bij het afwijzen van de review.')
      } else {
        loadReviews()
        alert('Review afgewezen!')
      }
    } catch (err) {
      console.error('Error rejecting review:', err)
      alert('Er is een fout opgetreden bij het afwijzen van de review.')
    }
  }

  const getSpamScoreColor = (score) => {
    if (score < 0.3) return 'text-green-600'
    if (score < 0.7) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getSpamScoreText = (score) => {
    if (score < 0.3) return 'Laag risico'
    if (score < 0.7) return 'Gemiddeld risico'
    return 'Hoog risico'
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-gray-500">Reviews laden...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Review Moderatie</h2>
        <div className="flex gap-2">
          <Button
            onClick={() => setFilter('pending')}
            variant={filter === 'pending' ? 'primary' : 'secondary'}
            className="px-4 py-2"
          >
            In behandeling ({reviews.filter(r => !r.is_approved && !r.is_published).length})
          </Button>
          <Button
            onClick={() => setFilter('approved')}
            variant={filter === 'approved' ? 'primary' : 'secondary'}
            className="px-4 py-2"
          >
            Goedgekeurd
          </Button>
          <Button
            onClick={() => setFilter('rejected')}
            variant={filter === 'rejected' ? 'primary' : 'secondary'}
            className="px-4 py-2"
          >
            Hoog spam risico
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {reviews.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500">Geen reviews gevonden voor dit filter.</p>
          </Card>
        ) : (
          reviews.map((review) => (
            <Card key={review.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <User size={20} className="text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{review.reviewer_name}</div>
                    <div className="text-sm text-gray-500">
                      {review.barbers?.name} • {review.barbers?.location}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star}
                          size={14} 
                          className={star <= review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'} 
                        />
                      ))}
                      <span className="text-sm text-gray-500 ml-1">
                        {new Date(review.created_at).toLocaleDateString('nl-NL')}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {review.spam_score > 0 && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getSpamScoreColor(review.spam_score)} bg-gray-100`}>
                      <AlertTriangle size={12} />
                      {getSpamScoreText(review.spam_score)} ({Math.round(review.spam_score * 100)}%)
                    </div>
                  )}
                  
                  {filter === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApprove(review.id)}
                        className="px-3 py-1 flex items-center gap-1 text-green-600 bg-green-50 hover:bg-green-100"
                        variant="secondary"
                      >
                        <Check size={14} />
                        Goedkeuren
                      </Button>
                      <Button
                        onClick={() => handleReject(review.id)}
                        className="px-3 py-1 flex items-center gap-1 text-red-600 bg-red-50 hover:bg-red-100"
                        variant="secondary"
                      >
                        <X size={14} />
                        Afwijzen
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">{review.title}</h4>
                <p className="text-gray-700 text-sm leading-relaxed">{review.content}</p>
                
                {review.reviewer_email && (
                  <p className="text-xs text-gray-500">
                    Email: {review.reviewer_email}
                  </p>
                )}
                
                {review.flags && review.flags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {review.flags.map((flag, index) => (
                      <span key={index} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                        {flag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

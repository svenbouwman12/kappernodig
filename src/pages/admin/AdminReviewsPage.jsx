import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import DataTable from '../../components/admin/DataTable.jsx'
import Button from '../../components/Button.jsx'
import { MessageSquare, Star, Check, X, AlertTriangle, User, Building2 } from 'lucide-react'

const AdminReviewsPage = () => {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, pending, approved, rejected
  const [selectedReview, setSelectedReview] = useState(null)
  const [showModal, setShowModal] = useState(false)

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
            id,
            name,
            location
          )
        `)
        .order('created_at', { ascending: false })

      // Apply filter
      if (filter === 'pending') {
        query = query.eq('is_approved', false).eq('is_published', false)
      } else if (filter === 'approved') {
        query = query.eq('is_approved', true).eq('is_published', true)
      } else if (filter === 'rejected') {
        query = query.eq('is_approved', false).gt('spam_score', 0.5)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error loading reviews:', error)
        return
      }

      setReviews(data || [])
    } catch (err) {
      console.error('Error loading reviews:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleView = (review) => {
    setSelectedReview(review)
    setShowModal(true)
  }

  const handleApprove = async (review) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({
          is_approved: true,
          is_published: true
        })
        .eq('id', review.id)

      if (error) {
        console.error('Error approving review:', error)
        alert('Er is een fout opgetreden bij het goedkeuren van de review.')
        return
      }

      loadReviews()
      alert('Review goedgekeurd!')
    } catch (err) {
      console.error('Error approving review:', err)
      alert('Er is een fout opgetreden bij het goedkeuren van de review.')
    }
  }

  const handleReject = async (review) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({
          is_approved: false,
          is_published: false
        })
        .eq('id', review.id)

      if (error) {
        console.error('Error rejecting review:', error)
        alert('Er is een fout opgetreden bij het afwijzen van de review.')
        return
      }

      loadReviews()
      alert('Review afgewezen!')
    } catch (err) {
      console.error('Error rejecting review:', err)
      alert('Er is een fout opgetreden bij het afwijzen van de review.')
    }
  }

  const handleDelete = async (review) => {
    if (!confirm(`Weet je zeker dat je deze review wilt verwijderen?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', review.id)

      if (error) {
        console.error('Error deleting review:', error)
        alert('Er is een fout opgetreden bij het verwijderen van de review.')
        return
      }

      loadReviews()
      alert('Review verwijderd!')
    } catch (err) {
      console.error('Error deleting review:', err)
      alert('Er is een fout opgetreden bij het verwijderen van de review.')
    }
  }

  const getSpamScoreColor = (score) => {
    if (score < 0.3) return 'text-green-600 bg-green-100'
    if (score < 0.7) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getStatusBadge = (review) => {
    if (review.is_approved && review.is_published) {
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Goedgekeurd</span>
    } else if (!review.is_approved && review.spam_score > 0.5) {
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Spam</span>
    } else {
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">In behandeling</span>
    }
  }

  const columns = [
    {
      key: 'reviewer_name',
      title: 'Reviewer',
      render: (value, row) => (
        <div className="flex items-center">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
            <User size={16} className="text-primary" />
          </div>
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    {
      key: 'barbers',
      title: 'Kapperszaak',
      render: (value) => (
        <div className="flex items-center">
          <Building2 size={16} className="text-gray-400 mr-2" />
          <span>{value?.name || 'Onbekend'}</span>
        </div>
      )
    },
    {
      key: 'rating',
      title: 'Rating',
      render: (value) => (
        <div className="flex items-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star 
              key={star}
              size={14} 
              className={star <= value ? 'text-yellow-400 fill-current' : 'text-gray-300'} 
            />
          ))}
        </div>
      )
    },
    {
      key: 'title',
      title: 'Titel',
      render: (value) => (
        <span className="truncate max-w-xs">{value}</span>
      )
    },
    {
      key: 'spam_score',
      title: 'Spam Score',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSpamScoreColor(value)}`}>
          {Math.round(value * 100)}%
        </span>
      )
    },
    {
      key: 'status',
      title: 'Status',
      render: (value, row) => getStatusBadge(row)
    },
    {
      key: 'created_at',
      title: 'Datum',
      render: (value) => new Date(value).toLocaleDateString('nl-NL')
    }
  ]

  const filterButtons = [
    { key: 'all', label: 'Alle Reviews', count: reviews.length },
    { key: 'pending', label: 'In Behandeling', count: reviews.filter(r => !r.is_approved && !r.is_published).length },
    { key: 'approved', label: 'Goedgekeurd', count: reviews.filter(r => r.is_approved && r.is_published).length },
    { key: 'rejected', label: 'Hoog Spam Risico', count: reviews.filter(r => !r.is_approved && r.spam_score > 0.5).length }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reviews Beheer</h1>
          <p className="mt-2 text-gray-600">
            Beheer en moderatie van alle reviews
          </p>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        {filterButtons.map((button) => (
          <button
            key={button.key}
            onClick={() => setFilter(button.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === button.key
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {button.label} ({button.count})
          </button>
        ))}
      </div>

      {/* Data Table */}
      <DataTable
        data={reviews}
        columns={columns}
        onView={handleView}
        loading={loading}
        searchable={true}
        filterable={true}
        sortable={true}
        pagination={true}
        pageSize={10}
      />

      {/* Review Detail Modal */}
      {showModal && selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Review Details
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* Review Info */}
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <User size={24} className="text-primary" />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">
                      {selectedReview.reviewer_name}
                    </h4>
                    <p className="text-gray-600">{selectedReview.barbers?.name}</p>
                    <div className="flex items-center mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star}
                          size={16} 
                          className={star <= selectedReview.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'} 
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Review Content */}
                <div>
                  <h5 className="text-lg font-medium text-gray-900 mb-2">
                    {selectedReview.title}
                  </h5>
                  <p className="text-gray-700 leading-relaxed">
                    {selectedReview.content}
                  </p>
                </div>

                {/* Review Metadata */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Datum
                    </label>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedReview.created_at).toLocaleDateString('nl-NL')}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    {getStatusBadge(selectedReview)}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Spam Score
                    </label>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSpamScoreColor(selectedReview.spam_score)}`}>
                      {Math.round(selectedReview.spam_score * 100)}%
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <p className="text-sm text-gray-900">
                      {selectedReview.reviewer_email || 'Niet opgegeven'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between mt-6 pt-6 border-t border-gray-200">
                <div className="flex space-x-2">
                  {!selectedReview.is_approved && (
                    <>
                      <Button
                        onClick={() => handleApprove(selectedReview)}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                      >
                        <Check size={16} />
                        Goedkeuren
                      </Button>
                      <Button
                        onClick={() => handleReject(selectedReview)}
                        variant="secondary"
                        className="flex items-center gap-2 text-red-600 bg-red-50 hover:bg-red-100"
                      >
                        <X size={16} />
                        Afwijzen
                      </Button>
                    </>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    variant="secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Sluiten
                  </Button>
                  <Button
                    onClick={() => handleDelete(selectedReview)}
                    className="flex items-center gap-2 text-red-600 bg-red-50 hover:bg-red-100"
                  >
                    <X size={16} />
                    Verwijderen
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminReviewsPage

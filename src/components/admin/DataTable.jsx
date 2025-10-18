import React, { useState } from 'react'
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react'

const DataTable = ({
  data = [],
  columns = [],
  onEdit,
  onDelete,
  onView,
  loading = false,
  searchable = true,
  filterable = true,
  sortable = true,
  pagination = true,
  pageSize = 10,
  className = ""
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState('')
  const [sortDirection, setSortDirection] = useState('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState([])

  // Filter data based on search term
  const filteredData = data.filter(row => {
    if (!searchTerm) return true
    return columns.some(col => {
      const value = row[col.key]
      return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    })
  })

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortField) return 0
    
    const aValue = a[sortField]
    const bValue = b[sortField]
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  // Paginate data
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedData = pagination ? sortedData.slice(startIndex, endIndex) : sortedData
  const totalPages = Math.ceil(sortedData.length / pageSize)

  const handleSort = (field) => {
    if (!sortable) return
    
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedRows(paginatedData.map(row => row.id))
    } else {
      setSelectedRows([])
    }
  }

  const handleSelectRow = (rowId, checked) => {
    if (checked) {
      setSelectedRows([...selectedRows, rowId])
    } else {
      setSelectedRows(selectedRows.filter(id => id !== rowId))
    }
  }

  const getSortIcon = (field) => {
    if (!sortable) return null
    if (sortField !== field) return <ArrowUpDown size={16} className="text-gray-400" />
    return sortDirection === 'asc' ? 
      <ArrowUp size={16} className="text-primary" /> : 
      <ArrowDown size={16} className="text-primary" />
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-500">Gegevens laden...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Table Header with Search and Filters */}
      {(searchable || filterable) && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            {searchable && (
              <div className="flex-1 relative">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Zoeken..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            )}
            
            {filterable && (
              <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Filter size={16} className="mr-2" />
                Filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {onEdit || onDelete || onView ? (
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedRows.length === paginatedData.length && paginatedData.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </th>
              ) : null}
              
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    sortable && column.sortable !== false ? 'cursor-pointer hover:bg-gray-100' : ''
                  }`}
                  onClick={() => column.sortable !== false && handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.title}</span>
                    {getSortIcon(column.key)}
                  </div>
                </th>
              ))}
              
              {(onEdit || onDelete || onView) && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acties
                </th>
              )}
            </tr>
          </thead>
          
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.length === 0 ? (
              <tr>
                <td 
                  colSpan={columns.length + (onEdit || onDelete || onView ? 2 : 0)} 
                  className="px-6 py-8 text-center text-gray-500"
                >
                  Geen gegevens gevonden
                </td>
              </tr>
            ) : (
              paginatedData.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  {onEdit || onDelete || onView ? (
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(row.id)}
                        onChange={(e) => handleSelectRow(row.id, e.target.checked)}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    </td>
                  ) : null}
                  
                  {columns.map((column) => (
                    <td key={column.key} className="px-6 py-4 whitespace-nowrap">
                      {column.render ? column.render(row[column.key], row) : row[column.key]}
                    </td>
                  ))}
                  
                  {(onEdit || onDelete || onView) && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {onView && (
                          <button
                            onClick={() => onView(row)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Bekijken"
                          >
                            <Eye size={16} />
                          </button>
                        )}
                        
                        {onEdit && (
                          <button
                            onClick={() => onEdit(row)}
                            className="text-green-600 hover:text-green-900"
                            title="Bewerken"
                          >
                            <Edit size={16} />
                          </button>
                        )}
                        
                        {onDelete && (
                          <button
                            onClick={() => onDelete(row)}
                            className="text-red-600 hover:text-red-900"
                            title="Verwijderen"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="px-6 py-3 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Toont {startIndex + 1} tot {Math.min(endIndex, sortedData.length)} van {sortedData.length} resultaten
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronLeft size={16} />
              </button>
              
              <span className="px-3 py-2 text-sm text-gray-700">
                Pagina {currentPage} van {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DataTable

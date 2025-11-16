import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Eye, Activity, Database, RefreshCw } from 'lucide-react';
import './AuditLogs.css';
import api from '../../libs/apiCall.js';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_records: 0,
    per_page: 50
  });

  const [filters, setFilters] = useState({
    page: 1,
    limit: 50,
    search: '',
    event_type: '',
    action_type: '',
    table_name: '',
    branch_filter: '',
    start_date: '',
    end_date: ''
  });

  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  // Add this useEffect in your AuditLogs component
useEffect(() => {
  if (selectedLog) {
    document.body.classList.add('modal-open');
  } else {
    document.body.classList.remove('modal-open');
  }
  
  // Cleanup on unmount
  return () => {
    document.body.classList.remove('modal-open');
  };
}, [selectedLog]);


const fetchAuditLogs = async () => {
  setLoading(true);
  setError(null);

  try {
    const queryParams = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key]) queryParams.append(key, filters[key]);
    });

    const { data } = await api.get(`/audits/audit-logs?${queryParams}`);

    if (data.status === "success") {
      setLogs(data.data.logs);
      setPagination(data.data.pagination);
    } else {
      setError(data.message || "Failed to fetch audit logs");
    }
  } catch (err) {
    setError("Network error. Please try again.");
    console.error(err);
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchAuditLogs();
  }, [filters.page, filters.limit]);

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, page: 1 }));
    fetchAuditLogs();
  };

    
  const handleFilterChange = (key, value) => {
  setFilters(prev => ({ ...prev, [key]: value }));
  console.log("Pagination object:", pagination);
};


  const handleExport = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.start_date) queryParams.append('start_date', filters.start_date);
      if (filters.end_date) queryParams.append('end_date', filters.end_date);
      if (filters.event_type) queryParams.append('event_type', filters.event_type);

      const response = await fetch(`/api-v1/audit-logs/export?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        const csv = convertToCSV(data.data);
        downloadCSV(csv, 'audit_logs.csv');
      }
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const convertToCSV = (data) => {
    if (!data.length) return '';
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(val => 
        typeof val === 'object' ? JSON.stringify(val) : val
      ).join(',')
    );
    
    return [headers, ...rows].join('\n');
  };

  const downloadCSV = (csv, filename) => {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  const getEventTypeClass = (type) => {
    const classes = {
      'CREATE': 'create',
      'Read': 'read',
      'Update': 'update',
      'Delete': 'delete'
    };
    return classes[type] || 'default';
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 50,
      search: '',
      event_type: '',
      action_type: '',
      table_name: '',
      branch_filter: '',
      start_date: '',
      end_date: ''
    });
    setTimeout(fetchAuditLogs, 100);
  };

  return (
    <div className="audit-logs-container">
      <div className="audit-logs-wrapper">
        {/* Header */}
        <div className="audit-header">
          <div className="header-top">
            <div className="header-title">
              <h1>Audit Logs</h1>
              <p>Track all system activities and changes</p>
            </div>
            <div className="header-actions">
              <button onClick={() => fetchAuditLogs()} className="btn btn-refresh">
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button onClick={handleExport} className="btn btn-export">
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="search-section">
            <div className="search-row">
              <div className="search-input-wrapper">
                <Search className="search-icon" />
                <input
                  type="text"
                  placeholder="Search by event type, table name, endpoint, or IP address..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="search-input"
                />
              </div>
              <button onClick={handleSearch} className="btn-search">
                Search
              </button>
              <button onClick={() => setShowFilters(!showFilters)} className="btn-filter">
                <Filter className="w-4 h-4" />
                Filters
              </button>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="filters-panel">
                <div className="filter-field">
                  <label>Event Type</label>
                  <select
                    value={filters.event_type}
                    onChange={(e) => handleFilterChange('event_type', e.target.value)}
                  >
                    <option value="">All Events</option>
                    <option value="CREATE">Create</option>
                    <option value="Read">Read</option>
                    <option value="Update">Update</option>
                    <option value="Delete">Delete</option>
                  </select>
                </div>

                <div className="filter-field">
                  <label>Table Name</label>
                  <input
                    type="text"
                    value={filters.table_name}
                    onChange={(e) => handleFilterChange('table_name', e.target.value)}
                    placeholder="e.g., patients, users"
                  />
                </div>

                <div className="filter-field">
                  <label>Action Type</label>
                  <input
                    type="text"
                    value={filters.action_type}
                    onChange={(e) => handleFilterChange('action_type', e.target.value)}
                    placeholder="e.g., register_user"
                  />
                </div>

                <div className="filter-field">
                  <label>Date Time</label>
                  <input
                    type="datetime-local"
                    value={filters.start_date}
                    onChange={(e) => handleFilterChange('start_date', e.target.value)}
                  />
                </div>

                {/* <div className="filter-field">
                  <label>End Date</label>
                  <input
                    type="datetime-local"
                    value={filters.end_date}
                    onChange={(e) => handleFilterChange('end_date', e.target.value)}
                  />
                </div> */}

                <div className="filters-actions">
                  <button onClick={clearFilters} className="btn-clear-filters">
                    Clear Filters
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="stats-grid">
            <div className="stat-card blue">
              <div className="stat-header blue">
                <Activity className="w-4 h-4" />
                <span>Total Records</span>
              </div>
              <p className="stat-value">{pagination.total_records}</p>
            </div>
            <div className="stat-card green">
              <div className="stat-header green">
                <Database className="w-4 h-4" />
                <span>Current Page</span>
              </div>
              <p className="stat-value">{pagination.current_page} / {pagination.total_pages}</p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Logs Table */}
        <div className="table-container">
          {loading ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
            </div>
          ) : logs.length === 0 ? (
            <div className="empty-state">
              <Activity className="w-12 h-12" />
              <p>No audit logs found</p>
            </div>
          ) : (
            <>
              <div className="audit-table">
                <table>
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Event</th>
                      <th>Action</th>
                      <th>Table</th>
                      <th>User</th>
                      {/* <th>Branch</th> */}
                      <th>IP Address</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.log_id}>
                        <td>{formatDate(log.timestamp)}</td>
                        <td>
                          <span className={`event-badge ${getEventTypeClass(log.event_type)}`}>
                            {log.event_type}
                          </span>
                        </td>
                        <td>{log.action_type || '-'}</td>
                        <td>{log.table_name || '-'}</td>
                        <td>
                          {log.user_first_name && log.user_last_name 
                            ? `${log.user_first_name} ${log.user_last_name}`
                            : log.user_email || '-'}
                        </td>
                        {/* <td>{log.branch_name || '-'}</td> */}
                        <td className="ip-address">{log.ip_address || '-'}</td>
                        <td>
                          <button onClick={() => setSelectedLog(log)} className="btn-view">
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="pagination">
                <div className="pagination-info">
                  Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to{' '}
                  {Math.min(pagination.current_page * pagination.per_page, pagination.total_records)} of{' '}
                  {pagination.total_records} results
                </div>
                <div className="pagination-controls">
                  <button
                    onClick={() => handleFilterChange('page', pagination.current_page - 1)}
                    disabled={!pagination.has_prev}
                  >
                    Previous
                  </button>
                  <div className="pagination-current">
                    Page {pagination.current_page} of {pagination.total_pages}
                  </div>
                  <button
                    onClick={() => handleFilterChange('page', pagination.current_page + 1)}
                    
                    disabled={!pagination.has_next}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Detail Modal */}
        {selectedLog && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            // Close when user clicks on the overlay, not inside the modal content
            if (e.target.classList.contains("modal-overlay")) {
              setSelectedLog(null);
            }
          }}
          
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              
              <h2>Audit Log Details</h2>
              <button onClick={() => setSelectedLog(null)} className="btn-cancel">
                  Cancel
                </button>

              {/* <button onClick={() => setSelectedLog(null)} className="btn-close">
                  Cancel
              </button> */}
            </div>

            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-field">
                  <label>Log ID</label>
                  <p>{selectedLog.log_id}</p>
                </div>
                <div className="detail-field">
                  <label>Timestamp</label>
                  <p>{formatDate(selectedLog.timestamp)}</p>
                </div>
                <div className="detail-field">
                  <label>Event Type</label>
                  <p>
                    <span className={`event-badge ${getEventTypeClass(selectedLog.event_type)}`}>
                      {selectedLog.event_type}
                    </span>
                  </p>
                </div>
                <div className="detail-field">
                  <label>Action Type</label>
                  <p>{selectedLog.action_type || '-'}</p>
                </div>
                <div className="detail-field">
                  <label>Table Name</label>
                  <p>{selectedLog.table_name || '-'}</p>
                </div>
                <div className="detail-field">
                  <label>Request Method</label>
                  <p>{selectedLog.request_method || '-'}</p>
                </div>
                <div className="detail-field full-width">
                  <label>Endpoint</label>
                  <p className="ip-address">{selectedLog.endpoint || '-'}</p>
                </div>
                <div className="detail-field">
                  <label>User</label>
                  <p>
                    {selectedLog.user_first_name && selectedLog.user_last_name 
                      ? `${selectedLog.user_first_name} ${selectedLog.user_last_name}`
                      : selectedLog.user_email || '-'}
                  </p>
                </div>
                <div className="detail-field">
                  <label>IP Address</label>
                  <p className="ip-address">{selectedLog.ip_address || '-'}</p>
                </div>
                <div className="detail-field">
                  <label>Hospital</label>
                  <p>{selectedLog.hospital_name || '-'}</p>
                </div>
                <div className="detail-field">
                  <label>Branch</label>
                  <p>{selectedLog.branch_name || '-'}</p>
                </div>
              </div>

              {selectedLog.old_values && (
                <div className="values-section">
                  <label>Old Values</label>
                  <pre className="code-block">
                    {JSON.stringify(selectedLog.old_values, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.new_values && (
                <div className="values-section">
                  <label>New Values</label>
                  <pre className="code-block">
                    {JSON.stringify(selectedLog.new_values, null, 2)}
                  </pre>
                </div>
              )}

       
      </div>
    </div>
  </div>
)}

      </div>
    </div>
  );
};

export default AuditLogs;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './visitsAll.css'; // Reuse the same CSS file
import api from '../../libs/apiCall.js';
import { toast } from 'react-hot-toast';

const OpenVisits = () => {
  const navigate = useNavigate();
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState({
    emergency: 0,
    urgent: 0,
    admitted: 0
  });
  const [scope, setScope] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterBranch, setFilterBranch] = useState('all');

  useEffect(() => {
    fetchOpenVisits();
    
    // Auto-refresh every 2 minutes
    const interval = setInterval(fetchOpenVisits, 120000);
    return () => clearInterval(interval);
  }, []);

  const fetchOpenVisits = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/visits/hospital/open-visits');
      
      if (data.status === 'success') {
        setVisits(data.visits);
        setStatistics(data.statistics);
        setScope(data.scope);
      }
    } catch (error) {
      console.error('Error fetching open visits:', error);
      toast.error(error?.response?.data?.message || 'Failed to fetch open visits');
    } finally {
      setLoading(false);
    }
  };

  // Filter visits
  const filteredVisits = visits.filter(visit => {
    const matchesSearch = searchTerm === '' || 
      visit.visit_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.patient_first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.patient_last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.reason_for_visit?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPriority = filterPriority === 'all' || visit.priority_level === filterPriority;
    const matchesBranch = filterBranch === 'all' || visit.branch_name === filterBranch;

    return matchesSearch && matchesPriority && matchesBranch;
  });

  // Get unique branches for filter
  const branches = [...new Set(visits.map(v => v.branch_name).filter(Boolean))];

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeSinceVisit = (dateString) => {
    if (!dateString) return 'N/A';
    const visitDate = new Date(dateString);
    const now = new Date();
    const diffMs = now - visitDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const getPriorityClass = (priority) => {
    const classes = {
      'Emergency': 'emergency',
      'Urgent': 'urgent',
      'Routine': 'routine',
      'Low': 'low'
    };
    return classes[priority] || 'routine';
  };

  const getAdmissionStatusClass = (status) => {
    if (!status) return 'pending';
    const statusLower = status.toLowerCase();
    if (statusLower.includes('admitted')) return 'admitted';
    if (statusLower.includes('observation')) return 'observation';
    if (statusLower.includes('outpatient')) return 'outpatient';
    return 'pending';
  };

  if (loading) {
    return (
      <div className="visits-container">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="loading-spinner"></div>
          <p>Loading open visits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="visits-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2>
            Open Visits
            {scope === 'branch' && (
              <span style={{ 
                fontSize: '14px', 
                fontWeight: 'normal', 
                color: '#6b7280',
                marginLeft: '8px' 
              }}>
                (Your Branch)
              </span>
            )}
          </h2>
          <p style={{ color: '#6b7280', marginTop: '8px' }}>
            Currently active patient visits requiring attention
          </p>
        </div>
        <div className="header-actions" style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn-secondary"
            onClick={fetchOpenVisits}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            🔄 Refresh
          </button>
          <button 
            className="btn-primary"
            onClick={() => navigate('/visits/new')}
          >
            + New Visit
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div className="stat-card">
          <div style={{ fontSize: '14px', color: '#6b7280' }}>Total Open Visits</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '8px' }}>
            {visits.length}
          </div>
          
        </div>
{/* 
        <div className="stat-card">
          <div style={{ fontSize: '14px', color: '#6b7280' }}>Emergency Cases</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '8px', color: '#dc2626' }}>
            {statistics.emergency}
          </div>
          <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '8px' }}>
            Requires immediate attention
          </div>
        </div> */}

        {/* <div className="stat-card">
          <div style={{ fontSize: '14px', color: '#6b7280' }}>Urgent Cases</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '8px', color: '#ea580c' }}>
            {statistics.urgent}
          </div>
          <div style={{ fontSize: '12px', color: '#ea580c', marginTop: '8px' }}>
            Priority attention needed
          </div>
        </div> */}

        <div className="stat-card">
          <div style={{ fontSize: '14px', color: '#6b7280' }}>Admitted Patients</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '8px', color: '#2563eb' }}>
            {statistics.admitted}
          </div>
          
        </div>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="search-box" style={{ marginBottom: '16px' }}>
          <input
            type="text"
            placeholder="🔍 Search by visit number, patient name, or reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <label style={{
              fontSize: '14px',
              color: '#6b7280',
              marginBottom: '4px',
              display: 'block'
            }}>
              Priority Level
            </label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                minWidth: '150px'
              }}
            >
              <option value="all">All Priorities</option>
              <option value="Emergency">Emergency</option>
              <option value="Urgent">Urgent</option>
              <option value="Routine">Routine</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {branches.length > 1 && (
            <div>
              <label style={{
                fontSize: '14px',
                color: '#6b7280',
                marginBottom: '4px',
                display: 'block'
              }}>
                Branch
              </label>
              <select
                value={filterBranch}
                onChange={(e) => setFilterBranch(e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  minWidth: '150px'
                }}
              >
                <option value="all">All Branches</option>
                {branches.map(branch => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </select>
            </div>
          )}

          {(searchTerm || filterPriority !== 'all' || filterBranch !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterPriority('all');
                setFilterBranch('all');
              }}
              style={{
                padding: '8px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                background: 'white',
                cursor: 'pointer',
                alignSelf: 'flex-end'
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Visits Table */}
      {filteredVisits.length === 0 ? (
        <div className="no-data">
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
          <h3>{searchTerm || filterPriority !== 'all' || filterBranch !== 'all'
            ? 'No visits found'
            : 'No open visits'}</h3>
          <p style={{ marginTop: '8px' }}>
            {searchTerm || filterPriority !== 'all' || filterBranch !== 'all'
              ? 'Try adjusting your filters to see more results'
              : 'All patient visits have been closed'}
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Patient</th>
                <th>Priority</th>
                <th>Visit Type</th>
                
                <th>Branch</th>
                <th>Time</th>
                <th>Reason</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVisits.map((visit, index) => (
                <tr key={visit.visit_id}>
                  <td>
                    <strong>{index + 1}</strong>
                  </td>
                  <td>
                    <div style={{ fontWeight: '500' }}>
                      {visit.patient_first_name} {visit.patient_last_name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                      {visit.visit_number}
                    </div>
                  </td>
                  <td>
                    <span 
                      className={`priority-badge ${getPriorityClass(visit.priority_level)}`}
                      style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}
                    >
                      {visit.priority_level}
                    </span>
                  </td>
                  <td>{visit.visit_type}</td>
                  
                  <td>
                    {visit.branch_name || <span style={{ color: '#9ca3af' }}>N/A</span>}
                  </td>
                  <td>
                    <div style={{ fontSize: '13px', fontWeight: '500' }}>
                      {getTimeSinceVisit(visit.visit_date)}
                    </div>
                    <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                      {formatDateTime(visit.visit_date)}
                    </div>
                  </td>
                  <td>
                    <div style={{
                      maxWidth: '200px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {visit.reason_for_visit || <span style={{ color: '#9ca3af' }}>N/A</span>}
                    </div>
                  </td>
                  <td>
                    <button
                      className="btn-primary"
                      onClick={() => navigate(`/visits/details/${visit.visit_id}`)}
                      style={{
                        padding: '6px 12px',
                        fontSize: '13px'
                      }}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Results Summary */}
      {filteredVisits.length > 0 && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: '#f9fafb',
          borderRadius: '6px',
          fontSize: '14px',
          color: '#6b7280',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>
            Showing <strong>{filteredVisits.length}</strong> of <strong>{visits.length}</strong> open visits
          </span>
          <span style={{ fontSize: '12px' }}>
            Last updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
      )}

      <style jsx>{`
        .pulse-dot {
          width: 8px;
          height: 8px;
          background-color: #3b82f6;
          border-radius: 50%;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f4f6;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default OpenVisits;
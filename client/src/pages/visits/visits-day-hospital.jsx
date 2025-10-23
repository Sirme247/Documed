import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './visits.css';
import api from '../../libs/apiCall.js';
import { toast } from 'react-hot-toast';

const VisitsDayHospital = () => {
  const navigate = useNavigate();
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [scope, setScope] = useState('hospital');

  useEffect(() => {
    fetchTodayVisits();
    // Auto-refresh every 2 minutes
    const interval = setInterval(fetchTodayVisits, 120000);
    return () => clearInterval(interval);
  }, []);

  const fetchTodayVisits = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/visits/hospital/visits/day/');
      
      if (data.status === 'success') {
        setVisits(data.visits);
        setScope(data.scope);
      }
    } catch (error) {
      console.error('Error fetching today\'s visits:', error);
      toast.error(error?.response?.data?.message || 'Failed to fetch today\'s visits');
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

    const matchesType = filterType === 'all' || visit.visit_type === filterType;
    const matchesPriority = filterPriority === 'all' || visit.priority_level === filterPriority;

    return matchesSearch && matchesType && matchesPriority;
  });

  // Get unique visit types and priorities for filters
  const visitTypes = [...new Set(visits.map(v => v.visit_type).filter(Boolean))];
  const priorityLevels = [...new Set(visits.map(v => v.priority_level).filter(Boolean))];

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
    if (statusLower.includes('discharged')) return 'discharged';
    if (statusLower.includes('observation')) return 'observation';
    return 'pending';
  };

  // Get current hour stats
  const currentHour = new Date().getHours();
  const thisHourVisits = visits.filter(v => {
    const visitHour = new Date(v.visit_date).getHours();
    return visitHour === currentHour;
  });

  if (loading) {
    return (
      <div className="visits-container">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="loading-spinner"></div>
          <p>Loading today's visits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="visits-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2>Today's Visits</h2>
          <p style={{ color: '#6b7280', marginTop: '8px' }}>
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
            {scope === 'branch' && ' • Branch Scope'}
          </p>
        </div>
        <div className="header-actions">
          <button 
            className="btn-secondary"
            onClick={fetchTodayVisits}
            style={{ marginRight: '8px' }}
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
        {/* <div className="stat-card" style={{ borderLeft: '4px solid #2563eb' }}> */}
        <div className="stat-card" >
          <div style={{ fontSize: '14px', color: '#6b7280' }}>Total Today</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', marginTop: '8px', color: '#000000ff' }}>
            {visits.length}
          </div>
        </div>
        {/* <div className="stat-card" style={{ borderLeft: '4px solid #dc2626' }}> */}
        <div className="stat-card" >
          <div style={{ fontSize: '14px', color: '#6b7280' }}>Emergency</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', marginTop: '8px', color: '#000000ff' }}>
            {visits.filter(v => v.priority_level === 'Emergency').length}
          </div>
        </div>
        {/* <div className="stat-card" style={{ borderLeft: '4px solid #ea580c' }}> */}
        <div className="stat-card" >
          <div style={{ fontSize: '14px', color: '#6b7280' }}>Urgent</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', marginTop: '8px', color: '#000000ff' }}>
            {visits.filter(v => v.priority_level === 'Urgent').length}
          </div>
        </div>
        {/* <div className="stat-card" style={{ borderLeft: '4px solid #059669' }}> */}
        <div className="stat-card" >
          <div style={{ fontSize: '14px', color: '#6b7280' }}>This Hour</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', marginTop: '8px', color: '#000000ff' }}>
            {thisHourVisits.length}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
            {currentHour}:00 - {currentHour + 1}:00
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="search-box" style={{ marginBottom: '16px' }}>
          <input
            type="text"
            placeholder="Search by visit number, patient name, or reason..."
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
            <label style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
              Visit Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                minWidth: '150px'
              }}
            >
              <option value="all">All Types</option>
              {visitTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
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
              {priorityLevels.map(priority => (
                <option key={priority} value={priority}>{priority}</option>
              ))}
            </select>
          </div>

          {(searchTerm || filterType !== 'all' || filterPriority !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterType('all');
                setFilterPriority('all');
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
          <span style={{ fontSize: '48px', marginBottom: '16px', display: 'block' }}>📋</span>
          <p style={{ fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>
            {searchTerm || filterType !== 'all' || filterPriority !== 'all' 
              ? 'No visits found matching your filters.' 
              : 'No visits today yet.'}
          </p>
          <p style={{ fontSize: '14px', color: '#9ca3af' }}>
            {!searchTerm && filterType === 'all' && filterPriority === 'all' && 'Visits will appear here as they are registered.'}
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Visit #</th>
                <th>Patient</th>
                <th>Contact</th>
                <th>Visit Type</th>
                <th>Priority</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Branch</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVisits.map((visit) => (
                <tr key={visit.visit_id}>
                  <td>
                    <div style={{ fontWeight: '600', fontSize: '15px' }}>
                      {formatTime(visit.visit_date)}
                    </div>
                  </td>
                  <td>
                    <strong>{visit.visit_number}</strong>
                  </td>
                  <td>
                    <div style={{ fontWeight: '500' }}>
                      {visit.patient_first_name} {visit.patient_last_name}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>
                      {visit.patient_phone || 'N/A'}
                    </div>
                  </td>
                  <td>
                    <span style={{
                      backgroundColor: '#dbeafe',
                      color: '#1e40af',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      {visit.visit_type || 'N/A'}
                    </span>
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
                      {visit.priority_level || 'Normal'}
                    </span>
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
                    <span 
                      className={`status-badge ${getAdmissionStatusClass(visit.admission_status)}`}
                      style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}
                    >
                      {visit.admission_status || 'Pending'}
                    </span>
                  </td>
                  <td>
                    {visit.branch_name || <span style={{ color: '#9ca3af' }}>Main</span>}
                  </td>
                  <td>
                    <button 
                      className="btn-secondary"
                      onClick={() => navigate(`/visits/details/${visit.visit_id}`)}
                      style={{ 
                        padding: '6px 12px', 
                        fontSize: '13px',
                        border: '1px solid #d1d5db',
                        backgroundColor: 'white',
                        borderRadius: '4px',
                        cursor: 'pointer'
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
          <span>Showing {filteredVisits.length} of {visits.length} visits today</span>
          <span style={{ fontSize: '12px' }}>
            Auto-refreshes every 2 minutes
          </span>
        </div>
      )}
    </div>
  );
};

export default VisitsDayHospital;
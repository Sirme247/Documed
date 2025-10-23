import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './visitsAll.css';
import api from '../../libs/apiCall.js';
import { toast } from 'react-hot-toast';

const VisitsAllHospital = () => {
  const navigate = useNavigate();
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  useEffect(() => {
    fetchHospitalVisits();
  }, []);

  const fetchHospitalVisits = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/visits/hospital');
      
      if (data.status === 'success') {
        setVisits(data.visits);
      }
    } catch (error) {
      console.error('Error fetching hospital visits:', error);
      toast.error(error?.response?.data?.message || 'Failed to fetch visits');
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

  if (loading) {
    return (
      <div className="visits-container">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="loading-spinner"></div>
          <p>Loading visits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="visits-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2>Hospital Visits</h2>
          <p style={{ color: '#6b7280', marginTop: '8px' }}>
            All visits in your hospital
          </p>
        </div>
        <div className="header-actions">
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
          <div style={{ fontSize: '14px', color: '#6b7280' }}>Total Visits</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '8px' }}>
            {visits.length}
          </div>
        </div>
        <div className="stat-card">
          <div style={{ fontSize: '14px', color: '#6b7280' }}>Today's Visits</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '8px' }}>
            {visits.filter(v => {
              const visitDate = new Date(v.visit_date);
              const today = new Date();
              return visitDate.toDateString() === today.toDateString();
            }).length}
          </div>
        </div>
        <div className="stat-card">
          <div style={{ fontSize: '14px', color: '#6b7280' }}>Emergency Visits</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '8px' }}>
            {visits.filter(v => v.priority_level === 'Emergency').length}
          </div>
        </div>
        <div className="stat-card">
          <div style={{ fontSize: '14px', color: '#6b7280' }}>Admitted Patients</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '8px' }}>
            {visits.filter(v => v.admission_status?.toLowerCase().includes('admitted')).length}
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
          <p>{searchTerm || filterType !== 'all' || filterPriority !== 'all' 
            ? 'No visits found matching your filters.' 
            : 'No visits recorded yet.'}
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Visit #</th>
                <th>Patient</th>
                <th>Visit Type</th>
                <th>Priority</th>
                <th>Visit Date</th>
                <th>Reason</th>
                <th>Admission Status</th>
                <th>Branch</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVisits.map((visit) => (
                <tr key={visit.visit_id}>
                  <td>
                    <strong>{visit.visit_number}</strong>
                  </td>
                  <td>
                    <div style={{ fontWeight: '500' }}>
                      {visit.patient_first_name} {visit.patient_last_name}
                    </div>
                    {/* <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      ID: {visit.patient_id}
                    </div> */}
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
                  <td>{formatDateTime(visit.visit_date)}</td>
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
          color: '#6b7280'
        }}>
          Showing {filteredVisits.length} of {visits.length} visits
        </div>
      )}
    </div>
  );
};

export default VisitsAllHospital;
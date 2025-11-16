import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../libs/apiCall.js';
import { toast } from 'react-hot-toast';
import './patients.css';

const PatientVisitList = () => {
  const { patient_id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [visits, setVisits] = useState([]);
  const [filteredVisits, setFilteredVisits] = useState([]);
  const [patient, setPatient] = useState(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    visitType: '',
    priority: '',
    hospital: '',
    dateFrom: '',
    dateTo: '',
    searchTerm: ''
  });

  useEffect(() => {
    fetchVisits();
  }, [patient_id]);

  useEffect(() => {
    applyFilters();
  }, [visits, filters]);

  const fetchVisits = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/visits/patient/${patient_id}`);
      
      if (data.status === "success") {
        setVisits(data.data);
      }
    } catch (error) {
      console.error(error);
      if (error?.response?.status === 404) {
        setVisits([]);
      } else {
        toast.error(error?.response?.data?.message || "Failed to fetch visits");
      }
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...visits];

    // Filter by visit type
    if (filters.visitType) {
      filtered = filtered.filter(visit => 
        visit.visit_type?.toLowerCase() === filters.visitType.toLowerCase()
      );
    }

    // Filter by priority
    if (filters.priority) {
      filtered = filtered.filter(visit => 
        visit.priority_level?.toLowerCase() === filters.priority.toLowerCase()
      );
    }

    // Filter by date range
    if (filters.dateFrom) {
      filtered = filtered.filter(visit => 
        new Date(visit.visit_date) >= new Date(filters.dateFrom)
      );
    }

    if (filters.dateTo) {
      const endDate = new Date(filters.dateTo);
      endDate.setHours(23, 59, 59, 999); // Include the entire day
      filtered = filtered.filter(visit => 
        new Date(visit.visit_date) <= endDate
      );
    }

    // Filter by search term (searches in reason and visit number)
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(visit => 
        visit.reason_for_visit?.toLowerCase().includes(searchLower) ||
        visit.visit_number?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredVisits(filtered);
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      visitType: '',
      priority: '',
      dateFrom: '',
      dateTo: '',
      searchTerm: ''
    });
  };

  const hasActiveFilters = () => {
    return filters.visitType || filters.priority || filters.dateFrom || 
           filters.dateTo || filters.searchTerm;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'emergency':
        return '#dc2626';
      case 'urgent':
        return '#ea580c';
      case 'routine':
        return '#16a34a';
      default:
        return '#6b7280';
    }
  };

  const handleVisitClick = (visit_id) => {
    navigate(`/visits/details/${visit_id}`);
  };

  const handleBack = () => {
    navigate(`/patients/${patient_id}`);
  };

  if (loading) {
    return (
      <div className="visit-list-container">
        <div className="loading-container">
          <div className="loading-spinner">⏳</div>
          <p>Loading visits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="visit-list-container">
      {/* Header */}
      <div className="visit-list-header">
        <button onClick={handleBack} className="btn-back">
          ← Back to Patient
        </button>
        <div className="header-content">
          <div className="header-left">
            <div className="visit-icon-large">📋</div>
            <div>
              <h1>Patient Visits</h1>
              <p className="subtitle">
                Patient ID: {patient_id} • Total Visits: {visits.length}
                {hasActiveFilters() && ` • Showing: ${filteredVisits.length}`}
              </p>
            </div>
          </div>
          <button 
            onClick={() => navigate(`/visits/new`, { state: { patient: { patient_id } } })}
            className="btn-add-visit"
          >
            + New Visit
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="visits-filters">
        <div className="filters-row">
          <div className="filter-group">
            <input
              type="text"
              placeholder="🔍 Search by reason or visit number..."
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              className="filter-search-input"
            />
          </div>

          <div className="filter-group">
            <select
              value={filters.visitType}
              onChange={(e) => handleFilterChange('visitType', e.target.value)}
              className="filter-select"
            >
              <option value="">All Visit Types</option>
              <option value="Outpatient">Outpatient</option>
              <option value="Inpatient">Inpatient</option>
              <option value="Emergency">Emergency</option>
              <option value="Follow-up">Follow-up</option>
              <option value="Consultation">Consultation</option>
              <option value="Preventive Care">Preventive Care</option>
              <option value="Surgical">Surgical</option>
            </select>
          </div>

          <div className="filter-group">
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="filter-select"
            >
              <option value="">All Priorities</option>
              <option value="emergency">Emergency</option>
              <option value="urgent">Urgent</option>
              <option value="routine">Routine</option>
            </select>
          </div>

          <div className="filter-group">
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="filter-date-input"
              placeholder="From Date"
            />
          </div>

          <div className="filter-group">
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="filter-date-input"
              placeholder="To Date"
            />
          </div>

          {hasActiveFilters() && (
            <button onClick={clearFilters} className="btn-clear-filters">
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Visits List */}
      <div className="visits-content">
        {filteredVisits.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>{hasActiveFilters() ? 'No Matching Visits' : 'No Visits Found'}</h3>
            <p>
              {hasActiveFilters() 
                ? 'Try adjusting your filters to see more results.' 
                : 'This patient has no recorded visits yet.'}
            </p>
            {!hasActiveFilters() && (
              <button 
                onClick={() => navigate(`/visits/new`, { state: { patient: { patient_id } } })}
                className="btn-add-new"
              >
                + Add First Visit
              </button>
            )}
          </div>
        ) : (
          <div className="visits-list-table">
            <div className="visits-list-header-row">
              <div className="col-visit-number">#</div>
              <div className="col-date">Date of Visit</div>
              <div className="col-type">Type</div>
              <div className="col-reason">Reason for Visit</div>
              <div className="col-hospital">Hospital/Branch</div>
              <div className="col-priority">Priority</div>
              <div className="col-action"></div>
            </div>
            
            {filteredVisits.map((visit, index) => (
              <div 
                key={visit.visit_id} 
                className="visit-list-row"
              >
                <div className="col-visit-number">
                 <span className="visit-number-badge">{index + 1}</span>
                </div>
                
                <div className="col-date">
                  <span className="date-main">{formatDate(visit.visit_date)}</span>
                </div>
                
                <div className="col-type">
                  <span className="visit-type-badge">{visit.visit_type || 'N/A'}</span>
                </div>
                
                <div className="col-reason">
                  <span className="reason-text">{visit.reason_for_visit || 'Not specified'}</span>
                </div>
                
                <div className="col-hospital">
                  <div className="hospital-info">
                    <div className="hospital-name">{visit.hospital_name || 'N/A'}</div>
                    {visit.branch_name && (
                      <div className="branch-name">{visit.branch_name}</div>
                    )}
                  </div>
                </div>
                
                <div className="col-priority">
                  <span 
                    className="priority-badge"
                    style={{ backgroundColor: getPriorityColor(visit.priority_level) }}
                  >
                    {visit.priority_level || 'N/A'}
                  </span>
                </div>
                
                <div className="col-action">
                  <button 
                    className="btn-view-visit-details"
                    onClick={() => handleVisitClick(visit.visit_id)}
                  >
                    View →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientVisitList;
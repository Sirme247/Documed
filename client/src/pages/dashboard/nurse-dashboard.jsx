import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../libs/apiCall.js";
import { toast } from "react-hot-toast";
import "../dashboard/dashboard.css";

const NurseDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [weekPatients, setWeekPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [dashboardData, setDashboardData] = useState({
    nurse_name: '',
    department: '',
    shift: '',
    total_patients: 0,
    today_visits: 0,
    pending_vitals: 0,
    completed_vitals: 0
  });
  const [todayVisits, setTodayVisits] = useState([]);
  const [recentPatients, setRecentPatients] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    fetchWeekPatients();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [todayVisitsRes, patientsRes] = await Promise.all([
        api.get('/visits/hospital/visits/day'),
        api.get('/patients/get-patients?limit=5&sort=created_at&order=DESC')
      ]);

      if (todayVisitsRes.data.status === 'success') {
        setTodayVisits(todayVisitsRes.data.visits || []);
      }

      setRecentPatients(patientsRes.data.data?.patients || []);

      setDashboardData({
        nurse_name: 'Nurse Jane Williams',
        department: 'Emergency Department',
        shift: 'Day Shift',
        total_patients: 45,
        today_visits: todayVisitsRes.data.visits?.length || 0,
        pending_vitals: 8,
        completed_vitals: 15
      });

    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const fetchWeekPatients = async () => {
    try {
      const { data } = await api.get('/patients/search-patients-week');
      
      if (data.status === 'success') {
        setWeekPatients(data.patients || []);
        setSearchResults(data.patients || []);
      }
    } catch (error) {
      console.error('Error fetching week patients:', error);
    }
  };

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setSearchResults(weekPatients);
      return;
    }

    setIsSearching(true);
    const filtered = weekPatients.filter(patient => {
      const searchLower = searchTerm.toLowerCase();
      return (
        patient.first_name?.toLowerCase().includes(searchLower) ||
        patient.last_name?.toLowerCase().includes(searchLower) ||
        patient.patient_number?.toLowerCase().includes(searchLower) ||
        `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(searchLower)
      );
    });

    setSearchResults(filtered);
    setIsSearching(false);
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults(weekPatients);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'emergency':
        return 'danger';
      case 'urgent':
        return 'warning';
      case 'routine':
        return 'success';
      default:
        return 'info';
    }
  };

  const getAdmissionStatusClass = (status) => {
    if (!status) return 'pending';
    const statusLower = status.toLowerCase();
    if (statusLower.includes('admitted')) return 'admitted';
    if (statusLower.includes('discharged')) return 'discharged';
    if (statusLower.includes('outpatient')) return 'outpatient';
    return 'pending';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>Welcome, {dashboardData.nurse_name}</h1>
          <p className="dashboard-subtitle">
            {dashboardData.department} • {dashboardData.shift}
          </p>
        </div>
        <div className="header-actions">
          <button onClick={fetchDashboardData} className="btn-refresh">
            🔄 Refresh
          </button>
          <button onClick={() => navigate('/patients/list')} className="btn-primary">
            🔍 Find Patient
          </button>
        </div>
      </div>

      

      {/* Main Statistics Grid */}
      <div className="stats-grid">
        {/* <div className="stat-card success" onClick={() => navigate('/visits/hospital/today')}> */}
        <div className="stat-card success">
          <div className="stat-icon-wrapper success">
            <span className="stat-icon">📋</span>
          </div>
          <div className="stat-content">
            <span className="stat-label">Today's Visits</span>
            <span className="stat-value">{dashboardData.today_visits}</span>
            <span className="stat-sublabel">Patients</span>
          </div>
        </div>

        {/* <div className="stat-card warning" onClick={() => navigate('/visits/hospital/today')}>
          <div className="stat-icon-wrapper warning">
            <span className="stat-icon">⏰</span>
          </div>
          <div className="stat-content">
            <span className="stat-label">Pending Vitals</span>
            <span className="stat-value">{dashboardData.pending_vitals}</span>
            <span className="stat-sublabel">Needs Recording</span>
          </div>
        </div> */}

        {/* <div className="stat-card info" onClick={() => navigate('/visits/hospital/all')}>
          <div className="stat-icon-wrapper info">
            <span className="stat-icon">✅</span>
          </div>
          <div className="stat-content">
            <span className="stat-label">Completed Today</span>
            <span className="stat-value">{dashboardData.completed_vitals}</span>
            <span className="stat-sublabel">Vitals Recorded</span>
          </div>
        </div> */}

        {/* <div className="stat-card purple" onClick={() => navigate('/visits/hospital/all')}> */}
        <div className="stat-card purple">
          <div className="stat-icon-wrapper purple">
            <span className="stat-icon">👥</span>
          </div>
          <div className="stat-content">
            <span className="stat-label">This Week's visits</span>
            <span className="stat-value">{weekPatients.length}</span>
            <span className="stat-sublabel">Patients </span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-section">
        <h2>Quick Actions</h2>
        <div className="quick-actions-grid">
          {/* <button onClick={() => navigate('/visits/new')} className="quick-action-card">
            <span className="action-icon">➕</span>
            <span className="action-label">Register Visit</span>
          </button> */}
          <button onClick={() => navigate('/patients/frequent')} className="quick-action-card">
            <span className="action-icon">🩺</span>
            <span className="action-label">Admitted Patients</span>
          </button>
          <button onClick={() => navigate('/patients/list')} className="quick-action-card">
            <span className="action-icon">🔍</span>
            <span className="action-label">Search Patient</span>
          </button>
          {/* <button onClick={() => navigate('/visits/hospital/today')} className="quick-action-card">
            <span className="action-icon">📅</span>
            <span className="action-label">Today's Schedule</span>
          </button> */}
          {/* <button onClick={() => navigate('/settings/user')} className="quick-action-card">
            <span className="action-icon">⚙️</span>
            <span className="action-label">My Settings</span>
          </button> */}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="dashboard-two-column">
        {/* Left Column */}
        <div className="dashboard-column">
          {/* Today's Visits */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3>Today's Patient Visits</h3>
              <button onClick={() => navigate('/visits/hospital/today')} className="btn-link">
                View All →
              </button>
            </div>
            <div className="card-content">
              {todayVisits.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">📋</span>
                  <p>No visits today</p>
                </div>
              ) : (
                <div className="activity-list">
                  {todayVisits.slice(0, 6).map((visit) => (
                    <div 
                      key={visit.visit_id} 
                      className="activity-item clickable"
                      onClick={() => navigate(`/visits/details/${visit.visit_id}`)}
                    >
                      <div className={`activity-icon ${getPriorityColor(visit.priority_level)}`}>
                        {visit.priority_level === 'emergency' ? '🚨' : 
                         visit.priority_level === 'urgent' ? '⚠️' : '📋'}
                      </div>
                      <div className="activity-content">
                        <div className="activity-text">
                          <strong>{visit.patient_first_name} {visit.patient_last_name}</strong>
                          {' • '}{formatTime(visit.visit_date)}
                        </div>
                        <div className="activity-subtitle">
                          {visit.reason_for_visit || 'General consultation'}
                        </div>
                        {visit.priority_level && (
                          <span className={`status-badge ${getPriorityColor(visit.priority_level)}`}>
                            {visit.priority_level}
                          </span>
                        )}
                      </div>
                      <span className={`status-badge ${getAdmissionStatusClass(visit.admission_status)}`}>
                        {visit.admission_status || 'Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          
        </div>

        {/* Right Column */}
        <div className="dashboard-column">
          {/* Pending Vitals Alert */}
          

          {/* Patients in Last 7 Days */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3>Patients in the last 7 days</h3>
              <button onClick={fetchWeekPatients} className="btn-link">
                Refresh →
              </button>
            </div>
            <div className="card-content">
              {/* Search Section */}
              <div className="search-section" style={{ marginBottom: '16px' }}>
                <input 
                  type="text" 
                  placeholder="Search by name or patient number..." 
                  className="search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
                <button 
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="btn-secondary"
                  style={{ minWidth: '80px' }}
                >
                  {isSearching ? '...' : '🔍 Search'}
                </button>
              </div>

              {searchTerm && (
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '12px',
                  padding: '8px 12px',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '6px',
                  fontSize: '13px'
                }}>
                  <span>
                    Found {searchResults.length} of {weekPatients.length} patients
                  </span>
                  <button 
                    onClick={clearSearch}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#2563eb',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '500'
                    }}
                  >
                    Clear
                  </button>
                </div>
              )}

              {/* Results List - Scrollable */}
              {searchResults.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">
                    {searchTerm ? '🔍' : '📅'}
                  </span>
                  <p>
                    {searchTerm 
                      ? 'No patients found matching your search' 
                      : 'No patient visits in the last 7 days'}
                  </p>
                </div>
              ) : (
                <>
                  <div style={{
                    fontSize: '13px',
                    color: '#6b7280',
                    marginBottom: '8px',
                    fontWeight: '500'
                  }}>
                    Showing {Math.min(searchResults.length, 6)} of {searchResults.length} patients
                  </div>
                  
                  <div 
                    className="list-items" 
                    style={{ 
                      maxHeight: '460px',
                      overflowY: 'auto',
                      overflowX: 'hidden',
                      paddingRight: '4px',
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#cbd5e1 #f1f5f9'
                    }}
                  >
                    {searchResults.map((patient) => (
                      <div 
                        key={patient.patient_id} 
                        className="list-item clickable"
                        onClick={() => navigate(`/patients/${patient.patient_id}`)}
                        style={{
                          marginBottom: '8px'
                        }}
                      >
                        <div className="item-icon patient-avatar">
                          {patient.first_name?.[0]}{patient.last_name?.[0]}
                        </div>
                        <div className="item-content">
                          <div className="item-title">
                            {patient.first_name} {patient.last_name}
                          </div>
                          <div className="item-subtitle">
                            {patient.patient_number} • {patient.visit_type || 'Visit'}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                            {patient.total_visits_last_7_days} visit{patient.total_visits_last_7_days > 1 ? 's' : ''} in last 7 days
                          </div>
                        </div>
                        <div className="item-meta">
                          <span className="item-date" style={{ fontSize: '12px' }}>
                            {formatDateTime(patient.last_visit_date)}
                          </span>
                          {patient.priority_level && (
                            <span className={`status-badge ${getPriorityColor(patient.priority_level)}`}>
                              {patient.priority_level}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Quick Shortcuts */}
              <div className="search-shortcuts" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                <button 
                  onClick={() => navigate('/patients/list')} 
                  className="shortcut-btn"
                  style={{
                    width: '100%',
                    padding: '8px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    background: 'white',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  View All Patients →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NurseDashboard;
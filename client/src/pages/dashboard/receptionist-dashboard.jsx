import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../libs/apiCall.js";
import { toast } from "react-hot-toast";
import "./dashboard.css";

const ReceptionistDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [weekPatients, setWeekPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [dashboardData, setDashboardData] = useState({
    receptionist_name: '',
    location: '',
    shift: '',
    today_visits: 0,
    pending_registrations: 0,
    total_patients: 0,
    admitted_patients: 0, 
    critical_admitted: 0 
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
      
      const [todayVisitsRes, patientsRes, admittedStatsRes] = await Promise.all([
        api.get('/visits/hospital/visits/day'),
        api.get('/patients/get-patients?limit=10&sort=created_at&order=DESC'),
        api.get('/patients/admitted-patients?sortBy=priority') 
      ]);

      if (todayVisitsRes.data.status === 'success') {
        setTodayVisits(todayVisitsRes.data.visits || []);
      }

      setRecentPatients(patientsRes.data.data?.patients || []);

      const admittedCount = admittedStatsRes.data.status === 'success' 
        ? admittedStatsRes.data.data?.length || 0
        : 0;

      const criticalAdmitted = admittedStatsRes.data.status === 'success'
        ? admittedStatsRes.data.data?.filter(p => p.priority_level === 'critical').length || 0
        : 0;

      setDashboardData({
        receptionist_name: 'Front Desk',
        location: 'Main Reception',
        shift: 'Day Shift',
        today_visits: todayVisitsRes.data.visits?.length || 0,
        pending_registrations: 0,
        total_patients: patientsRes.data.data?.total_count || 0,
        admitted_patients: admittedCount,
        critical_admitted: criticalAdmitted
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
        patient.primary_number?.toLowerCase().includes(searchLower) ||
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
      case 'critical':
        return 'danger';
      case 'high':
        return 'warning';
      case 'normal':
        return 'success';
      case 'low':
        return 'info';
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
          <h1>Reception Dashboard</h1>
          <p className="dashboard-subtitle">
            {dashboardData.location} • {dashboardData.shift}
          </p>
        </div>
        <div className="header-actions">
          <button onClick={fetchDashboardData} className="btn-refresh">
            🔄 Refresh
          </button>
          <button onClick={() => navigate('/patients/register')} className="btn-primary">
            ➕ Register Patient
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
            {/* <span className="stat-sublabel">Active Visits</span> */}
          </div>
        </div>

        {/* <div className="stat-card info" onClick={() => navigate('/visits/hospital/all')}> */}
        <div className="stat-card info">
          <div className="stat-icon-wrapper info">
            <span className="stat-icon">🆕</span>
          </div>
          <div className="stat-content">
            <span className="stat-label">Patients This Week</span>
            <span className="stat-value">{weekPatients.length}</span>
            {/* <span className="stat-sublabel">Patients</span> */}
          </div>
        </div>

        {/* <div className="stat-card warning" onClick={() => navigate('/patients/frequent')}> */}
        <div className="stat-card warning">
          <div className="stat-icon-wrapper warning">
            <span className="stat-icon">🏥</span>
          </div>
          <div className="stat-content">
            <span className="stat-label">Admitted Patients</span>
            <span className="stat-value">{dashboardData.admitted_patients}</span>
            {/* <span className="stat-sublabel">Currently</span> */}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-section">
        <h2>Quick Actions</h2>
        <div className="quick-actions-grid">
          <button onClick={() => navigate('/patients/register')} className="quick-action-card">
            <span className="action-icon">➕</span>
            <span className="action-label">Register New Patient</span>
          </button>
          <button onClick={() => navigate('/patients/list')} className="quick-action-card">
            <span className="action-icon">🔍</span>
            <span className="action-label">Find Patient</span>
          </button>
          {/* <button onClick={() => navigate('/visits/hospital/today')} className="quick-action-card">
            <span className="action-icon">📅</span>
            <span className="action-label">Today's Appointments</span>
          </button> */}
          {/* <button onClick={() => navigate('/patients/frequent')} className="quick-action-card">
            <span className="action-icon">🏥</span>
            <span className="action-label">Admitted Patients</span>
          </button> */}
          <button onClick={() => navigate('/patients/frequent')} className="quick-action-card">
              <span className="action-icon">🩺</span>
            <span className="action-label">Admitted Patients</span>
          </button>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="dashboard-two-column">
        {/* Left Column */}
        <div className="dashboard-column">
          {/* Patient Search */}
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

        {/* Right Column */}
        <div className="dashboard-column">
          {/* Today's Visits */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3>Today's Check-ins</h3>
              <button onClick={() => navigate('/visits/hospital/today')} className="btn-link">
                View All →
              </button>
            </div>
            <div className="card-content">
              {todayVisits.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">📋</span>
                  <p>No check-ins today</p>
                </div>
              ) : (
                <div 
                  className="activity-list"
                  style={{ 
                    maxHeight: '500px',
                    overflowY: 'auto'
                  }}
                >
                  {todayVisits.map((visit) => (
                    <div 
                      key={visit.visit_id} 
                      className="activity-item clickable"
                      onClick={() => navigate(`/visits/details/${visit.visit_id}`)}
                    >
                      <div className={`activity-icon ${getPriorityColor(visit.priority_level)}`}>
                        {visit.priority_level === 'critical' ? '🚨' : 
                         visit.priority_level === 'high' ? '⚠️' : '📋'}
                      </div>
                      <div className="activity-content">
                        <div className="activity-text">
                          <strong>{visit.patient_first_name} {visit.patient_last_name}</strong>
                          {' • '}{formatTime(visit.visit_date)}
                        </div>
                        <div className="activity-subtitle">
                          {visit.visit_type || 'General Visit'}
                          {visit.reason_for_visit && ` • ${visit.reason_for_visit.substring(0, 40)}...`}
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

          {/* Quick Stats */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3>Current Admission Status</h3>
            </div>
            <div className="card-content">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '12px',
                  background: '#f9fafb',
                  borderRadius: '6px'
                 }}>
                 <div>
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>Total Check-ins</div>
                    <div style={{ fontSize: '20px', fontWeight: '600', marginTop: '4px' }}>
                      {todayVisits.length}
                    </div>
                  </div>
                  <div style={{ fontSize: '32px' }}>📋</div>
                </div> */}

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '12px',
                  background: '#fef3c7',
                  borderRadius: '6px'
                }}>
                  <div>
                    <div style={{ fontSize: '13px', color: '#92400e' }}>Critical Admitted</div>
                    <div style={{ fontSize: '20px', fontWeight: '600', marginTop: '4px', color: '#92400e' }}>
                      {dashboardData.critical_admitted}
                    </div>
                  </div>
                  <div style={{ fontSize: '32px' }}>🚨</div>
                </div>

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '12px',
                  background: '#dbeafe',
                  borderRadius: '6px'
                }}>
                  <div>
                    <div style={{ fontSize: '13px', color: '#1e40af' }}>Currently Admitted</div>
                    <div style={{ fontSize: '20px', fontWeight: '600', marginTop: '4px', color: '#1e40af' }}>
                      {dashboardData.admitted_patients}
                    </div>
                  </div>
                  <div style={{ fontSize: '32px' }}>🏥</div>
                </div>

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '12px',
                  background: '#d1fae5',
                  borderRadius: '6px'
                }}>
                  <div>
                    <div style={{ fontSize: '13px', color: '#065f46' }}>Discharged Today</div>
                    <div style={{ fontSize: '20px', fontWeight: '600', marginTop: '4px', color: '#065f46' }}>
                      {todayVisits.filter(v => v.admission_status === 'discharged').length}
                    </div>
                  </div>
                  <div style={{ fontSize: '32px' }}>✅</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceptionistDashboard;
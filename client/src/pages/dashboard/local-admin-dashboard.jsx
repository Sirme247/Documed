import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../libs/apiCall.js";
import { toast } from "react-hot-toast";
import "./dashboard.css";

const LocalAdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    hospital_name: '',
    hospital_type: '',
    hospital_status: '',
    accredition_status: '',
    total_branches: 0,
    active_branches: 0,
    total_staff: 0,
    active_staff: 0,
    total_providers: 0,
    total_patients: 0,
    active_patients: 0,
    total_visits: 0,
    today_visits: 0,
    week_visits: 0,
    departments: [],
    visit_types: []
  });
  const [recentData, setRecentData] = useState({
    branches: [],
    users: [],
    patients: [],
    visits: []
  });
  const [todayVisits, setTodayVisits] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch statistics, recent data, and today's visits in parallel
      const [statsRes, branchesRes, usersRes, patientsRes, todayVisitsRes] = await Promise.all([
        api.get('/admin/hospital-statistics'),
        api.get('/hospitals/branches/list?limit=5&sort=created_at&order=DESC'),
        api.get('/users/hospital-users?limit=5'),
        api.get('/patients/get-patients?limit=5&sort=created_at&order=DESC'),
        api.get('/visits/hospital/visits/day')
      ]);

      if (statsRes.data.success) {
        setDashboardData(statsRes.data.data);
      }

      setRecentData({
        branches: branchesRes.data.data?.branches || [],
        users: usersRes.data.data?.users || usersRes.data.users || [],
        patients: patientsRes.data.data?.patients || []
      });

      // Set today's visits from the new endpoint
      if (todayVisitsRes.data.status === 'success') {
        setTodayVisits(todayVisitsRes.data.visits || []);
      }

    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
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

  const getStatusColor = (status) => {
    return status === 'Active' ? 'success' : 'danger';
  };

  const getAccreditationColor = (status) => {
    if (status === 'Accredited' || status === 'Fully Accredited') return 'success';
    if (status === 'Pending' || status === 'In Progress') return 'warning';
    return 'danger';
  };

  const getAdmissionStatusClass = (status) => {
    if (!status) return 'pending';
    const statusLower = status.toLowerCase();
    if (statusLower.includes('admitted')) return 'admitted';
    if (statusLower.includes('discharged')) return 'discharged';
    return 'pending';
  };

  // const getAdmissionStatusClass = (status) => {
  //   if (!status) return 'pending';
  //   const statusLower = status.toLowerCase();
  //   if (statusLower.includes('admitted')) return 'admitted';
  //   if (statusLower.includes('discharged')) return 'discharged';
  //   return 'pending';
  // };

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
          <h1>{dashboardData.hospital_name}</h1>
          <p className="dashboard-subtitle">
            {dashboardData.hospital_type} Hospital • 
            <span className={`status-inline ${getStatusColor(dashboardData.hospital_status)}`}>
              {' '}{dashboardData.hospital_status}
            </span>
          </p>
        </div>
        <div className="header-actions">
          <button onClick={fetchDashboardData} className="btn-refresh">
            🔄 Refresh
          </button>
          <button onClick={() => navigate('/users/register')} className="btn-primary">
            ➕ Add User
          </button>
        </div>
      </div>

      {/* Hospital Info Banner */}
      <div className={`hospital-info-banner ${getAccreditationColor(dashboardData.accredition_status)}`}>
        <div className="banner-content">
          <div className="banner-icon">🏥</div>
          <div>
            <span className="banner-title">Hospital Accreditation Status</span>
            <span className="banner-subtitle">{dashboardData.accredition_status}</span>
          </div>
        </div>
        <button onClick={() => navigate('/hospitals/current/get-profile')} className="btn-link-white">
          Hospital Details →
        </button>
      </div>

      {/* Main Statistics Grid */}
      <div className="stats-grid">
        {/* <div className="stat-card success" onClick={() => navigate('/users/list')}> */}
        <div className="stat-card success" >
          <div className="stat-icon-wrapper success">
            <span className="stat-icon">👥</span>
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Staff</span>
            <span className="stat-value">{dashboardData.total_staff}</span>
            <span className="stat-sublabel">{dashboardData.active_staff} Active</span>
          </div>
        </div>

        {/* <div className="stat-card warning" onClick={() => navigate('/providers')}>
          <div className="stat-icon-wrapper warning">
            <span className="stat-icon">👨‍⚕️</span>
          </div>
          <div className="stat-content">
            <span className="stat-label">Healthcare Providers</span>
            <span className="stat-value">{dashboardData.total_providers}</span>
            <span className="stat-sublabel">Active Providers</span>
          </div>
        </div> */}

        {/* <div className="stat-card purple" onClick={() => navigate('/visits/hospital/all')}> */}
        <div className="stat-card purple" >
          <div className="stat-icon-wrapper purple">
            <span className="stat-icon">📋</span>
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Visits</span>
            <span className="stat-value">{dashboardData.total_visits}</span>
            <span className="stat-sublabel">{dashboardData.today_visits} Today</span>
          </div>
        </div>

        {/* <div className="stat-card success" onClick={() => navigate('/visits/hospital/all')}> */}
        <div className="stat-card success" >
          <div className="stat-icon-wrapper success">
            <span className="stat-icon">📅</span>
          </div>
          <div className="stat-content">
            <span className="stat-label">This Week's Visits</span>
            <span className="stat-value">{dashboardData.week_visits}</span>
            <span className="stat-sublabel">Since Monday</span>
          </div>
        </div>

        {/* <div className="stat-card success" onClick={() => navigate('/visits/hospital/today')}> */}
        <div className="stat-card success" >
          <div className="stat-icon-wrapper success">
            <span className="stat-icon">📅</span>
          </div>
          <div className="stat-content">
            <span className="stat-label">Today's Visits</span>
            <span className="stat-value">{todayVisits.length}</span>
            <span className="stat-sublabel">Since Midnight</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-section">
        <h2>Quick Actions</h2>
        <div className="quick-actions-grid">
          <button onClick={() => navigate('/users/register')} className="quick-action-card">
            <span className="action-icon">👤</span>
            <span className="action-label">Add Staff Member</span>
          </button>
          <button onClick={() => navigate('/patients/register')} className="quick-action-card">
            <span className="action-icon">➕</span>
            <span className="action-label">Register Patient</span>
          </button>
          {/* <button onClick={() => navigate('/visits/new')} className="quick-action-card">
            <span className="action-icon">📋</span>
            <span className="action-label">New Visit</span>
          </button> */}
          <button onClick={() => navigate('/users/register-existing-doctor')} className="quick-action-card">
            <span className="action-icon">👤</span>
            <span className="action-label">Register Existing Doctor</span>
          </button>
          {/* <button onClick={() => navigate('/settings')} className="quick-action-card">
            <span className="action-icon">⚙️</span>
            <span className="action-label">Hospital Settings</span>
          </button> */}
          
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="dashboard-two-column">
        {/* Left Column */}
        <div className="dashboard-column">
          

          {/* Recent Users */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3>Recently Added Staff</h3>
              <button onClick={() => navigate('/users/list')} className="btn-link">
                View All →
              </button>
            </div>
            <div className="card-content">
              {recentData.users.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">👥</span>
                  <p>No staff members yet</p>
                </div>
              ) : (
                <div className="list-items">
                  {/* {recentData.users.map((user) => ( */}
                  {recentData.users.slice(0, 5).map((user) => (

                    <div 
                      key={user.user_id} 
                      className="list-item clickable"
                      onClick={() => navigate(`/users/${user.user_id}`)}
                    >
                      <div className="item-icon user-avatar">
                        {user.first_name?.[0]}{user.last_name?.[0]}
                      </div>
                      <div className="item-content">
                        <div className="item-title">{user.first_name} {user.last_name}</div>
                        <div className="item-subtitle">
                          {user.role} {user.department && `• ${user.department}`}
                        </div>
                      </div>
                      <div className="item-meta">
                        <span className={`status-badge ${user.employment_status === 'active' ? 'active' : 'inactive'}`}>
                          {user.employment_status}
                        </span>
                        <span className="item-date">{formatDate(user.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Departments Overview */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3>Staff by Department</h3>
              {/* <button onClick={() => navigate('/departments')} className="btn-link">
                View All →
              </button> */}
            </div>
            <div className="card-content">
              {dashboardData.departments.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">🏥</span>
                  <p>No department data available</p>
                </div>
              ) : (
                <div className="department-list">
                  {dashboardData.departments.map((dept, index) => (
                    <div key={index} className="department-item">
                      <div className="department-info">
                        <span className="department-name">{dept.department}</span>
                        <span className="department-count">{dept.count} staff members</span>
                      </div>
                      <div className="department-bar">
                        <div 
                          className="department-bar-fill" 
                          style={{ 
                            width: `${(dept.count / dashboardData.total_staff) * 100}%`,
                            background: `linear-gradient(90deg, ${['#667eea', '#11998e', '#f7971e', '#2193b0', '#8e2de2'][index % 5]} 0%, ${['#764ba2', '#38ef7d', '#ffd200', '#6dd5ed', '#4a00e0'][index % 5]} 100%)`
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>


        </div>

        {/* Right Column */}
        <div className="dashboard-column">
          {/* Visit Types Breakdown */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3>Visit Types (Last 30 Days)</h3>
              {/* <button onClick={() => navigate('/analytics/visits')} className="btn-link">
                View Analytics →
              </button> */}
            </div>
            <div className="card-content">
              {dashboardData.visit_types.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">📊</span>
                  <p>No visit data available</p>
                </div>
              ) : (
                <div className="visit-types-chart">
                  {dashboardData.visit_types.map((type, index) => {
                    const total = dashboardData.visit_types.reduce((sum, t) => sum + parseInt(t.count), 0);
                    const percentage = ((type.count / total) * 100).toFixed(1);
                    return (
                      <div key={index} className="visit-type-item">
                        <div className="visit-type-header">
                          <span className="visit-type-name">{type.visit_type || 'Unknown'}</span>
                          <span className="visit-type-stats">
                            <strong>{type.count}</strong> ({percentage}%)
                          </span>
                        </div>
                        <div className="visit-type-bar">
                          <div 
                            className="visit-type-bar-fill" 
                            style={{ 
                              width: `${percentage}%`,
                              background: `linear-gradient(90deg, ${['#667eea', '#11998e', '#f7971e', '#2193b0'][index % 4]} 0%, ${['#764ba2', '#38ef7d', '#ffd200', '#6dd5ed'][index % 4]} 100%)`
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

         

          {/* Today's Visits */}
          {/* <div className="dashboard-card">
            <div className="card-header">
              <h3>Today's Visits</h3>
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
                  {todayVisits.slice(0, 10).map((visit) => (
                    <div 
                      key={visit.visit_id} 
                      className="activity-item clickable"
                       onClick={() => navigate(`/visits/details/${visit.visit_id}`)}
                    >
                      <div className="activity-icon visit">
                        📋
                      </div>
                      <div className="activity-content">
                        <div className="activity-text">
                          <strong>{visit.patient_first_name} {visit.patient_last_name}</strong>
                          {' • '}{visit.visit_type || 'Visit'}
                        </div>
                        <div className="activity-subtitle">
                          {visit.reason_for_visit && `${visit.reason_for_visit.substring(0, 50)}${visit.reason_for_visit.length > 50 ? '...' : ''}`}
                          {visit.branch_name && ` • ${visit.branch_name}`}
                        </div>
                        <div className="activity-time">
                          {formatDateTime(visit.visit_date)}
                          {visit.priority_level && ` • Priority: ${visit.priority_level}`}
                        </div>
                      </div>
                      <span className={`status-badge ${getAdmissionStatusClass(visit.admission_status)}`}>
                        {visit.admission_status || 'Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default LocalAdminDashboard;
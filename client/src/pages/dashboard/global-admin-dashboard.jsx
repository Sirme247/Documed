import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../libs/apiCall.js";
import { toast } from "react-hot-toast";
// import "./dashboard.css";

const GlobalAdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    statistics: {
      total_hospitals: 0,
      active_hospitals: 0,
      total_branches: 0,
      total_users: 0,
      total_patients: 0,
      total_visits: 0,
      today_visits: 0,
      pending_approvals: 0
    },
    recentHospitals: [],
    recentUsers: [],
    recentAuditLogs: [],
    systemHealth: {},
    topHospitals: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch multiple endpoints in parallel
      const [statsRes, hospitalsRes, usersRes, auditsRes] = await Promise.all([
        api.get('/admin/statistics'),
        api.get('/hospitals/hospitals/list?limit=5&sort=created_at&order=DESC'),
        api.get('/users/list?limit=5&sort=created_at&order=DESC'),
        api.get('/audits/audit-logs/recent?limit=10')
      ]);

      setDashboardData({
        statistics: statsRes.data.data || {},
        recentHospitals: hospitalsRes.data.data?.hospitals || [],
        recentUsers: usersRes.data.data?.users || [],
        recentAuditLogs: auditsRes.data.data || [],
        systemHealth: {
          status: 'healthy',
          uptime: '99.9%',
          response_time: '45ms'
        },
        topHospitals: hospitalsRes.data.data?.hospitals || []
      });

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

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const { statistics, recentHospitals, recentUsers, recentAuditLogs, systemHealth, topHospitals } = dashboardData;

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>Global Admin Dashboard</h1>
          <p className="dashboard-subtitle">Welcome back! Here's what's happening in your healthcare network.</p>
        </div>
        <div className="header-actions">
          <button onClick={fetchDashboardData} className="btn-refresh">
            🔄 Refresh
          </button>
          <button onClick={() => navigate('/hospitals/register')} className="btn-primary">
            ➕ Add Hospital
          </button>
        </div>
      </div>

      {/* System Health Banner */}
      {/* <div className="system-health-banner">
        <div className="health-indicator">
          <div className="pulse-dot healthy"></div>
          <div>
            <span className="health-status">System Status: <strong>All Systems Operational</strong></span>
            <span className="health-details">Uptime: {systemHealth.uptime} • Response Time: {systemHealth.response_time}</span>
          </div>
        </div>
        <button onClick={() => navigate('/system/health')} className="btn-link">
          View Details →
        </button>
      </div> */}

      {/* Main Statistics Grid */}
      <div className="stats-grid">
        {/* <div className="stat-card primary" onClick={() => navigate('/hospitals/list')}> */}
        <div className="stat-card primary">
          <div className="stat-icon-wrapper primary">
            <span className="stat-icon">🏥</span>
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Hospitals</span>
            <span className="stat-value">{statistics.total_hospitals || 0}</span>
            <span className="stat-sublabel">{statistics.active_hospitals || 0} Active</span>
          </div>
          <div className="stat-trend positive">
            <span>+12%</span>
          </div>
        </div>

        {/* <div className="stat-card success" onClick={() => navigate('/hospitals/list')}> */}
        <div className="stat-card success">
          <div className="stat-icon-wrapper success">
            <span className="stat-icon">🏢</span>
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Branches</span>
            <span className="stat-value">{statistics.total_branches || 0}</span>
            <span className="stat-sublabel">Across all hospitals</span>
          </div>
          <div className="stat-trend positive">
            <span>+8%</span>
          </div>
        </div>

        {/* <div className="stat-card warning" onClick={() => navigate('/users/list')}> */}
        <div className="stat-card warning">
          <div className="stat-icon-wrapper warning">
            <span className="stat-icon">👥</span>
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Users</span>
            <span className="stat-value">{statistics.total_users || 0}</span>
            <span className="stat-sublabel">System-wide staff</span>
          </div>
          <div className="stat-trend positive">
            <span>+15%</span>
          </div>
        </div>

        {/* <div className="stat-card info" onClick={() => navigate('/patients/list')}> */}
        <div className="stat-card info">
          <div className="stat-icon-wrapper info">
            <span className="stat-icon">🏥</span>
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Patients</span>
            <span className="stat-value">{statistics.total_patients || 0}</span>
            <span className="stat-sublabel">Registered patients</span>
          </div>
          <div className="stat-trend positive">
            <span>+23%</span>
          </div>
        </div>

        {/* <div className="stat-card purple" onClick={() => navigate('/visits')}>
          <div className="stat-icon-wrapper purple">
            <span className="stat-icon">📋</span>
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Visits</span>
            <span className="stat-value">{statistics.total_visits || 0}</span>
            <span className="stat-sublabel">{statistics.today_visits || 0} today</span>
          </div>
          <div className="stat-trend positive">
            <span>+18%</span>
          </div>
        </div> */}

        {/* <div className="stat-card danger" onClick={() => navigate('/approvals')}>
          <div className="stat-icon-wrapper danger">
            <span className="stat-icon">⏳</span>
          </div>
          <div className="stat-content">
            <span className="stat-label">Pending Approvals</span>
            <span className="stat-value">{statistics.pending_approvals || 0}</span>
            <span className="stat-sublabel">Requires attention</span>
          </div>
          {statistics.pending_approvals > 0 && (
            <div className="stat-badge pulse">Action Needed</div>
          )}
        </div> */}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-section">
        <h2>Quick Actions</h2>
        <div className="quick-actions-grid">
          <button onClick={() => navigate('/hospitals/register')} className="quick-action-card">
            <span className="action-icon">➕</span>
            <span className="action-label">Register Hospital</span>
          </button>
          <button onClick={() => navigate('/users/list')} className="quick-action-card">
            <span className="action-icon">👤</span>
            <span className="action-label">View Users</span>
          </button>
          {/* <button onClick={() => navigate('/reports')} className="quick-action-card">
            <span className="action-icon">📊</span>
            <span className="action-label">View Reports</span>
          </button> */}
          <button onClick={() => navigate('/patients/register')} className="quick-action-card">
            <span className="action-icon">📝</span>
            <span className="action-label">Register Patient</span>
          </button>
          {/* <button onClick={() => navigate('/settings')} className="quick-action-card">
            <span className="action-icon">⚙️</span>
            <span className="action-label">System Settings</span>
          </button> */}
          {/* <button onClick={() => navigate('/backup')} className="quick-action-card">
            <span className="action-icon">💾</span>
            <span className="action-label">Backup & Restore</span>
          </button> */}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="dashboard-two-column">
        {/* Left Column */}
        <div className="dashboard-column">
          {/* Recent Hospitals */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3>Recently Added Hospitals</h3>
              <button onClick={() => navigate('/hospitals/list')} className="btn-link">
                View All →
              </button>
            </div>
            <div className="card-content">
              {recentHospitals.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">🏥</span>
                  <p>No hospitals yet</p>
                </div>
              ) : (
                <div className="list-items">
                  {recentHospitals.map((hospital) => (
                    <div 
                      key={hospital.hospital_id} 
                      className="list-item clickable"
                      onClick={() => navigate(`/hospitals/${hospital.hospital_id}`)}
                    >
                      <div className="item-icon">🏥</div>
                      <div className="item-content">
                        <div className="item-title">{hospital.hospital_name}</div>
                        <div className="item-subtitle">
                          {hospital.city}, {hospital.country} • {hospital.hospital_type}
                        </div>
                      </div>
                      <div className="item-meta">
                        <span className={`status-badge ${hospital.is_active ? 'active' : 'inactive'}`}>
                          {hospital.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <span className="item-date">{formatDate(hospital.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Users
          <div className="dashboard-card">
            <div className="card-header">
              <h3>Recently Added Users</h3>
              <button onClick={() => navigate('/users/list')} className="btn-link">
                View All →
              </button>
            </div>
            <div className="card-content">
              {recentUsers.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">👥</span>
                  <p>No users yet</p>
                </div>
              ) : (
                <div className="list-items">
                  {recentUsers.map((user) => (
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
                          {user.email} • {user.role}
                        </div>
                      </div>
                      <div className="item-meta">
                        <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <span className="item-date">{formatDate(user.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div> */}
        </div>

        {/* Right Column */}
        <div className="dashboard-column">
          {/* Top Performing Hospitals */}
          {/* <div className="dashboard-card">
            <div className="card-header">
              <h3>Top Hospitals by Activity</h3>
              <button onClick={() => navigate('/analytics/hospitals')} className="btn-link">
                View Analytics →
              </button>
            </div>
            <div className="card-content">
              {topHospitals.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">📊</span>
                  <p>No data available</p>
                </div>
              ) : (
                <div className="ranking-list">
                  {topHospitals.map((hospital, index) => (
                    <div 
                      key={hospital.hospital_id} 
                      className="ranking-item"
                      onClick={() => navigate(`/hospitals/${hospital.hospital_id}`)}
                    >
                      <div className="rank-badge">{index + 1}</div>
                      <div className="ranking-content">
                        <div className="ranking-title">{hospital.hospital_name}</div>
                        <div className="ranking-subtitle">{hospital.city}, {hospital.country}</div>
                      </div>
                      <div className="ranking-stats">
                        <span className="ranking-value">🛏️ {hospital.bed_capacity || 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div> */}

          {/* Recent Activity / Audit Logs */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3>Recent System Activity</h3>
              <button onClick={() => navigate('/audits/logs')} className="btn-link">
                View All Logs →
              </button>
            </div>
            <div className="card-content">
              {recentAuditLogs.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">📝</span>
                  <p>No recent activity</p>
                </div>
              ) : (
                <div className="activity-list">
                  {recentAuditLogs.slice(0, 8).map((log) => (
                    <div key={log.log_id} className="activity-item">
                      <div className={`activity-icon ${log.event_type?.toLowerCase()}`}>
                        {log.event_type === 'Create' && '➕'}
                        {log.event_type === 'Update' && '✏️'}
                        {log.event_type === 'Delete' && '🗑️'}
                        {log.event_type === 'Read' && '👁️'}
                      </div>
                      <div className="activity-content">
                        <div className="activity-text">
                          <strong>{log.user_first_name} {log.user_last_name}</strong>
                          {' '}{log.event_type?.toLowerCase()} {log.table_name}
                        </div>
                        <div className="activity-time">{formatDateTime(log.timestamp)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalAdminDashboard;
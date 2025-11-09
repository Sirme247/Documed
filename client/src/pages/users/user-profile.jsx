import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Mail, Phone, MapPin, Calendar, Briefcase, 
  Building2, Shield, Activity, Clock, Edit, ArrowLeft,
  CheckCircle, XCircle, AlertCircle, Users, FileText,
  Hospital, Award, IdCard, Stethoscope
} from 'lucide-react';
import api from '../../libs/apiCall.js';
import { toast } from 'react-hot-toast';
import './user-profile.css';

const UserProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        setLoading(true);
        // ✅ This endpoint gets YOUR OWN profile (no user_id needed)
        const { data } = await api.get('/users/user-profile');
        
        if (data.status === "success") {
          setUserData(data.data);
        } else {
          toast.error("Failed to fetch your profile");
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error(error?.response?.data?.message || "Failed to fetch your profile");
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, []); // No dependencies needed

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getRoleColor = (roleId) => {
    const colors = {
      1: '#8b5cf6',
      2: '#3b82f6',
      3: '#10b981',
      4: '#06b6d4',
      5: '#f59e0b'
    };
    return colors[roleId] || '#6b7280';
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: { bg: '#dcfce7', color: '#166534', icon: CheckCircle },
      inactive: { bg: '#fee2e2', color: '#991b1b', icon: XCircle },
      suspended: { bg: '#fef3c7', color: '#92400e', icon: AlertCircle }
    };
    const style = styles[status?.toLowerCase()] || styles.inactive;
    const Icon = style.icon;
    
    return (
      <span style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: '6px',
        padding: '6px 12px', 
        background: style.bg, 
        color: style.color, 
        borderRadius: '20px',
        fontSize: '14px',
        fontWeight: '600'
      }}>
        <Icon size={16} />
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="user-profile-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="user-profile-container">
        <div className="empty-state">
          <User size={48} />
          <p>Profile not found</p>
        </div>
      </div>
    );
  }

  const { user, provider, statistics, recentActivity } = userData;

  return (
    <div className="user-profile-container">
      {/* Header */}
      <div className="profile-header">
        <h2>My Profile</h2>
        {/* <button className="btn-edit" onClick={() => navigate('/users/self-update')}>
          <Edit size={18} />
          Edit Profile
        </button> */}
      </div>

      {/* Profile Banner */}
      <div className="profile-banner">
        <div className="banner-background" style={{ background: getRoleColor(user.role_id) }}></div>
        <div className="profile-main">
          <div className="profile-avatar">
            <div className="avatar-circle" style={{ background: getRoleColor(user.role_id) }}>
              {user.first_name?.[0]}{user.last_name?.[0]}
            </div>
            {provider && (
              <div className="provider-badge" title="Healthcare Provider">
                <Stethoscope size={20} />
              </div>
            )}
          </div>
          
          tab
          <div className="profile-info">
            <h1 className="profile-name">
              {user.first_name} {user.middle_name} {user.last_name}
            </h1>
            <div className="profile-meta">
              <span className="role-badge" style={{ background: getRoleColor(user.role_id),color: 'white'}}>
                <Shield size={14} />
                {user.role_name}
              </span>
              {getStatusBadge(user.account_status)}
              {user.employee_id && (
                <span className="employee-id">
                  <IdCard size={14} />
                  {user.employee_id}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards (for providers) */}
      {provider && statistics && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#dbeafe' }}>
              <Users size={24} style={{ color: '#1e40af' }} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{statistics.total_patients || 0}</div>
              <div className="stat-label">Total Patients</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#dcfce7' }}>
              <Activity size={24} style={{ color: '#166534' }} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{statistics.total_visits || 0}</div>
              <div className="stat-label">Total Visits</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#fef3c7' }}>
              <Calendar size={24} style={{ color: '#92400e' }} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{statistics.visits_last_30_days || 0}</div>
              <div className="stat-label">Last 30 Days</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#f3e8ff' }}>
              <Award size={24} style={{ color: '#6b21a8' }} />
            </div>
            <div className="stat-content">
              <div className="stat-value" style={{ 
                color: statistics.license_status === 'Valid' ? '#166534' : '#991b1b',
                fontSize: '16px'
              }}>
                {statistics.license_status || 'N/A'}
              </div>
              <div className="stat-label">License Status</div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="profile-tabs">
        <button 
          className={`tabs ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <User size={18} />
          Overview
        </button>
        
        {provider && (
          <button 
            className={`tabs ${activeTab === 'professional' ? 'active' : ''}`}
            onClick={() => setActiveTab('professional')}
          >
            <Stethoscope size={18} />
            Professional Info
          </button>
        )}
        
        <button 
          className={`tabs ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          <Activity size={18} />
          Recent Activity
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-content">
            <div className="info-section">
              <h3 className="section-title">
                <User size={20} />
                Personal Information
              </h3>
              <div className="info-grid">
                <div className="info-item">
                  <label><Mail size={16} /> Email</label>
                  <p>{user.email || 'N/A'}</p>
                </div>
                <div className="info-item">
                  <label><Phone size={16} /> Contact</label>
                  <p>{user.contact_info || 'N/A'}</p>
                </div>
                <div className="info-item">
                  <label><Calendar size={16} /> Date of Birth</label>
                  <p>{formatDate(user.date_of_birth)}</p>
                </div>
                <div className="info-item">
                  <label><User size={16} /> Gender</label>
                  <p>{user.gender || 'N/A'}</p>
                </div>
                <div className="info-item full-width">
                  <label><MapPin size={16} /> Address</label>
                  <p>{user.address_line || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="info-section">
              <h3 className="section-title">
                <Briefcase size={20} />
                Employment Information
              </h3>
              <div className="info-grid">
                <div className="info-item">
                  <label><Building2 size={16} /> Department</label>
                  <p>{user.department || 'N/A'}</p>
                </div>
                <div className="info-item">
                  <label><Activity size={16} /> Employment Status</label>
                  <p>{user.employment_status || 'N/A'}</p>
                </div>
                <div className="info-item">
                  <label><Clock size={16} /> Last Login</label>
                  <p>{formatDateTime(user.last_login)}</p>
                </div>
                <div className="info-item">
                  <label><Calendar size={16} /> Joined</label>
                  <p>{formatDate(user.created_at)}</p>
                </div>
              </div>
            </div>

            {user.hospital_name && (
              <div className="info-section">
                <h3 className="section-title">
                  <Hospital size={20} />
                  Hospital Assignment
                </h3>
                <div className="hospital-card">
                  <div className="hospital-info">
                    <h4>{user.hospital_name}</h4>
                    <p className="hospital-type">{user.hospital_type}</p>
                    <div className="hospital-location">
                      <MapPin size={14} />
                      <span>
                        {[user.hospital_city, user.hospital_state, user.hospital_country]
                          .filter(Boolean).join(', ')}
                      </span>
                    </div>
                    {user.hospital_email && (
                      <div className="hospital-contact">
                        <Mail size={14} />
                        <span>{user.hospital_email}</span>
                      </div>
                    )}
                    {user.hospital_phone && (
                      <div className="hospital-contact">
                        <Phone size={14} />
                        <span>{user.hospital_phone}</span>
                      </div>
                    )}
                  </div>
                  
                  {user.branch_name && (
                    <div className="branch-info">
                      <h5>Branch: {user.branch_name}</h5>
                      <p className="branch-type">{user.branch_type}</p>
                      <div className="branch-location">
                        <MapPin size={12} />
                        <span>
                          {[user.branch_city, user.branch_state, user.branch_country]
                            .filter(Boolean).join(', ')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Professional Info Tab (for providers) */}
        {activeTab === 'professional' && provider && (
          <div className="professional-content">
            <div className="info-section">
              <h3 className="section-title">
                <Award size={20} />
                License Information
              </h3>
              <div className="info-grid">
                <div className="info-item">
                  <label><IdCard size={16} /> License Number</label>
                  <p className="license-number">{provider.license_number}</p>
                </div>
                <div className="info-item">
                  <label><Calendar size={16} /> License Expiry</label>
                  <p style={{ 
                    color: new Date(provider.license_expiry) < new Date() ? '#dc2626' : '#16a34a'
                  }}>
                    {formatDate(provider.license_expiry)}
                  </p>
                </div>
                <div className="info-item">
                  <label><Stethoscope size={16} /> Specialization</label>
                  <p>{provider.specialization || 'General Practice'}</p>
                </div>
                <div className="info-item">
                  <label><Calendar size={16} /> Provider Since</label>
                  <p>{formatDate(provider.provider_created_at)}</p>
                </div>
              </div>
            </div>

            {provider.hospitals && provider.hospitals.length > 0 && (
              <div className="info-section">
                <h3 className="section-title">
                  <Hospital size={20} />
                  Hospital Affiliations ({provider.hospitals.length})
                </h3>
                <div className="hospitals-list">
                  {provider.hospitals.map((hosp, index) => (
                    <div key={index} className="hospital-affiliation-card">
                      <div className="affiliation-header">
                        <h4>{hosp.hospital_name}</h4>
                        {hosp.is_primary && (
                          <span className="primary-badge">Primary</span>
                        )}
                      </div>
                      <p className="hospital-type">{hosp.hospital_type}</p>
                      <div className="affiliation-details">
                        <div className="detail-item">
                          <MapPin size={14} />
                          <span>
                            {[hosp.hospital_city, hosp.hospital_state, hosp.hospital_country]
                              .filter(Boolean).join(', ')}
                          </span>
                        </div>
                        <div className="detail-item">
                          <Calendar size={14} />
                          <span>
                            Since {formatDate(hosp.start_date)}
                            {hosp.end_date && ` - ${formatDate(hosp.end_date)}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="activity-content">
            <div className="info-section">
              <h3 className="section-title">
                <Activity size={20} />
                Recent Activity
              </h3>
              {recentActivity && recentActivity.length > 0 ? (
                <div className="activity-timeline">
                  {recentActivity.map((activity, index) => (
                    <div key={activity.log_id || index} className="activity-item">
                      <div className="activity-icon">
                        <FileText size={16} />
                      </div>
                      <div className="activity-content-item">
                        <div className="activity-header">
                          <span className="activity-type">{activity.action_type}</span>
                          <span className="activity-time">{formatDateTime(activity.timestamp)}</span>
                        </div>
                        <div className="activity-details">
                          <span className="activity-table">Table: {activity.table_name}</span>
                          <span className="activity-event">{activity.event_type}</span>
                          {activity.ip_address && (
                            <span className="activity-ip">IP: {activity.ip_address}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state-small">
                  <Activity size={32} />
                  <p>No recent activity</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
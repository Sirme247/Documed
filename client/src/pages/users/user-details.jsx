import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../libs/apiCall';
import { toast } from 'react-hot-toast';
import useStore from '../../store/index.js';
import './users.css';

const UserDetails = () => {
  const { user_id } = useParams();
  const navigate = useNavigate();
  const currentUser = useStore((state) => state.user);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [modal, setModal] = useState({ type: null, isOpen: false });
  const [actionLoading, setActionLoading] = useState(false);
  const [formData, setFormData] = useState({ reason: '', confirmText: '' });

  // Check if current user is admin (role_id 1)
  const isAdmin = currentUser?.role_id === 1;

  useEffect(() => {
    fetchUserDetails();
  }, [user_id]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/users/user-details/${user_id}`);
      
      if (response.data.status === 'success') {
        setUserData(response.data.data);
      } else {
        toast.error('Failed to fetch user details');
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch user details');
      navigate('/users/list');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

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

  const getStatusBadgeClass = (status) => {
    switch(status?.toLowerCase()) {
      case 'active':
        return 'status-badge active';
      case 'inactive':
      case 'suspended':
        return 'status-badge inactive';
      case 'pending':
        return 'status-badge pending';
      default:
        return 'status-badge';
    }
  };

  const getLicenseStatusClass = (status) => {
    switch(status) {
      case 'Valid':
        return 'status-badge active';
      case 'Expired':
        return 'status-badge inactive';
      default:
        return 'status-badge pending';
    }
  };

  // Action Handlers
  const handleDeactivate = async () => {
    if (!formData.reason.trim()) {
      toast.error('Please provide a reason');
      return;
    }

    setActionLoading(true);
    try {
      const response = await api.put(`/users/deactivate-user/${user_id}`, {
        reason: formData.reason,
        suspension_type: 'inactive'
      });

      if (response.data.status === 'success') {
        toast.success('User deactivated successfully');
        setModal({ type: null, isOpen: false });
        setFormData({ reason: '', confirmText: '' });
        fetchUserDetails();
      } else {
        toast.error(response.data.message || 'Failed to deactivate user');
      }
    } catch (error) {
      console.error('Deactivate error:', error);
      toast.error(error.response?.data?.message || 'Error deactivating user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivate = async () => {
    setActionLoading(true);
    try {
      const response = await api.put(`/users/reactivate-user/${user_id}`, {
        reason: formData.reason || 'Account reactivated by admin'
      });

      if (response.data.status === 'success') {
        toast.success('User reactivated successfully');
        setModal({ type: null, isOpen: false });
        setFormData({ reason: '', confirmText: '' });
        fetchUserDetails();
      } else {
        toast.error(response.data.message || 'Failed to reactivate user');
      }
    } catch (error) {
      console.error('Reactivate error:', error);
      toast.error(error.response?.data?.message || 'Error reactivating user');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePermanentDelete = async () => {
    if (formData.confirmText !== 'DELETE') {
      toast.error('You must type "DELETE" to confirm');
      return;
    }

    if (!formData.reason.trim()) {
      toast.error('Please provide a reason for deletion');
      return;
    }

    setActionLoading(true);
    try {
      const response = await api.delete(`/users/delete-user-permanently/${user_id}`, {
        data: {
          confirmation_text: 'DELETE',
          reason: formData.reason
        }
      });

      if (response.data.status === 'success') {
        toast.success('User permanently deleted');
        setModal({ type: null, isOpen: false });
        setTimeout(() => navigate('/users/list'), 1500);
      } else {
        toast.error(response.data.message || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.message || 'Error deleting user');
    } finally {
      setActionLoading(false);
    }
  };

  const openModal = (type) => {
    setFormData({ reason: '', confirmText: '' });
    setModal({ type, isOpen: true });
  };

  const closeModal = () => {
    setModal({ type: null, isOpen: false });
    setFormData({ reason: '', confirmText: '' });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading user details...</p>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="empty-state">
        <span className="empty-icon">👤</span>
        <p>User not found</p>
        <button onClick={() => navigate('/users/list')} className="btn-primary">
          Back to Users
        </button>
      </div>
    );
  }

  const { user, provider, statistics, recentActivity } = userData;

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>User Details</h1>
          <p className="dashboard-subtitle">
            Complete profile information for {user.first_name} {user.last_name}
          </p>
        </div>
        <div className="header-actions">
          <button onClick={() => navigate('/users/list')} className="btn-refresh">
            ← Back
          </button>
          <button 
            onClick={() => navigate(`/users/${user_id}/edit`)} 
            className="btn-primary"
          >
            ✏️ Edit User
          </button>
        </div>
      </div>

      {/* User Info Banner */}
      <div className="hospital-info-banner success">
        <div className="banner-content">
          <div className="item-icon user-avatar" style={{ width: '80px', height: '80px', fontSize: '2rem' }}>
            {user.first_name?.[0]}{user.last_name?.[0]}
          </div>
          <div>
            <span className="banner-title">{user.role_name}</span>
            <span className="banner-subtitle">
              {user.first_name} {user.middle_name || ''} {user.last_name}
            </span>
            <div style={{ marginTop: '0.5rem' }}>
              <span className={getStatusBadgeClass(user.account_status)}>
                {user.account_status}
              </span>
              <span className={getStatusBadgeClass(user.employment_status)} style={{ marginLeft: '0.5rem' }}>
                {user.employment_status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons - Show conditionally based on account status and role */}
      <div className="action-buttons-group">
        {user.account_status === 'active' && (
          <button 
            onClick={() => openModal('deactivate')} 
            className="btn-action btn-warning"
          >
            🔒 Deactivate Account
          </button>
        )}
        {(user.account_status === 'inactive' || user.account_status === 'suspended') && (
          <button 
            onClick={() => openModal('reactivate')} 
            className="btn-action btn-success"
          >
            ✅ Reactivate Account
          </button>
        )}
        {/* Only show delete button to admins (role_id 1) */}
        {isAdmin && (
          <button 
            onClick={() => openModal('delete')} 
            className="btn-action btn-danger"
          >
            🗑️ Delete Permanently
          </button>
        )}
      </div>

      {/* Statistics Cards (for providers) */}
      {provider && statistics && (
        <div className="stats-grid">
          {/* <div className="stat-card primary">
            <div className="stat-icon-wrapper primary">
              <span className="stat-icon">🏥</span>
            </div>
            <div className="stat-content">
              <span className="stat-label">Total Visits</span>
              <span className="stat-value">{statistics.total_visits || 0}</span>
              <span className="stat-sublabel">All time</span>
            </div>
          </div> */}

          {/* <div className="stat-card success">
            <div className="stat-icon-wrapper success">
              <span className="stat-icon">👥</span>
            </div>
            <div className="stat-content">
              <span className="stat-label">Total Patients</span>
              <span className="stat-value">{statistics.total_patients || 0}</span>
              <span className="stat-sublabel">Unique patients</span>
            </div>
          </div> */}

          {/* <div className="stat-card info">
            <div className="stat-icon-wrapper info">
              <span className="stat-icon">📅</span>
            </div>
            <div className="stat-content">
              <span className="stat-label">Last 30 Days</span>
              <span className="stat-value">{statistics.visits_last_30_days || 0}</span>
              <span className="stat-sublabel">Visits</span>
            </div>
          </div> */}

          <div className="stat-card warning">
            <div className="stat-icon-wrapper warning">
              <span className="stat-icon">📋</span>
            </div>
            <div className="stat-content">
              <span className="stat-label">License Status</span>
              <span className={getLicenseStatusClass(statistics.license_status)}>
                {statistics.license_status}
              </span>
              <span className="stat-sublabel">
                {provider.license_expiry ? `Expires ${formatDate(provider.license_expiry)}` : 'No expiry date'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="dashboard-two-column">
        {/* Left Column */}
        <div className="dashboard-column">
          {/* Personal Information */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3>Personal Information</h3>
            </div>
            <div className="card-content">
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Employee ID</span>
                  <span className="info-value">{user.employee_id || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Username</span>
                  <span className="info-value">{user.username}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Email</span>
                  <span className="info-value">{user.email}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Contact</span>
                  <span className="info-value">{user.contact_info || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Date of Birth</span>
                  <span className="info-value">{formatDate(user.date_of_birth)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Gender</span>
                  <span className="info-value">{user.gender || 'N/A'}</span>
                </div>
                <div className="info-item" style={{ gridColumn: '1 / -1' }}>
                  <span className="info-label">Address</span>
                  <span className="info-value">{user.address_line || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Organization Information */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3>Organization Information</h3>
            </div>
            <div className="card-content">
              {user.hospital_id ? (
                <div className="info-grid">
                  <div className="info-item" style={{ gridColumn: '1 / -1' }}>
                    <span className="info-label">Hospital</span>
                    <span className="info-value">
                      {user.hospital_name} ({user.hospital_type})
                    </span>
                  </div>
                  <div className="info-item" style={{ gridColumn: '1 / -1' }}>
                    <span className="info-label">Location</span>
                    <span className="info-value">
                      {user.hospital_city}, {user.hospital_state}, {user.hospital_country}
                    </span>
                  </div>
                  {user.hospital_email && (
                    <div className="info-item">
                      <span className="info-label">Hospital Email</span>
                      <span className="info-value">{user.hospital_email}</span>
                    </div>
                  )}
                  {user.hospital_phone && (
                    <div className="info-item">
                      <span className="info-label">Hospital Phone</span>
                      <span className="info-value">{user.hospital_phone}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="empty-state">
                  <p>No hospital assigned</p>
                </div>
              )}

              {user.branch_id && (
                <div className="info-grid" style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '2px solid #f1f3f5' }}>
                  <div className="info-item" style={{ gridColumn: '1 / -1' }}>
                    <span className="info-label">Branch</span>
                    <span className="info-value">
                      {user.branch_name} ({user.branch_type})
                    </span>
                  </div>
                  <div className="info-item" style={{ gridColumn: '1 / -1' }}>
                    <span className="info-label">Branch Location</span>
                    <span className="info-value">
                      {user.branch_city}, {user.branch_state}, {user.branch_country}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="dashboard-column">
          {/* Provider Information */}
          {provider && (
            <div className="dashboard-card">
              <div className="card-header">
                <h3>Healthcare Provider Details</h3>
              </div>
              <div className="card-content">
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">License Number</span>
                    <span className="info-value">{provider.license_number}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">License Expiry</span>
                    <span className="info-value">{formatDate(provider.license_expiry)}</span>
                  </div>
                  <div className="info-item" style={{ gridColumn: '1 / -1' }}>
                    <span className="info-label">Specialization</span>
                    <span className="info-value">{provider.specialization || 'N/A'}</span>
                  </div>
                </div>

                {provider.hospitals && provider.hospitals.length > 0 && (
                  <div style={{ marginTop: '1.5rem' }}>
                    <h4 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#495057' }}>
                      Linked Hospitals ({provider.hospitals.length})
                    </h4>
                    <div className="list-items">
                      {provider.hospitals.map((hospital, index) => (
                        <div key={index} className="list-item">
                          <div className="item-icon">🏥</div>
                          <div className="item-content">
                            <div className="item-title">{hospital.hospital_name}</div>
                            <div className="item-subtitle">
                              {hospital.hospital_city}, {hospital.hospital_country}
                            </div>
                          </div>
                          {hospital.is_primary && (
                            <span className="status-badge active">Primary</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          {recentActivity && recentActivity.length > 0 && (
            <div className="dashboard-card">
              <div className="card-header">
                <h3>Recent Activity</h3>
                <button onClick={() => navigate('/audit-logs')} className="btn-link">
                  View All →
                </button>
              </div>
              <div className="card-content">
                <div className="activity-list">
                  {recentActivity.map((activity) => (
                    <div key={activity.log_id} className="activity-item">
                      <div className={`activity-icon ${activity.event_type?.toLowerCase()}`}>
                        {activity.event_type === 'CREATE' && '➕'}
                        {activity.event_type === 'UPDATE' && '✏️'}
                        {activity.event_type === 'DELETE' && '🗑️'}
                        {activity.event_type === 'READ' && '👁️'}
                      </div>
                      <div className="activity-content">
                        <div className="activity-text">
                          <strong>{activity.action_type}</strong> on {activity.table_name}
                        </div>
                        <div className="activity-time">{formatDateTime(activity.timestamp)}</div>
                        {activity.ip_address && (
                          <div className="activity-subtitle">IP: {activity.ip_address}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Account Information */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3>Account Timestamps</h3>
            </div>
            <div className="card-content">
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Created At</span>
                  <span className="info-value">{formatDateTime(user.created_at)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Last Updated</span>
                  <span className="info-value">{formatDateTime(user.updated_at)}</span>
                </div>
                {provider && (
                  <>
                    <div className="info-item">
                      <span className="info-label">Provider Created</span>
                      <span className="info-value">{formatDateTime(provider.provider_created_at)}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Provider Updated</span>
                      <span className="info-value">{formatDateTime(provider.provider_updated_at)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Employment Information */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3>Employment Information</h3>
            </div>
            <div className="card-content">
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Department</span>
                  <span className="info-value">{user.department || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Role</span>
                  <span className="info-value">{user.role_name}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Employment Status</span>
                  <span className={getStatusBadgeClass(user.employment_status)}>
                    {user.employment_status}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Account Status</span>
                  <span className={getStatusBadgeClass(user.account_status)}>
                    {user.account_status}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Last Login</span>
                  <span className="info-value">{formatDateTime(user.last_login)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Must Change Password</span>
                  <span className="info-value">{user.must_change_password ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Dialogs */}
      {modal.isOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {/* Deactivate Modal */}
            {modal.type === 'deactivate' && (
              <>
                <div className="modal-header">
                  <h2>🔒 Deactivate User Account</h2>
                  <button className="modal-close" onClick={closeModal}>✕</button>
                </div>
                <div className="modal-body">
                  <p>You are about to deactivate <strong>{user.first_name} {user.last_name}</strong>'s account.</p>
                  <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
                    The user will not be able to access the system until reactivated.
                  </p>
                  <div className="form-group">
                    <label>Reason for deactivation *</label>
                    <textarea
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      placeholder="Enter reason..."
                      rows="4"
                      className="form-textarea"
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button onClick={closeModal} className="btn-secondary">Cancel</button>
                  <button 
                    onClick={handleDeactivate} 
                    disabled={actionLoading || !formData.reason.trim()}
                    className="btn-danger"
                  >
                    {actionLoading ? 'Processing...' : 'Deactivate'}
                  </button>
                </div>
              </>
            )}

            {/* Reactivate Modal */}
            {modal.type === 'reactivate' && (
              <>
                <div className="modal-header">
                  <h2>✅ Reactivate User Account</h2>
                  <button className="modal-close" onClick={closeModal}>✕</button>
                </div>
                <div className="modal-body">
                  <p>You are about to reactivate <strong>{user.first_name} {user.last_name}</strong>'s account.</p>
                  <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
                    The user will regain access to the system.
                  </p>
                  <div className="form-group">
                    <label>Reason for reactivation (optional)</label>
                    <textarea
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      placeholder="Enter reason..."
                      rows="4"
                      className="form-textarea"
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button onClick={closeModal} className="btn-secondary">Cancel</button>
                  <button 
                    onClick={handleReactivate} 
                    disabled={actionLoading}
                    className="btn-success"
                  >
                    {actionLoading ? 'Processing...' : 'Reactivate'}
                  </button>
                </div>
              </>
            )}

            {/* Delete Modal */}
            {modal.type === 'delete' && (
              <>
                <div className="modal-header">
                  <h2 style={{ color: '#dc3545' }}>🗑️ Permanently Delete User</h2>
                  <button className="modal-close" onClick={closeModal}>✕</button>
                </div>
                <div className="modal-body">
                  <div style={{ 
                    padding: '1rem', 
                    backgroundColor: '#fee', 
                    border: '1px solid #fcc', 
                    borderRadius: '4px',
                    marginBottom: '1rem'
                  }}>
                    <strong style={{ color: '#dc3545' }}>⚠️ WARNING: This action cannot be undone!</strong>
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
                      This will permanently delete {user.first_name} {user.last_name}'s account and all associated data.
                    </p>
                  </div>

                  <div className="form-group">
                    <label>Reason for deletion *</label>
                    <textarea
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      placeholder="Enter reason..."
                      rows="3"
                      className="form-textarea"
                    />
                  </div>

                  <div className="form-group">
                    <label>Type <strong>"DELETE"</strong> to confirm *</label>
                    <input
                      type="text"
                      value={formData.confirmText}
                      onChange={(e) => setFormData({ ...formData, confirmText: e.target.value })}
                      placeholder="Type DELETE"
                      className="form-input"
                      style={{ fontWeight: 'bold' }}
                    />
                    {formData.confirmText !== 'DELETE' && formData.confirmText && (
                      <p style={{ color: '#dc3545', fontSize: '0.85rem', margin: '0.5rem 0 0 0' }}>
                        Text must match exactly
                      </p>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button onClick={closeModal} className="btn-secondary">Cancel</button>
                  <button 
                    onClick={handlePermanentDelete} 
                    disabled={actionLoading || formData.confirmText !== 'DELETE' || !formData.reason.trim()}
                    className="btn-danger"
                  >
                    {actionLoading ? 'Deleting...' : 'Delete Permanently'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDetails;
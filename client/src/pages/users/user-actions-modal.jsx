import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../libs/apiCall';
import { toast } from 'react-hot-toast';
import './users.css';

const UserActionsModal = ({ user, isOpen, onClose, onSuccess }) => {
  const navigate = useNavigate();
  const [actionType, setActionType] = useState(null); // 'deactivate', 'suspend', 'delete'
  const [reason, setReason] = useState('');
  const [confirmationText, setConfirmationText] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleDeactivate = async () => {
    try {
      setLoading(true);
      const response = await api.patch(`/users/deactivate/${user.user_id}`, {
        reason,
        suspension_type: actionType === 'suspend' ? 'Suspended' : 'Inactive'
      });

      if (response.data.status === 'success') {
        toast.success(response.data.message);
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Deactivate error:', error);
      toast.error(error.response?.data?.message || 'Failed to deactivate user');
    } finally {
      setLoading(false);
    }
  };

  const handleReactivate = async () => {
    try {
      setLoading(true);
      const response = await api.patch(`/users/reactivate/${user.user_id}`, {
        reason
      });

      if (response.data.status === 'success') {
        toast.success(response.data.message);
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Reactivate error:', error);
      toast.error(error.response?.data?.message || 'Failed to reactivate user');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (confirmationText !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }

    try {
      setLoading(true);
      const response = await api.delete(`/users/delete/${user.user_id}`, {
        data: {
          confirmation_text: confirmationText,
          reason
        }
      });

      if (response.data.status === 'success') {
        toast.success('User permanently deleted');
        navigate('/users/list');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setActionType(null);
    setReason('');
    setConfirmationText('');
    onClose();
  };

  // Initial action selection view
  if (!actionType) {
    return (
      <div className="modal-overlay" onClick={resetModal}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Manage User Account</h2>
            <button className="modal-close" onClick={resetModal}>×</button>
          </div>

          <div className="modal-body">
            <div className="user-info-box">
              <div className="user-avatar" style={{ width: '60px', height: '60px' }}>
                {user.first_name?.[0]}{user.last_name?.[0]}
              </div>
              <div>
                <h3>{user.first_name} {user.last_name}</h3>
                <p>{user.email}</p>
                <span className={`status-badge ${user.account_status?.toLowerCase()}`}>
                  {user.account_status}
                </span>
              </div>
            </div>

            <div className="action-buttons-grid">
              {/* Reactivate - only show if inactive/suspended */}
              {(user.account_status === 'Inactive' || user.account_status === 'Suspended') && (
                <button
                  className="action-button reactivate"
                  onClick={() => setActionType('reactivate')}
                >
                  <span className="action-icon">✅</span>
                  <div>
                    <strong>Reactivate Account</strong>
                    <p>Restore user access</p>
                  </div>
                </button>
              )}

              {/* Deactivate - only show if active */}
              {user.account_status === 'Active' && (
                <button
                  className="action-button deactivate"
                  onClick={() => setActionType('deactivate')}
                >
                  <span className="action-icon">⏸️</span>
                  <div>
                    <strong>Deactivate Account</strong>
                    <p>Temporarily disable access (reversible)</p>
                  </div>
                </button>
              )}

              {/* Suspend - only show if active */}
              {user.account_status === 'Active' && (
                <button
                  className="action-button suspend"
                  onClick={() => setActionType('suspend')}
                >
                  <span className="action-icon">🚫</span>
                  <div>
                    <strong>Suspend Account</strong>
                    <p>Block access for policy violations (reversible)</p>
                  </div>
                </button>
              )}

              {/* Delete - always available for super admins */}
              <button
                className="action-button delete"
                onClick={() => setActionType('delete')}
              >
                <span className="action-icon">🗑️</span>
                <div>
                  <strong>Delete Permanently</strong>
                  <p>⚠️ Cannot be undone - removes all data</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Reactivate confirmation
  if (actionType === 'reactivate') {
    return (
      <div className="modal-overlay" onClick={resetModal}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Reactivate User Account</h2>
            <button className="modal-close" onClick={resetModal}>×</button>
          </div>

          <div className="modal-body">
            <div className="warning-box success">
              <span className="warning-icon">✅</span>
              <div>
                <h4>You're about to reactivate this account</h4>
                <p>User: <strong>{user.first_name} {user.last_name}</strong></p>
                <p>This will restore full access to the system.</p>
              </div>
            </div>

            <div className="form-group">
              <label>Reason for Reactivation (Optional)</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="E.g., Issue resolved, probation completed..."
                rows="3"
                className="form-control"
              />
            </div>
          </div>

          <div className="modal-footer">
            <button className="btn-secondary" onClick={resetModal} disabled={loading}>
              Cancel
            </button>
            <button
              className="btn-success"
              onClick={handleReactivate}
              disabled={loading}
            >
              {loading ? 'Reactivating...' : 'Reactivate Account'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Deactivate/Suspend confirmation
  if (actionType === 'deactivate' || actionType === 'suspend') {
    return (
      <div className="modal-overlay" onClick={resetModal}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>{actionType === 'suspend' ? 'Suspend' : 'Deactivate'} User Account</h2>
            <button className="modal-close" onClick={resetModal}>×</button>
          </div>

          <div className="modal-body">
            <div className="warning-box warning">
              <span className="warning-icon">⚠️</span>
              <div>
                <h4>You're about to {actionType} this account</h4>
                <p>User: <strong>{user.first_name} {user.last_name}</strong></p>
                <p>The user will lose access immediately but can be reactivated later.</p>
              </div>
            </div>

            <div className="form-group">
              <label>Reason for {actionType === 'suspend' ? 'Suspension' : 'Deactivation'} *</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please provide a reason..."
                rows="4"
                className="form-control"
                required
              />
            </div>
          </div>

          <div className="modal-footer">
            <button className="btn-secondary" onClick={resetModal} disabled={loading}>
              Cancel
            </button>
            <button
              className="btn-warning"
              onClick={handleDeactivate}
              disabled={loading || !reason.trim()}
            >
              {loading ? 'Processing...' : `${actionType === 'suspend' ? 'Suspend' : 'Deactivate'} Account`}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Delete confirmation
  if (actionType === 'delete') {
    return (
      <div className="modal-overlay" onClick={resetModal}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header danger">
            <h2>⚠️ Permanent Deletion Warning</h2>
            <button className="modal-close" onClick={resetModal}>×</button>
          </div>

          <div className="modal-body">
            <div className="warning-box danger">
              <span className="warning-icon">🚨</span>
              <div>
                <h4>THIS ACTION CANNOT BE UNDONE</h4>
                <p>User: <strong>{user.first_name} {user.last_name}</strong></p>
                <ul style={{ marginTop: '1rem', paddingLeft: '1.5rem' }}>
                  <li>User account will be permanently deleted</li>
                  <li>All associated provider records will be removed</li>
                  <li>Audit logs will remain for compliance</li>
                  <li>Visit history will be preserved</li>
                  <li>This action requires super admin privileges</li>
                </ul>
              </div>
            </div>

            <div className="form-group">
              <label>Reason for Deletion *</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Document why this account is being deleted..."
                rows="4"
                className="form-control"
                required
              />
            </div>

            <div className="form-group">
              <label>Type <strong>DELETE</strong> to confirm *</label>
              <input
                type="text"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder="Type DELETE in capital letters"
                className="form-control"
                required
              />
              {confirmationText && confirmationText !== 'DELETE' && (
                <small className="text-danger">Must type DELETE exactly</small>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button className="btn-secondary" onClick={resetModal} disabled={loading}>
              Cancel
            </button>
            <button
              className="btn-danger"
              onClick={handleDelete}
              disabled={loading || confirmationText !== 'DELETE' || !reason.trim()}
            >
              {loading ? 'Deleting...' : 'Delete Permanently'}
            </button>
          </div>
        </div>
      </div>
    );
  }
};

export default UserActionsModal;
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../libs/apiCall.js";
import { toast } from "react-hot-toast";
import useStore from "../../store";
import "./hospitals.css";

const BranchDetails = () => {
  const { branch_id } = useParams();
  const navigate = useNavigate();
  const { user } = useStore(state => state);
  const [branch, setBranch] = useState(null);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [accessDenied, setAccessDenied] = useState(false);

  // Check if user is global admin (no hospital_id)
  const isGlobalAdmin = !user?.hospital_id;

  useEffect(() => {
    fetchBranchDetails();
  }, [branch_id]);

  const fetchBranchDetails = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/hospitals/branches/${branch_id}`);
      
      if (data.status === "success") {
        const branchData = data.data.branch;
        
        // Access control: Check if user has permission to view this branch
        if (!isGlobalAdmin && user?.hospital_id !== branchData.hospital_id) {
          setAccessDenied(true);
          toast.error("You don't have permission to view this branch");
          setLoading(false);
          return;
        }
        
        setBranch(branchData);
        setStatistics(data.data.statistics || {});
        setAccessDenied(false);
      }
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to fetch branch details");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const handleDeactivate = async () => {
    if (!window.confirm("Are you sure you want to deactivate this branch? This will affect all associated users.")) {
      return;
    }

    try {
      const { data } = await api.put(`/hospitals/hospitals/deactivate/${branch_id}`);

      if (data.status === "success") {
        toast.success("Branch deactivated successfully");
        fetchBranchDetails();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to deactivate branch");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("⚠️ WARNING: This will permanently delete the branch and ALL associated data. This action CANNOT be undone.")) {
      return;
    }

    const confirmation = prompt("Type 'DELETE' to confirm permanent deletion:");
    if (confirmation !== "DELETE") {
      toast.error("Deletion cancelled - confirmation text did not match");
      return;
    }

    try {
      const { data } = await api.delete(`/hospitals/hospitals/delete/${branch_id}`);

      if (data.status === "success") {
        toast.success("Branch deleted successfully");
        navigate(`/hospitals/${branch.hospital_id}`);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to delete branch");
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading branch details...</p>
      </div>
    );
  }

  // Access Denied Screen
  if (accessDenied) {
    return (
      <div className="error-container">
        <div className="error-icon" style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚫</div>
        <h2>Access Denied</h2>
        <p>You don't have permission to view this branch.</p>
        <p style={{ fontSize: '0.9rem', color: '#6b7280', marginTop: '0.5rem' }}>
          This branch belongs to a different hospital organization.
        </p>
        <button 
          onClick={() => navigate("/hospitals/list")} 
          className="btn-primary"
          style={{ marginTop: '1rem' }}
        >
          Back to Hospital List
        </button>
      </div>
    );
  }

  if (!branch) {
    return (
      <div className="error-container">
        <h2>Branch Not Found</h2>
        <p>The branch you're looking for doesn't exist or has been deleted.</p>
        <button onClick={() => navigate("/hospitals/list")} className="btn-primary">
          Back to Hospital List
        </button>
      </div>
    );
  }

  return (
    <div className="hospital-details-container">
      {/* Header Section */}
      <div className="details-header">
        {/* <button 
          onClick={() => navigate(`/dashboard/`)} 
          className="btn-back"
        >
          ← Back 
        </button> */}
        <div className="header-content">
          <div className="header-left">
            <div className="hospital-icon-large">🏢</div>
            <div>
              <h1>{branch.branch_name}</h1>
              <p className="hospital-subtitle">
                {branch.branch_type || "Branch"} • {branch.city}, {branch.country}
              </p>
              <p className="hospital-subtitle" style={{ marginTop: '0.25rem', fontSize: '0.9rem' }}>
                📍 Parent Hospital: <strong>{branch.hospital_name}</strong>
              </p>
            </div>
          </div>
          

<div className="header-actions">
  <span className={`status-badge-large ${branch.is_active ? 'active' : 'inactive'}`}>
    {branch.is_active ? 'Active' : 'Inactive'}
  </span>
  <button 
    onClick={() => navigate('/users/register', {
      state: {
        prefillData: {
          hospital_id: branch.hospital_id,
          branch_id: branch_id,
          sourceName: `${branch.branch_name} (${branch.hospital_name})`,
          returnPath: `/branches/${branch_id}`
        }
      }
    })}
    className="btn-primary"
    style={{ backgroundColor: '#10b981' }}
  >
    👤 Add User
  </button>
  <button 
    onClick={() => navigate(`/hospitals/branches/${branch_id}/edit`)}
    className="btn-primary"
  >
    ✏️ Edit
  </button>
  <button onClick={handleDeactivate} className="btn-danger">
    🚫 Deactivate
  </button>
  <button onClick={handleDelete} className="btn-danger-outline">
    🗑️ Delete
  </button>
</div>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="quick-stats-bar">
        <div className="quick-stat">
          <span className="stat-icon">👥</span>
          <div>
            <span className="stat-number">{statistics.total_users || 0}</span>
            <span className="stat-label">Staff Members</span>
          </div>
        </div>
        <div className="quick-stat">
          <span className="stat-icon">🏥</span>
          <div>
            <span className="stat-number">{branch.hospital_type || 'N/A'}</span>
            <span className="stat-label">Hospital Type</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="tabs-navigation">
        <button 
          className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          📊 Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === "contact" ? "active" : ""}`}
          onClick={() => setActiveTab("contact")}
        >
          📞 Contact Information
        </button>
        <button 
          className={`tab-btn ${activeTab === "compliance" ? "active" : ""}`}
          onClick={() => setActiveTab("compliance")}
        >
          📋 Compliance & Licensing
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="tab-panel">
            <div className="details-grid">
              <div className="details-card">
                <h3>Basic Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Branch Name</span>
                    <span className="info-value">{branch.branch_name}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Branch Type</span>
                    <span className="info-value">{branch.branch_type || "N/A"}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Parent Hospital</span>
                    <span className="info-value">
                      <a 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(`/hospitals/${branch.hospital_id}`);
                        }}
                        style={{ color: '#667eea', textDecoration: 'none' }}
                      >
                        {branch.hospital_name}
                      </a>
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Hospital Type</span>
                    <span className="info-value">{branch.hospital_type}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Established Year</span>
                    <span className="info-value">{branch.established_year || "N/A"}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Status</span>
                    <span className={`status-badge ${branch.is_active ? 'active' : 'inactive'}`}>
                      {branch.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="details-card">
                <h3>Location Details</h3>
                <div className="info-grid">
                  <div className="info-item full-width">
                    <span className="info-label">📍 Full Address</span>
                    <span className="info-value">{branch.address}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">City</span>
                    <span className="info-value">{branch.city}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">State/Province</span>
                    <span className="info-value">{branch.state || "N/A"}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Postal Code</span>
                    <span className="info-value">{branch.postal_code || "N/A"}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Country</span>
                    <span className="info-value">{branch.country}</span>
                  </div>
                  
                  
                </div>
              </div>

              <div className="details-card">
                <h3>Capacity & Resources</h3>
                <div className="info-grid">
                  
                  <div className="info-item">
                    <span className="info-label">👨‍⚕️ Staff Count</span>
                    <span className="info-value">{statistics.total_users || 0}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">📋 Total Visits</span>
                    <span className="info-value">{statistics.total_visits || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contact Information Tab */}
        {activeTab === "contact" && (
          <div className="tab-panel">
            <div className="details-card">
              <h3>Contact Details</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">📞 Primary Phone</span>
                  <span className="info-value">
                    <a href={`tel:${branch.contact_number}`}>{branch.contact_number}</a>
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">📧 Email Address</span>
                  <span className="info-value">
                    <a href={`mailto:${branch.email}`}>{branch.email}</a>
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">🌐 Website</span>
                  <span className="info-value">
                    {branch.website ? (
                      <a href={branch.website} target="_blank" rel="noopener noreferrer">
                        {branch.website}
                      </a>
                    ) : "N/A"}
                  </span>
                </div>
                
               
              </div>
            </div>

           
          </div>
        )}

        {/* Compliance Tab */}
        {activeTab === "compliance" && (
          <div className="tab-panel">
            <div className="details-card">
              <h3>Branch Licensing Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">📄 Branch License Number</span>
                  <span className="info-value">{branch.branch_license_number || "N/A"}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Parent Hospital License</span>
                  <span className="info-value">{branch.parent_hospital_license || "N/A"}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">License Issue Date</span>
                  <span className="info-value">{formatDate(branch.license_issue_date)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">License Expiry Date</span>
                  <span className="info-value expiry-date">
                    {formatDate(branch.license_expiry_date)}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Licensing Authority</span>
                  <span className="info-value">{branch.licensing_authority || "N/A"}</span>
                </div>
                
              </div>
            </div>

            <div className="details-card">
              <h3>Accreditation Status</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Accreditation Status</span>
                  <span className={`status-badge ${branch.accredition_status?.toLowerCase().replace(' ', '-')}`}>
                    {branch.accredition_status || "Not Accredited"}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Accrediting Body</span>
                  <span className="info-value">{branch.accrediting_body || "N/A"}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Accreditation Date</span>
                  <span className="info-value">{formatDate(branch.accreditation_date)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Valid Until</span>
                  <span className="info-value">{formatDate(branch.accreditation_valid_until)}</span>
                </div>
              </div>
            </div>

            
          </div>
        )}
      </div>

      {/* Footer with metadata */}
      <div className="details-footer">
        <div className="metadata">
          <span>🕒 Created: {formatDate(branch.created_at)}</span>
          <span>🔄 Last Updated: {formatDate(branch.updated_at)}</span>
          {branch.created_by && <span>👤 Created By: User #{branch.created_by}</span>}
          {!isGlobalAdmin && (
            <span style={{ color: '#10b981', fontWeight: '600' }}>
              🏥 Your Organization
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default BranchDetails;
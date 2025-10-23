import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../libs/apiCall.js";
import { toast } from "react-hot-toast";
// import "./HospitalProfile.css";

const HospitalProfile = () => {
  const navigate = useNavigate();
  const [hospital, setHospital] = useState(null);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchHospitalProfile();
  }, []);

  const fetchHospitalProfile = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/hospitals/hospitals/current-hospital`);
      
      if (data.status === "success") {
        setHospital(data.data);
        setBranches(data.branches || []);
      }
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to fetch hospital profile");
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

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading hospital profile...</p>
      </div>
    );
  }

  if (!hospital) {
    return (
      <div className="error-container">
        <h2>Hospital Profile Not Found</h2>
        <p>Unable to load your hospital information.</p>
      </div>
    );
  }

  return (
    <div className="hospital-profile-container">
      {/* Header Section */}
      <div className="profile-header">
        <div className="header-content">
          <div className="header-left">
            <div className="hospital-icon-large">🏥</div>
            <div>
              <h1>{hospital.hospital_name}</h1>
              <p className="hospital-subtitle">
                {hospital.hospital_type} • {hospital.city}, {hospital.country}
              </p>
            </div>
          </div>
          <div className="header-actions">
            <span className={`status-badge-large ${hospital.is_active ? 'active' : 'inactive'}`}>
              {hospital.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="quick-stats-bar">
        <div className="quick-stat">
          <span className="stat-icon">🏢</span>
          <div>
            <span className="stat-number">{branches.length}</span>
            <span className="stat-label">Branches</span>
          </div>
        </div>
        <div className="quick-stat">
          <span className="stat-icon">📋</span>
          <div>
            <span className="stat-number">{hospital.hospital_license_number}</span>
            <span className="stat-label">License Number</span>
          </div>
        </div>
        <div className="quick-stat">
          <span className="stat-icon">✅</span>
          <div>
            <span className="stat-number">{hospital.accredition_status}</span>
            <span className="stat-label">Accreditation</span>
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
          className={`tab-btn ${activeTab === "branches" ? "active" : ""}`}
          onClick={() => setActiveTab("branches")}
        >
          🏢 Branches ({branches.length})
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
                    <span className="info-label">Hospital Name</span>
                    <span className="info-value">{hospital.hospital_name}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Hospital Type</span>
                    <span className="info-value">{hospital.hospital_type}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Registration Date</span>
                    <span className="info-value">{formatDate(hospital.created_at)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Status</span>
                    <span className={`status-badge ${hospital.is_active ? 'active' : 'inactive'}`}>
                      {hospital.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="details-card">
                <h3>Location Details</h3>
                <div className="info-grid">
                  <div className="info-item full-width">
                    <span className="info-label">📍 Full Address</span>
                    <span className="info-value">{hospital.address_line}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">City</span>
                    <span className="info-value">{hospital.city}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">State</span>
                    <span className="info-value">{hospital.state}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">ZIP Code</span>
                    <span className="info-value">{hospital.zip_code}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Country</span>
                    <span className="info-value">{hospital.country}</span>
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
                    <a href={`tel:${hospital.contact_number}`}>{hospital.contact_number}</a>
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">📧 Email Address</span>
                  <span className="info-value">
                    <a href={`mailto:${hospital.email}`}>{hospital.email}</a>
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Branches Tab */}
        {activeTab === "branches" && (
          <div className="tab-panel">
            <div className="branches-header">
              <h3>Hospital Branches</h3>
            </div>

            {branches.length === 0 ? (
              <div className="no-results">
                <div className="no-results-icon">🏢</div>
                <h3>No Branches Yet</h3>
                <p>This hospital doesn't have any registered branches.</p>
              </div>
            ) : (
              <div className="branches-grid">
                {branches.map((branch) => (
                  <div key={branch.branch_id} className="branch-card">
                    <div className="branch-header">
                      <div>
                        <h4>{branch.branch_name}</h4>
                        <p className="branch-type">{branch.branch_type || "Branch"}</p>
                      </div>
                      <span className={`status-badge ${branch.is_active ? 'active' : 'inactive'}`}>
                        {branch.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <div className="branch-info">
                      <div className="info-row">
                        <span className="info-icon">📍</span>
                        <span>{branch.address_line}, {branch.city}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-icon">📞</span>
                        <span>{branch.contact_number}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-icon">📧</span>
                        <span className="email-text">{branch.email}</span>
                      </div>
                      {branch.branch_license_number && (
                        <div className="info-row">
                          <span className="info-icon">📄</span>
                          <span>License: {branch.branch_license_number}</span>
                        </div>
                      )}
                    </div>

                    <div className="branch-meta">
                      <span>Accreditation: {branch.accredition_status}</span>
                    </div>

                    <button 
                      className="btn-primary"
                      style={{ 
                        width: '100%', 
                        marginTop: '12px',
                        padding: '10px',
                        fontSize: '14px'
                      }}
                      onClick={() => navigate(`/branches/${branch.branch_id}`)}
                    >
                      View Branch Details →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Compliance Tab */}
        {activeTab === "compliance" && (
          <div className="tab-panel">
            <div className="details-card">
              <h3>Licensing Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">📄 License Number</span>
                  <span className="info-value">{hospital.hospital_license_number}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Accreditation Status</span>
                  <span className={`status-badge ${hospital.accredition_status?.toLowerCase().replace(' ', '-')}`}>
                    {hospital.accredition_status || "Not Accredited"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer with metadata */}
      <div className="details-footer">
        <div className="metadata">
          <span>🕒 Created: {formatDate(hospital.created_at)}</span>
          <span>🔄 Last Updated: {formatDate(hospital.updated_at)}</span>
        </div>
      </div>
    </div>
  );
};

export default HospitalProfile;
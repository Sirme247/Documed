import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../libs/apiCall.js";
import { toast } from "react-hot-toast";
import "./hospital_details.css";

const HospitalDetails = () => {
  const { hospital_id } = useParams();
  const navigate = useNavigate();
  const [hospital, setHospital] = useState(null);
  const [branches, setBranches] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchHospitalDetails();
  }, [hospital_id]);

  const fetchHospitalDetails = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/hospitals/hospitals/${hospital_id}`);
      
      if (data.status === "success") {
        setHospital(data.data.hospital);
        setBranches(data.data.branches || []);
        setStatistics(data.data.statistics || {});
      }
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to fetch hospital details");
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
    if (!window.confirm("Are you sure you want to deactivate this hospital? This will affect all associated branches and users.")) {
      return;
    }

    try {
      const { data } = await api.put(`/hospitals/hospitals/deactivate/${hospital_id}`);

      if (data.status === "success") {
        toast.success("Hospital deactivated successfully");
        fetchHospitalDetails();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to deactivate hospital");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("⚠️ WARNING: This will permanently delete the hospital and ALL associated data. This action CANNOT be undone. Type 'DELETE' to confirm.")) {
      return;
    }

    const confirmation = prompt("Type 'DELETE' to confirm permanent deletion:");
    if (confirmation !== "DELETE") {
      toast.error("Deletion cancelled - confirmation text did not match");
      return;
    }

    try {
      const { data } = await api.delete(`/hospitals/hospitals/delete/${hospital_id}`);

      if (data.status === "success") {
        toast.success("Hospital deleted successfully");
        navigate("/hospitals/list");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to delete hospital");
    }
  };

  const handleBranchDeactivate = async (branchId) => {
    if (!window.confirm("Are you sure you want to deactivate this branch?")) {
      return;
    }

    try {
      const { data } = await api.put(`/hospitals/hospitals/deactivate/${branchId}`);

      if (data.status === "success") {
        toast.success("Branch deactivated successfully");
        fetchHospitalDetails();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to deactivate branch");
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading hospital details...</p>
      </div>
    );
  }

  if (!hospital) {
    return (
      <div className="error-container">
        <h2>Hospital Not Found</h2>
        <p>The hospital you're looking for doesn't exist or has been deleted.</p>
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
        {/* <button onClick={() => navigate("/hospitals/list")} className="btn-back">
          ← Back to List
        </button> */}
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
  <button 
    onClick={() => navigate('/users/register', {
      state: {
        prefillData: {
          hospital_id: hospital_id,
          sourceName: hospital.hospital_name,
          returnPath: `/hospitals/${hospital_id}`
        }
      }
    })}
    className="btn-primary"
    style={{ backgroundColor: '#10b981' }}
  >
    👤 Add User
  </button>
  <button 
    onClick={() => navigate(`/hospitals/${hospital_id}/edit`)}
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
          <span className="stat-icon">🏢</span>
          <div>
            <span className="stat-number">{branches.length}</span>
            <span className="stat-label">Branches</span>
          </div>
        </div>
        <div className="quick-stat">
          <span className="stat-icon">👥</span>
          <div>
            <span className="stat-number">{statistics.total_users || 0}</span>
            <span className="stat-label">Staff Members</span>
          </div>
        </div>
        {/* <div className="quick-stat">
          <span className="stat-icon">🏥</span>
          <div>
            <span className="stat-number">{statistics.total_patients || 0}</span>
            <span className="stat-label">Patients</span>
          </div>
        </div>
        <div className="quick-stat">
          <span className="stat-icon">📋</span>
          <div>
            <span className="stat-number">{statistics.total_visits || 0}</span>
            <span className="stat-label">Total Visits</span>
          </div>
        </div> */}
        {/* <div className="quick-stat">
          <span className="stat-icon">🛏️</span>
          <div>
            <span className="stat-number">{hospital.bed_capacity || 0}</span>
            <span className="stat-label">Bed Capacity</span>
          </div>
        </div> */}
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
        {/* <button 
          className={`tab-btn ${activeTab === "services" ? "active" : ""}`}
          onClick={() => setActiveTab("services")}
        >
          ⚕️ Services & Facilities
        </button> */}
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
                    <span className="info-value">{hospital.address}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">City</span>
                    <span className="info-value">{hospital.city}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">State/Province</span>
                    <span className="info-value">{hospital.state || "N/A"}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Postal Code</span>
                    <span className="info-value">{hospital.postal_code || "N/A"}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Country</span>
                    <span className="info-value">{hospital.country}</span>
                  </div>
                 
                </div>
              </div>

              {/* <div className="details-card">
                <h3>Capacity & Resources</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">🛏️ Total Bed Capacity</span>
                    <span className="info-value">{hospital.bed_capacity || "N/A"}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">🚑 Ambulance Count</span>
                    <span className="info-value">{hospital.ambulance_count || "N/A"}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">🏢 Total Branches</span>
                    <span className="info-value">{branches.length}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">👨‍⚕️ Staff Count</span>
                    <span className="info-value">{statistics.total_users || 0}</span>
                  </div>
                </div>
              </div> */}
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
                <div className="info-item">
                  <span className="info-label">🌐 Website</span>
                  <span className="info-value">
                    {hospital.website ? (
                      <a href={hospital.website} target="_blank" rel="noopener noreferrer">
                        {hospital.website}
                      </a>
                    ) : "N/A"}
                  </span>
                </div>
               
                
              </div>
            </div>

{/* 
            <div className="details-card">
              <h3>Social Media & Online Presence</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Facebook</span>
                  <span className="info-value">
                    {hospital.facebook_url ? (
                      <a href={hospital.facebook_url} target="_blank" rel="noopener noreferrer">
                        View Profile
                      </a>
                    ) : "N/A"}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Twitter</span>
                  <span className="info-value">
                    {hospital.twitter_url ? (
                      <a href={hospital.twitter_url} target="_blank" rel="noopener noreferrer">
                        View Profile
                      </a>
                    ) : "N/A"}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">LinkedIn</span>
                  <span className="info-value">
                    {hospital.linkedin_url ? (
                      <a href={hospital.linkedin_url} target="_blank" rel="noopener noreferrer">
                        View Profile
                      </a>
                    ) : "N/A"}
                  </span>
                </div>
              </div>
            </div> */}
          </div>
        )}

        {/* Branches Tab */}
        {activeTab === "branches" && (
          <div className="tab-panel">
            <div className="branches-header">
              <h3>Hospital Branches</h3>
              <button 
                onClick={() => navigate("/hospitals/register-branch", { state: { hospital_id, hospital_name: hospital.hospital_name } })}
                className="btn-primary"
              >
                + Add New Branch
              </button>
            </div>

            {branches.length === 0 ? (
              <div className="no-results">
                <div className="no-results-icon">🏢</div>
                <h3>No Branches Yet</h3>
                <p>This hospital doesn't have any registered branches.</p>
                <button 
                  onClick={() => navigate("/hospitals/register-branch", { state: { hospital_id, hospital_name: hospital.hospital_name } })}
                  className="btn-primary"
                >
                  Register First Branch
                </button>
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
                        <span>{branch.address}, {branch.city}</span>
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

                    <div className="branch-stats">
                      {/* <div className="branch-stat">
                        <span className="stat-icon">🛏️</span>
                        <span>{branch.bed_capacity || 0} Beds</span>
                      </div> */}
                      {branch.has_emergency_services && (
                        <div className="branch-stat">
                          <span className="stat-icon">🚑</span>
                          <span>Emergency</span>
                        </div>
                      )}
                    </div>

                    <div className="branch-actions">
                      <button 
                        onClick={() => navigate(`/branches/${branch.branch_id}`)}
                        className="btn-view-details"
                      >
                        View Details
                      </button>
                      <button 
                        onClick={() => handleBranchDeactivate(branch.branch_id)}
                        className="btn-deactivate"
                        disabled={!branch.is_active}
                      >
                        Deactivate
                      </button>
                    </div>
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
                  <span className="info-label">License Issue Date</span>
                  <span className="info-value">{formatDate(hospital.license_issue_date)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">License Expiry Date</span>
                  <span className="info-value expiry-date">
                    {formatDate(hospital.license_expiry_date)}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Licensing Authority</span>
                  <span className="info-value">{hospital.licensing_authority || "N/A"}</span>
                </div>
             
              </div>
            </div>

            <div className="details-card">
              <h3>Accreditation Status</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Accreditation Status</span>
                  <span className={`status-badge ${hospital.accredition_status?.toLowerCase().replace(' ', '-')}`}>
                    {hospital.accredition_status || "Not Accredited"}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Accrediting Body</span>
                  <span className="info-value">{hospital.accrediting_body || "N/A"}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Accreditation Date</span>
                  <span className="info-value">{formatDate(hospital.accreditation_date)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Valid Until</span>
                  <span className="info-value">{formatDate(hospital.accreditation_valid_until)}</span>
                </div>
                {/* <div className="info-item full-width">
                  <span className="info-label">Accreditation Certificate Number</span>
                  <span className="info-value">{hospital.accreditation_certificate_number || "N/A"}</span>
                </div> */}
              </div>
            </div>

         
          </div>
        )}

        {/* Services & Facilities Tab */}
        {/* {activeTab === "services" && (
          <div className="tab-panel">
            <div className="details-card">
              <h3>Available Services</h3>
              <div className="services-grid">
                <div className="service-item">
                  <span className="service-icon">{hospital.has_emergency_services ? '✅' : '❌'}</span>
                  <span className="service-name">Emergency Services</span>
                  <span className="service-status">{hospital.has_emergency_services ? 'Available' : 'Not Available'}</span>
                </div>
                <div className="service-item">
                  <span className="service-icon">{hospital.has_ambulance_service ? '✅' : '❌'}</span>
                  <span className="service-name">Ambulance Service</span>
                  <span className="service-status">{hospital.has_ambulance_service ? 'Available' : 'Not Available'}</span>
                </div>
                <div className="service-item">
                  <span className="service-icon">{hospital.has_laboratory ? '✅' : '❌'}</span>
                  <span className="service-name">Laboratory</span>
                  <span className="service-status">{hospital.has_laboratory ? 'Available' : 'Not Available'}</span>
                </div>
                <div className="service-item">
                  <span className="service-icon">{hospital.has_pharmacy ? '✅' : '❌'}</span>
                  <span className="service-name">Pharmacy</span>
                  <span className="service-status">{hospital.has_pharmacy ? 'Available' : 'Not Available'}</span>
                </div>
                <div className="service-item">
                  <span className="service-icon">{hospital.has_radiology ? '✅' : '❌'}</span>
                  <span className="service-name">Radiology</span>
                  <span className="service-status">{hospital.has_radiology ? 'Available' : 'Not Available'}</span>
                </div>
                <div className="service-item">
                  <span className="service-icon">{hospital.has_icu ? '✅' : '❌'}</span>
                  <span className="service-name">ICU</span>
                  <span className="service-status">{hospital.has_icu ? 'Available' : 'Not Available'}</span>
                </div>
                <div className="service-item">
                  <span className="service-icon">{hospital.has_operation_theater ? '✅' : '❌'}</span>
                  <span className="service-name">Operation Theater</span>
                  <span className="service-status">{hospital.has_operation_theater ? 'Available' : 'Not Available'}</span>
                </div>
                <div className="service-item">
                  <span className="service-icon">{hospital.has_blood_bank ? '✅' : '❌'}</span>
                  <span className="service-name">Blood Bank</span>
                  <span className="service-status">{hospital.has_blood_bank ? 'Available' : 'Not Available'}</span>
                </div>
              </div>
            </div>

            <div className="details-card">
              <h3>Specialized Departments</h3>
              <div className="info-grid">
                <div className="info-item full-width">
                  <span className="info-label">Available Departments</span>
                  <span className="info-value">{hospital.departments || "N/A"}</span>
                </div>
                <div className="info-item full-width">
                  <span className="info-label">Specialties</span>
                  <span className="info-value">{hospital.specialties || "N/A"}</span>
                </div>
              </div>
            </div>

            <div className="details-card">
              <h3>Additional Information</h3>
              <div className="info-grid">
                <div className="info-item full-width">
                  <span className="info-label">Description</span>
                  <span className="info-value">{hospital.description || "N/A"}</span>
                </div>
                <div className="info-item full-width">
                  <span className="info-label">Notes</span>
                  <span className="info-value">{hospital.notes || "N/A"}</span>
                </div>
              </div>
            </div>
          </div>
        )} */}
      </div>

      {/* Footer with metadata */}
      <div className="details-footer">
        <div className="metadata">
          <span>🕒 Created: {formatDate(hospital.created_at)}</span>
          <span>🔄 Last Updated: {formatDate(hospital.updated_at)}</span>
          {hospital.created_by && <span>👤 Created By: User #{hospital.created_by}</span>}
        </div>
      </div>
    </div>
  );
};

export default HospitalDetails;
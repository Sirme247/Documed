import React, { useState, useEffect } from "react";
import "./patients.css";
import api from "../../libs/apiCall.js";
import { toast } from "react-hot-toast";
import { useParams, useNavigate } from "react-router-dom";
import useStore from "../../store/index.js";

const PatientDetails = () => {
  const { patient_id } = useParams();
  const navigate = useNavigate();
  const user = useStore((state) => state.user);
  
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState(null);
  const [medicalHistory, setMedicalHistory] = useState({
    allergies: [],
    medications: [],
    chronic_conditions: [],
    family_history: [],
    social_history: null
  });
  const [recentVisits, setRecentVisits] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [deleteType, setDeleteType] = useState(""); // "soft" or "hard"
  const [deactivateConfirmText, setDeactivateConfirmText] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [reactivateConfirmText, setReactivateConfirmText] = useState("");

  // Check if user is role_id 3 or 4 (doctors)
  const isDoctor = user?.role_id === 3 || user?.role_id === 4;
  
  // Check if user is role_id 5 (restricted user - e.g., receptionist)
  const isReceptionist = user?.role_id === 5;
  
  // Check if user is admin (role_id 1)
  const isAdmin = user?.role_id === 1;

  // Fetch patient details
  useEffect(() => {
    const fetchPatientDetails = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/patients/get-patient/${patient_id}`);

        if (data.status === "success") {
          setPatient(data.data.patient);
          setMedicalHistory(data.data.medical_history);
          setRecentVisits(data.data.recent_visits);
        }
      } catch (error) {
        console.error(error);
        toast.error(error?.response?.data?.message || "Failed to fetch patient details");
        navigate("/patients");
      } finally {
        setLoading(false);
      }
    };

    if (patient_id) {
      fetchPatientDetails();
    }
  }, [patient_id, navigate]);

  // Handle patient reactivation
  const handleReactivatePatient = async () => {
    // Validate confirmation text
    const expectedText = `${patient.first_name} ${patient.last_name}`.toLowerCase();
    if (reactivateConfirmText.toLowerCase() !== expectedText) {
      toast.error("Patient name does not match. Please type the exact name.");
      return;
    }

    try {
      const { data } = await api.put(`/patients/reactivate-patient/${patient_id}`);
      
      if (data.status === "success") {
        toast.success("Patient reactivated successfully");
        setShowReactivateModal(false);
        setReactivateConfirmText("");
        // Refresh patient data
        const updatedData = await api.get(`/patients/get-patient/${patient_id}`);
        if (updatedData.data.status === "success") {
          setPatient(updatedData.data.data.patient);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to reactivate patient");
    }
  };

  // Handle patient deactivation
  const handleDeactivatePatient = async () => {
    // Validate confirmation text
    const expectedText = `${patient.first_name} ${patient.last_name}`.toLowerCase();
    if (deactivateConfirmText.toLowerCase() !== expectedText) {
      toast.error("Patient name does not match. Please type the exact name.");
      return;
    }

    try {
      const { data } = await api.delete(`/patients/delete-patient/${patient_id}`);
      
      if (data.status === "success") {
        toast.success("Patient deactivated successfully");
        setShowDeactivateModal(false);
        setDeactivateConfirmText("");
        navigate("/patients");
      }
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to deactivate patient");
    }
  };

  // Handle permanent deletion
  const handlePermanentDelete = async () => {
    // Validate confirmation text
    const expectedText = `${patient.first_name} ${patient.last_name}`.toLowerCase();
    if (deleteConfirmText.toLowerCase() !== expectedText) {
      toast.error("Patient name does not match. Please type the exact name.");
      return;
    }

    try {
      const { data } = await api.delete(`/patients/hard-delete-patient/${patient_id}`);
      
      if (data.status === "success") {
        toast.success("Patient permanently deleted");
        setShowDeleteModal(false);
        setDeleteConfirmText("");
        navigate("/patients");
      }
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to delete patient");
    }
  };

  // Calculate age
  const calculateAge = (dob) => {
    if (!dob) return "N/A";
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  // Format datetime
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

  if (loading) {
    return (
      <div className="patient-details-container">
        <div className="loading-container">
          <p>Loading patient details...</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="patient-details-container">
        <div className="no-results">
          <p>Patient not found</p>
        </div>
      </div>
    );
  }

  const displayedVisits = recentVisits.slice(0, 4);
  const hasMoreVisits = recentVisits.length > 0;

  return (
    <div className="patient-details-container">
      {/* Header */}
      <div className="details-header">
        <h2>Patient Details</h2>
      
        <div className="header-actions">
          {/* Admin-specific buttons */}
          {isAdmin && (
            <>
              {patient.is_active ? (
                <button 
                  onClick={() => {
                    setDeleteType("soft");
                    setShowDeactivateModal(true);
                  }} 
                  className="btn-warning"
                >
                  Deactivate Patient
                </button>
              ) : (
                <button 
                  onClick={() => {
                    setShowReactivateModal(true);
                  }} 
                  className="btn-success"
                >
                  Reactivate Patient
                </button>
              )}
              <button 
                onClick={() => {
                  setDeleteType("hard");
                  setShowDeleteModal(true);
                }} 
                className="btn-danger"
              >
                Permanently Delete
              </button>
            </>
          )}

          {/* Non-admin buttons */}
          {!isAdmin && !isReceptionist && (
            <>
              <button 
                onClick={() => navigate(`/ai-summary/${patient.patient_id}`, { state: { patient } })} 
                className="btn-primary"
              >
                Patient Summary
              </button>
              <button
                onClick={() => navigate(`/patients/${patient.patient_id}/edit`, { state: { patient } })} 
                className="btn-secondary"
              >
                Edit Patient
              </button>
              <button 
                onClick={() => navigate("/visits/new", { state: { patient } })} 
                className="btn-primary"
              >
                New Visit
              </button>
            </>
          )}

          {/* Receptionist sees only edit button */}
          {isReceptionist && (
            <button
              onClick={() => navigate(`/patients/${patient.patient_id}/edit`, { state: { patient } })} 
              className="btn-secondary"
            >
              Edit Patient
            </button>
          )}
        </div>
      </div>

      {/* Reactivation Confirmation Modal */}
      {showReactivateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Reactivate Patient</h3>
            <p>Are you sure you want to reactivate this patient?</p>
            <p><strong>{patient.first_name} {patient.last_name}</strong></p>
            <p className="modal-success">
              This will mark the patient as active again and restore full access to their records.
            </p>
            <div className="confirmation-input-section">
              <label>
                To confirm, please type the patient's full name: <strong>{patient.first_name} {patient.last_name}</strong>
              </label>
              <input
                type="text"
                value={reactivateConfirmText}
                onChange={(e) => setReactivateConfirmText(e.target.value)}
                placeholder="Enter patient's full name"
                className="confirmation-input"
              />
            </div>
            <div className="modal-actions">
              <button 
                onClick={() => {
                  setShowReactivateModal(false);
                  setReactivateConfirmText("");
                }} 
                className="btn-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={handleReactivatePatient} 
                className="btn-success"
                disabled={reactivateConfirmText.toLowerCase() !== `${patient.first_name} ${patient.last_name}`.toLowerCase()}
              >
                Reactivate Patient
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reactivation Confirmation Modal */}
      {showReactivateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Reactivate Patient</h3>
            <p>Are you sure you want to reactivate this patient?</p>
            <p><strong>{patient.first_name} {patient.last_name}</strong></p>
            <p className="modal-success">
              This will mark the patient as active again and restore full access to their records.
            </p>
            <div className="confirmation-input-section">
              <label>
                To confirm, please type the patient's full name: <strong>{patient.first_name} {patient.last_name}</strong>
              </label>
              <input
                type="text"
                value={reactivateConfirmText}
                onChange={(e) => setReactivateConfirmText(e.target.value)}
                placeholder="Enter patient's full name"
                className="confirmation-input"
              />
            </div>
            <div className="modal-actions">
              <button 
                onClick={() => {
                  setShowReactivateModal(false);
                  setReactivateConfirmText("");
                }} 
                className="btn-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={handleReactivatePatient} 
                className="btn-success"
                disabled={reactivateConfirmText.toLowerCase() !== `${patient.first_name} ${patient.last_name}`.toLowerCase()}
              >
                Reactivate Patient
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivation Confirmation Modal */}
      {showDeactivateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Deactivate Patient</h3>
            <p>Are you sure you want to deactivate this patient?</p>
            <p><strong>{patient.first_name} {patient.last_name}</strong></p>
            <p className="modal-warning">
              This will mark the patient as inactive. The patient record will be preserved 
              and can be reactivated later.
            </p>
            <div className="confirmation-input-section">
              <label>
                To confirm, please type the patient's full name: <strong>{patient.first_name} {patient.last_name}</strong>
              </label>
              <input
                type="text"
                value={deactivateConfirmText}
                onChange={(e) => setDeactivateConfirmText(e.target.value)}
                placeholder="Enter patient's full name"
                className="confirmation-input"
              />
            </div>
            <div className="modal-actions">
              <button 
                onClick={() => {
                  setShowDeactivateModal(false);
                  setDeactivateConfirmText("");
                }} 
                className="btn-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeactivatePatient} 
                className="btn-warning"
                disabled={deactivateConfirmText.toLowerCase() !== `${patient.first_name} ${patient.last_name}`.toLowerCase()}
              >
                Deactivate Patient
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permanent Deletion Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>⚠️ Permanent Deletion Warning</h3>
            <p>Are you sure you want to <strong>permanently delete</strong> this patient?</p>
            <p><strong>{patient.first_name} {patient.last_name}</strong></p>
            <div className="modal-danger-warning">
              <p><strong>This action cannot be undone!</strong></p>
              <p>All associated records will be permanently deleted:</p>
              <ul>
                <li>Patient demographics</li>
                <li>Medical history (allergies, medications, conditions)</li>
                <li>Visit records</li>
                <li>Hospital identifiers</li>
              </ul>
            </div>
            <div className="confirmation-input-section">
              <label>
                To confirm permanent deletion, please type the patient's full name: <strong>{patient.first_name} {patient.last_name}</strong>
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Enter patient's full name"
                className="confirmation-input"
              />
            </div>
            <div className="modal-actions">
              <button 
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText("");
                }} 
                className="btn-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={handlePermanentDelete} 
                className="btn-danger"
                disabled={deleteConfirmText.toLowerCase() !== `${patient.first_name} ${patient.last_name}`.toLowerCase()}
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Patient Summary Card */}
      <div className="patient-summary-card">
        <div className="patient-avatar">
          <div className="avatar-circle">
            {patient.first_name?.charAt(0)}{patient.last_name?.charAt(0)}
          </div>
        </div>
        
        <div className="patient-info">
          <h1>
            {patient.first_name} {patient.middle_name || ""} {patient.last_name}
          </h1>
          <div className="patient-meta">
            <span className="meta-item">
              <strong>MRN:</strong> {patient.identifiers?.[0]?.patient_mrn || "N/A"}
            </span>
            <span className="meta-item">
              <strong>Age:</strong> {patient.age || calculateAge(patient.date_of_birth)} years
            </span>
            <span className="meta-item">
              <strong>Gender:</strong> {patient.gender || "N/A"}
            </span>
            <span className="meta-item">
              <strong>Blood Type:</strong> {patient.blood_type || "N/A"}
            </span>
          </div>
        </div>

        <div className="patient-status">
          <span className={`status-badge ${patient.is_deceased ? 'deceased' : patient.is_active ? 'active' : 'inactive'}`}>
            {patient.is_deceased ? "Deceased" : patient.is_active ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      {/* Alert Badges - Hide from receptionists and admins */}
      {!isReceptionist && !isAdmin && (medicalHistory.allergies.length > 0 || medicalHistory.chronic_conditions.length > 0) && (
        <div className="alert-badges">
          {medicalHistory.allergies.length > 0 && (
            <div className="alert-badge alert-warning">
              <span className="alert-icon">⚠️</span>
              <div>
                <strong>Allergies Alert</strong>
                <p>{medicalHistory.allergies.length} known allergies on file</p>
              </div>
            </div>
          )}
          {medicalHistory.chronic_conditions.filter(c => c.is_active).length > 0 && (
            <div className="alert-badge alert-info">
              <span className="alert-icon">💊</span>
              <div>
                <strong>Chronic Conditions</strong>
                <p>{medicalHistory.chronic_conditions.filter(c => c.is_active).length} active conditions</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="tabs-container">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </button>
          
          {!isReceptionist && !isAdmin && (
            <button 
              className={`tab ${activeTab === "medical" ? "active" : ""}`}
              onClick={() => setActiveTab("medical")}
            >
              Medical History
            </button>
          )}
          
          {isDoctor && (
            <button 
              className={`tab ${activeTab === "visits" ? "active" : ""}`}
              onClick={() => setActiveTab("visits")}
            >
              Visits ({recentVisits.length})
            </button>
          )}
          
          <button 
            className={`tab ${activeTab === "contact" ? "active" : ""}`}
            onClick={() => setActiveTab("contact")}
          >
            Contact & Insurance
          </button>
        </div>
      </div>

      {/* Tab Content - Rest remains the same */}
      <div className="tab-content">
        {activeTab === "overview" && (
          <div className="overview-grid">
            <div className="info-card">
              <h3>Personal Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>Date of Birth</label>
                  <p>{formatDate(patient.date_of_birth)}</p>
                </div>
                <div className="info-item">
                  <label>National ID</label>
                  <p>{patient.national_id || "N/A"}</p>
                </div>
                <div className="info-item">
                  <label>Marital Status</label>
                  <p>{patient.marital_status || "N/A"}</p>
                </div>
                <div className="info-item">
                  <label>Occupation</label>
                  <p>{patient.occupation || "N/A"}</p>
                </div>
                <div className="info-item">
                  <label>Ethnicity</label>
                  <p>{patient.ethnicity || "N/A"}</p>
                </div>
                <div className="info-item">
                  <label>Preferred Language</label>
                  <p>{patient.preffered_language || "N/A"}</p>
                </div>
                <div className="info-item">
                  <label>Religion</label>
                  <p>{patient.religion || "N/A"}</p>
                </div>
                <div className="info-item">
                  <label>Country of Birth</label>
                  <p>{patient.country_of_birth || "N/A"}</p>
                </div>
                <div className="info-item full-width">
                  <label>Country of Residence</label>
                  <p>{patient.country_of_residence || "N/A"}</p>
                </div>
                <div className="info-item full-width">
                  <label>Address</label>
                  <p>{patient.address_line || "N/A"}</p>
                </div>
              </div>
            </div>

            <div className="info-card">
              <h3>Quick Summary</h3>
              <div className="medical-summary">
                {!isReceptionist && !isAdmin && (
                  <>
                    <div className="summary-item">
                      <div className="summary-count">{medicalHistory.allergies.length}</div>
                      <div className="summary-label">Allergies</div>
                    </div>
                    <div className="summary-item">
                      <div className="summary-count">
                        {medicalHistory.medications.filter(m => m.medication_is_active).length}
                      </div>
                      <div className="summary-label">Active Medications</div>
                    </div>
                    <div className="summary-item">
                      <div className="summary-count">
                        {medicalHistory.chronic_conditions.filter(c => c.is_active).length}
                      </div>
                      <div className="summary-label">Chronic Conditions</div>
                    </div>
                  </>
                )}
                <div className="summary-item">
                  <div className="summary-count">{recentVisits.length}</div>
                  <div className="summary-label">Total Visits</div>
                </div>
                <div className="summary-item">
                  <div className="summary-count">
                    {patient.is_active ? "Active" : "Inactive"}
                  </div>
                  <div className="summary-label">Patient Status</div>
                </div>
              </div>
            </div>
          </div>
        )}
       
        {/* Medical History Tab - Only accessible to non-receptionists */}
        {activeTab === "medical" && !isReceptionist && (
          <div className="medical-content">
            {/* Allergies */}
            <div className="info-card">
              <h3>Allergies</h3>
              {/* <button
                onClick={() => navigate(`/patients/add-allergy`, { state: { patient } })} 
                className="btn-secondary"
              >
                Add Allergy
              </button> */}
              {medicalHistory.allergies.length === 0 ? (
                <p className="empty-state">No allergies recorded</p>
              ) : (
                <div className="list-items">
                  {medicalHistory.allergies.map((allergy) => (
                    <div key={allergy.allergy_id} className="list-item">
                      <div className="list-item-header">
                        <strong>{allergy.allergen}</strong>
                        <span className={`severity-badge ${allergy.allergy_severity?.toLowerCase()}`}>
                          {allergy.allergy_severity}
                        </span>
                      </div>
                      <p className="list-item-detail">
                        <strong>Reaction:</strong> {allergy.reaction}
                      </p>
                      {allergy.verified && (
                        <span className="verified-badge">✓ Verified</span>
                      )}
                      <p className="list-item-date">Recorded: {formatDate(allergy.created_at)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Medications */}
            <div className="info-card">
              <h3>Medications</h3>
              {/* <button
                onClick={() => navigate(`/patients/add-medication`, { state: { patient } })} 
                className="btn-secondary"
              >
                Add Medication
              </button> */}
              {medicalHistory.medications.length === 0 ? (
                <p className="empty-state">No medications recorded</p>
              ) : (
                <div className="list-items">
                  {medicalHistory.medications.map((med) => (
                    <div key={med.medication_id} className="list-item">
                      <div className="list-item-header">
                        <strong>{med.medication_name}</strong>
                        <span className={`status-badge ${med.medication_is_active ? 'active' : 'inactive'}`}>
                          {med.medication_is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div className="medication-details">
                        <p><strong>Dosage:</strong> {med.dosage || "N/A"}</p>
                        <p><strong>Frequency:</strong> {med.frequency || "N/A"}</p>
                        <p><strong>Start Date:</strong> {formatDate(med.start_date)}</p>
                        {med.end_date && <p><strong>End Date:</strong> {formatDate(med.end_date)}</p>}
                        {med.hospital_where_prescribed && (
                          <p><strong>Prescribed at:</strong> {med.hospital_where_prescribed}</p>
                        )}
                      </div>
                      {med.medication_notes && (
                        <p className="list-item-notes">{med.medication_notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Chronic Conditions */}
            <div className="info-card">
              <h3>Chronic Conditions</h3>
              {/* <button
                onClick={() => navigate(`/patients/add-chronic-conditions`, { state: { patient } })} 
                className="btn-secondary"
              >
                Add Chronic Condition
              </button> */}
              {medicalHistory.chronic_conditions.length === 0 ? (
                <p className="empty-state">No chronic conditions recorded</p>
              ) : (
                <div className="list-items">
                  {medicalHistory.chronic_conditions.map((condition) => (
                    <div key={condition.condition_id} className="list-item">
                      <div className="list-item-header">
                        <strong>{condition.condition_name}</strong>
                        <div className="badge-group">
                          <span className={`severity-badge ${condition.condition_severity?.toLowerCase()}`}>
                            {condition.condition_severity}
                          </span>
                          <span className={`status-badge ${condition.is_active ? 'active' : 'inactive'}`}>
                            {condition.current_status}
                          </span>
                        </div>
                      </div>
                      {condition.icd_code && (
                        <p className="list-item-detail">
                          <strong>ICD Code:</strong> {condition.icd_code} ({condition.icd_codes_version})
                        </p>
                      )}
                      <p className="list-item-detail">
                        <strong>Diagnosed:</strong> {formatDate(condition.diagnosed_date)}
                      </p>
                      {condition.management_plan && (
                        <div className="management-plan">
                          <strong>Management Plan:</strong>
                          <p>{condition.management_plan}</p>
                        </div>
                      )}
                      {condition.condition_notes && (
                        <p className="list-item-notes">{condition.condition_notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Family History */}
            <div className="info-card">
              <h3>Family History</h3>
              {/* <button
                onClick={() => navigate(`/patients/add-family-history`, { state: { patient } })} 
                className="btn-secondary"
              >
                Add Family History
              </button> */}
              {medicalHistory.family_history.length === 0 ? (
                <p className="empty-state">No family history recorded</p>
              ) : (
                <div className="list-items">
                  {medicalHistory.family_history.map((history) => (
                    <div key={history.family_history_id} className="list-item">
                      <div className="list-item-header">
                        <strong>{history.relative_name}</strong>
                        <span className="relationship-badge">{history.relationship}</span>
                      </div>
                      <p className="list-item-detail">
                        <strong>Condition:</strong> {history.relative_condition_name}
                      </p>
                      {history.age_of_onset && (
                        <p className="list-item-detail">
                          <strong>Age of Onset:</strong> {history.age_of_onset}
                        </p>
                      )}
                      {history.family_history_notes && (
                        <p className="list-item-notes">{history.family_history_notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Social History */}
            <div className="info-card">
              <h3>Social History</h3>
              {!medicalHistory.social_history ? (
                <p className="empty-state">No social history recorded</p>
              ) : (
                <div className="info-grid">
                  <div className="info-item">
                    <label>Smoking Status</label>
                    <p>{medicalHistory.social_history.smoking_status || "N/A"}</p>
                  </div>
                  <div className="info-item">
                    <label>Alcohol Use</label>
                    <p>{medicalHistory.social_history.alcohol_use || "N/A"}</p>
                  </div>
                  <div className="info-item">
                    <label>Drug Use</label>
                    <p>{medicalHistory.social_history.drug_use || "N/A"}</p>
                  </div>
                  <div className="info-item">
                    <label>Physical Activity</label>
                    <p>{medicalHistory.social_history.physical_activity || "N/A"}</p>
                  </div>
                  <div className="info-item">
                    <label>Living Situation</label>
                    <p>{medicalHistory.social_history.living_situation || "N/A"}</p>
                  </div>
                  <div className="info-item full-width">
                    <label>Diet Description</label>
                    <p>{medicalHistory.social_history.diet_description || "N/A"}</p>
                  </div>
                  <div className="info-item full-width">
                    <label>Support System</label>
                    <p>{medicalHistory.social_history.support_system || "N/A"}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Visits Tab - Only visible to doctors */}
        {activeTab === "visits" && isDoctor && (
          <div className="info-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3>Recent Visits</h3>
              {hasMoreVisits && (
                <button
                  onClick={() => navigate(`/visits/patients/${patient_id}`)}
                  className="btn-primary"
                >
                  View All Visits ({recentVisits.length})
                </button>
              )}
            </div>
            {displayedVisits.length === 0 ? (
              <p className="empty-state">No visits recorded</p>
            ) : (
              <>
                <div className="visits-list">
                  {displayedVisits.map((visit) => (
                    <div key={visit.visit_id} className="visit-item">
                      <div className="visit-header">
                        <div>
                          <strong>{visit.visit_number}</strong>
                          <span className="visit-type">{visit.visit_type}</span>
                        </div>
                        <span className={`priority-badge ${visit.priority_level}`}>
                          {visit.priority_level}
                        </span>
                      </div>
                      <p className="visit-date">{formatDateTime(visit.visit_date)}</p>
                     
                      {visit.hospital_name && (
                        <div className="visit-hospital-info">
                          <strong>Hospital:</strong> {visit.hospital_name}
                          {visit.branch_name && <span className="branch-name"> - {visit.branch_name}</span>}
                        </div>
                      )}
                      {visit.reason_for_visit && (
                        <p className="visit-reason"><strong>Reason:</strong> {visit.reason_for_visit}</p>
                      )}
                      <div className="visit-status">
                        <span className="admission-status">{visit.admission_status}</span>
                        {visit.discharge_date && (
                          <span className="discharge-date">
                            Discharged: {formatDateTime(visit.discharge_date)}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => navigate(`/visits/details/${visit.visit_id}`)}
                        className="btn-view-visit">View Full Visit</button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Contact & Insurance Tab */}
        {activeTab === "contact" && (
          <div className="contact-grid">
            {/* Contact Information */}
            <div className="info-card">
              <h3>Contact Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>Primary Phone</label>
                  <p>{patient.primary_number || "N/A"}</p>
                </div>
                <div className="info-item">
                  <label>Secondary Phone</label>
                  <p>{patient.secondary_number || "N/A"}</p>
                </div>
                <div className="info-item full-width">
                  <label>Email</label>
                  <p>{patient.email || "N/A"}</p>
                </div>
              </div>
            </div>

            {/* Emergency Contacts */}
            <div className="info-card">
              <h3>Emergency Contacts</h3>
              <div className="emergency-contacts">
                {patient.emergency_contact1_name && (
                  <div className="emergency-contact">
                    <h4>Primary Emergency Contact</h4>
                    <p><strong>Name:</strong> {patient.emergency_contact1_name}</p>
                    <p><strong>Phone:</strong> {patient.emergency_contact1_number}</p>
                    <p><strong>Relationship:</strong> {patient.emergency_contact1_relationship}</p>
                  </div>
                )}
                {patient.emergency_contact2_name && (
                  <div className="emergency-contact">
                    <h4>Secondary Emergency Contact</h4>
                    <p><strong>Name:</strong> {patient.emergency_contact2_name}</p>
                    <p><strong>Phone:</strong> {patient.emergency_contact2_number}</p>
                    <p><strong>Relationship:</strong> {patient.emergency_contact2_relationship}</p>
                  </div>
                )}
                {!patient.emergency_contact1_name && !patient.emergency_contact2_name && (
                  <p className="empty-state">No emergency contacts recorded</p>
                )}
              </div>
            </div>

            {/* Insurance Information */}
            <div className="info-card">
              <h3>Insurance Information</h3>
              <div className="insurance-info">
                {patient.primary_insurance_provider && (
                  <div className="insurance-item">
                    <h4>Primary Insurance</h4>
                    <p><strong>Provider:</strong> {patient.primary_insurance_provider}</p>
                    <p><strong>Policy Number:</strong> {patient.primary_insurance_policy_number || "N/A"}</p>
                  </div>
                )}
                {patient.secondary_insurance_provider && (
                  <div className="insurance-item">
                    <h4>Secondary Insurance</h4>
                    <p><strong>Provider:</strong> {patient.secondary_insurance_provider}</p>
                    <p><strong>Policy Number:</strong> {patient.secondary_insurance_policy_number || "N/A"}</p>
                  </div>
                )}
                {!patient.primary_insurance_provider && !patient.secondary_insurance_provider && (
                  <p className="empty-state">No insurance information recorded</p>
                )}
              </div>
            </div>

            {/* Hospital Identifiers */}
            <div className="info-card">
              <h3>Hospital Identifiers</h3>
              {patient.identifiers && patient.identifiers.length > 0 ? (
                <div className="identifiers-list">
                  {patient.identifiers.map((identifier) => (
                    <div key={identifier.identifier_id} className="identifier-item">
                      <p><strong>Hospital ID:</strong> {identifier.hospital_id}</p>
                      <p><strong>MRN:</strong> {identifier.patient_mrn}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-state">No hospital identifiers recorded</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDetails;
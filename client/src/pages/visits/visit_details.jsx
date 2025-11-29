import React, { useState, useEffect } from "react";
import "./visits.css";
import api from "../../libs/apiCall.js";
import { toast } from "react-hot-toast";
import { useParams, useNavigate } from "react-router-dom";

// Hook to fetch visit permissions and user role
const useVisitStatus = (visit_id) => {
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const { data } = await api.get(`/visits/${visit_id}/permissions`);
        if (data.status === 'success') {
          setPermissions(data.permissions);
        }
      } catch (error) {
        console.error('Error fetching permissions:', error);
      } finally {
        setLoading(false);
      }
    };

    // Get user role from localStorage or context
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserRole(user.role_id);

    if (visit_id) {
      fetchPermissions();
    }
  }, [visit_id]);

  return { permissions, loading, setPermissions, userRole };
};

const VisitDetails = () => {
  const { visit_id } = useParams();
  const navigate = useNavigate();
  const { permissions, loading: permLoading, setPermissions, userRole } = useVisitStatus(visit_id);

  const [loading, setLoading] = useState(true);
  const [visitData, setVisitData] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  const [selectedLabTest, setSelectedLabTest] = useState(null);
  const [selectedImagingStudy, setSelectedImagingStudy] = useState(null);

  const [showDeleteLabTestModal, setShowDeleteLabTestModal] = useState(false);
  const [labTestToDelete, setLabTestToDelete] = useState(null);


  // ADD THESE TWO NEW ONES:
  const [showDeleteStudyModal, setShowDeleteStudyModal] = useState(false);
  const [studyToDelete, setStudyToDelete] = useState(null);


  const canDeleteImagingStudy = userRole === 1 || userRole === 3 || userRole === 4;

  // Check if user is receptionist (role_id 5)
  const isReceptionist = userRole === 5;

  // Fetch visit details
  useEffect(() => {
    const fetchVisitDetails = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/visits/get-visit/${visit_id}`);

        if (data.status === "success") {
          setVisitData(data.data);
          console.log("Visit Data:", data.data);
          console.log("User Role:", userRole);
        }
      } catch (error) {
        console.error(error);
        toast.error(error?.response?.data?.message || "Failed to fetch visit details");
        navigate("/visits");
      } finally {
        setLoading(false);
      }
    };

    if (visit_id) {
      fetchVisitDetails();
    }
  }, [visit_id, navigate, userRole]);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  // Close visit handler
  const handleCloseVisit = async () => {
    if (!permissions?.can_close) {
      toast.error(permissions?.close_reason || 'You cannot close this visit');
      return;
    }

    if (!window.confirm('Are you sure you want to close this visit? Clinical staff will no longer be able to edit records.')) {
      return;
    }

    try {
      const { data } = await api.post(`/visits/${visit_id}/close`);
      toast.success('Visit closed successfully');
      
      setPermissions(prev => ({
        ...prev,
        visit_status: 'closed',
        can_edit: false,
        can_add_records: false
      }));

      if (setVisitData) {
        setVisitData(prev => ({
          ...prev,
          visit_status: 'closed'
        }));
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to close visit');
    }
  };

  // Reopen visit handler
  const handleReopenVisit = async () => {
    try {
      const { data } = await api.post(`/visits/${visit_id}/reopen`);
      toast.success('Visit reopened for editing');
      
      setPermissions(prev => ({
        ...prev,
        visit_status: 'open',
        can_edit: true,
        can_add_records: true
      }));

      if (setVisitData) {
        setVisitData(prev => ({
          ...prev,
          visit_status: 'open'
        }));
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to reopen visit');
    }
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

  const DeleteImagingStudyModal = ({ show, onClose, study, onDeleteSuccess }) => {
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const REQUIRED_CONFIRM_TEXT = "DELETE";

  const handleDelete = async () => {
    if (deleteConfirmText !== REQUIRED_CONFIRM_TEXT) {
      toast.error(`Please type ${REQUIRED_CONFIRM_TEXT} exactly to confirm deletion`);
      return;
    }

    try {
      setIsDeleting(true);
      const { data } = await api.delete(`/medical-imaging/studies/${study.imaging_study_id}`);

      if (data.status === "success") {
        toast.success("Imaging study deleted successfully");
        setDeleteConfirmText("");
        onClose();
        if (onDeleteSuccess) {
          onDeleteSuccess(study.imaging_study_id);
        }
      }
    } catch (error) {
      console.error("Error deleting imaging study:", error);
      toast.error(error?.response?.data?.message || "Failed to delete imaging study");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      setDeleteConfirmText("");
      onClose();
    }
  };

  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>⚠️ Delete Imaging Study</h3>
        
        <div className="study-info-section">
          <p><strong>Study ID:</strong> {study.imaging_study_id}</p>
          <p><strong>Modality:</strong> {study.modality || "N/A"}</p>
          <p><strong>Study Date:</strong> {study.study_date 
            ? formatDate(study.study_date) 
            : "N/A"}
          </p>
          {study.study_description && (
            <p><strong>Description:</strong> {study.study_description}</p>
          )}
        </div>

        <div className="modal-danger-warning">
          <p><strong>This action cannot be undone!</strong></p>
          <p>Deleting this imaging study will permanently remove:</p>
          <ul>
            <li>All DICOM images and series in this study</li>
            <li>Study metadata and findings</li>
            <li>All associated recommendations</li>
            <li>Data from both the database and Orthanc server</li>
          </ul>
          <p className="warning-note">
            <strong>Note:</strong> The visit record will remain intact, but this 
            imaging data will be permanently lost.
          </p>
        </div>

        <div className="confirmation-input-section">
          <label>
            To confirm deletion, please type <strong>{REQUIRED_CONFIRM_TEXT}</strong> below:
          </label>
          <input
            type="text"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder={`Type ${REQUIRED_CONFIRM_TEXT} to confirm`}
            className="confirmation-input"
            disabled={isDeleting}
            autoComplete="off"
          />
        </div>

        <div className="modal-actions">
          <button 
            onClick={handleClose}
            className="btn-secondary"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button 
            onClick={handleDelete}
            className="btn-danger"
            disabled={deleteConfirmText !== REQUIRED_CONFIRM_TEXT || isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Permanently"}
          </button>
        </div>
      </div>
    </div>
  );
};

const handleDeleteLabTestClick = (test) => {
    setLabTestToDelete(test);
    setShowDeleteLabTestModal(true);
  };

  const handleDeleteLabTestSuccess = (testId) => {
    setVisitData(prev => ({
      ...prev,
      lab_tests: prev.lab_tests.filter(t => t.lab_test_id !== testId)
    }));
    
    if (selectedLabTest?.lab_test_id === testId) {
      setSelectedLabTest(null);
    }
    
    setLabTestToDelete(null);
  };


  // Calculate BMI if not provided
  const calculateBMI = (weight, height, weightUnit, heightUnit) => {
    if (!weight || !height) return null;
    
    let weightKg = weightUnit === 'lb' ? weight * 0.453592 : weight;
    let heightM = heightUnit === 'in' ? height * 0.0254 : height / 100;
    
    const bmi = weightKg / (heightM * heightM);
    return bmi.toFixed(1);
  };

  // Open imaging viewer in new tab
  const openImagingViewer = (study) => {
    if (!study.viewer_url) {
      toast.error("Viewer URL not available");
      return;
    }
    window.open(study.viewer_url, '_blank', 'noopener,noreferrer');
  };

  // Show viewer options if multiple are available
  const showViewerOptions = (study) => {
    if (!study.all_viewers || study.all_viewers.length === 0) {
      toast.error("No viewers available");
      return;
    }

    if (study.all_viewers.length === 1) {
      window.open(study.all_viewers[0].url, '_blank', 'noopener,noreferrer');
      return;
    }

    const backdrop = document.createElement('div');
    backdrop.className = 'toast-backdrop';
    document.body.appendChild(backdrop);

    const closeModal = (toastId) => {
      backdrop.remove();
      toast.remove(toastId);
    };

    const toastId = toast.custom((t) => (
      <div className="viewer-toast">
        <h4>Choose a DICOM Viewer</h4>
        <div className="viewer-options">
          {study.all_viewers.map((viewer) => (
            <button
              key={viewer.type}
              className={`viewer-option-btn ${viewer.primary ? 'primary' : ''}`}
              onClick={() => {
                window.open(viewer.url, '_blank', 'noopener,noreferrer');
                closeModal(t.id);
              }}
            >
              <strong>
                {viewer.name}
                {viewer.primary && <span className="badge">Recommended</span>}
              </strong>
              <small>{viewer.description || 'Open in this viewer'}</small>
            </button>
          ))}
        </div>
        <button 
          onClick={() => closeModal(t.id)} 
          className="close-toast"
        >
          Cancel
        </button>
      </div>
    ), { 
      duration: Infinity,
      position: 'top-center',
      style: {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 9999,
      }
    });

    backdrop.onclick = () => {
      closeModal(toastId);
    };
  };

  // View lab test PDF
  const viewLabTestPDF = async (testId) => {
    try {
      const { data } = await api.get(`/lab-tests/${testId}`);
      
      if (data.status === 'success' && data.data.downloadUrl) {
        window.open(data.data.downloadUrl, '_blank', 'noopener,noreferrer');
      } else {
        toast.error('PDF not available for this test');
      }
    } catch (error) {
      console.error('Error fetching PDF:', error);
      toast.error('Failed to load PDF');
    }
  };
  const handleDeleteStudyClick = (study) => {
  setStudyToDelete(study);
  setShowDeleteStudyModal(true);
};

// Handle successful deletion
const handleDeleteStudySuccess = (studyId) => {
  // Remove the deleted study from the list
  setVisitData(prev => ({
    ...prev,
    imaging_studies: prev.imaging_studies.filter(s => s.imaging_study_id !== studyId)
  }));
  
  // Close the detail modal if it's showing the deleted study
  if (selectedImagingStudy?.imaging_study_id === studyId) {
    setSelectedImagingStudy(null);
  }
  
  setStudyToDelete(null);
};


const DeleteLabTestModal = ({ show, onClose, test, onDeleteSuccess }) => {
    const [deleteConfirmText, setDeleteConfirmText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const REQUIRED_CONFIRM_TEXT = "DELETE";

    const handleDelete = async () => {
      if (deleteConfirmText !== REQUIRED_CONFIRM_TEXT) {
        toast.error(`Please type ${REQUIRED_CONFIRM_TEXT} exactly to confirm deletion`);
        return;
      }

      try {
        setIsDeleting(true);
        const { data } = await api.delete(`/lab-tests/delete-test/${test.lab_test_id}`);

        if (data.status === "success") {
          toast.success("Lab test deleted successfully");
          setDeleteConfirmText("");
          onClose();
          if (onDeleteSuccess) {
            onDeleteSuccess(test.lab_test_id);
          }
        }
      } catch (error) {
        console.error("Error deleting lab test:", error);
        toast.error(error?.response?.data?.message || "Failed to delete lab test");
      } finally {
        setIsDeleting(false);
      }
    };

    const handleClose = () => {
      if (!isDeleting) {
        setDeleteConfirmText("");
        onClose();
      }
    };

    if (!show) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <h3>⚠️ Delete Lab Test</h3>
          
          <div className="study-info-section">
            <p><strong>Test ID:</strong> {test.lab_test_id}</p>
            <p><strong>Test Name:</strong> {test.test_name}</p>
            {test.test_code && (
              <p><strong>Test Code:</strong> {test.test_code}</p>
            )}
            <p><strong>Test Date:</strong> {test.test_date 
              ? formatDate(test.test_date) 
              : formatDate(test.created_at)}
            </p>
            {test.priority && (
              <p><strong>Priority:</strong> {test.priority}</p>
            )}
          </div>

          <div className="modal-danger-warning">
            <p><strong>This action cannot be undone!</strong></p>
            <p>Deleting this lab test will permanently remove:</p>
            <ul>
              <li>Test results and findings</li>
              <li>All recommendations</li>
              <li>Lab notes</li>
              {test.pdf_key && <li>Associated PDF report from AWS S3 storage</li>}
              <li>All related metadata</li>
            </ul>
            <p className="warning-note">
              <strong>Note:</strong> The visit record will remain intact, but this 
              lab test data will be permanently lost.
            </p>
          </div>

          <div className="confirmation-input-section">
            <label>
              To confirm deletion, please type <strong>{REQUIRED_CONFIRM_TEXT}</strong> below:
            </label>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={`Type ${REQUIRED_CONFIRM_TEXT} to confirm`}
              className="confirmation-input"
              disabled={isDeleting}
              autoComplete="off"
            />
          </div>

          <div className="modal-actions">
            <button 
              onClick={handleClose}
              className="btn-secondary"
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button 
              onClick={handleDelete}
              className="btn-danger"
              disabled={deleteConfirmText !== REQUIRED_CONFIRM_TEXT || isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Permanently"}
            </button>
          </div>
        </div>
      </div>
    );
  };


  if (loading) {
    return (
      <div className="visit-details-container">
        <div className="loading-container">
          <p>Loading visit details...</p>
        </div>
      </div>
    );
  }

  if (!visitData) {
    return (
      <div className="visit-details-container">
        <div className="no-results">
          <p>Visit not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="visit-details-container">
      {/* Header */}
      <div className="details-header">
        <button onClick={() => navigate("/visits")} className="btn-back">
          ← Back 
        </button>
        <div className="header-actions">
          <button 
            onClick={() => navigate(`/patients/${visitData.patient_id}`)}
            className="btn-secondary"
          >
            View Patient Profile
          </button>
          
          {/* Close Visit Button - for receptionists and admins */}
          {permissions?.can_close && permissions?.visit_status === 'open' && (
            <button 
              onClick={handleCloseVisit}
              className="btn-danger"
            >
              Close Visit
            </button>
          )}

          {/* Reopen Visit Button - for admins only */}
          {isReceptionist && permissions?.visit_status === 'closed' && (
            <button 
              onClick={handleReopenVisit}
              className="btn-warning"
            >
              Reopen Visit
            </button>
          )}
        </div>
      </div>

      {/* Visit Summary Card */}
      <div className="visit-summary-card">
        <div className="visit-header-info">
          <div>
            <h1>Visit #{visitData.visit_number}</h1>
            <div className="visit-meta">
              <span className="meta-item">
                <strong>Patient:</strong> {visitData.patient_first_name} {visitData.patient_last_name}
              </span>
              <span className="meta-item">
                <strong>Type:</strong> {visitData.visit_type}
              </span>
              <span className="meta-item">
                <strong>Date:</strong> {formatDateTime(visitData.visit_date)}
              </span>
            </div>
          </div>
          
          <div className="visit-badges">
            <span className={`priority-badge ${visitData.priority_level?.toLowerCase()}`}>
              {visitData.priority_level || 'Normal'}
            </span>
            {visitData.admission_status && (
              <span className="admission-badge">
                {visitData.admission_status}
              </span>
            )}
            {/* Visit Status Badge */}
            {permissions?.visit_status === 'closed' && (
              <span className="status-badge closed">
                Closed
              </span>
            )}
            {permissions?.visit_status === 'open' && (
              <span className="status-badge open">
                Open
              </span>
            )}
          </div>
        </div>

        {/* Hospital/Branch Info */}
        <div className="location-info">
          <div className="location-item">
            <span className="location-icon">🏥</span>
            <div>
              <strong>{visitData.hospital_name || 'N/A'}</strong>
              <p>{visitData.hospital_city || ''}</p>
            </div>
          </div>
          {visitData.branch_name && (
            <div className="location-item">
              <span className="location-icon">📍</span>
              <div>
                <strong>{visitData.branch_name}</strong>
                <p>{visitData.branch_city}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reason for Visit */}
      {visitData.reason_for_visit && (
        <div className="reason-card">
          <h3>Reason for Visit</h3>
          <p>{visitData.reason_for_visit}</p>
        </div>
      )}

      {/* CONTINUES IN PART 2 */}
      
  {/* Tabs - Only show Overview tab for receptionists */}
      <div className="tabs-container">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </button>
          
          {/* Hide all other tabs for receptionists */}
          {!isReceptionist && (
            <>
              <button 
                className={`tab ${activeTab === "vitals" ? "active" : ""}`}
                onClick={() => setActiveTab("vitals")}
              >
                Vitals {visitData.vitals?.length > 0 && `(${visitData.vitals.length})`}
              </button>
              <button 
                className={`tab ${activeTab === "diagnoses" ? "active" : ""}`}
                onClick={() => setActiveTab("diagnoses")}
              >
                Diagnoses {visitData.diagnoses?.length > 0 && `(${visitData.diagnoses.length})`}
              </button>
              <button 
                className={`tab ${activeTab === "treatments" ? "active" : ""}`}
                onClick={() => setActiveTab("treatments")}
              >
                Treatments {visitData.treatments?.length > 0 && `(${visitData.treatments.length})`}
              </button>
              <button 
                className={`tab ${activeTab === "prescriptions" ? "active" : ""}`}
                onClick={() => setActiveTab("prescriptions")}
              >
                Prescriptions {visitData.prescriptions?.length > 0 && `(${visitData.prescriptions.length})`}
              </button>
              <button 
                className={`tab ${activeTab === "tests" ? "active" : ""}`}
                onClick={() => setActiveTab("tests")}
              >
                Lab & Imaging
              </button>
            </>
          )}
        </div>
      </div>

      {/* Restricted Access Notice for Receptionists */}
      {isReceptionist && (
        <div className="restricted-access-notice">
          <p>ℹ️ Clinical details (vitals, diagnoses, treatments, prescriptions, and test results) are restricted for reception staff.</p>
        </div>
      )}

      {/* Tab Content */}
      <div className="tab-content">
        {/* Overview Tab - Available to all roles */}
        {activeTab === "overview" && (
          <div className="overview-grid">
            {/* Visit Information */}
            <div className="info-card">
              <h3>Visit Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>Visit Number</label>
                  <p>{visitData.visit_number}</p>
                </div>
                <div className="info-item">
                  <label>Visit Type</label>
                  <p>{visitData.visit_type}</p>
                </div>
                <div className="info-item">
                  <label>Priority Level</label>
                  <p>{visitData.priority_level || 'Normal'}</p>
                </div>
                <div className="info-item">
                  <label>Visit Date</label>
                  <p>{formatDateTime(visitData.visit_date)}</p>
                </div>
                {visitData.admission_status && (
                  <div className="info-item">
                    <label>Admission Status</label>
                    <p>{visitData.admission_status}</p>
                  </div>
                )}
                {visitData.discharge_date && (
                  <div className="info-item">
                    <label>Discharge Date</label>
                    <p>{formatDateTime(visitData.discharge_date)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Referral Information */}
            {(visitData.referring_provider_name || visitData.referring_provider_hospital) && (
              <div className="info-card">
                <h3>Referral Information</h3>
                <div className="info-grid">
                  {visitData.referring_provider_name && (
                    <div className="info-item">
                      <label>Referring Provider</label>
                      <p>{visitData.referring_provider_name}</p>
                    </div>
                  )}
                  {visitData.referring_provider_hospital && (
                    <div className="info-item">
                      <label>Referring Hospital</label>
                      <p>{visitData.referring_provider_hospital}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quick Summary - Show counts for non-receptionists only */}
            {!isReceptionist && (
              <div className="info-card full-width">
                <h3>Visit Summary</h3>
                <div className="summary-stats">
                  <div className="stat-item">
                    <div className="stat-number">{visitData.vitals?.length || 0}</div>
                    <div className="stat-label">Vital Records</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">{visitData.diagnoses?.length || 0}</div>
                    <div className="stat-label">Diagnoses</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">{visitData.treatments?.length || 0}</div>
                    <div className="stat-label">Treatments</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">{visitData.prescriptions?.length || 0}</div>
                    <div className="stat-label">Prescriptions</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">{visitData.lab_tests?.length || 0}</div>
                    <div className="stat-label">Lab Tests</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">{visitData.imaging_studies?.length || 0}</div>
                    <div className="stat-label">Imaging Studies</div>
                  </div>
                </div>
              </div>
            )}

            {/* Notes - Available to all */}
            {visitData.notes && (
              <div className="info-card full-width">
                <h3>Visit Notes</h3>
                <p className="notes-text">{visitData.notes}</p>
              </div>
            )}
          </div>
        )}

        {/* CLINICAL TABS - RESTRICTED FOR RECEPTIONISTS */}
        {!isReceptionist && (
          <>
            {/* Vitals Tab */}
            {activeTab === "vitals" && (
              <div className="info-card">
                <div className="card-header-with-action">
                  <h3>Vital Signs</h3>
                  {permissions?.can_add_records && (
                    <button 
                      className="btn-primary"
                      onClick={() => navigate('/visits/record-vitals', { 
                        state: { visit_id, patient_id: visitData.patient_id } 
                      })}
                    >
                      + Record Vitals
                    </button>
                  )}
                </div>
                {!visitData.vitals || visitData.vitals.length === 0 ? (
                  <p className="empty-state">No vital signs recorded</p>
                ) : (
                  <div className="vitals-list">
                    {visitData.vitals.map((vital) => (
                      <div key={vital.vital_id} className="vital-record">
                        <div className="vital-timestamp">
                          {formatDateTime(vital.created_at)}
                        </div>
                        <div className="vital-grid">
                          <div className="vital-item">
                            <span className="vital-icon">❤️</span>
                            <div>
                              <label>Blood Pressure</label>
                              <p className="vital-value">{vital.blood_pressure || 'N/A'}</p>
                            </div>
                          </div>
                          <div className="vital-item">
                            <span className="vital-icon">💓</span>
                            <div>
                              <label>Heart Rate</label>
                              <p className="vital-value">{vital.heart_rate ? `${vital.heart_rate} bpm` : 'N/A'}</p>
                            </div>
                          </div>
                          <div className="vital-item">
                            <span className="vital-icon">🌡️</span>
                            <div>
                              <label>Temperature</label>
                              <p className="vital-value">{vital.temperature ? `${vital.temperature}°C` : 'N/A'}</p>
                            </div>
                          </div>
                          <div className="vital-item">
                            <span className="vital-icon">🫁</span>
                            <div>
                              <label>Respiratory Rate</label>
                              <p className="vital-value">{vital.respiratory_rate ? `${vital.respiratory_rate}/min` : 'N/A'}</p>
                            </div>
                          </div>
                          <div className="vital-item">
                            <span className="vital-icon">💨</span>
                            <div>
                              <label>O₂ Saturation</label>
                              <p className="vital-value">{vital.oxygen_saturation ? `${vital.oxygen_saturation}%` : 'N/A'}</p>
                            </div>
                          </div>
                          <div className="vital-item">
                            <span className="vital-icon">⚖️</span>
                            <div>
                              <label>Weight</label>
                              <p className="vital-value">
                                {vital.weight ? `${vital.weight} ${vital.weight_unit}` : 'N/A'}
                              </p>
                            </div>
                          </div>
                          <div className="vital-item">
                            <span className="vital-icon">📏</span>
                            <div>
                              <label>Height</label>
                              <p className="vital-value">
                                {vital.height ? `${vital.height} ${vital.height_unit}` : 'N/A'}
                              </p>
                            </div>
                          </div>
                          <div className="vital-item">
                            <span className="vital-icon">📊</span>
                            <div>
                              <label>BMI</label>
                              <p className="vital-value">
                                {vital.bmi || calculateBMI(vital.weight, vital.height, vital.weight_unit, vital.height_unit) || 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Diagnoses Tab */}
            {activeTab === "diagnoses" && (
              <div className="info-card">
                <div className="card-header-with-action">
                  <h3>Diagnoses</h3>
                  {permissions?.can_add_records && (
                    <button 
                      className="btn-primary"
                      onClick={() => navigate('/visits/record-diagnosis', { 
                        state: { visit_id, patient_id: visitData.patient_id } 
                      })}
                    >
                      + Record Diagnosis
                    </button>
                  )}
                </div>
                {!visitData.diagnoses || visitData.diagnoses.length === 0 ? (
                  <p className="empty-state">No diagnoses recorded</p>
                ) : (
                  <div className="list-items">
                    {visitData.diagnoses.map((diagnosis) => (
                      <div key={diagnosis.diagnosis_id} className="list-item">
                        <div className="list-item-header">
                          <strong>{diagnosis.diagnosis_name}</strong>
                          <div className="badge-group">
                            <span className={`type-badge ${diagnosis.diagnosis_type?.toLowerCase()}`}>
                              {diagnosis.diagnosis_type}
                            </span>
                            {diagnosis.severity && (
                              <span className={`severity-badge ${diagnosis.severity?.toLowerCase()}`}>
                                {diagnosis.severity}
                              </span>
                            )}
                            {diagnosis.is_chronic && (
                              <span className="chronic-badge">Chronic</span>
                            )}
                          </div>
                        </div>
                        <div className="diagnosis-details">
                          <p><strong>ICD Code:</strong> {diagnosis.icd_code} ({diagnosis.icd_codes_version || 'N/A'})</p>
                          {diagnosis.diagnosis_description && (
                            <p className="description">{diagnosis.diagnosis_description}</p>
                          )}
                        </div>
                        <p className="list-item-date">Recorded: {formatDateTime(diagnosis.created_at)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* CONTINUES IN PART 3 */}
         {/* Treatments Tab */}
            {activeTab === "treatments" && (
              <div className="info-card">
                <div className="card-header-with-action">
                  <h3>Treatments</h3>
                  {permissions?.can_add_records && (
                    <button 
                      className="btn-primary"
                      onClick={() => navigate('/visits/record-treatment', { 
                        state: { visit_id, patient_id: visitData.patient_id } 
                      })}
                    >
                      + Record Treatment
                    </button>
                  )}
                </div>
                {!visitData.treatments || visitData.treatments.length === 0 ? (
                  <p className="empty-state">No treatments recorded</p>
                ) : (
                  <div className="list-items">
                    {visitData.treatments.map((treatment) => (
                      <div key={treatment.treatment_id} className="list-item">
                        <div className="list-item-header">
                          <strong>{treatment.treatment_name}</strong>
                          {treatment.outcome && (
                            <span className={`outcome-badge ${treatment.outcome?.toLowerCase()}`}>
                              {treatment.outcome}
                            </span>
                          )}
                        </div>
                        <div className="treatment-details">
                          {treatment.treatment_type && (
                            <p><strong>Type:</strong> {treatment.treatment_type}</p>
                          )}
                          {treatment.procedure_code && (
                            <p><strong>Procedure Code:</strong> {treatment.procedure_code}</p>
                          )}
                          {treatment.start_date && (
                            <p><strong>Start Date:</strong> {formatDateTime(treatment.start_date)}</p>
                          )}
                          {treatment.end_date && (
                            <p><strong>End Date:</strong> {formatDateTime(treatment.end_date)}</p>
                          )}
                          {treatment.treatment_description && (
                            <p className="description"><strong>Description:</strong> {treatment.treatment_description}</p>
                          )}
                          {treatment.complications && (
                            <p className="complications"><strong>Complications:</strong> {treatment.complications}</p>
                          )}
                          {treatment.follow_up_required && (
                            <span className="follow-up-badge">⚠️ Follow-up Required</span>
                          )}
                        </div>
                        {treatment.treatment_notes && (
                          <p className="list-item-notes">{treatment.treatment_notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Prescriptions Tab */}
            {activeTab === "prescriptions" && (
              <div className="info-card">
                <div className="card-header-with-action">
                  <h3>Prescriptions</h3>
                  {permissions?.can_add_records && (
                    <button 
                      className="btn-primary"
                      onClick={() => navigate('/visits/record-prescriptions', { 
                        state: { visit_id, patient_id: visitData.patient_id } 
                      })}
                    >
                      + Record Prescription
                    </button>
                  )}
                </div>
                {!visitData.prescriptions || visitData.prescriptions.length === 0 ? (
                  <p className="empty-state">No prescriptions issued</p>
                ) : (
                  <div className="list-items">
                    {visitData.prescriptions.map((prescription) => (
                      <div key={prescription.prescription_id} className="list-item">
                        <div className="list-item-header">
                          <strong>{prescription.medication_name}</strong>
                          <span className={`status-badge ${prescription.is_active ? 'active' : 'inactive'}`}>
                            {prescription.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="prescription-details">
                          <div className="detail-row">
                            <p><strong>Dosage:</strong> {prescription.dosage || 'N/A'}</p>
                            <p><strong>Frequency:</strong> {prescription.frequency || 'N/A'}</p>
                          </div>
                          <div className="detail-row">
                            <p><strong>Start Date:</strong> {formatDate(prescription.start_date)}</p>
                            <p><strong>End Date:</strong> {formatDate(prescription.end_date)}</p>
                          </div>
                          {prescription.refills_allowed > 0 && (
                            <p><strong>Refills Allowed:</strong> {prescription.refills_allowed}</p>
                          )}
                          {prescription.instructions && (
                            <div className="instructions">
                              <strong>Instructions:</strong>
                              <p>{prescription.instructions}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Lab & Imaging Tab */}
            {activeTab === "tests" && (
              <div className="tests-content">
                {/* Lab Tests - Compact View */}
                <div className="info-card">
                  <div className="card-header-with-action">
                    <h3>Laboratory Tests</h3>
                    {permissions?.can_add_records && (
                      <button 
                        className="btn-primary"
                        onClick={() => navigate('/visits/record-lab-results', { 
                          state: { visit_id, patient_id: visitData.patient_id } 
                        })}
                      >
                        + Record Lab Test
                      </button>
                    )}
                  </div>
                  {!visitData.lab_tests || visitData.lab_tests.length === 0 ? (
                    <p className="empty-state">No lab tests recorded</p>
                  ) : (
                    <div className="compact-list">
                      {visitData.lab_tests.map((test) => (
                        <div 
                          key={test.lab_test_id} 
                          className="compact-item"
                          onClick={() => setSelectedLabTest(test)}
                        >
                          <div className="compact-item-main">
                            <strong>{test.test_name}</strong>
                            <span className="compact-date">{formatDate(test.test_date)}</span>
                          </div>
                          <span className="compact-action">View Details →</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Imaging Studies - Compact View */}
                <div className="info-card">
                  <div className="card-header-with-action">
                    <h3>Imaging Studies</h3>
                    {permissions?.can_add_records && (
                      <button 
                        className="btn-primary"
                        onClick={() => navigate('/visits/record-imaging-results', { 
                          state: { visit_id, patient_id: visitData.patient_id } 
                        })}
                      >
                        + Upload Study
                      </button>
                    )}
                  </div>
                  {!visitData.imaging_studies || visitData.imaging_studies.length === 0 ? (
                    <p className="empty-state">No imaging studies recorded</p>
                  ) : (
                    <div className="compact-list">
                      {visitData.imaging_studies.map((study) => (
                        <div 
                          key={study.imaging_study_id} 
                          className="compact-item"
                          onClick={() => setSelectedImagingStudy(study)}
                        >
                          <div className="compact-item-main">
                            <strong>
                              {study.modality ? `${study.modality} Study` : 'Imaging Study'}
                              {study.body_part && ` - ${study.body_part}`}
                            </strong>
                            <div className="compact-meta">
                              <span className="compact-date">{formatDate(study.study_date || study.created_at)}</span>
                              {study.total_file_size && (
                                <span className="compact-size">
                                  {(study.total_file_size / (1024 * 1024)).toFixed(1)} MB
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="compact-action">View Details →</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

     

      {/* Imaging Study Detail Modal - Only for non-receptionists */}
     {/* Lab Test Detail Modal - Only for non-receptionists */}
      {!isReceptionist && selectedLabTest && (
        <div className="lab-imaging-modal-overlay" onClick={() => setSelectedLabTest(null)}>
          <div className="lab-imaging-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="lab-imaging-modal-header">
              <h2>{selectedLabTest.test_name}</h2>
              <button 
                className="lab-imaging-modal-close"
                onClick={() => setSelectedLabTest(null)}
              >
                ×
              </button>
            </div>
            <div className="lab-imaging-modal-body">
              <div className="lab-imaging-detail-section">
                <div className="lab-imaging-detail-grid">
                  {selectedLabTest.test_code && (
                    <div className="lab-imaging-detail-item">
                      <label>Test Code</label>
                      <p>{selectedLabTest.test_code}</p>
                    </div>
                  )}
                  <div className="lab-imaging-detail-item">
                    <label>Test Date</label>
                    <p>{formatDateTime(selectedLabTest.test_date)}</p>
                  </div>
                  <div className="lab-imaging-detail-item">
                    <label>Priority</label>
                    <p>
                      <span className={`priority-badge ${selectedLabTest.priority?.toLowerCase()}`}>
                        {selectedLabTest.priority || 'Normal'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {selectedLabTest.findings && (
                <div className="lab-imaging-detail-section">
                  <h4>Findings</h4>
                  <p className="lab-imaging-detail-text">{selectedLabTest.findings}</p>
                </div>
              )}

              {selectedLabTest.recommendations && (
                <div className="lab-imaging-detail-section">
                  <h4>Recommendations</h4>
                  <p className="lab-imaging-detail-text">{selectedLabTest.recommendations}</p>
                </div>
              )}

              {selectedLabTest.lab_notes && (
                <div className="lab-imaging-detail-section">
                  <h4>Notes</h4>
                  <p className="lab-imaging-detail-text">{selectedLabTest.lab_notes}</p>
                </div>
              )}

              {selectedLabTest.pdf_key && (
                <div className="lab-imaging-modal-actions">
                  <button 
                    onClick={() => viewLabTestPDF(selectedLabTest.lab_test_id)}
                    className="btn-primary"
                  >
                    📄 View Report PDF
                  </button>

                   
                 {permissions?.visit_status === 'open' && permissions?.can_edit && (
                  <button 
                    onClick={() => handleDeleteLabTestClick(selectedLabTest)}
                    className="btn-danger"
                    style={{ marginTop: '0.5rem' }}
                  >
                    🗑️ Delete Test
                  </button>
                )}
                
                </div>
                 
                
              )}
            </div>
          </div>
        </div>
      )}

      {/* Imaging Study Detail Modal - Only for non-receptionists */}
      {!isReceptionist && selectedImagingStudy && (
        <div className="lab-imaging-modal-overlay" onClick={() => setSelectedImagingStudy(null)}>
          <div className="lab-imaging-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="lab-imaging-modal-header">
              <h2>
                {selectedImagingStudy.modality ? `${selectedImagingStudy.modality} Study` : 'Imaging Study'}
                {selectedImagingStudy.body_part && ` - ${selectedImagingStudy.body_part}`}
              </h2>
              <button 
                className="lab-imaging-modal-close"
                onClick={() => setSelectedImagingStudy(null)}
              >
                ×
              </button>
            </div>
            <div className="lab-imaging-modal-body">
              <div className="lab-imaging-detail-section">
                <div className="lab-imaging-detail-grid">
                  {selectedImagingStudy.study_description && (
                    <div className="lab-imaging-detail-item full-width">
                      <label>Study Description</label>
                      <p>{selectedImagingStudy.study_description}</p>
                    </div>
                  )}
                  <div className="lab-imaging-detail-item">
                    <label>Study Date</label>
                    <p>{formatDateTime(selectedImagingStudy.study_date || selectedImagingStudy.created_at)}</p>
                  </div>
                  <div className="lab-imaging-detail-item">
                    <label>Series Count</label>
                    <p>📁 {selectedImagingStudy.series_count} series</p>
                  </div>
                  <div className="lab-imaging-detail-item">
                    <label>Image Count</label>
                    <p>🖼️ {selectedImagingStudy.instance_count} images</p>
                  </div>
                  {selectedImagingStudy.total_file_size && (
                    <div className="lab-imaging-detail-item">
                      <label>Total Size</label>
                      <p>{(selectedImagingStudy.total_file_size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                  )}
                </div>
              </div>

              {selectedImagingStudy.findings && (
                <div className="lab-imaging-detail-section">
                  <h4>Findings</h4>
                  <p className="lab-imaging-detail-text">{selectedImagingStudy.findings}</p>
                </div>
              )}

              {selectedImagingStudy.recommendations && (
                <div className="lab-imaging-detail-section">
                  <h4>Recommendations</h4>
                  <p className="lab-imaging-detail-text">{selectedImagingStudy.recommendations}</p>
                </div>
              )}

              <div className="lab-imaging-modal-actions">
                {selectedImagingStudy.viewer_url ? (
                  <>
                    <button 
                      onClick={() => openImagingViewer(selectedImagingStudy)}
                      className="btn-primary"
                    >
                      🖼️ View Complete Study
                    </button>
                    {selectedImagingStudy.all_viewers && selectedImagingStudy.all_viewers.length > 1 && (
                      <button 
                        onClick={() => showViewerOptions(selectedImagingStudy)}
                        className="btn-secondary"
                      >
                        ⚙️ More Viewers
                      </button>
                    )}
                     {/* Delete Button - Only for authorized users */}
                
                 {/* Delete button only shows for open visits */}
                  {permissions?.visit_status === 'open' && permissions?.can_edit && (
                    <button 
                      onClick={() => handleDeleteStudyClick(selectedImagingStudy)}
                      className="btn-danger"
                      style={{ marginTop: '0.5rem' }}
                    >
                      🗑️ Delete Study
                    </button>
                  )}
                
                  </>
                ) : (
                  <p className="lab-imaging-no-viewer-text">Viewer not available for this study</p>
                )}
                
               
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Imaging Study Confirmation Modal */}
      {studyToDelete && (
        <DeleteImagingStudyModal
          show={showDeleteStudyModal}
          onClose={() => {
            setShowDeleteStudyModal(false);
            setStudyToDelete(null);
          }}
          study={studyToDelete}
          onDeleteSuccess={handleDeleteStudySuccess}
        />
      )}
       {/* NEW: Delete Lab Test Confirmation Modal */}
      {labTestToDelete && (
        <DeleteLabTestModal
          show={showDeleteLabTestModal}
          onClose={() => {
            setShowDeleteLabTestModal(false);
            setLabTestToDelete(null);
          }}
          test={labTestToDelete}
          onDeleteSuccess={handleDeleteLabTestSuccess}
        />
      )}
    </div>
    
  );
};

   
export default VisitDetails;
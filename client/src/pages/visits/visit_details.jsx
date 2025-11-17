import React, { useState, useEffect } from "react";
import "./visits.css";
import api from "../../libs/apiCall.js";
import { toast } from "react-hot-toast";
import { useParams, useNavigate } from "react-router-dom";

const VisitDetails = () => {
  const { visit_id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [visitData, setVisitData] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch visit details
  useEffect(() => {
    const fetchVisitDetails = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/visits/get-visit/${visit_id}`);

        if (data.status === "success") {
          setVisitData(data.data);
          // DEBUG: Check imaging data
          console.log("Visit Data:", data.data);
          console.log("Imaging Results:", data.data.imaging_results);
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
  }, [visit_id, navigate]);

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

  // Calculate BMI if not provided
  const calculateBMI = (weight, height, weightUnit, heightUnit) => {
    if (!weight || !height) return null;
    
    // Convert to kg and meters
    let weightKg = weightUnit === 'lb' ? weight * 0.453592 : weight;
    let heightM = heightUnit === 'in' ? height * 0.0254 : height / 100;
    
    const bmi = weightKg / (heightM * heightM);
    return bmi.toFixed(1);
  };

  // Open imaging viewer in new tab
  const openImagingViewer = (imaging) => {
    if (!imaging.viewer_url) {
      toast.error("Viewer URL not available");
      return;
    }
    window.open(imaging.viewer_url, '_blank', 'noopener,noreferrer');
  };

  // Show viewer options if multiple are available
  // Improved showViewerOptions function with better modal styling

  const showViewerOptions = (imaging) => {
  if (!imaging.all_viewers || imaging.all_viewers.length === 0) {
    toast.error("No viewers available");
    return;
  }

  if (imaging.all_viewers.length === 1) {
    window.open(imaging.all_viewers[0].url, '_blank', 'noopener,noreferrer');
    return;
  }

  // Create backdrop element
  const backdrop = document.createElement('div');
  backdrop.className = 'toast-backdrop';
  document.body.appendChild(backdrop);

  // Function to close modal instantly
  const closeModal = (toastId) => {
    backdrop.remove();
    toast.remove(toastId); // Use remove instead of dismiss for instant closure
  };

  // Show custom toast with better positioning
  const toastId = toast.custom((t) => (
    <div className="viewer-toast">
      <h4>Choose a DICOM Viewer</h4>
      <div className="viewer-options">
        {imaging.all_viewers.map((viewer) => (
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
    duration: Infinity, // Don't auto-dismiss
    position: 'top-center',
    style: {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 9999,
    }
  });

  // Remove backdrop when clicking on it
  backdrop.onclick = () => {
    closeModal(toastId);
  };
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

      {/* Tabs */}
      <div className="tabs-container">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </button>
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
        </div>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Overview Tab */}
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

            {/* Quick Summary */}
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
                  <div className="stat-number">{visitData.imaging_results?.length || 0}</div>
                  <div className="stat-label">Imaging</div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {visitData.notes && (
              <div className="info-card full-width">
                <h3>Visit Notes</h3>
                <p className="notes-text">{visitData.notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Vitals Tab */}
        {activeTab === "vitals" && (
          <div className="info-card">
            <div className="card-header-with-action">
              <h3>Vital Signs</h3>
              <button 
                className="btn-primary"
                onClick={() => navigate('/visits/record-vitals', { 
                  state: { visit_id, patient_id: visitData.patient_id } 
                })}
              >
                + Record Vitals
              </button>
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
              <button 
                className="btn-primary"
                onClick={() => navigate('/visits/record-diagnosis', { 
                  state: { visit_id, patient_id: visitData.patient_id } 
                })}
              >
                + Record Diagnosis
              </button>
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

        {/* Treatments Tab */}
        {activeTab === "treatments" && (
          <div className="info-card">
            <div className="card-header-with-action">
              <h3>Treatments</h3>
              <button 
                className="btn-primary"
                onClick={() => navigate('/visits/record-treatment', { 
                  state: { visit_id, patient_id: visitData.patient_id } 
                })}
              >
                + Record Treatment
              </button>
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
              <button 
                className="btn-primary"
                onClick={() => navigate('/visits/record-prescriptions', { 
                  state: { visit_id, patient_id: visitData.patient_id } 
                })}
              >
                + Record Prescription
              </button>
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
            {/* Lab Tests */}
            <div className="info-card">
              <div className="card-header-with-action">
                <h3>Laboratory Tests</h3>
                <button 
                  className="btn-primary"
                  onClick={() => navigate('/visits/record-lab-results', { 
                    state: { visit_id, patient_id: visitData.patient_id } 
                  })}
                >
                  + Record Lab Test
                </button>
              </div>
              {!visitData.lab_tests || visitData.lab_tests.length === 0 ? (
                <p className="empty-state">No lab tests recorded</p>
              ) : (
                <div className="list-items">
                  {visitData.lab_tests.map((test) => (
                    <div key={test.lab_test_id} className="list-item">
                      <div className="list-item-header">
                        <strong>{test.test_name}</strong>
                        <span className={`priority-badge ${test.priority?.toLowerCase()}`}>
                          {test.priority || 'Normal'}
                        </span>
                      </div>
                      <div className="test-details">
                        {test.test_code && <p><strong>Test Code:</strong> {test.test_code}</p>}
                        <p><strong>Test Date:</strong> {formatDateTime(test.test_date)}</p>
                        {test.findings && (
                          <div className="findings">
                            <strong>Findings:</strong>
                            <p>{test.findings}</p>
                          </div>
                        )}
                        {test.recommendations && (
                          <div className="recommendations">
                            <strong>Recommendations:</strong>
                            <p>{test.recommendations}</p>
                          </div>
                        )}
                        {test.pdf_url && (
                          <a href={test.pdf_url} target="_blank" rel="noopener noreferrer" className="btn-view-pdf">
                            📄 View Report PDF
                          </a>
                        )}
                      </div>
                      {test.lab_notes && (
                        <p className="list-item-notes">{test.lab_notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Imaging Results */}
            <div className="info-card">
              <div className="card-header-with-action">
                <h3>Imaging Results</h3>
                <button 
                  className="btn-primary"
                  onClick={() => navigate('/visits/record-imaging-results', { 
                    state: { visit_id, patient_id: visitData.patient_id } 
                  })}
                >
                  + Record Imaging
                </button>
              </div>
              {!visitData.imaging_results || visitData.imaging_results.length === 0 ? (
                <p className="empty-state">No imaging results recorded</p>
              ) : (
                <div className="list-items">
                  {visitData.imaging_results.map((imaging) => {
                    // DEBUG: Log each imaging result
                    console.log("Imaging item:", imaging);
                    console.log("Has viewer_url:", !!imaging.viewer_url);
                    console.log("Has all_viewers:", imaging.all_viewers);
                    
                    return (
                    <div key={imaging.imaging_result_id} className="list-item">
                      <div className="list-item-header">
                        <div>
                          <strong>
                            {imaging.modality ? `${imaging.modality} Study` : 'Imaging Study'}
                          </strong>
                          {imaging.body_part && (
                            <span className="body-part-tag"> - {imaging.body_part}</span>
                          )}
                        </div>
                        
                      </div>
                      
                      <div className="imaging-metadata">
                        {imaging.study_description && (
                          <p><strong>Study:</strong> {imaging.study_description}</p>
                        )}
                        {imaging.series_description && (
                          <p><strong>Series:</strong> {imaging.series_description}</p>
                        )}
                        <p><strong>Date:</strong> {formatDateTime(imaging.study_date || imaging.created_at)}</p>
                      </div>

                      {imaging.findings && (
                        <div className="findings">
                          <strong>Findings:</strong>
                          <p>{imaging.findings}</p>
                        </div>
                      )}
                      {imaging.recommendations && (
                        <div className="recommendations">
                          <strong>Recommendations:</strong>
                          <p>{imaging.recommendations}</p>
                        </div>
                      )}
                      
                      {/* Fallback for old data structure */}
                      {imaging.reccomendations && !imaging.recommendations && (
                        <div className="recommendations">
                          <strong>Recommendations:</strong>
                          <p>{imaging.reccomendations}</p>
                        </div>
                      )}
                      
                      {/* {imaging.image_url && (
                        <a href={imaging.image_url} target="_blank" rel="noopener noreferrer" className="btn-view-image">
                          🖼️ View Image
                        </a>
                      )} */}
                      <div className="imaging-actions">
                          {/* Always show button for testing */}
                          <button 
                            onClick={() => {
                              console.log("Button clicked, imaging data:", imaging);
                              if (imaging.viewer_url) {
                                openImagingViewer(imaging);
                              } else {
                                toast.error("Viewer URL not available in data");
                              }
                            }}
                            className="btn-view-imaging"
                            title="Open DICOM Viewer"
                          >
                            🖼️ View Images {!imaging.viewer_url && "(No URL)"}
                          </button>
                          {imaging.all_viewers && imaging.all_viewers.length > 1 && (
                            <button 
                              onClick={() => showViewerOptions(imaging)}
                              className="btn-viewer-options"
                              title="Choose Viewer"
                            >
                              ⚙️
                            </button>
                          )}
                        </div>
                    </div>
                  )})}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisitDetails;
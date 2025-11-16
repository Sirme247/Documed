import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../libs/apiCall.js";
import { toast } from "react-hot-toast";
import "./edit_patient.css";

const EditMedicals = () => {
  const { patient_id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState(null);
  const [medicalHistory, setMedicalHistory] = useState({
    allergies: [],
    medications: [],
    chronic_conditions: [],
    family_history: [],
    social_history: null
  });
  const [activeTab, setActiveTab] = useState("allergies");
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    fetchPatientData();
  }, [patient_id]);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/patients/get-patient/${patient_id}`);
      if (data.status === "success") {
        setPatient(data.data.patient);
        setMedicalHistory(data.data.medical_history);
      }
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to fetch patient details");
      navigate(`/patients/${patient_id}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAllergy = async (allergy_id) => {
    if (!window.confirm("Are you sure you want to delete this allergy?")) return;
    
    try {
      const { data } = await api.delete('/patients/delete-allergy', {
        data: { allergy_id }
      });
      if (data.status === "success") {
        toast.success("Allergy deleted successfully");
        fetchPatientData();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to delete allergy");
    }
  };

  const handleDeleteMedication = async (medication_id) => {
    if (!window.confirm("Are you sure you want to delete this medication?")) return;
    
    try {
      const { data } = await api.delete('/patients/delete-medication', {
        data: { medication_id }
      });
      if (data.status === "success") {
        toast.success("Medication deleted successfully");
        fetchPatientData();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to delete medication");
    }
  };

  const handleDeleteCondition = async (condition_id) => {
    if (!window.confirm("Are you sure you want to delete this condition?")) return;
    
    try {
      const { data } = await api.delete('/patients/delete-chronic-condition', {
        data: { condition_id }
      });
      if (data.status === "success") {
        toast.success("Condition deleted successfully");
        fetchPatientData();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to delete condition");
    }
  };

  const handleDeleteFamilyHistory = async (family_history_id) => {
    if (!window.confirm("Are you sure you want to delete this family history entry?")) return;
    
    try {
      const { data } = await api.delete('/patients/delete-family-history', {
        data: { family_history_id }
      });
      if (data.status === "success") {
        toast.success("Family history deleted successfully");
        fetchPatientData();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to delete family history");
    }
  };

  const handleUpdateAllergy = async (allergy) => {
    try {
      const { data } = await api.put('/patients/update-allergy', {
        ...allergy,
        patient_id: parseInt(patient_id)
      });
      if (data.status === "success") {
        toast.success("Allergy updated successfully");
        fetchPatientData();
        setEditingItem(null);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update allergy");
    }
  };

  const handleUpdateMedication = async (medication) => {
    try {
      const { data } = await api.put('/patients/update-medication', {
        ...medication,
        patient_id: parseInt(patient_id)
      });
      if (data.status === "success") {
        toast.success("Medication updated successfully");
        fetchPatientData();
        setEditingItem(null);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update medication");
    }
  };

  const handleUpdateCondition = async (condition) => {
    try {
      const { data } = await api.put('/patients/update-chronic-condition', {
        ...condition,
        patient_id: parseInt(patient_id)
      });
      if (data.status === "success") {
        toast.success("Chronic condition updated successfully");
        fetchPatientData();
        setEditingItem(null);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update condition");
    }
  };

  const handleUpdateFamilyHistory = async (familyHx) => {
    try {
      const { data } = await api.put('/patients/update-family-history', {
        ...familyHx,
        patient_id: parseInt(patient_id)
      });
      if (data.status === "success") {
        toast.success("Family history updated successfully");
        fetchPatientData();
        setEditingItem(null);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update family history");
    }
  };

  const handleUpdateSocialHistory = async (socialHx) => {
    try {
      const { data } = await api.put('/patients/update-social-history', {
        ...socialHx,
        patient_id: parseInt(patient_id)
      });
      if (data.status === "success") {
        toast.success("Social history updated successfully");
        fetchPatientData();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update social history");
    }
  };

  const handleCancel = () => {
     navigate(`/patients/${patient_id}/edit`);
    
  };

  if (loading) {
    return (
      <div className="edit-patient-container">
        <div className="loading-container">
          <div className="loading-spinner">⏳</div>
          <p>Loading medical records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-patient-container">
      {/* Header */}
      <div className="edit-header">
        <button onClick={handleCancel} className="btn-back">
          ← Back
        </button>
        <div className="header-content">
          <div className="header-left">
            <div className="patient-icon-large">🩺</div>
            <div>
              <h1>Edit Medical Records</h1>
              <p className="subtitle">
                {patient?.first_name} {patient?.middle_name} {patient?.last_name}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="tabs-navigation">
        <button 
          className={`tab-btn ${activeTab === "allergies" ? "active" : ""}`}
          onClick={() => setActiveTab("allergies")}
        >
          ⚠️ Allergies
        </button>
        <button 
          className={`tab-btn ${activeTab === "medications" ? "active" : ""}`}
          onClick={() => setActiveTab("medications")}
        >
          💊 Medications
        </button>
        <button 
          className={`tab-btn ${activeTab === "conditions" ? "active" : ""}`}
          onClick={() => setActiveTab("conditions")}
        >
          🩺 Chronic Conditions
        </button>
        <button 
          className={`tab-btn ${activeTab === "family" ? "active" : ""}`}
          onClick={() => setActiveTab("family")}
        >
          👨‍👩‍👧 Family History
        </button>
        <button 
          className={`tab-btn ${activeTab === "social" ? "active" : ""}`}
          onClick={() => setActiveTab("social")}
        >
          🏠 Social History
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content-area">
        {/* Allergies Tab */}
        {activeTab === "allergies" && (
          <div className="medical-section">
            <div className="section-header">
              <div>
                <h2>⚠️ Allergies</h2>
                <p className="section-subtitle">Manage patient allergy information</p>
              </div>
              <button 
                onClick={() => navigate('/patients/add-allergy', { state: { patient_id } })}
                className="btn-add-new"
              >
                + Add Allergy
              </button>
            </div>
            {medicalHistory.allergies.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">⚠️</div>
                <p>No allergies recorded</p>
              </div>
            ) : (
              <div className="medical-items-list">
                {medicalHistory.allergies.map((allergy) => (
                  <AllergyItem
                    key={allergy.allergy_id}
                    allergy={allergy}
                    onUpdate={handleUpdateAllergy}
                    onDelete={handleDeleteAllergy}
                    editingItem={editingItem}
                    setEditingItem={setEditingItem}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Medications Tab */}
        {activeTab === "medications" && (
          <div className="medical-section">
            <div className="section-header">
              <div>
                <h2>💊 Medications</h2>
                <p className="section-subtitle">Manage patient medication list</p>
              </div>
              <button 
                onClick={() => navigate('/patients/add-medication', { state: { patient_id } })}
                className="btn-add-new"
              >
                + Add Medication
              </button>
            </div>
            {medicalHistory.medications.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">💊</div>
                <p>No medications recorded</p>
              </div>
            ) : (
              <div className="medical-items-list">
                {medicalHistory.medications.map((medication) => (
                  <MedicationItem
                    key={medication.medication_id}
                    medication={medication}
                    onUpdate={handleUpdateMedication}
                    onDelete={handleDeleteMedication}
                    editingItem={editingItem}
                    setEditingItem={setEditingItem}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Chronic Conditions Tab */}
        {activeTab === "conditions" && (
          <div className="medical-section">
            <div className="section-header">
              <div>
                <h2>🩺 Chronic Conditions</h2>
                <p className="section-subtitle">Manage chronic health conditions</p>
              </div>
              <button 
                onClick={() => navigate('/patients/add-chronic-condition', { state: { patient_id } })}
                className="btn-add-new"
              >
                + Add Condition
              </button>
            </div>
            {medicalHistory.chronic_conditions.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🩺</div>
                <p>No chronic conditions recorded</p>
              </div>
            ) : (
              <div className="medical-items-list">
                {medicalHistory.chronic_conditions.map((condition) => (
                  <ConditionItem
                    key={condition.condition_id}
                    condition={condition}
                    onUpdate={handleUpdateCondition}
                    onDelete={handleDeleteCondition}
                    editingItem={editingItem}
                    setEditingItem={setEditingItem}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Family History Tab */}
        {activeTab === "family" && (
          <div className="medical-section">
            <div className="section-header">
              <div>
                <h2>👨‍👩‍👧 Family History</h2>
                <p className="section-subtitle">Manage family medical history</p>
              </div>
              <button 
                onClick={() => navigate('/patients/add-family-history', { state: { patient_id } })}
                className="btn-add-new"
              >
                + Add Family History
              </button>
            </div>
            {medicalHistory.family_history.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👨‍👩‍👧</div>
                <p>No family history recorded</p>
              </div>
            ) : (
              <div className="medical-items-list">
                {medicalHistory.family_history.map((familyHx) => (
                  <FamilyHistoryItem
                    key={familyHx.family_history_id}
                    familyHx={familyHx}
                    onUpdate={handleUpdateFamilyHistory}
                    onDelete={handleDeleteFamilyHistory}
                    editingItem={editingItem}
                    setEditingItem={setEditingItem}
                  />
                ))}
              </div>
            )}
          </div>
        )}
{/* Social History Tab */}
{activeTab === "social" && (
  <div className="medical-section">
    <div className="section-header">
      <h2>🏠 Social History</h2>
      <p className="section-subtitle">Manage patient social and lifestyle information</p>
    </div>
    <SocialHistoryForm
      socialHistory={medicalHistory.social_history}
      onUpdate={handleUpdateSocialHistory}
      navigate={navigate}
      patient_id={patient_id}
    />
  </div>
)}
      </div>
    </div>
  );
};

// Allergy Item Component
const AllergyItem = ({ allergy, onUpdate, onDelete, editingItem, setEditingItem }) => {
  const [formData, setFormData] = useState({ ...allergy });
  const isEditing = editingItem === `allergy-${allergy.allergy_id}`;

  const handleSave = () => {
    onUpdate(formData);
  };

  return (
    <div className={`medical-item-card ${isEditing ? 'editing' : ''}`}>
      {isEditing ? (
        <div className="edit-form">
          <div className="form-grid">
            <div className="form-group">
              <label>Allergen *</label>
              <input
                type="text"
                value={formData.allergen}
                onChange={(e) => setFormData({...formData, allergen: e.target.value})}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Reaction</label>
              <input
                type="text"
                value={formData.reaction}
                onChange={(e) => setFormData({...formData, reaction: e.target.value})}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Severity</label>
              <select
                value={formData.allergy_severity}
                onChange={(e) => setFormData({...formData, allergy_severity: e.target.value})}
                className="form-input"
              >
                <option value="Mild">Mild</option>
                <option value="Moderate">Moderate</option>
                <option value="Severe">Severe</option>
              </select>
            </div>
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.verified}
                  onChange={(e) => setFormData({...formData, verified: e.target.checked})}
                />
                <span>Verified</span>
              </label>
            </div>
          </div>
          <div className="form-actions">
            <button onClick={() => setEditingItem(null)} className="btn-cancel">Cancel</button>
            <button onClick={handleSave} className="btn-save">Save Changes</button>
          </div>
        </div>
      ) : (
        <div className="item-view">
          <div className="item-header">
            <div>
              <h3>{allergy.allergen}</h3>
              <div className="badge-group">
                <span className={`severity-badge ${allergy.allergy_severity?.toLowerCase()}`}>
                  {allergy.allergy_severity}
                </span>
                {allergy.verified && <span className="verified-badge">✓ Verified</span>}
              </div>
            </div>
            <div className="item-actions">
              <button onClick={() => setEditingItem(`allergy-${allergy.allergy_id}`)} className="btn-medical-edit">
                Edit
              </button>
              <button onClick={() => onDelete(allergy.allergy_id)} className="btn-medical-delete">
                Delete
              </button>
            </div>
          </div>
          <div className="item-details">
            <p><strong>Reaction:</strong> {allergy.reaction}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Medication Item Component
const MedicationItem = ({ medication, onUpdate, onDelete, editingItem, setEditingItem }) => {
  const [formData, setFormData] = useState({ ...medication });
  const isEditing = editingItem === `medication-${medication.medication_id}`;

  const handleSave = () => {
    onUpdate(formData);
  };

  return (
    <div className={`medical-item-card ${isEditing ? 'editing' : ''}`}>
      {isEditing ? (
        <div className="edit-form">
          <div className="form-grid">
            <div className="form-group">
              <label>Medication Name *</label>
              <input
                type="text"
                value={formData.medication_name}
                onChange={(e) => setFormData({...formData, medication_name: e.target.value})}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Dosage</label>
              <input
                type="text"
                value={formData.dosage}
                onChange={(e) => setFormData({...formData, dosage: e.target.value})}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Frequency</label>
              <input
                type="text"
                value={formData.frequency}
                onChange={(e) => setFormData({...formData, frequency: e.target.value})}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Start Date</label>
              <input
                type="date"
                value={formData.start_date ? formData.start_date.split('T')[0] : ''}
                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input
                type="date"
                value={formData.end_date ? formData.end_date.split('T')[0] : ''}
                onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Hospital Prescribed</label>
              <input
                type="text"
                value={formData.hospital_where_prescribed || ''}
                onChange={(e) => setFormData({...formData, hospital_where_prescribed: e.target.value})}
                className="form-input"
              />
            </div>
            <div className="form-group full-width">
              <label>Notes</label>
              <textarea
                value={formData.medication_notes || ''}
                onChange={(e) => setFormData({...formData, medication_notes: e.target.value})}
                className="form-input"
                rows="2"
              />
            </div>
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.medication_is_active}
                  onChange={(e) => setFormData({...formData, medication_is_active: e.target.checked})}
                />
                <span>Active</span>
              </label>
            </div>
          </div>
          <div className="form-actions">
            <button onClick={() => setEditingItem(null)} className="btn-cancel">Cancel</button>
            <button onClick={handleSave} className="btn-save">Save Changes</button>
          </div>
        </div>
      ) : (
        <div className="item-view">
          <div className="item-header">
            <div>
              <h3>{medication.medication_name}</h3>
              <span className={`status-badge ${medication.medication_is_active ? 'active' : 'inactive'}`}>
                {medication.medication_is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="item-actions">
              <button onClick={() => setEditingItem(`medication-${medication.medication_id}`)} className="btn-medical-edit">
                Edit
              </button>
              <button onClick={() => onDelete(medication.medication_id)} className="btn-medical-delete">
                Delete
              </button>
            </div>
          </div>
          <div className="item-details">
            <p><strong>Dosage:</strong> {medication.dosage || "N/A"}</p>
            <p><strong>Frequency:</strong> {medication.frequency || "N/A"}</p>
            {medication.hospital_where_prescribed && (
              <p><strong>Prescribed at:</strong> {medication.hospital_where_prescribed}</p>
            )}
            {medication.medication_notes && (
              <p className="notes"><em>{medication.medication_notes}</em></p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Chronic Condition Item Component
const ConditionItem = ({ condition, onUpdate, onDelete, editingItem, setEditingItem }) => {
  const [formData, setFormData] = useState({ ...condition });
  const isEditing = editingItem === `condition-${condition.condition_id}`;

  const handleSave = () => {
    onUpdate(formData);
  };

  return (
    <div className={`medical-item-card ${isEditing ? 'editing' : ''}`}>
      {isEditing ? (
        <div className="edit-form">
          <div className="form-grid">
            <div className="form-group">
              <label>Condition Name *</label>
              <input
                type="text"
                value={formData.condition_name}
                onChange={(e) => setFormData({...formData, condition_name: e.target.value})}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>ICD Code</label>
              <input
                type="text"
                value={formData.icd_code || ''}
                onChange={(e) => setFormData({...formData, icd_code: e.target.value})}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>ICD Version</label>
              <input
                type="text"
                value={formData.icd_codes_version || ''}
                onChange={(e) => setFormData({...formData, icd_codes_version: e.target.value})}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Severity</label>
              <select
                value={formData.condition_severity}
                onChange={(e) => setFormData({...formData, condition_severity: e.target.value})}
                className="form-input"
              >
                <option value="Mild">Mild</option>
                <option value="Moderate">Moderate</option>
                <option value="Severe">Severe</option>
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <input
                type="text"
                value={formData.current_status || ''}
                onChange={(e) => setFormData({...formData, current_status: e.target.value})}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Diagnosed Date</label>
              <input
                type="date"
                value={formData.diagnosed_date ? formData.diagnosed_date.split('T')[0] : ''}
                onChange={(e) => setFormData({...formData, diagnosed_date: e.target.value})}
                className="form-input"
              />
            </div>
            <div className="form-group full-width">
              <label>Management Plan</label>
              <textarea
                value={formData.management_plan || ''}
                onChange={(e) => setFormData({...formData, management_plan: e.target.value})}
                className="form-input"
                rows="2"
              />
            </div>
            <div className="form-group full-width">
              <label>Notes</label>
              <textarea
                value={formData.condition_notes || ''}
                onChange={(e) => setFormData({...formData, condition_notes: e.target.value})}
                className="form-input"
                rows="2"
              />
            </div>
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                />
                <span>Active</span>
              </label>
            </div>
          </div>
          <div className="form-actions">
            <button onClick={() => setEditingItem(null)} className="btn-cancel">Cancel</button>
            <button onClick={handleSave} className="btn-save">Save Changes</button>
          </div>
        </div>
      ) : (
        <div className="item-view">
          <div className="item-header">
            <div>
              <h3>{condition.condition_name}</h3>
              <div className="badge-group">
                <span className={`severity-badge ${condition.condition_severity?.toLowerCase()}`}>
                  {condition.condition_severity}
                </span>
                <span className={`status-badge ${condition.is_active ? 'active' : 'inactive'}`}>
                  {condition.current_status}
                </span>
              </div>
            </div>
            <div className="item-actions">
              <button onClick={() => setEditingItem(`condition-${condition.condition_id}`)} className="btn-medical-edit">
                Edit
              </button>
              <button onClick={() => onDelete(condition.condition_id)} className="btn-medical-delete">
                Delete
              </button>
            </div>
          </div>
          <div className="item-details">
            {condition.icd_code && (
              <p><strong>ICD Code:</strong> {condition.icd_code} ({condition.icd_codes_version})</p>
            )}
            {condition.management_plan && (
              <div className="management-box">
                <strong>Management Plan:</strong>
                <p>{condition.management_plan}</p>
              </div>
            )}
            {condition.condition_notes && (
              <p className="notes"><em>{condition.condition_notes}</em></p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Family History Item Component
const FamilyHistoryItem = ({ familyHx, onUpdate, onDelete, editingItem, setEditingItem }) => {
  const [formData, setFormData] = useState({ ...familyHx });
  const isEditing = editingItem === `family-${familyHx.family_history_id}`;

  const handleSave = () => {
    onUpdate(formData);
  };

  return (<div className={`medical-item-card ${isEditing ? 'editing' : ''}`}>
      {isEditing ? (
        <div className="edit-form">
          <div className="form-grid">
            <div className="form-group">
              <label>Relative Name *</label>
              <input
                type="text"
                value={formData.relative_name}
                onChange={(e) => setFormData({...formData, relative_name: e.target.value})}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Relationship</label>
              <input
                type="text"
                value={formData.relationship}
                onChange={(e) => setFormData({...formData, relationship: e.target.value})}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Condition</label>
              <input
                type="text"
                value={formData.relative_condition_name}
                onChange={(e) => setFormData({...formData, relative_condition_name: e.target.value})}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Age of Onset</label>
              <input
                type="text"
                value={formData.age_of_onset || ''}
                onChange={(e) => setFormData({...formData, age_of_onset: e.target.value})}
                className="form-input"
              />
            </div>
            <div className="form-group full-width">
              <label>Notes</label>
              <textarea
                value={formData.family_history_notes || ''}
                onChange={(e) => setFormData({...formData, family_history_notes: e.target.value})}
                className="form-input"
                rows="2"
              />
            </div>
          </div>
          <div className="form-actions">
            <button onClick={() => setEditingItem(null)} className="btn-cancel">Cancel</button>
            <button onClick={handleSave} className="btn-save">Save Changes</button>
          </div>
        </div>
      ) : (
        <div className="item-view">
          <div className="item-header">
            <div>
              <h3>{familyHx.relative_name}</h3>
              <span className="relationship-badge">{familyHx.relationship}</span>
            </div>
            <div className="item-actions">
              <button onClick={() => setEditingItem(`family-${familyHx.family_history_id}`)} className="btn-medical-edit">
                Edit
              </button>
              <button onClick={() => onDelete(familyHx.family_history_id)} className="btn-medical-delete">
                Delete
              </button>
            </div>
          </div>
          <div className="item-details">
            <p><strong>Condition:</strong> {familyHx.relative_condition_name}</p>
            {familyHx.age_of_onset && (
              <p><strong>Age of Onset:</strong> {familyHx.age_of_onset}</p>
            )}
            {familyHx.family_history_notes && (
              <p className="notes"><em>{familyHx.family_history_notes}</em></p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Social History Form Component
// Social History Form Component
const SocialHistoryForm = ({ socialHistory, onUpdate, navigate, patient_id }) => {
  const [formData, setFormData] = useState({
    smoking_status: socialHistory?.smoking_status || '',
    alcohol_use: socialHistory?.alcohol_use || '',
    drug_use: socialHistory?.drug_use || '',
    physical_activity: socialHistory?.physical_activity || '',
    diet_description: socialHistory?.diet_description || '',
    living_situation: socialHistory?.living_situation || '',
    support_system: socialHistory?.support_system || ''
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (socialHistory) {
      setFormData({
        smoking_status: socialHistory.smoking_status || '',
        alcohol_use: socialHistory.alcohol_use || '',
        drug_use: socialHistory.drug_use || '',
        physical_activity: socialHistory.physical_activity || '',
        diet_description: socialHistory.diet_description || '',
        living_situation: socialHistory.living_situation || '',
        support_system: socialHistory.support_system || ''
      });
    }
  }, [socialHistory]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(formData);
    setIsEditing(false);
  };

  // Remove the duplicate early return and use this single one
  if (!socialHistory) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🏠</div>
        <p>No social history recorded</p>
        <button 
          onClick={() => navigate('/patients/add-social-history', { state: { patient_id } })}
          className="btn-add-new"
          style={{ marginTop: '1rem' }}
        >
          + Add Social History
        </button>
      </div>
    );
  }

  return (
    <div className="social-history-form">
      {!isEditing ? (
        <div className="social-history-view">
          <div className="info-grid-social">
            <div className="info-item-social">
              <label>Smoking Status</label>
              <p>{socialHistory.smoking_status || 'N/A'}</p>
            </div>
            <div className="info-item-social">
              <label>Alcohol Use</label>
              <p>{socialHistory.alcohol_use || 'N/A'}</p>
            </div>
            <div className="info-item-social">
              <label>Drug Use</label>
              <p>{socialHistory.drug_use || 'N/A'}</p>
            </div>
            <div className="info-item-social">
              <label>Physical Activity</label>
              <p>{socialHistory.physical_activity || 'N/A'}</p>
            </div>
            <div className="info-item-social full">
              <label>Diet Description</label>
              <p>{socialHistory.diet_description || 'N/A'}</p>
            </div>
            <div className="info-item-social full">
              <label>Living Situation</label>
              <p>{socialHistory.living_situation || 'N/A'}</p>
            </div>
            <div className="info-item-social full">
              <label>Support System</label>
              <p>{socialHistory.support_system || 'N/A'}</p>
            </div>
          </div>
          <button onClick={() => setIsEditing(true)} className="btn-medical-edit" style={{ marginTop: '20px' }}>
            Edit Social History
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="edit-form">
          <div className="form-grid">
            <div className="form-group">
              <label>Smoking Status</label>
              <input
                type="text"
                value={formData.smoking_status}
                onChange={(e) => setFormData({...formData, smoking_status: e.target.value})}
                className="form-input"
                placeholder="e.g., Never, Former, Current"
              />
            </div>
            <div className="form-group">
              <label>Alcohol Use</label>
              <input
                type="text"
                value={formData.alcohol_use}
                onChange={(e) => setFormData({...formData, alcohol_use: e.target.value})}
                className="form-input"
                placeholder="e.g., None, Occasional, Regular"
              />
            </div>
            <div className="form-group">
              <label>Drug Use</label>
              <input
                type="text"
                value={formData.drug_use}
                onChange={(e) => setFormData({...formData, drug_use: e.target.value})}
                className="form-input"
                placeholder="e.g., None, Past, Current"
              />
            </div>
            <div className="form-group">
              <label>Physical Activity</label>
              <input
                type="text"
                value={formData.physical_activity}
                onChange={(e) => setFormData({...formData, physical_activity: e.target.value})}
                className="form-input"
                placeholder="e.g., 3x per week"
              />
            </div>
            <div className="form-group full-width">
              <label>Diet Description</label>
              <textarea
                value={formData.diet_description}
                onChange={(e) => setFormData({...formData, diet_description: e.target.value})}
                className="form-input"
                rows="2"
                placeholder="Describe dietary habits"
              />
            </div>
            <div className="form-group full-width">
              <label>Living Situation</label>
              <textarea
                value={formData.living_situation}
                onChange={(e) => setFormData({...formData, living_situation: e.target.value})}
                className="form-input"
                rows="2"
                placeholder="Describe living arrangements"
              />
            </div>
            <div className="form-group full-width">
              <label>Support System</label>
              <textarea
                value={formData.support_system}
                onChange={(e) => setFormData({...formData, support_system: e.target.value})}
                className="form-input"
                rows="2"
                placeholder="Describe support network"
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="button" onClick={() => setIsEditing(false)} className="btn-cancel">
              Cancel
            </button>
            <button type="submit" className="btn-save">
              Save Changes
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default EditMedicals;
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../libs/apiCall.js";
import { toast } from "react-hot-toast";
import "./edit_patient.css";

const EditPatient = () => {
  const { patient_id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("demographics");
  
  const [formData, setFormData] = useState({
    // Demographics
    first_name: "",
    middle_name: "",
    last_name: "",
    date_of_birth: "",
    gender: "",
    national_id: "",
    country_of_birth: "",
    country_of_residence: "",
    
    // Contact Information
    email: "",
    primary_number: "",
    secondary_number: "",
    address_line: "",
    
    // Personal Details
    marital_status: "",
    blood_type: "",
    occupation: "",
    ethnicity: "",
    preffered_language: "",
    religion: "",
    
    // Emergency Contacts
    emergency_contact1_name: "",
    emergency_contact1_number: "",
    emergency_contact1_relationship: "",
    emergency_contact2_name: "",
    emergency_contact2_number: "",
    emergency_contact2_relationship: "",
    
    // Insurance
    primary_insurance_provider: "",
    primary_insurance_policy_number: "",
    secondary_insurance_provider: "",
    secondary_insurance_policy_number: "",
    
    // Status
    is_active: true,
    is_deceased: false,
    date_of_death: ""
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchPatientData();
  }, [patient_id]);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/patients/get-patient/${patient_id}`);
      
      if (data.status === "success") {
        const patient = data.data.patient;
        
        setFormData({
          first_name: patient.first_name || "",
          middle_name: patient.middle_name || "",
          last_name: patient.last_name || "",
          date_of_birth: patient.date_of_birth ? patient.date_of_birth.split('T')[0] : "",
          gender: patient.gender || "",
          national_id: patient.national_id || "",
          country_of_birth: patient.country_of_birth || "",
          country_of_residence: patient.country_of_residence || "",
          email: patient.email || "",
          primary_number: patient.primary_number || "",
          secondary_number: patient.secondary_number || "",
          address_line: patient.address_line || "",
          marital_status: patient.marital_status || "",
          blood_type: patient.blood_type || "",
          occupation: patient.occupation || "",
          ethnicity: patient.ethnicity || "",
          preffered_language: patient.preffered_language || "",
          religion: patient.religion || "",
          emergency_contact1_name: patient.emergency_contact1_name || "",
          emergency_contact1_number: patient.emergency_contact1_number || "",
          emergency_contact1_relationship: patient.emergency_contact1_relationship || "",
          emergency_contact2_name: patient.emergency_contact2_name || "",
          emergency_contact2_number: patient.emergency_contact2_number || "",
          emergency_contact2_relationship: patient.emergency_contact2_relationship || "",
          primary_insurance_provider: patient.primary_insurance_provider || "",
          primary_insurance_policy_number: patient.primary_insurance_policy_number || "",
          secondary_insurance_provider: patient.secondary_insurance_provider || "",
          secondary_insurance_policy_number: patient.secondary_insurance_policy_number || "",
          is_active: patient.is_active ?? true,
          is_deceased: patient.is_deceased ?? false,
          date_of_death: patient.date_of_death ? patient.date_of_death.split('T')[0] : ""
        });
      }
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to fetch patient details");
      navigate(`/patients/${patient_id}`);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Demographics validation
    if (!formData.first_name.trim()) {
      newErrors.first_name = "First name is required";
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = "Last name is required";
    }

    if (!formData.date_of_birth) {
      newErrors.date_of_birth = "Date of birth is required";
    }

    if (!formData.gender) {
      newErrors.gender = "Gender is required";
    }

    // Contact validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.primary_number.trim()) {
      newErrors.primary_number = "Primary contact number is required";
    }

    // Emergency contact validation
    if (formData.emergency_contact1_name && !formData.emergency_contact1_number) {
      newErrors.emergency_contact1_number = "Contact number is required for emergency contact 1";
    }

    if (formData.emergency_contact2_name && !formData.emergency_contact2_number) {
      newErrors.emergency_contact2_number = "Contact number is required for emergency contact 2";
    }

    // Deceased validation
    if (formData.is_deceased && !formData.date_of_death) {
      newErrors.date_of_death = "Date of death is required when marked as deceased";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix all errors before submitting");
      return;
    }

    try {
      setSubmitting(true);
      
      const updateData = {
        patient_id: parseInt(patient_id),
        ...formData
      };

      const { data } = await api.put(`/patients/update-patient`, updateData);

      if (data.status === "success") {
        toast.success("Patient updated successfully");
        navigate(`/patients/${patient_id}`);
      }
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to update patient");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(`/patients/${patient_id}`);
    
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading patient details...</p>
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
            <div className="patient-icon-large">🏥</div>
            <div>
              <h1>Edit Patient Record</h1>
              <p className="subtitle">Update patient demographics and information</p>
            </div>
          </div>
        </div>
        <div>
          <button
           onClick={() => navigate(`/patients/${patient_id}/edit-medicals`, { state: { patient_id } })} 
           className="btn-secondary"
          >
            Edit Medical Details
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="tabs-navigation">
        <button 
          className={`tab-btn ${activeTab === "demographics" ? "active" : ""}`}
          onClick={() => setActiveTab("demographics")}
        >
          👤 Demographics
        </button>
        <button 
          className={`tab-btn ${activeTab === "contact" ? "active" : ""}`}
          onClick={() => setActiveTab("contact")}
        >
          📞 Contact & Address
        </button>
        <button 
          className={`tab-btn ${activeTab === "emergency" ? "active" : ""}`}
          onClick={() => setActiveTab("emergency")}
        >
          🚨 Emergency Contacts
        </button>
        <button 
          className={`tab-btn ${activeTab === "insurance" ? "active" : ""}`}
          onClick={() => setActiveTab("insurance")}
        >
          💳 Insurance
        </button>
        <button 
          className={`tab-btn ${activeTab === "other" ? "active" : ""}`}
          onClick={() => setActiveTab("other")}
        >
          📋 Other Details
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="edit-form">
        {/* Demographics Tab */}
        {activeTab === "demographics" && (
          <div className="form-section">
            <h2 className="section-title">
              <span className="section-icon">👤</span>
              Demographics Information
            </h2>
            
            <div className="form-grid">
              <div className="form-field">
                <label className="form-label">
                  First Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className={`form-input ${errors.first_name ? 'error' : ''}`}
                  placeholder="Enter first name"
                />
                {errors.first_name && (
                  <span className="error-message">{errors.first_name}</span>
                )}
              </div>

              <div className="form-field">
                <label className="form-label">Middle Name</label>
                <input
                  type="text"
                  name="middle_name"
                  value={formData.middle_name}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter middle name (optional)"
                />
              </div>

              <div className="form-field">
                <label className="form-label">
                  Last Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className={`form-input ${errors.last_name ? 'error' : ''}`}
                  placeholder="Enter last name"
                />
                {errors.last_name && (
                  <span className="error-message">{errors.last_name}</span>
                )}
              </div>

              <div className="form-field">
                <label className="form-label">
                  Date of Birth <span className="required">*</span>
                </label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  className={`form-input ${errors.date_of_birth ? 'error' : ''}`}
                />
                {errors.date_of_birth && (
                  <span className="error-message">{errors.date_of_birth}</span>
                )}
              </div>

              <div className="form-field">
                <label className="form-label">
                  Gender <span className="required">*</span>
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className={`form-input ${errors.gender ? 'error' : ''}`}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                {errors.gender && (
                  <span className="error-message">{errors.gender}</span>
                )}
              </div>

              <div className="form-field">
                <label className="form-label">National ID</label>
                <input
                  type="text"
                  name="national_id"
                  value={formData.national_id}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter national ID"
                />
              </div>

              <div className="form-field">
                <label className="form-label">Country of Birth</label>
                <input
                  type="text"
                  name="country_of_birth"
                  value={formData.country_of_birth}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter country of birth"
                />
              </div>

              <div className="form-field">
                <label className="form-label">Country of Residence</label>
                <input
                  type="text"
                  name="country_of_residence"
                  value={formData.country_of_residence}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter country of residence"
                />
              </div>

              <div className="form-field">
                <label className="form-label">Blood Type</label>
                <select
                  name="blood_type"
                  value={formData.blood_type}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="">Select blood type</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              <div className="form-field">
                <label className="form-label">Marital Status</label>
                <select
                  name="marital_status"
                  value={formData.marital_status}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="">Select marital status</option>
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                  <option value="divorced">Divorced</option>
                  <option value="widowed">Widowed</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Contact & Address Tab */}
        {activeTab === "contact" && (
          <div className="form-section">
            <h2 className="section-title">
              <span className="section-icon">📞</span>
              Contact & Address Information
            </h2>
            
            <div className="form-grid">
              <div className="form-field">
                <label className="form-label">
                  Primary Phone <span className="required">*</span>
                </label>
                <input
                  type="tel"
                  name="primary_number"
                  value={formData.primary_number}
                  onChange={handleChange}
                  className={`form-input ${errors.primary_number ? 'error' : ''}`}
                  placeholder="+1-555-0123"
                />
                {errors.primary_number && (
                  <span className="error-message">{errors.primary_number}</span>
                )}
              </div>

              <div className="form-field">
                <label className="form-label">Secondary Phone</label>
                <input
                  type="tel"
                  name="secondary_number"
                  value={formData.secondary_number}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="+1-555-0124"
                />
              </div>

              <div className="form-field full-width">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`form-input ${errors.email ? 'error' : ''}`}
                  placeholder="patient@example.com"
                />
                {errors.email && (
                  <span className="error-message">{errors.email}</span>
                )}
              </div>

              <div className="form-field full-width">
                <label className="form-label">Full Address</label>
                <input
                  type="text"
                  name="address_line"
                  value={formData.address_line}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter complete address"
                />
              </div>
            </div>
          </div>
        )}

        {/* Emergency Contacts Tab */}
        {activeTab === "emergency" && (
          <div className="form-section">
            <h2 className="section-title">
              <span className="section-icon">🚨</span>
              Emergency Contacts
            </h2>
            
            <div className="emergency-section">
              <h3 className="subsection-title">Primary Emergency Contact</h3>
              <div className="form-grid">
                <div className="form-field">
                  <label className="form-label">Contact Name</label>
                  <input
                    type="text"
                    name="emergency_contact1_name"
                    value={formData.emergency_contact1_name}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Enter name"
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Contact Number</label>
                  <input
                    type="tel"
                    name="emergency_contact1_number"
                    value={formData.emergency_contact1_number}
                    onChange={handleChange}
                    className={`form-input ${errors.emergency_contact1_number ? 'error' : ''}`}
                    placeholder="+1-555-0125"
                  />
                  {errors.emergency_contact1_number && (
                    <span className="error-message">{errors.emergency_contact1_number}</span>
                  )}
                </div>

                <div className="form-field">
                  <label className="form-label">Relationship</label>
                  <input
                    type="text"
                    name="emergency_contact1_relationship"
                    value={formData.emergency_contact1_relationship}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="e.g., Spouse, Parent"
                  />
                </div>
              </div>
            </div>

            <div className="emergency-section">
              <h3 className="subsection-title">Secondary Emergency Contact</h3>
              <div className="form-grid">
                <div className="form-field">
                  <label className="form-label">Contact Name</label>
                  <input
                    type="text"
                    name="emergency_contact2_name"
                    value={formData.emergency_contact2_name}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Enter name"
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Contact Number</label>
                  <input
                    type="tel"
                    name="emergency_contact2_number"
                    value={formData.emergency_contact2_number}
                    onChange={handleChange}
                    className={`form-input ${errors.emergency_contact2_number ? 'error' : ''}`}
                    placeholder="+1-555-0126"
                  />
                  {errors.emergency_contact2_number && (
                    <span className="error-message">{errors.emergency_contact2_number}</span>
                  )}
                </div>

                <div className="form-field">
                  <label className="form-label">Relationship</label>
                  <input
                    type="text"
                    name="emergency_contact2_relationship"
                    value={formData.emergency_contact2_relationship}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="e.g., Sibling, Friend"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Insurance Tab */}
        {activeTab === "insurance" && (
          <div className="form-section">
            <h2 className="section-title">
              <span className="section-icon">💳</span>
              Insurance Information
            </h2>
            
            <div className="emergency-section">
              <h3 className="subsection-title">Primary Insurance</h3>
              <div className="form-grid">
                <div className="form-field">
                  <label className="form-label">Provider Name</label>
                  <input
                    type="text"
                    name="primary_insurance_provider"
                    value={formData.primary_insurance_provider}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Enter insurance provider"
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Policy Number</label>
                  <input
                    type="text"
                    name="primary_insurance_policy_number"
                    value={formData.primary_insurance_policy_number}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Enter policy number"
                  />
                </div>
              </div>
            </div>

            <div className="emergency-section">
              <h3 className="subsection-title">Secondary Insurance</h3>
              <div className="form-grid">
                <div className="form-field">
                  <label className="form-label">Provider Name</label>
                  <input
                    type="text"
                    name="secondary_insurance_provider"
                    value={formData.secondary_insurance_provider}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Enter insurance provider"
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Policy Number</label>
                  <input
                    type="text"
                    name="secondary_insurance_policy_number"
                    value={formData.secondary_insurance_policy_number}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Enter policy number"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Other Details Tab */}
        {activeTab === "other" && (
          <div className="form-section">
            <h2 className="section-title">
              <span className="section-icon">📋</span>
              Additional Details
            </h2>
            
            <div className="form-grid">
              <div className="form-field">
                <label className="form-label">Occupation</label>
                <input
                  type="text"
                  name="occupation"
                  value={formData.occupation}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter occupation"
                />
              </div>

              <div className="form-field">
                <label className="form-label">Ethnicity</label>
                <input
                  type="text"
                  name="ethnicity"
                  value={formData.ethnicity}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter ethnicity"
                />
              </div>

              <div className="form-field">
                <label className="form-label">Preferred Language</label>
                <input
                  type="text"
                  name="preffered_language"
                  value={formData.preffered_language}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter preferred language"
                />
              </div>

              <div className="form-field">
                <label className="form-label">Religion</label>
                <input
                  type="text"
                  name="religion"
                  value={formData.religion}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter religion"
                />
              </div>

              <div className="form-field full-width">
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="is_deceased"
                      checked={formData.is_deceased}
                      onChange={handleChange}
                      className="form-checkbox"
                    />
                    <span>Patient is Deceased</span>
                  </label>
                </div>
              </div>

              {formData.is_deceased && (
                <div className="form-field">
                  <label className="form-label">
                    Date of Death <span className="required">*</span>
                  </label>
                  <input
                    type="date"
                    name="date_of_death"
                    value={formData.date_of_death}
                    onChange={handleChange}
                    className={`form-input ${errors.date_of_death ? 'error' : ''}`}
                  />
                  {errors.date_of_death && (
                    <span className="error-message">{errors.date_of_death}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="form-actions">
          <div className="actions-left">
            <p className="required-note">
              <span className="required">*</span> Required fields
            </p>
          </div>
          <div className="actions-right">
            <button
              type="button"
              onClick={handleCancel}
              className="btn-cancel"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <div className="spinner-small"></div>
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <span>💾</span>
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditPatient;
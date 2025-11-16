import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../libs/apiCall.js";
import { toast } from "react-hot-toast";
import "./hospitals.css";

const EditHospital = () => {
  const { hospital_id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    hospital_name: "",
    hospital_type: "",
    hospital_license_number: "",
    address_line: "",
    city: "",
    state: "",
    country: "",
    zip_code: "",
    contact_number: "",
    email: "",
    accredition_status: ""
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchHospitalData();
  }, [hospital_id]);

  const fetchHospitalData = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/hospitals/hospitals/${hospital_id}`);
      
      if (data.status === "success") {
        const hospital = data.data.hospital;
        setFormData({
          hospital_name: hospital.hospital_name || "",
          hospital_type: hospital.hospital_type || "",
          hospital_license_number: hospital.hospital_license_number || "",
          address_line: hospital.address_line || "",
          city: hospital.city || "",
          state: hospital.state || "",
          country: hospital.country || "",
          zip_code: hospital.zip_code || "",
          contact_number: hospital.contact_number || "",
          email: hospital.email || "",
          accredition_status: hospital.accredition_status || "Not Accredited"
        });
      }
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to fetch hospital details");
      navigate(`/hospitals/${hospital_id}`);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.hospital_name.trim()) {
      newErrors.hospital_name = "Hospital name is required";
    }

    if (!formData.hospital_type) {
      newErrors.hospital_type = "Hospital type is required";
    }

    if (!formData.hospital_license_number.trim()) {
      newErrors.hospital_license_number = "License number is required";
    }

    if (!formData.address_line.trim()) {
      newErrors.address_line = "Address is required";
    }

    if (!formData.city.trim()) {
      newErrors.city = "City is required";
    }

    if (!formData.state.trim()) {
      newErrors.state = "State is required";
    }

    if (!formData.country.trim()) {
      newErrors.country = "Country is required";
    }

    if (!formData.zip_code.trim()) {
      newErrors.zip_code = "Zip code is required";
    }

    if (!formData.contact_number.trim()) {
      newErrors.contact_number = "Contact number is required";
    } else if (!/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/.test(formData.contact_number)) {
      newErrors.contact_number = "Invalid contact number format";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when user starts typing
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
        hospital_id: parseInt(hospital_id),
        ...formData
      };

      const { data } = await api.put(`/hospitals/update-hospital`, updateData);

      if (data.status === "success") {
        toast.success("Hospital updated successfully");
        navigate(`/hospitals/${hospital_id}`);
      }
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to update hospital");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm("Are you sure you want to cancel? Any unsaved changes will be lost.")) {
      navigate(`/hospitals/${hospital_id}`);
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

  return (
    <div className="edit-hospital-container">
      {/* Header */}
      <div className="edit-header">
        <button onClick={handleCancel} className="btn-back">
          ← Back
        </button>
        <div className="header-content">
          <div className="header-left">
            <div className="hospital-icon-large">🏥</div>
            <div>
              <h1>Edit Hospital</h1>
              <p className="subtitle">Update hospital information</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="edit-form">
        {/* Basic Information */}
        <div className="form-section">
          <h2 className="section-title">
            <span className="section-icon">📋</span>
            Basic Information
          </h2>
          
          <div className="form-grid">
            <div className="form-field full-width">
              <label className="form-label">
                Hospital Name <span className="required">*</span>
              </label>
              <input
                type="text"
                name="hospital_name"
                value={formData.hospital_name}
                onChange={handleChange}
                className={`form-input ${errors.hospital_name ? 'error' : ''}`}
                placeholder="Enter hospital name"
              />
              {errors.hospital_name && (
                <span className="error-message">{errors.hospital_name}</span>
              )}
            </div>

            <div className="form-field">
              <label className="form-label">
                Hospital Type <span className="required">*</span>
              </label>
              <select
                name="hospital_type"
                value={formData.hospital_type}
                onChange={handleChange}
                className={`form-input ${errors.hospital_type ? 'error' : ''}`}
              >
                <option value="">Select type</option>
                <option value="General">General</option>
                <option value="Specialty">Specialty</option>
                <option value="Clinic">Clinic</option>
                <option value="Teaching">Teaching</option>
                <option value="Research">Research</option>
              </select>
              {errors.hospital_type && (
                <span className="error-message">{errors.hospital_type}</span>
              )}
            </div>

            <div className="form-field">
              <label className="form-label">
                License Number <span className="required">*</span>
              </label>
              <input
                type="text"
                name="hospital_license_number"
                value={formData.hospital_license_number}
                onChange={handleChange}
                className={`form-input ${errors.hospital_license_number ? 'error' : ''}`}
                placeholder="Enter license number"
              />
              {errors.hospital_license_number && (
                <span className="error-message">{errors.hospital_license_number}</span>
              )}
            </div>

            <div className="form-field">
              <label className="form-label">Accreditation Status</label>
              <select
                name="accredition_status"
                value={formData.accredition_status}
                onChange={handleChange}
                className="form-input"
              >
                <option value="Not Accredited">Not Accredited</option>
                <option value="Accredited">Accredited</option>
                <option value="Provisionally Accredited">Provisionally Accredited</option>
                <option value="Accreditation Pending">Accreditation Pending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Location Information */}
        <div className="form-section">
          <h2 className="section-title">
            <span className="section-icon">📍</span>
            Location Information
          </h2>
          
          <div className="form-grid">
            <div className="form-field full-width">
              <label className="form-label">
                Address <span className="required">*</span>
              </label>
              <input
                type="text"
                name="address_line"
                value={formData.address_line}
                onChange={handleChange}
                className={`form-input ${errors.address_line ? 'error' : ''}`}
                placeholder="Enter street address"
              />
              {errors.address_line && (
                <span className="error-message">{errors.address_line}</span>
              )}
            </div>

            <div className="form-field">
              <label className="form-label">
                City <span className="required">*</span>
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className={`form-input ${errors.city ? 'error' : ''}`}
                placeholder="Enter city"
              />
              {errors.city && (
                <span className="error-message">{errors.city}</span>
              )}
            </div>

            <div className="form-field">
              <label className="form-label">
                State/Province <span className="required">*</span>
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className={`form-input ${errors.state ? 'error' : ''}`}
                placeholder="Enter state or province"
              />
              {errors.state && (
                <span className="error-message">{errors.state}</span>
              )}
            </div>

            <div className="form-field">
              <label className="form-label">
                Zip/Postal Code <span className="required">*</span>
              </label>
              <input
                type="text"
                name="zip_code"
                value={formData.zip_code}
                onChange={handleChange}
                className={`form-input ${errors.zip_code ? 'error' : ''}`}
                placeholder="Enter zip code"
              />
              {errors.zip_code && (
                <span className="error-message">{errors.zip_code}</span>
              )}
            </div>

            <div className="form-field">
              <label className="form-label">
                Country <span className="required">*</span>
              </label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                className={`form-input ${errors.country ? 'error' : ''}`}
                placeholder="Enter country"
              />
              {errors.country && (
                <span className="error-message">{errors.country}</span>
              )}
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="form-section">
          <h2 className="section-title">
            <span className="section-icon">📞</span>
            Contact Information
          </h2>
          
          <div className="form-grid">
            <div className="form-field">
              <label className="form-label">
                Contact Number <span className="required">*</span>
              </label>
              <input
                type="tel"
                name="contact_number"
                value={formData.contact_number}
                onChange={handleChange}
                className={`form-input ${errors.contact_number ? 'error' : ''}`}
                placeholder="+1-555-0123"
              />
              {errors.contact_number && (
                <span className="error-message">{errors.contact_number}</span>
              )}
            </div>

            <div className="form-field">
              <label className="form-label">
                Email Address <span className="required">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`form-input ${errors.email ? 'error' : ''}`}
                placeholder="hospital@example.com"
              />
              {errors.email && (
                <span className="error-message">{errors.email}</span>
              )}
            </div>
          </div>
        </div>

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
              className="btn-edit-cancel"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-edit-submit"
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
                  <span>Save</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditHospital;
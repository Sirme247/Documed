import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../libs/apiCall.js";
import { toast } from "react-hot-toast";
import "./users.css";

const EditUser = () => {
  const { user_id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isProvider, setIsProvider] = useState(false);
  const [formData, setFormData] = useState({
    // Basic Info
    first_name: "",
    middle_name: "",
    last_name: "",
    username: "",
    employee_id: "",
    email: "",
    contact_info: "",
    
    // Personal Info
    date_of_birth: "",
    gender: "",
    address_line: "",
    
    // Professional Info
    department: "",
    role_id: "",
    employment_status: "",
    account_status: "",
    
    // Provider Info (if applicable)
    license_number: "",
    license_expiry: "",
    specialization: ""
  });

  const [roles, setRoles] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchUserData();
    fetchRoles();
  }, [user_id]);

  const fetchRoles = async () => {
    try {
      const { data } = await api.get("/roles");
      if (data.status === "success") {
        setRoles(data.roles);
      }
    } catch (error) {
      console.error("Failed to fetch roles:", error);
    }
  };

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/users/user-details/${user_id}`);
      
      if (data.status === "success") {
        const user = data.data.user;
        const provider = data.data.provider;

        // Check if user is a healthcare provider (role_id 3 = Doctor, 4 = Nurse)
        const isHealthcareProvider = user.role_id === 3 || user.role_id === 4;
        setIsProvider(isHealthcareProvider);

        setFormData({
          first_name: user.first_name || "",
          middle_name: user.middle_name || "",
          last_name: user.last_name || "",
          username: user.username || "",
          employee_id: user.employee_id || "",
          email: user.email || "",
          contact_info: user.contact_info || "",
          date_of_birth: user.date_of_birth ? user.date_of_birth.split('T')[0] : "",
          gender: user.gender || "",
          address_line: user.address_line || "",
          department: user.department || "",
          role_id: user.role_id || "",
          employment_status: user.employment_status || "active",
          account_status: user.account_status || "active",
          license_number: provider?.license_number || "",
          license_expiry: provider?.license_expiry ? provider.license_expiry.split('T')[0] : "",
          specialization: provider?.specialization || ""
        });
      }
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to fetch user details");
      navigate("/users/list");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Basic validation
    if (!formData.first_name.trim()) {
      newErrors.first_name = "First name is required";
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = "Last name is required";
    }

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    }

    if (!formData.employee_id.trim()) {
      newErrors.employee_id = "Employee ID is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.gender) {
      newErrors.gender = "Gender is required";
    }

    if (!formData.role_id) {
      newErrors.role_id = "Role is required";
    }

    // Provider-specific validation
    if (isProvider || formData.role_id === 3 || formData.role_id === 4) {
      if (!formData.license_number.trim()) {
        newErrors.license_number = "License number is required for healthcare providers";
      }
      if (!formData.specialization.trim()) {
        newErrors.specialization = "Specialization is required for healthcare providers";
      }
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
    
    // Update provider status if role changes
    if (name === "role_id") {
      const roleId = parseInt(value);
      setIsProvider(roleId === 3 || roleId === 4);
    }
    
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
        user_id: parseInt(user_id),
        ...formData,
        role_id: parseInt(formData.role_id)
      };

      const { data } = await api.put(`/users/admin-update-user`, updateData);

      if (data.status === "success") {
        toast.success("User updated successfully");
        navigate(`/users/${user_id}`);
      }
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to update user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm("Are you sure you want to cancel? Any unsaved changes will be lost.")) {
      navigate(`/users/${user_id}`);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading user details...</p>
      </div>
    );
  }

  return (
    <div className="edit-user-container">
      {/* Header */}
      <div className="edit-header">
        <button onClick={handleCancel} className="btn-back">
          ← Back
        </button>
        <div className="header-content">
          <div className="header-left">
            <div className="user-icon-large">👤</div>
            <div>
              <h1>Edit User Profile</h1>
              <p className="subtitle">Update user information and credentials</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="edit-form">
        {/* Basic Information */}
        <div className="form-section">
          <h2 className="section-title">
            <span className="section-icon">👤</span>
            Basic Information
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
                Username <span className="required">*</span>
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={`form-input ${errors.username ? 'error' : ''}`}
                placeholder="Enter username"
              />
              {errors.username && (
                <span className="error-message">{errors.username}</span>
              )}
            </div>

            <div className="form-field">
              <label className="form-label">
                Employee ID <span className="required">*</span>
              </label>
              <input
                type="text"
                name="employee_id"
                value={formData.employee_id}
                onChange={handleChange}
                className={`form-input ${errors.employee_id ? 'error' : ''}`}
                placeholder="Enter employee ID"
              />
              {errors.employee_id && (
                <span className="error-message">{errors.employee_id}</span>
              )}
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="form-section">
          <h2 className="section-title">
            <span className="section-icon">📋</span>
            Personal Information
          </h2>
          
          <div className="form-grid">
            <div className="form-field">
              <label className="form-label">Date of Birth</label>
              <input
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleChange}
                className="form-input"
              />
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

            <div className="form-field full-width">
              <label className="form-label">Address</label>
              <input
                type="text"
                name="address_line"
                value={formData.address_line}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter full address"
              />
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
                Email Address <span className="required">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`form-input ${errors.email ? 'error' : ''}`}
                placeholder="user@example.com"
              />
              {errors.email && (
                <span className="error-message">{errors.email}</span>
              )}
            </div>

            <div className="form-field">
              <label className="form-label">Contact Number</label>
              <input
                type="tel"
                name="contact_info"
                value={formData.contact_info}
                onChange={handleChange}
                className="form-input"
                placeholder="+1-555-0123"
              />
            </div>
          </div>
        </div>

        {/* Professional Information */}
        <div className="form-section">
          <h2 className="section-title">
            <span className="section-icon">💼</span>
            Professional Information
          </h2>
          
          <div className="form-grid">
            <div className="form-field">
              <label className="form-label">
                Role <span className="required">*</span>
              </label>
              <select
                name="role_id"
                value={formData.role_id}
                onChange={handleChange}
                className={`form-input ${errors.role_id ? 'error' : ''}`}
              >
                <option value="">Select role</option>
                {roles.map(role => (
                  <option key={role.role_id} value={role.role_id}>
                    {role.role_name}
                  </option>
                ))}
              </select>
              {errors.role_id && (
                <span className="error-message">{errors.role_id}</span>
              )}
            </div>

            <div className="form-field">
              <label className="form-label">Department</label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., Cardiology, Emergency"
              />
            </div>

            <div className="form-field">
              <label className="form-label">Employment Status</label>
              <select
                name="employment_status"
                value={formData.employment_status}
                onChange={handleChange}
                className="form-input"
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="fired">Fired</option>
              </select>
            </div>

            <div className="form-field">
              <label className="form-label">Account Status</label>
              <select
                name="account_status"
                value={formData.account_status}
                onChange={handleChange}
                className="form-input"
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="locked">Locked</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        </div>

        {/* Healthcare Provider Information (conditional) */}
        {(isProvider || formData.role_id === 3 || formData.role_id === 4) && (
          <div className="form-section provider-section">
            <h2 className="section-title">
              <span className="section-icon">⚕️</span>
              Healthcare Provider Information
            </h2>
            
            <div className="form-grid">
              <div className="form-field">
                <label className="form-label">
                  License Number <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="license_number"
                  value={formData.license_number}
                  onChange={handleChange}
                  className={`form-input ${errors.license_number ? 'error' : ''}`}
                  placeholder="Enter license number"
                />
                {errors.license_number && (
                  <span className="error-message">{errors.license_number}</span>
                )}
              </div>

              <div className="form-field">
                <label className="form-label">License Expiry Date</label>
                <input
                  type="date"
                  name="license_expiry"
                  value={formData.license_expiry}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div className="form-field full-width">
                <label className="form-label">
                  Specialization <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                  className={`form-input ${errors.specialization ? 'error' : ''}`}
                  placeholder="e.g., Cardiology, General Surgery"
                />
                {errors.specialization && (
                  <span className="error-message">{errors.specialization}</span>
                )}
              </div>
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
              className="btn-user-edit-cancel"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-user-edit-submit"
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

export default EditUser;
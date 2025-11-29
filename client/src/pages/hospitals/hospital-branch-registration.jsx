import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import "./hospitals.css";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import api from "../../libs/apiCall.js";
import { toast } from "react-hot-toast";

const HospitalBranchRegistrationSchema = z.object({
  hospital_id: z.string().min(1, "Hospital ID is required"),
  branch_name: z.string().min(3, "Branch name must be at least 3 characters"),
  branch_type: z.string().min(1, "Please select branch type"),
  branch_license_number: z.string().min(1, "License number is required"),
  address_line: z.string().min(5, "Address must be at least 5 characters"),
  city: z.string().min(2, "City is required"),
  state: z.string().optional(),
  country: z.string().min(2, "Country is required"),
  zip_code: z.string().min(1, "Zip/Postal code is required"),
  contact_number: z.string().min(10, "Valid contact number is required"),
  email: z.string().email("Invalid email format"),
  accredition_status: z.string().min(1, "Please select accreditation status"),
});

const HospitalBranchRegistration = () => {
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get hospital_id and hospital_name from navigation state
  const { hospital_id, hospital_name } = location.state || {};

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    resolver: zodResolver(HospitalBranchRegistrationSchema),
    mode: "onBlur",
    defaultValues: {
      hospital_id: hospital_id ? String(hospital_id) : "",
      country: "Kenya"
    }
  });

  // Set hospital_id when component mounts or location state changes
  useEffect(() => {
    if (hospital_id) {
      setValue("hospital_id", String(hospital_id));
    }
  }, [hospital_id, setValue]);

  const onSubmit = async (data) => {
    console.log("Form data being sent:", data);

    try {
      setLoading(true);

      // Convert hospital_id to number
      const formattedData = {
        ...data,
        hospital_id: parseInt(data.hospital_id)
      };

      const { data: res } = await api.post("/hospitals/register-hospital-branch", formattedData);

      toast.success(res.message || "Hospital branch registered successfully!");
     
      navigate(`/hospitals/${hospital_id}`,  );
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hospital-registration">
      <h2>Register Hospital Branch</h2>
      {hospital_name && (
        <p style={{ color: '#6b7280', marginBottom: '20px', fontSize: '14px' }}>
          Registering branch for: <strong>{hospital_name}</strong>
        </p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="form">
        {/* Parent Hospital */}
        {/* <div className="form-section">
          <h3>Parent Hospital</h3>

          <div className="form-group">
            <label>Hospital ID *</label>
            <input 
              type="number" 
              {...register("hospital_id")} 
              placeholder="Enter parent hospital ID"
              disabled={!!hospital_id}
              style={hospital_id ? { backgroundColor: '#f3f4f6', cursor: 'not-allowed' } : {}}
            />
            {errors.hospital_id && (
              <div className="error-message">{errors.hospital_id.message}</div>
            )}
            <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
              {hospital_id 
                ? 'Auto-filled from parent hospital' 
                : 'The ID of the main hospital this branch belongs to'}
            </small>
          </div>
        </div> */}

        {/* Branch Information */}
        <div className="form-section">
          <h3>Branch Information</h3>

          <div className="form-group">
            <label>Branch Name *</label>
            <input {...register("branch_name")} placeholder="e.g., Westlands Branch, Karen Clinic" />
            {errors.branch_name && (
              <div className="error-message">{errors.branch_name.message}</div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Branch Type *</label>
              <select {...register("branch_type")}>
                <option value="">-- Select Type --</option>
                <option value="Main Branch">Main Branch</option>
                <option value="Satellite Clinic">Satellite Clinic</option>
                <option value="Outpatient Center">Outpatient Center</option>
                <option value="Diagnostic Center">Diagnostic Center</option>
                <option value="Specialized Unit">Specialized Unit</option>
                <option value="Emergency Center">Emergency Center</option>
              </select>
              {errors.branch_type && (
                <div className="error-message">{errors.branch_type.message}</div>
              )}
            </div>

            <div className="form-group">
              <label>License Number *</label>
              <input {...register("branch_license_number")} placeholder="Branch license number" />
              {errors.branch_license_number && (
                <div className="error-message">{errors.branch_license_number.message}</div>
              )}
            </div>

            <div className="form-group">
              <label>Accreditation Status *</label>
              <select {...register("accredition_status")}>
                <option value="">-- Select Status --</option>
                <option value="Accredited">Accredited</option>
                <option value="Pending">Pending</option>
                <option value="Provisional">Provisional</option>
                <option value="Not Accredited">Not Accredited</option>
              </select>
              {errors.accredition_status && (
                <div className="error-message">{errors.accredition_status.message}</div>
              )}
            </div>
          </div>
        </div>

        {/* Location Information */}
        <div className="form-section">
          <h3>Location</h3>

          <div className="form-group">
            <label>Address *</label>
            <input {...register("address_line")} placeholder="Street address" />
            {errors.address_line && (
              <div className="error-message">{errors.address_line.message}</div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>City *</label>
              <input {...register("city")} placeholder="City" />
              {errors.city && (
                <div className="error-message">{errors.city.message}</div>
              )}
            </div>

            <div className="form-group">
              <label>State/Province</label>
              <input {...register("state")} placeholder="State or Province" />
            </div>

            <div className="form-group">
              <label>Country *</label>
              <input {...register("country")} placeholder="Country" />
              {errors.country && (
                <div className="error-message">{errors.country.message}</div>
              )}
            </div>

            <div className="form-group">
              <label>Zip/Postal Code *</label>
              <input {...register("zip_code")} placeholder="Postal code" />
              {errors.zip_code && (
                <div className="error-message">{errors.zip_code.message}</div>
              )}
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="form-section">
          <h3>Contact Information</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Contact Number *</label>
              <input {...register("contact_number")} placeholder="+254712345678" />
              {errors.contact_number && (
                <div className="error-message">{errors.contact_number.message}</div>
              )}
            </div>

            <div className="form-group">
              <label>Email *</label>
              <input type="email" {...register("email")} placeholder="branch@example.com" />
              {errors.email && (
                <div className="error-message">{errors.email.message}</div>
              )}
            </div>
          </div>
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? "Registering Branch..." : "Register Branch"}
        </button>
      </form>
    </div>
  );
};

export default HospitalBranchRegistration;
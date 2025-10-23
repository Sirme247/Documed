import React, { useState } from "react";
import "./hospitals.css";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import api from "../../libs/apiCall.js";
import { toast } from "react-hot-toast";

const HospitalRegistrationSchema = z.object({
  hospital_name: z.string().min(3, "Hospital name must be at least 3 characters"),
  hospital_type: z.string().min(1, "Please select hospital type"),
  hospital_license_number: z.string().min(1, "License number is required"),
  address_line: z.string().min(5, "Address must be at least 5 characters"),
  city: z.string().min(2, "City is required"),
  state: z.string().optional(),
  country: z.string().min(2, "Country is required"),
  zip_code: z.string().min(1, "Zip/Postal code is required"),
  contact_number: z.string().min(10, "Valid contact number is required"),
  email: z.string().email("Invalid email format"),
  accredition_status: z.string().min(1, "Please select accreditation status"),
});

const HospitalRegistration = () => {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(HospitalRegistrationSchema),
    mode: "onBlur"
  });

  const onSubmit = async (data) => {
    console.log("Form data being sent:", data);

    try {
      setLoading(true);

      const { data: res } = await api.post("/hospitals/register-hospital", data);

      toast.success(res.message || "Hospital registered successfully!");
      reset();
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hospital-registration">
      <h2>Register New Hospital</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="form">
        {/* Hospital Information */}
        <div className="form-section">
          <h3>Hospital Information</h3>

          <div className="form-group">
            <label>Hospital Name *</label>
            <input {...register("hospital_name")} placeholder="Enter hospital name" />
            {errors.hospital_name && (
              <div className="error-message">{errors.hospital_name.message}</div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Hospital Type *</label>
              <select {...register("hospital_type")}>
                <option value="">-- Select Type --</option>
                <option value="Public">Public</option>
                <option value="Private">Private</option>
                <option value="Non-Profit">Non-Profit</option>
                <option value="Teaching">Teaching</option>
                <option value="Specialty">Specialty</option>
                <option value="Community">Community</option>
              </select>
              {errors.hospital_type && (
                <div className="error-message">{errors.hospital_type.message}</div>
              )}
            </div>

            <div className="form-group">
              <label>License Number *</label>
              <input {...register("hospital_license_number")} placeholder="Hospital license number" />
              {errors.hospital_license_number && (
                <div className="error-message">{errors.hospital_license_number.message}</div>
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
              <input {...register("country")} placeholder="Country" defaultValue="Kenya" />
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
              <input type="email" {...register("email")} placeholder="hospital@example.com" />
              {errors.email && (
                <div className="error-message">{errors.email.message}</div>
              )}
            </div>
          </div>
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? "Registering Hospital..." : "Register Hospital"}
        </button>
      </form>
    </div>
  );
};

export default HospitalRegistration;
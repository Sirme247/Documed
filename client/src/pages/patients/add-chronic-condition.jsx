import React, { useState } from "react";
import "./patients.css";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import api from "../../libs/apiCall.js";
import { toast } from "react-hot-toast";

const ChronicConditionSchema = z.object({
  patient_id: z.string().min(1, "Patient ID is required"),
  condition_name: z.string().min(1, "Condition name is required"),
  current_status: z.string().min(1, "Current status is required"),
  icd_codes_version: z.string().optional(),
  icd_code: z.string().optional(),
  diagnosed_date: z.string().optional(),
  condition_severity: z.string().optional(),
  management_plan: z.string().optional(),
  condition_notes: z.string().optional(),
  is_active: z.boolean().optional(),
});

const AddChronicCondition = () => {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(ChronicConditionSchema),
    mode: "onBlur",
    defaultValues: {
      condition_severity: "Not Specified",
      is_active: true
    }
  });

  const onSubmit = async (data) => {
    console.log("Form data being sent:", data);

    try {
      setLoading(true);

      const formattedData = {
        ...data,
        patient_id: parseInt(data.patient_id),
      };

      const { data: res } = await api.post("/patients/add-chronic-condition", formattedData);

      toast.success(res.message || "Chronic condition recorded successfully!");
      reset();
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="patient-record-form">
      <h2>Add Chronic Condition</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="form">
        <div className="form-section">
          <h3>Patient Information</h3>
          
          <div className="form-group">
            <label>Patient ID *</label>
            <input type="number" {...register("patient_id")} />
            {errors.patient_id && (
              <div className="error-message">{errors.patient_id.message}</div>
            )}
          </div>
        </div>

        <div className="form-section">
          <h3>Condition Details</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Condition Name *</label>
              <input {...register("condition_name")} placeholder="e.g., Type 2 Diabetes" />
              {errors.condition_name && (
                <div className="error-message">{errors.condition_name.message}</div>
              )}
            </div>

            <div className="form-group">
              <label>Current Status *</label>
              <select {...register("current_status")}>
                <option value="">-- Select Status --</option>
                <option value="Active">Active</option>
                <option value="Controlled">Controlled</option>
                <option value="In Remission">In Remission</option>
                <option value="Resolved">Resolved</option>
                <option value="Worsening">Worsening</option>
              </select>
              {errors.current_status && (
                <div className="error-message">{errors.current_status.message}</div>
              )}
            </div>

            <div className="form-group">
              <label>Severity</label>
              <select {...register("condition_severity")}>
                <option value="Not Specified">Not Specified</option>
                <option value="Mild">Mild</option>
                <option value="Moderate">Moderate</option>
                <option value="Severe">Severe</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>ICD Code Version</label>
              <input {...register("icd_codes_version")} placeholder="e.g., ICD-10" />
            </div>

            <div className="form-group">
              <label>ICD Code</label>
              <input {...register("icd_code")} placeholder="e.g., E11.9" />
            </div>

            <div className="form-group">
              <label>Diagnosed Date</label>
              <input type="date" {...register("diagnosed_date")} />
            </div>
          </div>

          <div className="form-group">
            <label>Management Plan</label>
            <textarea {...register("management_plan")} rows="3" placeholder="Treatment and management strategy" />
          </div>

          <div className="form-group">
            <label>Additional Notes</label>
            <textarea {...register("condition_notes")} rows="3" placeholder="Additional notes about this condition" />
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" {...register("is_active")} style={{ width: 'auto' }} />
              Condition is currently active
            </label>
          </div>
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? "Adding..." : "Add Chronic Condition"}
        </button>
      </form>
    </div>
  );
};

export default AddChronicCondition;
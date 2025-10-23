import React, { useState } from "react";
import "./patients.css";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import api from "../../libs/apiCall.js";
import { toast } from "react-hot-toast";

const SocialHistorySchema = z.object({
  patient_id: z.string().min(1, "Patient ID is required"),
  smoking_status: z.string().optional(),
  alcohol_use: z.string().optional(),
  drug_use: z.string().optional(),
  physical_activity: z.string().optional(),
  diet_description: z.string().optional(),
  living_situation: z.string().optional(),
  support_system: z.string().optional(),
}).refine(
  (data) => {
    return data.smoking_status || data.alcohol_use || data.drug_use || 
           data.physical_activity || data.living_situation || data.support_system;
  },
  {
    message: "At least one field must be filled",
    path: ["smoking_status"]
  }
);

const AddSocialHistory = () => {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(SocialHistorySchema),
    mode: "onBlur"
  });

  const onSubmit = async (data) => {
    console.log("Form data being sent:", data);

    try {
      setLoading(true);

      const formattedData = {
        ...data,
        patient_id: parseInt(data.patient_id),
      };

      const { data: res } = await api.post("/patients/add-social-history", formattedData);

      toast.success(res.message || "Social history recorded successfully!");
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
      <h2>Add Social History</h2>

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
          <h3>Lifestyle Information</h3>
          <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>
            At least one field must be filled out
          </p>

          <div className="form-row">
            <div className="form-group">
              <label>Smoking Status</label>
              <select {...register("smoking_status")}>
                <option value="">-- Select Status --</option>
                <option value="Never">Never</option>
                <option value="Former">Former Smoker</option>
                <option value="Current">Current Smoker</option>
              </select>
              {errors.smoking_status && (
                <div className="error-message">{errors.smoking_status.message}</div>
              )}
            </div>

            <div className="form-group">
              <label>Alcohol Use</label>
              <select {...register("alcohol_use")}>
                <option value="">-- Select Status --</option>
                <option value="None">None</option>
                <option value="Occasional">Occasional</option>
                <option value="Moderate">Moderate</option>
                <option value="Heavy">Heavy</option>
                <option value="Former">Former</option>
              </select>
            </div>

            <div className="form-group">
              <label>Drug Use</label>
              <select {...register("drug_use")}>
                <option value="">-- Select Status --</option>
                <option value="None">None</option>
                <option value="Former">Former</option>
                <option value="Current">Current</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Physical Activity</label>
              <input {...register("physical_activity")} placeholder="e.g., 3x per week, Sedentary" />
            </div>

            <div className="form-group">
              <label>Living Situation</label>
              <input {...register("living_situation")} placeholder="e.g., Lives alone, With family" />
            </div>
          </div>

          <div className="form-group">
            <label>Diet Description</label>
            <textarea {...register("diet_description")} rows="3" placeholder="Describe dietary habits and restrictions" />
          </div>

          <div className="form-group">
            <label>Support System</label>
            <textarea {...register("support_system")} rows="3" placeholder="Family, friends, community support available" />
          </div>
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? "Adding..." : "Add Social History"}
        </button>
      </form>
    </div>
  );
};

export default AddSocialHistory;
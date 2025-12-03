import React, { useState,useEffect } from "react";
import "./visits.css";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import {useLocation, useNavigate} from 'react-router-dom';
import api from "../../libs/apiCall.js";
import { toast } from "react-hot-toast";

const DiagnosisSchema = z.object({
  visit_id: z.string().min(1, "Visit ID is required"),
  diagnosis_name: z.string().min(1, "Diagnosis name is required"),
  diagnosis_type: z.string().optional(),
  icd_codes_version: z.string().optional(),
  icd_code: z.string().optional(),
  is_chronic: z.boolean().optional(),
  diagnosis_description: z.string().optional(),
  severity: z.string().optional(),
});

const RecordDiagnosis = () => {
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(DiagnosisSchema),
    mode: "onBlur",
    defaultValues: {
      diagnosis_type: "General",
      severity: "Not Specified",
      is_chronic: false
    }
  });

  const onSubmit = async (data) => {
    console.log("Form data being sent:", data);

    try {
      setLoading(true);

      const formattedData = {
        ...data,
        visit_id: parseInt(data.visit_id),
      };

      const { data: res } = await api.post("/visits/record-diagnosis", formattedData);

      toast.success(res.message || "Diagnosis recorded successfully!");

      if (data.visit_id) {
        navigate(`/visits/details/${data.visit_id}`);
      } else {
      reset();
    }
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="medical-record-form">
      <h2>Record Diagnosis</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="form">
        {/* <div className="form-section">
          <h3>Visit Information</h3>
          
          <div className="form-group">
            <label>Visit ID *</label>
            <input type="number" {...register("visit_id")} />
            {errors.visit_id && (
              <div className="error-message">{errors.visit_id.message}</div>
            )}
          </div>
        </div> */}

        <div className="form-section">
          <h3>Diagnosis Details</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Diagnosis Name *</label>
              <input {...register("diagnosis_name")} placeholder="e.g., Type 2 Diabetes" />
              {errors.diagnosis_name && (
                <div className="error-message">{errors.diagnosis_name.message}</div>
              )}
            </div>

            <div className="form-group">
              <label>Diagnosis Type</label>
              <select {...register("diagnosis_type")}>
                <option value="General">General</option>
                <option value="Primary">Primary</option>
                <option value="Secondary">Secondary</option>
                <option value="Differential">Differential</option>
                <option value="Provisional">Provisional</option>
              </select>
            </div>

            <div className="form-group">
              <label>Severity</label>
              <select {...register("severity")}>
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
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea {...register("diagnosis_description")} rows="4" placeholder="Detailed diagnosis description" />
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" {...register("is_chronic")} style={{ width: 'auto' }} />
              This is a chronic condition
            </label>
          </div>
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? "Recording..." : "Record Diagnosis"}
        </button>
      </form>
    </div>
  );
};

export default RecordDiagnosis;
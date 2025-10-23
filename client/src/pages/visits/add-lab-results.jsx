import React, { useState } from "react";
import "./visits.css";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import api from "../../libs/apiCall.js";
import { toast } from "react-hot-toast";

const LabTestSchema = z.object({
  visit_id: z.string().min(1, "Visit ID is required"),
  test_name: z.string().min(1, "Test name is required"),
  priority: z.string().optional(),
  test_code: z.string().optional(),
  pdf_url: z.string().optional(),
  findings: z.string().optional(),
  recommendations: z.string().optional(),
  lab_notes: z.string().optional(),
});

const RecordLabTest = () => {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(LabTestSchema),
    mode: "onBlur",
    defaultValues: {
      priority: "normal"
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

      const { data: res } = await api.post("/visits/record-lab-tests", formattedData);

      toast.success(res.message || "Lab test recorded successfully!");
      reset();
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="medical-record-form">
      <h2>Record Lab Test</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="form">
        <div className="form-section">
          <h3>Visit Information</h3>
          
          <div className="form-group">
            <label>Visit ID *</label>
            <input type="number" {...register("visit_id")} />
            {errors.visit_id && (
              <div className="error-message">{errors.visit_id.message}</div>
            )}
          </div>
        </div>

        <div className="form-section">
          <h3>Test Details</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Test Name *</label>
              <input {...register("test_name")} placeholder="e.g., Complete Blood Count" />
              {errors.test_name && (
                <div className="error-message">{errors.test_name.message}</div>
              )}
            </div>

            <div className="form-group">
              <label>Test Code</label>
              <input {...register("test_code")} placeholder="e.g., CBC-001" />
            </div>

            <div className="form-group">
              <label>Priority</label>
              <select {...register("priority")}>
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
                <option value="stat">STAT</option>
                <option value="routine">Routine</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>PDF URL</label>
            <input type="url" {...register("pdf_url")} placeholder="https://..." />
            <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px' }}>
              Link to the full lab report PDF
            </small>
          </div>

          <div className="form-group">
            <label>Findings</label>
            <textarea {...register("findings")} rows="4" placeholder="Lab test findings and results" />
          </div>

          <div className="form-group">
            <label>Recommendations</label>
            <textarea {...register("recommendations")} rows="3" placeholder="Follow-up recommendations based on results" />
          </div>

          <div className="form-group">
            <label>Lab Notes</label>
            <textarea {...register("lab_notes")} rows="2" placeholder="Additional notes" />
          </div>
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? "Recording..." : "Record Lab Test"}
        </button>
      </form>
    </div>
  );
};

export default RecordLabTest;
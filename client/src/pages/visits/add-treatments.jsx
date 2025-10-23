import React, { useState } from "react";
import "./visits.css";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import api from "../../libs/apiCall.js";
import { toast } from "react-hot-toast";

const TreatmentSchema = z.object({
  visit_id: z.string().min(1, "Visit ID is required"),
  treatment_name: z.string().min(1, "Treatment name is required"),
  treatment_type: z.string().optional(),
  procedure_code: z.string().optional(),
  treatment_description: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  outcome: z.string().optional(),
  complications: z.string().optional(),
  follow_up_required: z.boolean().optional(),
  treatment_notes: z.string().optional(),
});

const RecordTreatment = () => {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(TreatmentSchema),
    mode: "onBlur",
    defaultValues: {
      outcome: "Ongoing",
      follow_up_required: false
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

      const { data: res } = await api.post("/visits/record-treatment", formattedData);

      toast.success(res.message || "Treatment recorded successfully!");
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
      <h2>Record Treatment</h2>

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
          <h3>Treatment Details</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Treatment Name *</label>
              <input {...register("treatment_name")} placeholder="e.g., Physical Therapy" />
              {errors.treatment_name && (
                <div className="error-message">{errors.treatment_name.message}</div>
              )}
            </div>

            <div className="form-group">
              <label>Treatment Type</label>
              <select {...register("treatment_type")}>
                <option value="">-- Select Type --</option>
                <option value="Medication">Medication</option>
                <option value="Surgery">Surgery</option>
                <option value="Therapy">Therapy</option>
                <option value="Procedure">Procedure</option>
                <option value="Counseling">Counseling</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Procedure Code</label>
              <input {...register("procedure_code")} placeholder="CPT/HCPCS code" />
            </div>
          </div>

          <div className="form-group">
            <label>Treatment Description</label>
            <textarea {...register("treatment_description")} rows="3" placeholder="Detailed treatment description" />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Start Date</label>
              <input type="date" {...register("start_date")} />
            </div>

            <div className="form-group">
              <label>End Date</label>
              <input type="date" {...register("end_date")} />
            </div>

            <div className="form-group">
              <label>Outcome</label>
              <select {...register("outcome")}>
                <option value="Ongoing">Ongoing</option>
                <option value="Improved">Improved</option>
                <option value="Resolved">Resolved</option>
                <option value="No Change">No Change</option>
                <option value="Worsened">Worsened</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Complications</label>
            <textarea {...register("complications")} rows="2" placeholder="Any complications or adverse effects" />
          </div>

          <div className="form-group">
            <label>Additional Notes</label>
            <textarea {...register("treatment_notes")} rows="3" />
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" {...register("follow_up_required")} style={{ width: 'auto' }} />
              Follow-up required
            </label>
          </div>
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? "Recording..." : "Record Treatment"}
        </button>
      </form>
    </div>
  );
};

export default RecordTreatment;
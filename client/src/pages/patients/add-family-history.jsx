import React, { useState } from "react";
import "./patients.css";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import api from "../../libs/apiCall.js";
import { toast } from "react-hot-toast";

const FamilyHistorySchema = z.object({
  patient_id: z.string().min(1, "Patient ID is required"),
  relative_condition_name: z.string().min(1, "Relative condition name is required"),
  relative_name: z.string().optional(),
  relationship: z.string().optional(),
  relative_patient_id: z.string().optional(),
  age_of_onset: z.string().optional(),
  family_history_notes: z.string().optional(),
});

const AddFamilyHistory = () => {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(FamilyHistorySchema),
    mode: "onBlur"
  });

  const onSubmit = async (data) => {
    console.log("Form data being sent:", data);

    try {
      setLoading(true);

      const formattedData = {
        ...data,
        patient_id: parseInt(data.patient_id),
        relative_patient_id: data.relative_patient_id ? parseInt(data.relative_patient_id) : undefined,
      };

      const { data: res } = await api.post("/patients/add-family-history", formattedData);

      toast.success(res.message || "Family history recorded successfully!");
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
      <h2>Add Family History</h2>

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
          <h3>Relative Information</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Relative Name</label>
              <input {...register("relative_name")} placeholder="e.g., John Doe" />
            </div>

            <div className="form-group">
              <label>Relationship</label>
              <input {...register("relationship")} placeholder="e.g., Father, Sister, Grandfather" />
            </div>

            <div className="form-group">
              <label>Relative Patient ID</label>
              <input type="number" {...register("relative_patient_id")} placeholder="If they are also a patient" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Condition Name *</label>
              <input {...register("relative_condition_name")} placeholder="e.g., Heart Disease, Diabetes" />
              {errors.relative_condition_name && (
                <div className="error-message">{errors.relative_condition_name.message}</div>
              )}
            </div>

            <div className="form-group">
              <label>Age of Onset</label>
              <input {...register("age_of_onset")} placeholder="e.g., 45 years, Early 50s" />
            </div>
          </div>

          <div className="form-group">
            <label>Additional Notes</label>
            <textarea {...register("family_history_notes")} rows="4" placeholder="Additional family history information" />
          </div>
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? "Adding..." : "Add Family History"}
        </button>
      </form>
    </div>
  );
};

export default AddFamilyHistory;
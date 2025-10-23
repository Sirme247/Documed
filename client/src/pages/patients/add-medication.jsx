import React, { useState } from "react";
import "./patients.css";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import api from "../../libs/apiCall.js";
import { toast } from "react-hot-toast";

const MedicationSchema = z.object({
  patient_id: z.string().min(1, "Patient ID is required"),
  medication_name: z.string().min(1, "Medication name is required"),
  dosage: z.string().optional(),
  frequency: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  medication_is_active: z.boolean().optional(),
  hospital_where_prescribed: z.string().optional(),
  medication_notes: z.string().optional(),
});

const AddMedication = () => {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(MedicationSchema),
    mode: "onBlur",
    defaultValues: {
      medication_is_active: true
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

      const { data: res } = await api.post("/patients/add-medication", formattedData);

      toast.success(res.message || "Medication recorded successfully!");
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
      <h2>Add Patient Medication</h2>

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
          <h3>Medication Details</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Medication Name *</label>
              <input {...register("medication_name")} placeholder="e.g., Metformin" />
              {errors.medication_name && (
                <div className="error-message">{errors.medication_name.message}</div>
              )}
            </div>

            <div className="form-group">
              <label>Dosage</label>
              <input {...register("dosage")} placeholder="e.g., 500mg" />
            </div>

            <div className="form-group">
              <label>Frequency</label>
              <input {...register("frequency")} placeholder="e.g., Twice daily" />
            </div>
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
              <label>Hospital Prescribed</label>
              <input {...register("hospital_where_prescribed")} placeholder="Hospital name" />
            </div>
          </div>

          <div className="form-group">
            <label>Medication Notes</label>
            <textarea {...register("medication_notes")} rows="3" placeholder="Additional notes about this medication" />
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" {...register("medication_is_active")} style={{ width: 'auto' }} />
              Currently active medication
            </label>
          </div>
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? "Adding..." : "Add Medication"}
        </button>
      </form>
    </div>
  );
};

export default AddMedication;
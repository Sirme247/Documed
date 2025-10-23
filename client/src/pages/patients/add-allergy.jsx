import React, { useState } from "react";
import "./patients.css";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import api from "../../libs/apiCall.js";
import { toast } from "react-hot-toast";

const AllergySchema = z.object({
  patient_id: z.string().min(1, "Patient ID is required"),
  allergen: z.string().min(1, "Allergen is required"),
  reaction: z.string().min(1, "Reaction is required"),
  allergy_severity: z.string().optional(),
  verified: z.boolean().optional(),
});

const AddAllergy = () => {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(AllergySchema),
    mode: "onBlur",
    defaultValues: {
      allergy_severity: "Not Specified",
      verified: false
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

      const { data: res } = await api.post("/patients/add-allergy", formattedData);

      toast.success(res.message || "Allergy recorded successfully!");
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
      <h2>Add Patient Allergy</h2>

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
          <h3>Allergy Details</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Allergen *</label>
              <input {...register("allergen")} placeholder="e.g., Penicillin, Peanuts, Latex" />
              {errors.allergen && (
                <div className="error-message">{errors.allergen.message}</div>
              )}
            </div>

            <div className="form-group">
              <label>Reaction *</label>
              <input {...register("reaction")} placeholder="e.g., Rash, Anaphylaxis, Hives" />
              {errors.reaction && (
                <div className="error-message">{errors.reaction.message}</div>
              )}
            </div>

            <div className="form-group">
              <label>Severity</label>
              <select {...register("allergy_severity")}>
                <option value="Not Specified">Not Specified</option>
                <option value="Mild">Mild</option>
                <option value="Moderate">Moderate</option>
                <option value="Severe">Severe</option>
                <option value="Life-Threatening">Life-Threatening</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" {...register("verified")} style={{ width: 'auto' }} />
              Verified by healthcare provider
            </label>
          </div>
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? "Adding..." : "Add Allergy"}
        </button>
      </form>
    </div>
  );
};

export default AddAllergy;
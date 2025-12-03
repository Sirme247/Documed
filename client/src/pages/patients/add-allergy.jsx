import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get patient_id from either location.state.patient or location.state.patient_id
  const patient = location.state?.patient;
  const patient_id = patient?.patient_id || location.state?.patient_id;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    resolver: zodResolver(AllergySchema),
    mode: "onBlur",
    defaultValues: {
      allergy_severity: "Not Specified",
      verified: false
    }
  });

  useEffect(() => {
    if (patient_id) {
      setValue("patient_id", patient_id.toString());
    }
  }, [patient_id, setValue]);

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
      
      // Navigate back to the patient details page
      if (patient_id) {
        navigate(`/patients/${patient_id}`);
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

  const handleCancel = () => {
    if (patient_id) {
      navigate(`/patients/${patient_id}`);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="patient-record-form">
      <h2>Add Patient Allergy</h2>
      {patient && (
        <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#f3f4f6', borderRadius: '4px' }}>
          <strong>Patient:</strong> {patient.first_name} {patient.last_name} (MRN: {patient.identifiers?.[0]?.patient_mrn || 'N/A'})
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="form">
        {/* <div className="form-section">
          <h3>Patient Information</h3>
          
          <div className="form-group">
            <label>Patient ID *</label>
            <input 
              type="number" 
              {...register("patient_id")} 
              disabled={!!patient_id}
              style={patient_id ? { backgroundColor: '#f3f4f6', cursor: 'not-allowed' } : {}}
            />
            {errors.patient_id && (
              <div className="error-message">{errors.patient_id.message}</div>
            )}
          </div>
        </div> */}

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

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button type="button" onClick={handleCancel} className="cancel-btn" disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? "Adding..." : "Add Allergy"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddAllergy;
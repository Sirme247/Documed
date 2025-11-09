import React, { useState, useEffect } from "react";
import "./visits.css";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import {useLocation, useNavigate} from 'react-router-dom'
import api from "../../libs/apiCall.js";
import { toast } from "react-hot-toast";

const PrescriptionSchema = z.object({
  visit_id: z.string().min(1, "Visit ID is required"),
  medication_name: z.string().min(1, "Medication name is required"),
  dosage: z.string().optional(),
  frequency: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  refills_allowed: z.string().optional(),
  instructions: z.string().optional(),
  is_active: z.boolean().optional(),
});

const RecordPrescription = () => {
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const {visit_id,patient_id} = location.state || {};

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm({
    resolver: zodResolver(PrescriptionSchema),
    mode: "onBlur",
    defaultValues: {
      visit_id: visit_id?.toString() || "",
      is_active: true,
      refills_allowed: "0"
    }
  });

  useEffect(()=>{
    if(visit_id){
      setValue("visit_id", visit_id.toString());
    }
  }, [visit_id,setValue])

  const onSubmit = async (data) => {
    console.log("Form data being sent:", data);

    try {
      setLoading(true);

      const formattedData = {
        ...data,
        visit_id: parseInt(data.visit_id),
        refills_allowed: parseInt(data.refills_allowed),
      };

      const { data: res } = await api.post("/visits/record-visit-prescriptions", formattedData);

      toast.success(res.message || "Prescription recorded successfully!");
      
      if(visit_id){
        navigate(`/visits/${visit_id}`)
      }else{
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
      <h2>Record Prescription</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="form">
        <div className="form-section">
          <h3>Visit Information</h3>
          
          <div className="form-group">
            <label>Visit ID *</label>
            <input type="number" {...register("visit_id")} 
             readOnly = {!!visit_id}
              disabled = {!!visit_id}
               style={visit_id ? { background: '#f3f4f6', cursor: 'not-allowed', opacity: 0.7 } : {}}
            />
            {errors.visit_id && (
              <div className="error-message">{errors.visit_id.message}</div>
            )}
          </div>
        </div>

        <div className="form-section">
          <h3>Medication Details</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Medication Name *</label>
              <input {...register("medication_name")} placeholder="e.g., Amoxicillin" />
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
              <input {...register("frequency")} placeholder="e.g., 3 times daily" />
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
              <label>Refills Allowed</label>
              <input type="number" {...register("refills_allowed")} min="0" />
            </div>
          </div>

          <div className="form-group">
            <label>Instructions</label>
            <textarea {...register("instructions")} rows="3" placeholder="Special instructions for taking this medication" />
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" {...register("is_active")} style={{ width: 'auto' }} />
              Prescription is currently active
            </label>
          </div>
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? "Recording..." : "Record Prescription"}
        </button>
      </form>
    </div>
  );
};

export default RecordPrescription;
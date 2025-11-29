import React, { useState, useEffect } from "react";
import "./visits.css";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import api from "../../libs/apiCall.js";
import { toast } from "react-hot-toast";
import { useLocation, useSearchParams } from "react-router-dom";

import useStore from "../../store/index.js";

const NewVisitSchema = z.object({
  visit_number: z.string().min(1, "Visit number is required"),
  visit_type: z.string().min(1, "Please select visit type"),
  patient_id: z.string().min(1, "Patient ID is required"),
  provider_id: z.string().optional(),
  hospital_id: z.string().min(1, "Hospital ID is required"),
  branch_id: z.string().optional(),
  priority_level: z.string().optional(),
  referring_provider_name: z.string().optional(),
  referring_provider_hospital: z.string().optional(),
  reason_for_visit: z.string().optional(),
  admission_status: z.string().optional(),
  discharge_date: z.string().optional(),
  notes: z.string().optional(),
});



const NewVisit = () => {
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const user = useStore((state) => state.user);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(NewVisitSchema),
    mode: "onBlur",
    defaultValues: {
      hospital_id: user?.hospital_id ? String(user.hospital_id) : "",
      branch_id: user?.branch_id ? String(user.branch_id) : "",
    }
  });

  const visitType = watch("visit_type");
  const admissionStatus = watch("admission_status");
  const patientId = watch("patient_id");

  // Prefill form with patient data and user's hospital/branch
  useEffect(() => {
    // Get patient data from location state (passed via navigate)
    const patientData = location.state?.patient;
    
    // Or get patient_id from URL query params
    const patientIdFromUrl = searchParams.get("patient_id");
    
    if (patientData) {
      // Prefill patient ID only
      setValue("patient_id", patientData.patient_id?.toString() || "");
    } else if (patientIdFromUrl) {
      // Prefill from URL parameter
      setValue("patient_id", patientIdFromUrl);
    }
    
    // Always prefill hospital_id and branch_id from current user's store
    if (user?.hospital_id) {
      setValue("hospital_id", user.hospital_id.toString());
    }
    if (user?.branch_id) {
      setValue("branch_id", user.branch_id.toString());
    }

    // Auto-generate visit number (you can customize this logic)
    const generateVisitNumber = () => {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      return `V${year}${month}-${random}`;
    };
    
    setValue("visit_number", generateVisitNumber());
  }, [location.state, searchParams, setValue, user]);

  // Fetch patient details when patient_id is entered manually
  const [patientInfo, setPatientInfo] = useState(null);
  useEffect(() => {
    const fetchPatientInfo = async () => {
      if (patientId && patientId.length > 0) {
        try {
          const { data } = await api.get(`/patients/get-patient/${patientId}`);
          if (data.status === "success") {
            setPatientInfo(data.data.patient);
          }
        } catch (error) {
          console.error("Error fetching patient:", error);
          setPatientInfo(null);
        }
      }
    };

    const timeoutId = setTimeout(fetchPatientInfo, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [patientId]);

  const onSubmit = async (data) => {
    console.log("Form data being sent:", data);

    try {
      setLoading(true);

      // Format data - convert string IDs to numbers
      const formattedData = {
        ...data,
        patient_id: parseInt(data.patient_id),
        provider_id: data.provider_id ? parseInt(data.provider_id) : undefined,
        hospital_id: parseInt(data.hospital_id),
        branch_id: data.branch_id ? parseInt(data.branch_id) : undefined,
      };

      const { data: res } = await api.post("/visits/register-visit", formattedData);

      toast.success(res.message || "Visit registered successfully!");
      
     navigate(`/patients/${data.patient_id}`);
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="visit-registration">
      <h2>Register New Visit</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="form">
        {/* Visit Identification */}
        <div className="form-section">
          <h3>Visit Information</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Visit Number *</label>
              <input {...register("visit_number")} placeholder="e.g., V2024-001" />
              {errors.visit_number && (
                <div className="error-message">{errors.visit_number.message}</div>
              )}
            </div>

            <div className="form-group">
              <label>Visit Type *</label>
              <select {...register("visit_type")}>
                <option value="">-- Select Visit Type --</option>
                <option value="Outpatient">Outpatient</option>
                <option value="Inpatient">Inpatient</option>
                <option value="Emergency">Emergency</option>
                <option value="Follow-up">Follow-up</option>
                <option value="Consultation">Consultation</option>
                <option value="Preventive Care">Preventive Care</option>
                <option value="Surgical">Surgical</option>
              </select>
              {errors.visit_type && (
                <div className="error-message">{errors.visit_type.message}</div>
              )}
            </div>

            <div className="form-group">
              <label>Priority Level</label>
              <select {...register("priority_level")}>
                <option value="">-- Select Priority --</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Patient and Provider Information */}
        {/* <div className="form-section">
          <h3>Patient & Provider Details</h3>

          <div className="form-row">
            <div className="form-group">
            <label>Patient ID *</label>
            <input 
              type="number" 
              {...register("patient_id")} 
              placeholder="Enter patient ID"
              disabled={true}
              style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
            />
            {errors.patient_id && (
              <div className="error-message">{errors.patient_id.message}</div>
            )}
            {patientInfo && (
              <div style={{ 
                marginTop: '8px', 
                padding: '8px 12px', 
                backgroundColor: '#d1fae5', 
                borderRadius: '4px',
                fontSize: '13px',
                color: '#065f46',
              }}>
                ✓ Patient: {patientInfo.first_name} {patientInfo.last_name} 
                {patientInfo.date_of_birth && ` (Age: ${new Date().getFullYear() - new Date(patientInfo.date_of_birth).getFullYear()})`}
              </div>
            )}
          </div>

            <div className="form-group">
              <label>Provider ID</label>
              <input type="number" {...register("provider_id")} placeholder="Assigned provider ID" />
              <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                Leave empty if not yet assigned
              </small>
            </div>

            <div className="form-group">
              <label>Hospital ID *</label>
              <input 
                type="number" 
                {...register("hospital_id")} 
                placeholder="Hospital ID"
                disabled={!!user?.hospital_id}
                style={user?.hospital_id ? { backgroundColor: '#f3f4f6', cursor: 'not-allowed' } : {}}
              />
              {user?.hospital_id && (
                <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  Auto-filled from your account
                </small>
              )}
              {errors.hospital_id && (
                <div className="error-message">{errors.hospital_id.message}</div>
              )}
            </div>

            <div className="form-group">
              <label>Branch ID</label>
              <input 
                type="number" 
                {...register("branch_id")} 
                placeholder="Branch ID (optional)"
                disabled={!!user?.branch_id}
                style={user?.branch_id ? { backgroundColor: '#f3f4f6', cursor: 'not-allowed' } : {}}
              />
              {user?.branch_id && (
                <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  Auto-filled from your account
                </small>
              )}
            </div>
          </div>
        </div> */}

        {/* Referral Information */}
        <div className="form-section">
          <h3>Referral Information (Optional)</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Referring Provider Name</label>
              <input {...register("referring_provider_name")} placeholder="Dr. John Doe" />
            </div>

            <div className="form-group">
              <label>Referring Provider Hospital</label>
              <input {...register("referring_provider_hospital")} placeholder="Hospital name" />
            </div>
          </div>
        </div>

        {/* Visit Details */}
        <div className="form-section">
          <h3>Visit Details</h3>

          <div className="form-group">
            <label>Reason for Visit</label>
            <textarea 
              {...register("reason_for_visit")} 
              rows="3"
              placeholder="Describe the reason for this visit"
            />
          </div>

          {(visitType === "Inpatient" || visitType === "Emergency" || visitType === "Surgical") && (
            <div className="form-row">
              <div className="form-group">
                <label>Admission Status</label>
                <select {...register("admission_status")}>
                  <option value="">-- Select Status --</option>
                  <option value="admitted">Admitted</option>
                  <option value="under observation">Under Observation</option>
                  <option value="transferred">Transferred</option>
                  <option value="discharged">Discharged</option>
                </select>
              </div>

              {admissionStatus === "Discharged" && (
                <div className="form-group">
                  <label>Discharge Date</label>
                  <input type="datetime-local" {...register("discharge_date")} />
                </div>
              )}
            </div>
          )}

          <div className="form-group">
            <label>Additional Notes</label>
            <textarea 
              {...register("notes")} 
              rows="4"
              placeholder="Any additional information about this visit"
            />
          </div>
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? "Registering Visit..." : "Register Visit"}
        </button>
      </form>
    </div>
  );
};

export default NewVisit;
import React, { useState, useEffect } from "react";
import "./patients.css";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import api from "../../libs/apiCall.js";
import { toast } from "react-hot-toast";
import useStore from "../../store/index.js";

const PatientRegistrationSchema = z.object({
  // Required fields
  first_name: z.string().min(2, "First name must be at least 2 characters"),
  last_name: z.string().min(2, "Last name must be at least 2 characters"),
  country_of_residence: z.string().min(1, "Country of residence is required"),
  date_of_birth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["male", "female", "other"], {
    errorMap: () => ({ message: "Please select a gender" })
  }),
  email: z.string().optional(),
  primary_number: z.string().min(1, "Primary phone number is required"),
  patient_mrn: z.string().optional(),
  hospital_id: z.string().optional(),

  // Optional personal fields
  middle_name: z.string().optional(),
  country_of_birth: z.string().optional(),
  national_id: z.string().optional(),
  birth_certificate_number: z.string().optional(),
  marital_status: z.string().optional(),
  blood_type: z.string().optional(),
  occupation: z.string().optional(),
  address_line: z.string().optional(),
  secondary_number: z.string().optional(),
  ethnicity: z.string().optional(),
  preffered_language: z.string().optional(),
  religion: z.string().optional(),

  // Emergency contacts
  emergency_contact1_name: z.string().optional(),
  emergency_contact1_number: z.string().optional(),
  emergency_contact1_relationship: z.string().optional(),
  emergency_contact2_name: z.string().optional(),
  emergency_contact2_number: z.string().optional(),
  emergency_contact2_relationship: z.string().optional(),

  // Insurance
  primary_insurance_provider: z.string().optional(),
  primary_insurance_policy_number: z.string().optional(),
  secondary_insurance_provider: z.string().optional(),
  secondary_insurance_policy_number: z.string().optional(),

  // Medical - Allergies
  allergen: z.string().optional(),
  reaction: z.string().optional(),
  allergy_severity: z.string().optional(),
  verified: z.boolean().optional(),

  // Medical - Medications
  medication_name: z.string().optional(),
  dosage: z.string().optional(),
  frequency: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  medication_is_active: z.boolean().optional(),
  hospital_where_prescribed: z.string().optional(),
  medication_notes: z.string().optional(),

  // Medical - Chronic Conditions
  icd_codes_version: z.string().optional(),
  icd_code: z.string().optional(),
  condition_name: z.string().optional(),
  diagnosed_date: z.string().optional(),
  current_status: z.string().optional(),
  condition_severity: z.string().optional(),
  management_plan: z.string().optional(),
  condition_notes: z.string().optional(),
  is_active: z.boolean().optional(),

  // Family History
  relationship: z.string().optional(),
  relative_name: z.string().optional(),
  relative_patient_id: z.string().optional(),
  relative_condition_name: z.string().optional(),
  age_of_onset: z.string().optional(),
  family_history_notes: z.string().optional(),

  // Social History
  smoking_status: z.string().optional(),
  alcohol_use: z.string().optional(),
  drug_use: z.string().optional(),
  physical_activity: z.string().optional(),
  diet_description: z.string().optional(),
  living_situation: z.string().optional(),
  support_system: z.string().optional(),
});

const RegisterPatient = () => {
  const [loading, setLoading] = useState(false);
  const user = useStore((state) => state.user);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    resolver: zodResolver(PatientRegistrationSchema),
    mode: "onBlur",
    defaultValues: {
      verified: false,
      medication_is_active: true,
      is_active: true,
      hospital_id: user?.hospital_id ? String(user.hospital_id) : "",
    }
  });

  // Set hospital_id when component mounts or user changes
  useEffect(() => {
    if (user?.hospital_id) {
      setValue("hospital_id", String(user.hospital_id));
    }
  }, [user, setValue]);

  const onSubmit = async (data) => {
  console.log("Form data being sent:", data);

  try {
    setLoading(true);

    // Format data - convert string IDs to numbers and clean empty MRN
    const formattedData = {
      ...data,
      hospital_id: parseInt(data.hospital_id),
      relative_patient_id: data.relative_patient_id ? parseInt(data.relative_patient_id) : undefined,
      patient_mrn: data.patient_mrn?.trim() || undefined, // Remove empty string
    };

    const { data: res } = await api.post("/patients/register-patient", formattedData);

    toast.success(res.message || "Patient registered successfully!");
    
    // Show the generated MRN if available
    if (res.patient?.patient_mrn) {
      toast.success(`MRN assigned: ${res.patient.patient_mrn}`, {
        duration: 5000,
      });
    }
    
    navigate(`/patients/list`);
  } catch (error) {
    console.error(error);
    toast.error(error?.response?.data?.message || error.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="patient-registration">
      <h2>Register New Patient</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="form">
        {/* Required Patient Information */}
        <div className="form-section">
          <h3>Required Information</h3>

          <div className="form-row">
            {/* <div className="form-group">
              <label>Hospital ID *</label>
              <input 
                type="number" 
                {...register("hospital_id")} 
                disabled={!!user?.hospital_id}
                style={user?.hospital_id ? { backgroundColor: '#f3f4f6', cursor: 'not-allowed' } : {}}
              />
              {user?.hospital_id && (
                <small style={{ color: '#6b7280', fontSize: '12px' }}>
                  Auto-filled from your account
                </small>
              )}
              {errors.hospital_id && (
                <div className="error-message">{errors.hospital_id.message}</div>
              )}
            </div> */}

            <div className="form-group">
              <label>Patient MRN</label>
              <input 
                {...register("patient_mrn")} 
                placeholder="Leave empty to auto-generate (H1-20241126-A8F2)" 
              />
              <small style={{ color: '#6b7280', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                Medical Record Number (auto-generated if left blank)
              </small>
              {errors.patient_mrn && (
                <div className="error-message">{errors.patient_mrn.message}</div>
              )}
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="form-section">
          <h3>Personal Information</h3>

          <div className="form-row">
            <div className="form-group">
              <label>First Name *</label>
              <input {...register("first_name")} />
              {errors.first_name && (
                <div className="error-message">{errors.first_name.message}</div>
              )}
            </div>

            <div className="form-group">
              <label>Middle Name</label>
              <input {...register("middle_name")} />
            </div>

            <div className="form-group">
              <label>Last Name *</label>
              <input {...register("last_name")} />
              {errors.last_name && (
                <div className="error-message">{errors.last_name.message}</div>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Date of Birth *</label>
              <input type="date" {...register("date_of_birth")} />
              {errors.date_of_birth && (
                <div className="error-message">{errors.date_of_birth.message}</div>
              )}
            </div>

            <div className="form-group">
              <label>Gender *</label>
              <select {...register("gender")}>
                <option value="">-- Select Gender --</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              {errors.gender && (
                <div className="error-message">{errors.gender.message}</div>
              )}
            </div>

            <div className="form-group">
              <label>Blood Type</label>
              <select {...register("blood_type")}>
                <option value="">-- Select Blood Type --</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>National ID</label>
              <input {...register("national_id")} />
            </div>

            <div className="form-group">
              <label>Birth Certificate Number</label>
              <input {...register("birth_certificate_number")} placeholder="e.g., 123456789" />
              <small style={{ color: '#6b7280', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                For minors or those without National ID
              </small>
            </div>

            <div className="form-group">
              <label>Marital Status</label>
              <select {...register("marital_status")}>
                <option value="">-- Select Status --</option>
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="divorced">Divorced</option>
                <option value="widowed">Widowed</option>
              </select>
            </div>

            <div className="form-group">
              <label>Occupation</label>
              <input {...register("occupation")} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Country of Birth</label>
              <input {...register("country_of_birth")} />
            </div>

            <div className="form-group">
              <label>Country of Residence *</label>
              <input {...register("country_of_residence")} />
              {errors.country_of_residence && (
                <div className="error-message">{errors.country_of_residence.message}</div>
              )}
            </div>

            <div className="form-group">
              <label>Ethnicity</label>
              <input {...register("ethnicity")} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Preferred Language</label>
              <input {...register("preffered_language")} />
            </div>

            <div className="form-group">
              <label>Religion</label>
              <input {...register("religion")} />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="form-section">
          <h3>Contact Information</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Primary Phone *</label>
              <input {...register("primary_number")} placeholder="+254712345678" />
              {errors.primary_number && (
                <div className="error-message">{errors.primary_number.message}</div>
              )}
            </div>

            <div className="form-group">
              <label>Secondary Phone</label>
              <input {...register("secondary_number")} placeholder="+254798765432" />
            </div>

            <div className="form-group">
              <label>Email *</label>
              <input type="email" {...register("email")} />
              {errors.email && (
                <div className="error-message">{errors.email.message}</div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>Address</label>
            <input {...register("address_line")} />
          </div>
        </div>

        {/* Emergency Contacts */}
        <div className="form-section">
          <h3>Emergency Contacts</h3>

          <h4 style={{ fontSize: '16px', marginBottom: '12px', color: '#6b7280' }}>Primary Emergency Contact</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Contact Name</label>
              <input {...register("emergency_contact1_name")} />
            </div>

            <div className="form-group">
              <label>Contact Phone</label>
              <input {...register("emergency_contact1_number")} />
            </div>

            <div className="form-group">
              <label>Relationship</label>
              <input {...register("emergency_contact1_relationship")} placeholder="e.g., Spouse, Parent" />
            </div>
          </div>

          <h4 style={{ fontSize: '16px', marginTop: '16px', marginBottom: '12px', color: '#6b7280' }}>Secondary Emergency Contact</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Contact Name</label>
              <input {...register("emergency_contact2_name")} />
            </div>

            <div className="form-group">
              <label>Contact Phone</label>
              <input {...register("emergency_contact2_number")} />
            </div>

            <div className="form-group">
              <label>Relationship</label>
              <input {...register("emergency_contact2_relationship")} />
            </div>
          </div>
        </div>

        {/* Insurance Information */}
        <div className="form-section">
          <h3>Insurance Information</h3>

          <h4 style={{ fontSize: '16px', marginBottom: '12px', color: '#6b7280' }}>Primary Insurance</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Provider</label>
              <input {...register("primary_insurance_provider")} placeholder="e.g., NHIF, AAR" />
            </div>

            <div className="form-group">
              <label>Policy Number</label>
              <input {...register("primary_insurance_policy_number")} />
            </div>
          </div>

          <h4 style={{ fontSize: '16px', marginTop: '16px', marginBottom: '12px', color: '#6b7280' }}>Secondary Insurance</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Provider</label>
              <input {...register("secondary_insurance_provider")} />
            </div>

            <div className="form-group">
              <label>Policy Number</label>
              <input {...register("secondary_insurance_policy_number")} />
            </div>
          </div>
        </div>

        {/* Allergies */}
        <div className="form-section">
          <h3>Allergies (Optional)</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Allergen</label>
              <input {...register("allergen")} placeholder="e.g., Penicillin, Peanuts" />
            </div>

            <div className="form-group">
              <label>Reaction</label>
              <input {...register("reaction")} placeholder="e.g., Rash, Anaphylaxis" />
            </div>

            <div className="form-group">
              <label>Severity</label>
              <select {...register("allergy_severity")}>
                <option value="">-- Select Severity --</option>
                <option value="Mild">Mild</option>
                <option value="Moderate">Moderate</option>
                <option value="Severe">Severe</option>
                <option value="Not Specified">Not Specified</option>
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

        {/* Current Medications */}
        <div className="form-section">
          <h3>Current Medications (Optional)</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Medication Name</label>
              <input {...register("medication_name")} />
            </div>

            <div className="form-group">
              <label>Dosage</label>
              <input {...register("dosage")} placeholder="e.g., 10mg" />
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
              <input {...register("hospital_where_prescribed")} />
            </div>
          </div>

          <div className="form-group">
            <label>Medication Notes</label>
            <textarea {...register("medication_notes")} rows="2" />
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" {...register("medication_is_active")} style={{ width: 'auto' }} />
              Currently active medication
            </label>
          </div>
        </div>

        {/* Chronic Conditions */}
        <div className="form-section">
          <h3>Chronic Conditions (Optional)</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Condition Name</label>
              <input {...register("condition_name")} placeholder="e.g., Diabetes Type 2" />
            </div>

            <div className="form-group">
              <label>ICD Code Version</label>
              <input {...register("icd_codes_version")} placeholder="e.g., ICD-10" />
            </div>

            <div className="form-group">
              <label>ICD Code</label>
              <input {...register("icd_code")} placeholder="e.g., E11.9" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Diagnosed Date</label>
              <input type="date" {...register("diagnosed_date")} />
            </div>

            <div className="form-group">
              <label>Current Status</label>
              <select {...register("current_status")}>
                <option value="">-- Select Status --</option>
                <option value="Active">Active</option>
                <option value="Controlled">Controlled</option>
                <option value="In Remission">In Remission</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            <div className="form-group">
              <label>Severity</label>
              <select {...register("condition_severity")}>
                <option value="">-- Select Severity --</option>
                <option value="Mild">Mild</option>
                <option value="Moderate">Moderate</option>
                <option value="Severe">Severe</option>
                <option value="Not Specified">Not Specified</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Management Plan</label>
            <textarea {...register("management_plan")} rows="2" placeholder="Treatment plan and management strategy" />
          </div>

          <div className="form-group">
            <label>Condition Notes</label>
            <textarea {...register("condition_notes")} rows="2" />
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" {...register("is_active")} style={{ width: 'auto' }} />
              Condition is currently active
            </label>
          </div>
        </div>

        {/* Family History */}
        <div className="form-section">
          <h3>Family History (Optional)</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Relative Name</label>
              <input {...register("relative_name")} />
            </div>

            <div className="form-group">
              <label>Relationship</label>
              <input {...register("relationship")} placeholder="e.g., Father, Sister" />
            </div>

            {/* <div className="form-group">
              <label>Relative Patient ID (if applicable)</label>
              <input type="number" {...register("relative_patient_id")} />
            </div> */}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Condition Name</label>
              <input {...register("relative_condition_name")} placeholder="e.g., Heart Disease" />
            </div>

            <div className="form-group">
              <label>Age of Onset</label>
              <input {...register("age_of_onset")} placeholder="e.g., 45" />
            </div>
          </div>

          <div className="form-group">
            <label>Family History Notes</label>
            <textarea {...register("family_history_notes")} rows="2" />
          </div>
        </div>

        {/* Social History */}
        <div className="form-section">
          <h3>Social History (Optional)</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Smoking Status</label>
              <select {...register("smoking_status")}>
                <option value="">-- Select Status --</option>
                <option value="Never">Never</option>
                <option value="Former">Former</option>
                <option value="Current">Current</option>
              </select>
            </div>

            <div className="form-group">
              <label>Alcohol Use</label>
              <select {...register("alcohol_use")}>
                <option value="">-- Select Status --</option>
                <option value="None">None</option>
                <option value="Occasional">Occasional</option>
                <option value="Moderate">Moderate</option>
                <option value="Heavy">Heavy</option>
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
              <input {...register("physical_activity")} placeholder="e.g., 3x per week" />
            </div>

            <div className="form-group">
              <label>Living Situation</label>
              <input {...register("living_situation")} placeholder="e.g., Lives alone, With family" />
            </div>
          </div>

          <div className="form-group">
            <label>Diet Description</label>
            <textarea {...register("diet_description")} rows="2" placeholder="Describe dietary habits" />
          </div>

          <div className="form-group">
            <label>Support System</label>
            <textarea {...register("support_system")} rows="2" placeholder="Family, friends, community support" />
          </div>
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? "Registering Patient..." : "Register Patient"}
        </button>
      </form>
    </div>
  );
};

export default RegisterPatient;
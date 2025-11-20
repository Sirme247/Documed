import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./users.css";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import api from "../../libs/apiCall.js";
import { toast } from "react-hot-toast";
import useStore from "../../store"; 

const UserRegistrationSchema = z.object({
  first_name: z.string().min(2, "First name must be at least 2 characters"),
  middle_name: z.string().optional(),
  last_name: z.string().min(2, "Last name must be at least 2 characters"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  employee_id: z.string().min(1, "Employee ID is required"),
  hospital_id: z.string().optional(),
  branch_id: z.string().optional(),
  department: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.enum(["male", "female", "other"], {
    errorMap: () => ({ message: "Please select a gender" })
  }),
  email: z.string().email("Invalid email format"),
  contact_info: z.string().optional(),
  address_line: z.string().optional(),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/, "Password must include at least one letter and one number"),
  role_id: z.string().min(1, "Please select a role"),
  license_number: z.string().optional(),
  license_expiry: z.string().optional(),
  specialization: z.string().optional(),
}).refine((data) => {
  if (data.role_id === "3" || data.role_id === "4") {
    return data.license_number && data.license_number.length > 0;
  }
  return true;
}, {
  message: "License number is required for doctors and nurses",
  path: ["license_number"]
});

const UserRegistration = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const { user } = useStore(); 

  // Get prefilled data from navigation state (from Hospital/Branch Details pages)
  const prefilledFromNavigation = location.state?.prefillData;
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue 
  } = useForm({
    resolver: zodResolver(UserRegistrationSchema),
    mode: "onBlur",
    defaultValues: {
      hospital_id: prefilledFromNavigation?.hospital_id || '',
      branch_id: prefilledFromNavigation?.branch_id || ''
    }
  });

  const roleId = watch("role_id");

  // Prefill logic with priority: Navigation state > User's hospital/branch
  useEffect(() => {
    // Priority 1: Data from navigation (Hospital/Branch Details page)
    if (prefilledFromNavigation) {
      if (prefilledFromNavigation.hospital_id) {
        setValue("hospital_id", prefilledFromNavigation.hospital_id.toString());
      }
      if (prefilledFromNavigation.branch_id) {
        setValue("branch_id", prefilledFromNavigation.branch_id.toString());
      }
    }
    // Priority 2: User's own hospital/branch (if no navigation data and user is Local Admin)
    else if (user && user.role_id === 2) {
      if (user.hospital_id) {
        setValue("hospital_id", user.hospital_id.toString());
      }
      if (user.branch_id) {
        setValue("branch_id", user.branch_id.toString());
      }
    }
  }, [user, prefilledFromNavigation, setValue]);

  const onSubmit = async (data) => {
    console.log("Form data being sent:", data);

    try {
      setLoading(true);

      // Check if doctor already exists (for role_id 3 or 4)
      if (data.role_id === "3" || data.role_id === "4") {
        try {
          const checkResponse = await api.get('/users/check-existing-practitioner', {
            params: {
              license_number: data.license_number,
              email: data.email
            }
          });

          if (checkResponse.data.exists) {
            const existingDoctor = checkResponse.data.doctor;
            
            const confirmed = window.confirm(
              `A healthcare provider with this license number already exists:\n\n` +
              `Name: Dr. ${existingDoctor.first_name} ${existingDoctor.last_name}\n` +
              `Email: ${existingDoctor.email}\n` +
              `Currently at: ${existingDoctor.current_hospitals.map(h => h.hospital_name).join(', ')}\n\n` +
              `Would you like to add this doctor to your hospital instead of creating a new account?`
            );

            if (confirmed) {
              navigate('/users/register-existing-doctor', {
                state: {
                  doctorData: {
                    user_id: existingDoctor.user_id,
                    first_name: existingDoctor.first_name,
                    last_name: existingDoctor.last_name,
                    email: existingDoctor.email,
                    license_number: existingDoctor.license_number,
                    specialization: existingDoctor.specialization,
                    current_hospitals: existingDoctor.current_hospitals
                  }
                }
              });
              return;
            }
          }
        } catch (checkError) {
          console.log('Check failed, proceeding with registration:', checkError);
        }
      }

      const formattedData = {
        ...data,
        hospital_id: data.hospital_id ? parseInt(data.hospital_id) : undefined,
        branch_id: data.branch_id ? parseInt(data.branch_id) : undefined,
        role_id: parseInt(data.role_id)
      };

      const { data: res } = await api.post("/users/register-user", formattedData);
      toast.success("User registered successfully!");
      reset();
      
      // Navigate back to where we came from if applicable
      if (prefilledFromNavigation?.returnPath) {
        navigate(prefilledFromNavigation.returnPath);
      }
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  // Check if fields are disabled (prefilled and locked)
  const isHospitalIdLocked = !!(prefilledFromNavigation?.hospital_id || (user?.role_id === 2 && user?.hospital_id));
  const isBranchIdLocked = !!(prefilledFromNavigation?.branch_id || (user?.role_id === 2 && user?.branch_id));

  // Determine available roles based on current user's role
  const getAvailableRoles = () => {
    if (user?.role_id === 1) {
      // Global Admin can register any role
      return [
        { value: "2", label: "Hospital Admin" },
       { value: "3", label: "Medical Practitioner(e.g. doctors)" },
        { value: "4", label: "Medical Staff(e.g Nurses)" },
        { value: "5", label: "Receptionist" }
      ];
    } else if (user?.role_id === 2) {
      // Local Admin can only register Medical Practitioner, Medical Staff, and Receptionist
      return [
        { value: "3", label: "Medical Practitioner(e.g. doctors)" },
        { value: "4", label: "Medical Staff(e.g Nurses)" },
        { value: "5", label: "Receptionist" }
      ];
    }
    return [];
  };

  const availableRoles = getAvailableRoles();

  return (
    <div className="user-registration">
      <div className="page-header">
        <h2>Register New User</h2>
        {prefilledFromNavigation && (
          <button 
            onClick={() => navigate(prefilledFromNavigation.returnPath || -1)}
            className="btn-secondary"
          >
            ← Back
          </button>
        )}
      </div>

      {/* Info banner when prefilled */}
      {prefilledFromNavigation && (
        <div style={{
          backgroundColor: '#dbeafe',
          border: '1px solid #3b82f6',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <p style={{ margin: 0, color: '#1e40af', fontWeight: '500' }}>
            ℹ️ Hospital/Branch information has been pre-filled from {prefilledFromNavigation.sourceName}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="form">
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
              <label>Date of Birth</label>
              <input type="date" {...register("date_of_birth")} />
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
          </div>
        </div>

        <div className="form-section">
          <h3>Contact Information</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>Email *</label>
              <input type="email" {...register("email")} />
              {errors.email && (
                <div className="error-message">{errors.email.message}</div>
              )}
            </div>

            <div className="form-group">
              <label>Contact Info</label>
              <input {...register("contact_info")} placeholder="Phone number" />
            </div>
          </div>

          <div className="form-group">
            <label>Address</label>
            <input {...register("address_line")} />
          </div>
        </div>

        <div className="form-section">
          <h3>Employment Details</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>Username *</label>
              <input {...register("username")} />
              {errors.username && (
                <div className="error-message">{errors.username.message}</div>
              )}
            </div>

            <div className="form-group">
              <label>Employee ID *</label>
              <input {...register("employee_id")} />
              {errors.employee_id && (
                <div className="error-message">{errors.employee_id.message}</div>
              )}
            </div>

            <div className="form-group">
              <label>Department</label>
              <input {...register("department")} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Hospital ID</label>
              <input 
                type="number" 
                {...register("hospital_id")} 
                disabled={isHospitalIdLocked}
                style={isHospitalIdLocked ? { backgroundColor: '#f3f4f6', cursor: 'not-allowed' } : {}}
              />
              {isHospitalIdLocked && (
                <small style={{ color: '#059669', fontSize: '12px', fontWeight: '500' }}>
                  ✓ Auto-filled
                </small>
              )}
            </div>

            <div className="form-group">
              <label>Branch ID</label>
              <input 
                type="number" 
                {...register("branch_id")} 
                disabled={isBranchIdLocked}
                style={isBranchIdLocked ? { backgroundColor: '#f3f4f6', cursor: 'not-allowed' } : {}}
              />
              {isBranchIdLocked && (
                <small style={{ color: '#059669', fontSize: '12px', fontWeight: '500' }}>
                  ✓ Auto-filled
                </small>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Role *</label>
              <select {...register("role_id")}>
                <option value="">-- Select Role --</option>
                {availableRoles.map(role => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
              {errors.role_id && (
                <div className="error-message">{errors.role_id.message}</div>
              )}
            </div>

            <div className="form-group">
              <label>Password *</label>
              <input type="password" {...register("password")} />
              {errors.password && (
                <div className="error-message">{errors.password.message}</div>
              )}
            </div>
          </div>
        </div>

        {/* Healthcare provider fields */}
        {(roleId === "3" || roleId === "4") && (
          <div className="form-section">
            <h3>Professional Credentials</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>License Number *</label>
                <input {...register("license_number")} placeholder="e.g., MD123456" />
                {errors.license_number && (
                  <div className="error-message">{errors.license_number.message}</div>
                )}
              </div>

              <div className="form-group">
                <label>License Expiry</label>
                <input type="date" {...register("license_expiry")} />
              </div>

              <div className="form-group">
                <label>Specialization</label>
                <input {...register("specialization")} placeholder="e.g., Cardiology" />
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <button type="submit" className="submit-btn" disabled={loading} style={{ flex: 1 }}>
            {loading ? "Registering..." : "Register User"}
          </button>
          {prefilledFromNavigation?.returnPath && (
            <button
              type="button"
              onClick={() => navigate(prefilledFromNavigation.returnPath)}
              className="btn-secondary"
              style={{ flex: 1 }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default UserRegistration;
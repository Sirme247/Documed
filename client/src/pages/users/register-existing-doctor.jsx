import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './users.css';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import api from '../../libs/apiCall.js';
import { toast } from 'react-hot-toast';
import useStore from '../../store';

const RegisterExistingDoctorSchema = z.object({
  user_id: z.string().min(1, "User ID is required"),
  license_number: z.string().min(1, "License number is required"),
  hospital_id: z.string().optional(),
  branch_id: z.string().optional(),
  start_date: z.string().min(1, "Start date is required"),
  is_primary: z.boolean().optional()
});

const RegisterExistingDoctor = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useStore();
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [doctorInfo, setDoctorInfo] = useState(null);

  // Pre-filled data from navigation (if redirected from user registration)
  const prefilledData = location.state?.doctorData;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm({
    resolver: zodResolver(RegisterExistingDoctorSchema),
    mode: 'onBlur',
    defaultValues: {
      user_id: prefilledData?.user_id?.toString() || '',
      license_number: prefilledData?.license_number || '',
      hospital_id: user?.hospital_id?.toString() || '',
      branch_id: user?.branch_id?.toString() || '',
      start_date: new Date().toISOString().split('T')[0],
      is_primary: false
    }
  });

  const userId = watch('user_id');
  const licenseNumber = watch('license_number');

  // Search for doctor by user_id or license_number
  const searchDoctor = async () => {
    if (!userId && !licenseNumber) {
      toast.error('Please enter User ID or License Number');
      return;
    }

    try {
      setSearchLoading(true);
      const { data } = await api.get('/users/search-doctor', {
        params: {
          user_id: userId,
          license_number: licenseNumber
        }
      });

      if (data.status === 'success') {
        setDoctorInfo(data.doctor);
        setValue('user_id', data.doctor.user_id.toString());
        setValue('license_number', data.doctor.license_number);
        toast.success('Doctor found!');
      }
    } catch (error) {
      console.error('Error searching doctor:', error);
      toast.error(error?.response?.data?.message || 'Doctor not found');
      setDoctorInfo(null);
    } finally {
      setSearchLoading(false);
    }
  };

  const onSubmit = async (data) => {
    console.log('Form data being sent:', data);

    try {
      setLoading(true);

      const formattedData = {
        user_id: parseInt(data.user_id),
        license_number: data.license_number,
        hospital_id: parseInt(data.hospital_id || user.hospital_id),
        branch_id: data.branch_id ? parseInt(data.branch_id) : null,
        start_date: data.start_date,
        is_primary: data.is_primary || false
      };

      const { data: res } = await api.post('/users/register-existing-practitioner', formattedData);
      
      toast.success('Doctor successfully added to your hospital!');
      navigate('/users/list');
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-registration">
      <div className="page-header">
        <div>
          <h2>Register Existing Doctor</h2>
          <p style={{ color: '#6b7280', marginTop: '8px' }}>
            Add an existing healthcare provider to your hospital
          </p>
        </div>
        <button 
          onClick={() => navigate('/users/list')}
          className="btn-secondary"
        >
          ← Back to Users
        </button>
      </div>

      {prefilledData && (
        <div style={{
          backgroundColor: '#dbeafe',
          border: '1px solid #3b82f6',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <p style={{ margin: 0, color: '#1e40af', fontWeight: '500' }}>
            ℹ️ This doctor is already registered in the system. You can add them to your hospital below.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="form">
        {/* Search Section */}
        <div className="form-section">
          <h3>Search Doctor</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>User ID</label>
              <input 
                type="number"
                {...register('user_id')} 
                placeholder="Enter user ID"
                disabled={!!prefilledData}
              />
              {errors.user_id && (
                <div className="error-message">{errors.user_id.message}</div>
              )}
            </div>

            <div className="form-group">
              <label>License Number</label>
              <input 
                {...register('license_number')} 
                placeholder="e.g., MD123456"
                disabled={!!prefilledData}
              />
              {errors.license_number && (
                <div className="error-message">{errors.license_number.message}</div>
              )}
            </div>

            {!prefilledData && (
              <div className="form-group" style={{ alignSelf: 'flex-end' }}>
                <button
                  type="button"
                  onClick={searchDoctor}
                  disabled={searchLoading}
                  className="btn-secondary"
                  style={{ width: '100%' }}
                >
                  {searchLoading ? 'Searching...' : '🔍 Search'}
                </button>
              </div>
            )}
          </div>

          {/* Doctor Info Display */}
          {(doctorInfo || prefilledData) && (
            <div style={{
              marginTop: '16px',
              padding: '16px',
              backgroundColor: '#f0fdf4',
              border: '1px solid #86efac',
              borderRadius: '8px'
            }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#166534' }}>
                ✅ Doctor Found
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '14px' }}>
                <div>
                  <strong>Name:</strong> Dr. {(doctorInfo || prefilledData)?.first_name} {(doctorInfo || prefilledData)?.last_name}
                </div>
                <div>
                  <strong>Email:</strong> {(doctorInfo || prefilledData)?.email}
                </div>
                <div>
                  <strong>License:</strong> {(doctorInfo || prefilledData)?.license_number}
                </div>
                <div>
                  <strong>Specialization:</strong> {(doctorInfo || prefilledData)?.specialization || 'N/A'}
                </div>
              </div>

              {(doctorInfo?.current_hospitals || prefilledData?.current_hospitals) && (
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #86efac' }}>
                  <strong style={{ display: 'block', marginBottom: '8px' }}>Currently Registered At:</strong>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {(doctorInfo?.current_hospitals || prefilledData?.current_hospitals).map((hosp, idx) => (
                      <span key={idx} style={{ fontSize: '13px' }}>
                        • {hosp.hospital_name} {hosp.branch_name ? `- ${hosp.branch_name}` : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Hospital Assignment */}
        <div className="form-section">
          <h3>Hospital Assignment</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Hospital ID *</label>
              <input 
                type="number"
                {...register('hospital_id')} 
                disabled={user?.role_id === 2}
                style={user?.role_id === 2 ? { backgroundColor: '#f3f4f6', cursor: 'not-allowed' } : {}}
              />
              {user?.role_id === 2 && (
                <small style={{ color: '#6b7280', fontSize: '12px' }}>
                  Auto-filled from your hospital
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
                {...register('branch_id')} 
                placeholder="Optional"
              />
            </div>

            <div className="form-group">
              <label>Start Date *</label>
              <input 
                type="date"
                {...register('start_date')} 
              />
              {errors.start_date && (
                <div className="error-message">{errors.start_date.message}</div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input 
                type="checkbox"
                {...register('is_primary')} 
                style={{ width: 'auto' }}
              />
              Set as primary hospital for this doctor
            </label>
            <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
              Check this if this is the doctor's main workplace
            </small>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            type="submit" 
            className="submit-btn" 
            disabled={loading || (!doctorInfo && !prefilledData)}
            style={{ flex: 1 }}
          >
            {loading ? 'Adding Doctor...' : 'Add Doctor to Hospital'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/users/register')}
            className="btn-secondary"
            style={{ flex: 1 }}
          >
            Register New User Instead
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegisterExistingDoctor;
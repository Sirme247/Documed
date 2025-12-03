import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './auth.css';
import documedLogo from '../../assets/documedLogo.png';
import api from '../../libs/apiCall.js';
import { setAuthToken } from '../../libs/apiCall.js';
import { toast } from 'react-hot-toast';
import useStore from '../../store';

const DoctorSelectHospital = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [pendingAuth, setPendingAuth] = useState(null);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const { setCredentials } = useStore.getState();

  useEffect(() => {
    // Get pending auth data from sessionStorage
    const authData = sessionStorage.getItem('pendingAuth');
    
    if (!authData) {
      // No pending auth, redirect to sign in
      navigate('/sign-in');
      return;
    }

    try {
      const data = JSON.parse(authData);
      console.log('Pending auth data:', data); // Debug log
      console.log('Hospitals:', data.hospitals); // Debug log
      setPendingAuth(data);
      
      // Set temporary auth token for API calls
      setAuthToken(data.token);
    } catch (error) {
      console.error('Failed to parse pending auth:', error);
      navigate('/sign-in');
    }
  }, [navigate]);

  const handleHospitalSelect = async (hospital) => {
  console.log('Selected hospital:', hospital); // Debug log
  
  if (!hospital) {
    toast.error('Invalid hospital selection');
    return;
  }

  // Extract hospital_id and branch_id (branch_id can be null)
  const hospitalId = hospital.hospital_id;
  const branchId = hospital.branch_id; // Can be null

  console.log('Hospital ID:', hospitalId, 'Branch ID:', branchId); // Debug log

  // Only validate hospital_id, branch_id can be null
  if (!hospitalId) {
    toast.error('Hospital information is missing');
    console.error('Missing hospital_id:', hospitalId);
    return;
  }

  try {
    setLoading(true);
    
    // Call API to set selected hospital (branch_id can be null)
    const { data: res } = await api.post('/auth/doctor-select-hospital', {
      hospital_id: hospitalId,
      branch_id: branchId  // Send null if no branch
    });

    console.log('API response:', res); // Debug log

    // Update with new token that includes hospital_id and branch_id
    const { token } = res;
    const updatedUser = {
      ...pendingAuth.user,
      hospital_id: hospitalId,
      branch_id: branchId
    };

    // Set auth and credentials
    setAuthToken(token);
    setCredentials({ token, ...updatedUser });
    localStorage.setItem('user', JSON.stringify({ token, ...updatedUser }));

    // Clear pending auth
    sessionStorage.removeItem('pendingAuth');

    toast.success(`Logged in to ${hospital.hospital_name}`);
    navigate('/');
  } catch (error) {
    console.error('Hospital selection error:', error);
    toast.error(error?.response?.data?.message || 'Failed to select hospital');
  } finally {
    setLoading(false);
  }
};

  const handleLogout = () => {
    sessionStorage.removeItem('pendingAuth');
    navigate('/sign-in');
  };

  if (!pendingAuth) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="form-wrapper">
      <main className="form-side" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <a href="#" title="Logo" className="logoImage">
          <img src={documedLogo} alt="Documed Logo" className="logo" />
        </a>

        <div className="hospital-selection-container" style={{ padding: '20px' }}>
          <div className="form-welcome-row" style={{ marginBottom: '30px' }}>
            <h1>Select Your Hospital</h1>
            <p>Welcome, Dr. {pendingAuth.user.first_name} {pendingAuth.user.last_name}</p>
            <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '8px' }}>
              You have access to multiple hospitals. Please select which hospital you're working at today.
            </p>
          </div>

          <div className="hospitals-grid" style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '16px',
            marginBottom: '24px'
          }}>
            {pendingAuth.hospitals && pendingAuth.hospitals.length > 0 ? (
              pendingAuth.hospitals.map((hospital, index) => (
                <button
                  key={hospital.hospital_id || index}
                  onClick={() => handleHospitalSelect(hospital)}
                  disabled={loading}
                  className={`hospital-card ${selectedHospital?.hospital_id === hospital.hospital_id ? 'selected' : ''}`}
                  style={{
                    padding: '20px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    background: 'white',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'left',
                    opacity: loading ? 0.6 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.borderColor = '#4f46e5';
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.backgroundColor = 'white';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                      flexShrink: 0
                    }}>
                      🏥
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        marginBottom: '8px'
                      }}>
                        <h3 style={{ 
                          margin: 0, 
                          fontSize: '18px', 
                          fontWeight: '600',
                          color: '#111827'
                        }}>
                          {hospital.hospital_name}
                        </h3>
                        {hospital.is_primary && (
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '500',
                            backgroundColor: '#dbeafe',
                            color: '#1e40af'
                          }}>
                            Primary
                          </span>
                        )}
                      </div>
                      
                      <div style={{ 
                        fontSize: '14px', 
                        color: '#6b7280',
                        marginTop: '4px'
                      }}>
                        {hospital.branch_id ? (
                          <span>Branch ID: {hospital.branch_id}</span>
                        ) : (
                          <span>Main Branch</span>
                        )}
                      </div>

                      <div style={{
                        marginTop: '12px',
                        fontSize: '13px',
                        color: '#4f46e5',
                        fontWeight: '500'
                      }}>
                        Click to select →
                      </div>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                No hospitals available
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              background: 'white',
              color: '#6b7280',
              fontSize: '14px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Cancel & Sign Out
          </button>
        </div>
      </main>

      <aside className="info-side">
        <div className="blockquote-wrapper">
          <blockquote>
            "Having the flexibility to work across multiple hospitals while maintaining 
            seamless access to patient records is invaluable."
          </blockquote>
          <div className="author">
            <span className="author-name">- Multi-Hospital Healthcare Provider</span>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default DoctorSelectHospital;
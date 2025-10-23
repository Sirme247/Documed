import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../../store';
import { setAuthToken } from '../../libs/apiCall';
import { toast } from 'react-hot-toast';
import './signout.css';

const SignOut = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { signOut, user } = useStore(state => state);

  const handleSignOut = async () => {
    setIsLoading(true);
    
    // Small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Clear auth token from axios
    setAuthToken(null);
    
    // Clear user from store (also clears localStorage)
    signOut();
    
    // Show success message
    toast.success("Signed out successfully!");
    
    // Redirect to sign-in page
    navigate('/sign-in');
  };

  const handleCancel = () => {
    navigate(-1); // Go back to previous page
  };

  return (
    <div className="signout-container">
      <div className="signout-card">
        <div className="signout-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </div>
        
        <h2>Sign Out?</h2>
        <p className="signout-message">
          Are you sure you want to sign out of your account?
        </p>
        
        
          {user && (
          <div className="user-info-box">
            <div className='user-avatar-box'>
              <div className="user-avatar">
                {user.first_name?.[0]}{user.last_name?.[0]}
              </div>
            </div>
            <div className="user-details">
              <p className="user-name">{user.first_name} {user.last_name}</p>
              <p className="user-email">{user.email}</p>
            </div>
          </div>
        )}
        
        
        
        <div className="button-group">
          <button 
            onClick={handleSignOut} 
            className="btn-signout"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Signing out...
              </>
            ) : (
              'Sign Out'
            )}
          </button>
          <button 
            onClick={handleCancel} 
            className="btn-cancel"
            disabled={isLoading}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignOut;
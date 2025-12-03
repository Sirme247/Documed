import React, { useEffect, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import useStore from '../store/index.js';
import './breadcrumb.css';

const Breadcrumb = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useStore(state => state.user);
  const navigationHistory = useStore(state => state.navigationHistory);
  const addToNavigationHistory = useStore(state => state.addToNavigationHistory);
  const clearNavigationHistory = useStore(state => state.clearNavigationHistory);
  const navigateBackInHistory = useStore(state => state.navigateBackInHistory);

  const MAX_VISIBLE_CRUMBS = 4;

  const routeMap = {
    // Patient Management
    '/patients/register': 'Register Patient',
    '/patients/list': 'Patient List',
    '/patients/frequent': 'Frequent Patients',
    '/patients/add-allergy': 'Add Allergy',
    '/patients/add-chronic-condition': 'Add Chronic Condition',
    '/patients/add-family-history': 'Add Family History',
    '/patients/add-medication': 'Add Medication',
    '/patients/add-social-history': 'Add Social History',
    
    // Visit Management
    '/visits/new': 'New Visit',
    '/visits/open': 'Open Visits',
    '/visits/record-diagnosis': 'Record Diagnosis',
    '/visits/record-imaging-results': 'Record Imaging Results',
    '/visits/record-lab-results': 'Record Lab Results',
    '/visits/record-vitals': 'Record Vitals',
    '/visits/record-prescriptions': 'Record Prescriptions',
    '/visits/record-treatment': 'Record Treatment',
    '/visits/hospital/today': "Today's Visits",
    '/visits/hospital/all': 'All Visits',
    '/visits/hospital/last-week': 'Last Week Visits',
    
    // Hospital Management
    '/hospitals/register': 'Register Hospital',
    '/hospitals/list': 'Hospital List',
    '/hospitals/register-branch': 'Register Branch',
    '/hospitals/current/get-profile': 'Hospital Profile',
    
    // User Management
    '/users/register': 'Register User',
    '/users/list': 'User List',
    '/users/register-existing-doctor': 'Register Existing Doctor',
    '/users/hospital-users': 'Hospital Users',
    
    // Settings
    '/settings/user': 'User Settings',
    '/settings/system': 'System Settings',
    '/profile/user': 'My Profile',
    
    // Audit
    '/audits/logs': 'Audit Logs',
    
    // Dashboards
    '/dashboard/global-admin': 'Dashboard',
    '/dashboard/local-admin': 'Dashboard',
    '/dashboard/doctor': 'Dashboard',
    '/dashboard/nurse': 'Dashboard',
    '/dashboard/receptionist': 'Dashboard',
    
    // Branches
    '/branches/list': 'Branch List',
    
    // Authentication
    '/password-change': 'Change Password',
    '/password-reset': 'Reset Password',
    '/select-hospital': 'Select Hospital',
    '/sign-in': 'Sign In',
    '/sign-out': 'Sign Out',
  };

  // Get the display name for a path
  const getDisplayName = (path) => {
    // Try exact match first
    if (routeMap[path]) {
      return routeMap[path];
    }

    // Handle dynamic routes with IDs
    const pathSegments = path.split('/').filter(Boolean);
    
    // Handle patient details routes
    if (pathSegments[0] === 'patients' && pathSegments.length >= 2) {
      const patientId = pathSegments[1];
      const isId = /^[a-f0-9-]{36}$|^\d+$/.test(patientId);
      
      if (isId) {
        if (pathSegments.length === 2) {
          return 'Patient Details';
        }
        if (pathSegments[2] === 'edit') {
          return 'Edit Patient';
        }
        if (pathSegments[2] === 'edit-medicals') {
          return 'Edit Medical History';
        }
      }
    }
    
    // Handle visit details routes
    if (pathSegments[0] === 'visits') {
      if (pathSegments[1] === 'patients' && pathSegments.length === 3) {
        return 'Patient Visits';
      }
      if (pathSegments[1] === 'details' && pathSegments.length === 3) {
        return 'Visit Details';
      }
    }
    
    // Handle user details routes
    if (pathSegments[0] === 'users' && pathSegments.length >= 2) {
      const userId = pathSegments[1];
      const isId = /^[a-f0-9-]{36}$|^\d+$/.test(userId);
      
      if (isId) {
        if (pathSegments.length === 2) {
          return 'User Details';
        }
        if (pathSegments[2] === 'edit') {
          return 'Edit User';
        }
      }
    }
    
    // Handle hospital details routes
    if (pathSegments[0] === 'hospitals' && pathSegments.length >= 2) {
      const hospitalId = pathSegments[1];
      const isId = /^[a-f0-9-]{36}$|^\d+$/.test(hospitalId);
      
      if (isId) {
        if (pathSegments.length === 2) {
          return 'Hospital Details';
        }
        if (pathSegments[2] === 'edit') {
          return 'Edit Hospital';
        }
      }
    }
    
    // Handle branch details routes
    if (pathSegments[0] === 'branches' && pathSegments.length === 2) {
      const branchId = pathSegments[1];
      const isId = /^[a-f0-9-]{36}$|^\d+$/.test(branchId);
      
      if (isId) {
        return 'Branch Details';
      }
    }
    
    // Handle AI summary route
    if (pathSegments[0] === 'ai-summary' && pathSegments.length === 2) {
      return 'AI Summary';
    }

    // Convert to Title Case as fallback
    const lastSegment = pathSegments[pathSegments.length - 1];
    return lastSegment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Track navigation changes
  useEffect(() => {
    const excludedPaths = [
      '/sign-in', 
      '/sign-out', 
      '/password-reset', 
      '/select-hospital', 
      '/unauthorized', 
      '/',
      '/overview'
    ];
    
    // Check if it's a dashboard route
    const isDashboard = location.pathname.startsWith('/dashboard/');
    
    if (!excludedPaths.includes(location.pathname)) {
      const displayName = getDisplayName(location.pathname);
      
      // If navigating to dashboard, clear history
      if (isDashboard) {
        clearNavigationHistory();
      } else {
        // Add current page to navigation history
        addToNavigationHistory(location.pathname, displayName);
      }
    }
  }, [location.pathname, addToNavigationHistory, clearNavigationHistory]);

  const breadcrumbs = useMemo(() => {
    const excludedPaths = [
      '/sign-in', 
      '/sign-out', 
      '/password-reset', 
      '/select-hospital', 
      '/unauthorized', 
      '/',
      '/overview'
    ];
    
    if (excludedPaths.includes(location.pathname)) {
      return [];
    }

    const crumbs = [];

    // Add home/dashboard as first crumb
    const getDashboardRoute = () => {
      if (!user?.role_id) return { path: '/', name: 'Home' };
      const roleId = Number(user.role_id);
      switch(roleId) {
        case 1: return { path: '/dashboard/global-admin', name: 'Home' };
        case 2: return { path: '/dashboard/local-admin', name: 'Home' };
        case 3: return { path: '/dashboard/doctor', name: 'Home' };
        case 4: return { path: '/dashboard/nurse', name: 'Home' };
        case 5: return { path: '/dashboard/receptionist', name: 'Home' };
        default: return { path: '/', name: 'Home' };
      }
    };

    const dashboardRoute = getDashboardRoute();
    
    // Always add dashboard/home as first crumb (except when on dashboard)
    if (location.pathname !== dashboardRoute.path) {
      crumbs.push({
        path: dashboardRoute.path,
        name: dashboardRoute.name,
        icon: '🏠'
      });
    }

    // Add navigation history as breadcrumbs
    navigationHistory.forEach((historyItem, index) => {
      crumbs.push({
        path: historyItem.path,
        name: historyItem.name,
        isLast: index === navigationHistory.length - 1
      });
    });

    // If we have too many crumbs, show only the most recent ones
    if (crumbs.length > MAX_VISIBLE_CRUMBS) {
      const hiddenCount = crumbs.length - MAX_VISIBLE_CRUMBS;
      return [
        crumbs[0], // Always keep Home
        { 
          isEllipsis: true, 
          hiddenCount,
          hiddenCrumbs: crumbs.slice(1, 1 + hiddenCount) 
        },
        ...crumbs.slice(-MAX_VISIBLE_CRUMBS + 1) // Keep the most recent ones
      ];
    }

    return crumbs;
  }, [location.pathname, user, navigationHistory]);

  if (breadcrumbs.length === 0) {
    return null;
  }

  const handleCrumbClick = (e, crumb, index) => {
    e.preventDefault();
    
    // Navigate to the clicked crumb
    navigate(crumb.path);
    
    // Remove all items after the clicked one from history
    const crumbIndexInHistory = navigationHistory.findIndex(h => h.path === crumb.path);
    if (crumbIndexInHistory !== -1) {
      navigateBackInHistory(crumbIndexInHistory);
    }
  };

  return (
    <nav className="breadcrumb-container" aria-label="breadcrumb">
      <ol className="breadcrumb-list">
        {breadcrumbs.map((crumb, index) => (
          <li key={crumb.isEllipsis ? 'ellipsis' : `${crumb.path}-${index}`} className="breadcrumb-item">
            {crumb.isEllipsis ? (
              <>
                <span 
                  className="breadcrumb-ellipsis" 
                  title={`${crumb.hiddenCount} hidden item${crumb.hiddenCount > 1 ? 's' : ''}`}
                >
                  ...
                </span>
                <span className="breadcrumb-separator">/</span>
              </>
            ) : crumb.isLast ? (
              <span className="breadcrumb-current">
                {crumb.icon && <span className="breadcrumb-icon">{crumb.icon}</span>}
                {crumb.name}
              </span>
            ) : (
              <>
                <Link 
                  to={crumb.path} 
                  className="breadcrumb-link"
                  onClick={(e) => handleCrumbClick(e, crumb, index)}
                >
                  {crumb.icon && <span className="breadcrumb-icon">{crumb.icon}</span>}
                  {crumb.name}
                </Link>
                <span className="breadcrumb-separator">/</span>
              </>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
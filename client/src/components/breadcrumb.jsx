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
    '/patients/register': 'RegisterPatient',
    '/patients/list': 'PatientList',
    '/patients/frequent': 'FrequentPatients',
    '/patients/add-allergy': 'AddAllergy',
    '/patients/add-chronic-condition': 'AddChronicCondition',
    '/patients/add-family-history': 'AddFamilyHistory',
    '/patients/add-medication': 'AddMedication',
    '/patients/add-social-history': 'AddSocialHistory',
    
    '/visits/new': 'NewVisit',
    '/visits/record-diagnosis': 'RecordDiagnosis',
    '/visits/record-imaging-results': 'RecordImagingResults',
    '/visits/record-lab-results': 'RecordLabResults',
    '/visits/record-vitals': 'RecordVitals',
    '/visits/record-prescriptions': 'RecordPrescriptions',
    '/visits/record-treatment': 'RecordTreatment',
    '/visits/hospital/today': 'TodayVisits',
    '/visits/hospital/all': 'AllVisits',
    '/visits/hospital/last-week': 'LastWeekVisits',
    
    '/hospitals/register': 'RegisterHospital',
    '/hospitals/list': 'HospitalList',
    '/hospitals/register-branch': 'RegisterBranch',
    '/hospitals/current/get-profile': 'HospitalProfile',
    
    '/users/register': 'RegisterUser',
    '/users/list': 'UserList',
    '/users/register-existing-doctor': 'RegisterExistingDoctor',
    '/users/hospital-users': 'HospitalUsers',
    
    '/settings/user': 'UserSettings',
    '/settings/system': 'SystemSettings',
    
    '/audits/logs': 'AuditLogs',
    
    '/dashboard/global-admin': 'GlobalAdminDashboard',
    '/dashboard/local-admin': 'LocalAdminDashboard',
    '/dashboard/doctor': 'DoctorDashboard',
    '/dashboard/nurse': 'NurseDashboard',
    '/dashboard/receptionist': 'ReceptionistDashboard',
    
    '/password-change': 'PasswordChange',
    '/password-reset': 'PasswordReset',
    '/select-hospital': 'SelectHospital',
    '/sign-in': 'SignIn',
    '/sign-out': 'SignOut',
  };

  // Get the display name for a path
  const getDisplayName = (path) => {
    // Try exact match first
    if (routeMap[path]) {
      return routeMap[path];
    }

    // Handle dynamic routes with IDs
    const pathSegments = path.split('/').filter(Boolean);
    const lastSegment = pathSegments[pathSegments.length - 1];
    
    // Check if it's an ID
    const isId = /^[a-f0-9-]{36}$|^\d+$/.test(lastSegment);
    if (isId && pathSegments.length > 1) {
      const parentSegment = pathSegments[pathSegments.length - 2];
      const singular = parentSegment.slice(0, -1); // Remove 's'
      return `${singular.charAt(0).toUpperCase() + singular.slice(1)}Details`;
    }

    // Handle edit routes
    if (lastSegment === 'edit' && pathSegments.length > 2) {
      const parentSegment = pathSegments[pathSegments.length - 3];
      const singular = parentSegment.slice(0, -1);
      return `Edit${singular.charAt(0).toUpperCase() + singular.slice(1)}`;
    }

    // Convert to PascalCase as fallback
    return lastSegment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  };

  // Track navigation changes
  useEffect(() => {
    const excludedPaths = ['/sign-in', '/sign-out', '/password-reset', '/select-hospital', '/unauthorized', '/'];
    
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
    const excludedPaths = ['/sign-in', '/sign-out', '/password-reset', '/select-hospital', '/unauthorized', '/'];
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
import { useEffect, useState } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom' 
import { Toaster } from 'react-hot-toast'
import SignIn from './pages/auth/sign-in'
import PasswordChange from './pages/auth/password-change'
import UserPasswordReset from './pages/auth/user-password-reset.jsx'
import DoctorDashboard from './pages/dashboard/doctor-dashboard'
import GlobalAdminDashboard from './pages/dashboard/global-admin-dashboard'
import LocalAdminDashboard from './pages/dashboard/local-admin-dashboard'
import NurseDashboard from './pages/dashboard/nurse-dashboard'
import ReceptionistDashboard from './pages/dashboard/receptionist-dashboard'
import SystemSettings from './pages/settings/system-settings'
import UserProfile from './pages/users/user-profile.jsx'
import EditHospitals from './pages/hospitals/edit_hospital'
import HospitalList from './pages/hospitals/hospital-list'
import HospitalProfile from './pages/hospitals/hospital-profile'
import HospitalRegistration from './pages/hospitals/hospital-registration'
import HospitalDetails from './pages/hospitals/hospital_details'
import EditPatient from './pages/patients/edit-patient'
import PatientDetails from './pages/patients/patient-details'
import PatientList from './pages/patients/patient_list'
import RegisterPatient from './pages/patients/register_patient'
import EditUser from './pages/users/edit-user'
import UserDetails from './pages/users/user-details'
import UserList from './pages/users/user-list'
import UserRegistration from './pages/users/user-registration'
import PatientVisitList from './pages/patients/patient-visit-list.jsx'
import NewVisit from './pages/visits/new-visit'
import VisitDetails from './pages/visits/visit_details'
import HospitalBranchRegistration from './pages/hospitals/hospital-branch-registration.jsx'
import RecordVitals from './pages/visits/add-vitals.jsx'
import RecordDiagnosis from './pages/visits/add-diagnosis.jsx'
import RecordImagingResult from './pages/visits/add-imaging-results.jsx'
import RecordLabTests  from './pages/visits/add-lab-results.jsx'
import RecordPrescription from './pages/visits/add-prescription.jsx'
import RecordTreatment from './pages/visits/add-treatments.jsx'
import AddAllergy from './pages/patients/add-allergy.jsx'
import AddChronicCondition from './pages/patients/add-chronic-condition.jsx'
import AddFamilyHistory from './pages/patients/add-family-history.jsx'
import AddMedication from './pages/patients/add-medication.jsx'
import AddSocialHistory from './pages/patients/add-social-history.jsx'
import SignOut from './pages/auth/signout.jsx'
import BranchDetails from './pages/hospitals/branch_details.jsx'
import AuditLogs from './pages/audit/audit_logs.jsx'
import HospitalUsers from './pages/users/hospital-users.jsx'
import VisitsDayHospital from './pages/visits/visits-day-hospital.jsx'
import VisitsAllHospital from './pages/visits/visits-all-hospital.jsx'
import DoctorSelectHospital from './pages/auth/doctor-select-hospital.jsx'
import RegisterExistingDoctor from './pages/users/register-existing-doctor.jsx'
import LastWeekVisits from './pages/visits/last-week-visits.jsx'
import FrequentPatients from './pages/patients/admitted-patients.jsx'


import Sidebar from './components/sidebar.jsx' 
import Breadcrumb from './components/breadcrumb.jsx'
import Summary from './pages/patients/summary.jsx'
import EditMedicals from './pages/patients/edit-medicals.jsx'

import { jwtDecode } from 'jwt-decode'
import useStore from './store/index.js'
import { setAuthToken } from './libs/apiCall.js'

const ProtectedRoute = ({ allowedRoles, children }) => {
  const user = useStore((state) => state.user);
  const location = useLocation();
  const isAuthenticated = !!user?.token;
  
  const currentPath = window.location.pathname;
  
  console.log(`\n=== ProtectedRoute Check for: ${currentPath} ===`);
  console.log('user.role_id:', user?.role_id, '(type:', typeof user?.role_id, ')');
  console.log('allowedRoles:', allowedRoles);
  
  if (!isAuthenticated) {
    console.log(' Not authenticated');
    return <Navigate to="/sign-in" replace />
  }
  
  if (user?.must_change_password && location.pathname !== '/password-change' && location.pathname !== '/sign-out') {
    console.log(' User must change password, redirecting...');
    return <Navigate to="/password-change" replace />
  }
  
  const userRoleId = Number(user.role_id);
  
  if (allowedRoles && allowedRoles.length > 0) {
    const hasAccess = allowedRoles.some(allowedRole => {
      const match = Number(allowedRole) === userRoleId;
      console.log(`  Comparing: ${userRoleId} === ${allowedRole} ? ${match}`);
      return match;
    });
    
    console.log('Final result:', hasAccess ? ' GRANTED' : ' DENIED');
    
    if (!hasAccess) {
      return <Navigate to="/unauthorized" replace />
    }
  }
  
  return children ? children : <Outlet />
}

const RootLayout = () => {
  const { user } = useStore((state) => state);

  if (!user || !user.role_id) {
    return <Navigate to="/sign-in" replace />;
  }
  
  if (user.must_change_password) {
    return <Navigate to="/password-change" replace />;
  }
  
  const getDashboardRoute = (roleId) => {
    const numericRoleId = Number(roleId);
    switch(numericRoleId) {
      case 1: 
        return '/dashboard/global-admin'
      case 2: 
        return '/dashboard/local-admin'
      case 3: 
        return '/dashboard/doctor'
      case 4: 
        return '/dashboard/nurse'
      case 5: 
        return '/dashboard/receptionist'
      default:
        return '/sign-in'
    }
  }

  return <Navigate to={getDashboardRoute(user.role_id)} replace />
}

const Unauthorized = () => (
  <div style={{ padding: '2rem', textAlign: 'center' }}>
    <h1>Unauthorized Access</h1>
    <p>You don't have permission to access this page.</p>
    <button 
      onClick={() => window.history.back()}
      style={{ 
        marginTop: '1rem', 
        padding: '0.5rem 1rem',
        background: '#4f46e5',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
      }}
    >
      Go Back
    </button>
  </div>
)

function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const setCredentials = useStore(state => state.setCredentials);
  const user = useStore(state => state.user); 

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        if (userData.token) {
          const decoded = jwtDecode(userData.token);
          const isExpired = decoded.exp * 1000 < Date.now();
          
          if (isExpired) {
            console.log("Token expired, clearing session");
            localStorage.removeItem("user");
          } else {
            setAuthToken(userData.token);
            setCredentials(userData);
          }
        }
      } catch (error) {
        console.error("Failed to restore user session:", error);
        localStorage.removeItem("user");
      }
    }
    
    setIsInitialized(true);
  }, [setCredentials]);

  // Check if user is authenticated
  const isAuthenticated = !!user?.token;

  // Public routes that should NOT show sidebar
  const publicPaths = ['/sign-in', '/sign-out', '/password-reset', '/select-hospital', '/unauthorized'];
  const location = useLocation?.() || { pathname: window.location.pathname };
  const isPublicRoute = publicPaths.includes(location.pathname);

  if (!isInitialized) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #e5e7eb',
          borderTopColor: '#4f46e5',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }}></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <main>
      <Toaster 
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#ffffffff',
            color: '#fff',
          },
          success: {
            duration: 3000,
            style: {
              background: '#10b981',
              color: '#fff',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#10b981',
            },
          },
          error: {
            duration: 4000,
            style: {
              background: '#ef4444',
              color: '#fff',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#ef4444',
            },
          },
        }}
      />
      
      {/* Main Layout with Sidebar */}
     <div style={{ display: 'flex', width: '100%', minHeight: '100vh' }}>
  {/* Sidebar */}
  {isAuthenticated && !isPublicRoute && <Sidebar />}
  
  {/* Main content area */}
  <div 
    className="RoutesDiv" 
    style={{ 
      flex: 1,
      marginLeft: isAuthenticated && !isPublicRoute ? 'var(--sidebar-width, 280px)' : '0',
      minHeight: '100vh',
      transition: 'margin-left 0.3s ease',
      width: '100%',
      maxWidth: '100%',
      minWidth: 0, //Allows container to shrink
      overflowX: 'hidden',
      boxSizing: 'border-box'
    }}
  >
     {isAuthenticated && !isPublicRoute && <Breadcrumb />}
          <Routes>
            {/* Public routes */}
            <Route path="/sign-in" element={<SignIn />} />
            <Route path="/select-hospital" element={<DoctorSelectHospital />} />
            <Route path="/sign-out" element={<SignOut />} />
            <Route path="/password-reset" element={<UserPasswordReset />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* Password change route */}
            <Route element={<ProtectedRoute allowedRoles={[1, 2, 3, 4, 5]} />}>
              <Route path="/password-change" element={<PasswordChange />} />
              <Route path="/ai-summary/:patient_id" element={<Summary />} />
            </Route>
            
            {/* Root redirect */}
            <Route path="/" element={<RootLayout />} />
            <Route path="/overview" element={<RootLayout />} />

            {/* Shared routes for all users */}
            <Route element={<ProtectedRoute allowedRoles={[1, 2, 3, 4, 5]} />}>
              <Route path="/patients/register" element={<RegisterPatient />} />

              <Route path="/profile/user" element={<UserProfile />} />
              <Route path="/patients/:patient_id/edit-medicals" element={<EditMedicals />} />
              
              <Route path="/patients/list" element={<PatientList />} />
              <Route path="/patients/:patient_id" element={<PatientDetails />} />
              <Route path="/patients/:patient_id/edit" element={<EditPatient />} />
              
              <Route path="/patients/add-allergy" element={<AddAllergy />} />
              <Route path="/patients/add-chronic-condition" element={<AddChronicCondition />} />
              <Route path="/patients/add-family-history" element={<AddFamilyHistory />} />
              <Route path="/patients/add-medication" element={<AddMedication />} />
              <Route path="/patients/add-social-history" element={<AddSocialHistory />} />
              
              <Route path="/visits/new" element={<NewVisit />} />
              <Route path="/visits/patients/:patient_id" element={<PatientVisitList />} />
              <Route path="/visits/details/:visit_id" element={<VisitDetails />} />
              
              <Route path="/visits/record-diagnosis" element={<RecordDiagnosis />} />
              <Route path="/visits/record-imaging-results" element={<RecordImagingResult />} />
              <Route path="/visits/record-lab-results" element={<RecordLabTests />} />
              <Route path="/visits/record-vitals" element={<RecordVitals />} />
              <Route path="/visits/record-prescriptions" element={<RecordPrescription />} />
              <Route path="/visits/record-treatment" element={<RecordTreatment />} />
              
              
              <Route path="/branches/:branch_id" element={<BranchDetails />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={[2, 3, 4, 5]} />}>
              <Route path="/visits/hospital/today" element={<VisitsDayHospital />} />
              <Route path="/visits/hospital/all" element={<VisitsAllHospital />} />
              <Route path="/visits/hospital/last-week" element={<LastWeekVisits />} />
              <Route path="/patients/frequent" element={<FrequentPatients />} />
            </Route>

            {/* Shared routes for Global Admin and Local Admin */}
            <Route element={<ProtectedRoute allowedRoles={[1, 2]} />}>
              <Route path="/users/register" element={<UserRegistration />} />
              <Route path="/users/register-existing-doctor" element={<RegisterExistingDoctor />} />
              <Route path="/users/list" element={<UserList />} />
              <Route path="/users/:user_id" element={<UserDetails />} />
              <Route path="/users/:user_id/edit" element={<EditUser />} />
            </Route>

            {/* System Admin ONLY routes */}
            <Route element={<ProtectedRoute allowedRoles={[1]} />}>
              <Route path="/hospitals/register-branch" element={<HospitalBranchRegistration />} />
              <Route path="/dashboard/global-admin" element={<GlobalAdminDashboard />} />
              <Route path="/hospitals/register" element={<HospitalRegistration />} />
              <Route path="/hospitals/list" element={<HospitalList />} />
              <Route path="/hospitals/:hospital_id" element={<HospitalDetails />} />
              <Route path="/hospitals/:hospital_id/edit" element={<EditHospitals />} />
              <Route path="/settings/system" element={<SystemSettings />} />
              <Route path="/audits/logs" element={<AuditLogs />} />
            </Route>

            {/* Hospital Admin ONLY routes */}
            <Route element={<ProtectedRoute allowedRoles={[2]} />}>
              <Route path="/dashboard/local-admin" element={<LocalAdminDashboard />} />
              <Route path="/hospitals/current/get-profile" element={<HospitalProfile />} />
              <Route path="/users/hospital-users" element={<HospitalUsers />} />
            </Route>

            {/* Doctor ONLY routes */}
            <Route element={<ProtectedRoute allowedRoles={[3]} />}>
              <Route path="/dashboard/doctor" element={<DoctorDashboard />} />
            </Route>

            {/* Nurse ONLY routes */}
            <Route element={<ProtectedRoute allowedRoles={[4]} />}>
              <Route path="/dashboard/nurse" element={<NurseDashboard />} />
            </Route>

            {/* Receptionist ONLY routes */}
            <Route element={<ProtectedRoute allowedRoles={[5]} />}>
              <Route path="/dashboard/receptionist" element={<ReceptionistDashboard />} />
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </main>
  )
}

export default App
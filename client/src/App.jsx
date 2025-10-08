import { useState } from 'react'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom' 
import SignIn from './pages/auth/sign-in'
import PasswordChange from './pages/auth/password-change'
import PasswordReset from './pages/auth/password-reset'
import DoctorDashboard from './pages/dashboard/doctor-dashboard'
import GlobalAdminDashboard from './pages/dashboard/global-admin-dashboard'
import LocalAdminDashboard from './pages/dashboard/local-admin-dashboard'
import NurseDashboard from './pages/dashboard/nurse-dashboard'
import ReceptionistDashboard from './pages/dashboard/receptionist-dashboard'
import SystemSettings from './pages/settings/system-settings'
import UserSettings from './pages/settings/user-settings'
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
import PatientVisitList from './pages/visits/patient-visit-list'
import NewVisit from './pages/visits/new-visit'
import VisitDetails from './pages/visits/visit_details'

import useStore from './store/index.js'

const ProtectedRoute = ({ allowedRoles, children }) => {
  const user = useStore((state) => state.user) || '{}';
  const isAuthenticated = !!user.token
  
  if (!isAuthenticated) {
    return <Navigate to="/sign-in" replace />
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role_id)) {
    return <Navigate to="/unauthorized" replace />
  }
  
  return children ? children : <Outlet />
}


const RootLayout = () => {
  // const user = useStore((state) => state.user) || '{}';
  const  {user}  = useStore((state)=> state)
  console.log(user)

  // console.log(JSON.parse(localStorage.getItem("user")))


  if (!user || !user.role_id) {
    return <Navigate to="/sign-in" replace />;
  }
  
 
  const getDashboardRoute = (roleId) => {
    switch(roleId) {
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
  </div>
)

function App() {
  return (
    <main>
      <div>
        <Routes>
          
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          
          <Route path="/" element={<RootLayout />} />
          <Route path="/overview" element={<RootLayout />} />

          
          <Route element={<ProtectedRoute allowedRoles={[1]} />}>
            <Route path="/password-reset" element={<PasswordReset />} />
            <Route path="/dashboard/global-admin" element={<GlobalAdminDashboard />} />
            <Route path="/hospitals/register" element={<HospitalRegistration />} />
            <Route path="/hospitals/list" element={<HospitalList />} />
            <Route path="/hospitals/:patient_id" element={<HospitalDetails />} />
            <Route path="/hospitals/:patient_id/edit" element={<EditHospitals />} />
            <Route path="/hospital/profile" element={<HospitalProfile />} />
            <Route path="/users/register" element={<UserRegistration />} />
            <Route path="/users/list" element={<UserList />} />
            <Route path="/users/:patient_id" element={<UserDetails />} />
            <Route path="/users/:patient_id/edit" element={<EditUser />} />
            <Route path="/patients/register" element={<RegisterPatient />} />
            <Route path="/patients/list" element={<PatientList />} />
            <Route path="/patients/:patient_id" element={<PatientDetails />} />
            <Route path="/patients/:patient_id/edit" element={<EditPatient />} />
            <Route path="/visits/:visit_id" element={<VisitDetails />} />

            <Route path="/settings/system" element={<SystemSettings />} />
          </Route>

          
          <Route element={<ProtectedRoute allowedRoles={[2]} />}>
            <Route path="/password-reset" element={<PasswordReset />} />
            <Route path="/dashboard/local-admin" element={<LocalAdminDashboard />} />
            <Route path="/hospital/profile" element={<HospitalProfile />} />
            <Route path="/users/register" element={<UserRegistration />} />
            <Route path="/users/list" element={<UserList />} />
            <Route path="/users/:patient_id" element={<UserDetails />} />
            <Route path="/users/:patient_id/edit" element={<EditUser />} />
            <Route path="/patients/register" element={<RegisterPatient />} />
            <Route path="/patients/list" element={<PatientList />} />
            <Route path="/patients/:patient_id" element={<PatientDetails />} />
            <Route path="/patients/:patient_id/edit" element={<EditPatient />} />
            <Route path="/visits/new" element={<NewVisit />} />
            <Route path="/visits/:patient_id" element={<PatientVisitList />} />
            <Route path="/visits/:visit_id" element={<VisitDetails />} />
            
          </Route>

          
          <Route element={<ProtectedRoute allowedRoles={[3]} />}>
            <Route path="/dashboard/doctor" element={<DoctorDashboard />} />
            
            <Route path="/patients/:patient_id" element={<PatientDetails />} />
            <Route path="/patients/register" element={<RegisterPatient />} />
            <Route path="/patients/list" element={<PatientList />} />
            <Route path="/patients/:patient_id" element={<PatientDetails />} />
            <Route path="/patients/:patient_id/edit" element={<EditPatient />} />
            <Route path="/visits/new" element={<NewVisit />} />
            <Route path="/visits/:patient_id" element={<PatientVisitList />} />
            <Route path="/visits/:visit_id" element={<VisitDetails />} />
            
            
          </Route>

         
          <Route element={<ProtectedRoute allowedRoles={[4]} />}>
            <Route path="/dashboard/nurse" element={<NurseDashboard />} />
            <Route path="/patients/:patient_id" element={<PatientDetails />} />
            <Route path="/patients/register" element={<RegisterPatient />} />
            <Route path="/patients/list" element={<PatientList />} />
            <Route path="/patients/:patient_id" element={<PatientDetails />} />
            <Route path="/patients/:patient_id/edit" element={<EditPatient />} />
            <Route path="/visits/new" element={<NewVisit />} />
            <Route path="/visits/:patient_id" element={<PatientVisitList />} />
            <Route path="/visits/:visit_id" element={<VisitDetails />} />
          </Route>

          
          <Route element={<ProtectedRoute allowedRoles={[5]} />}>
            <Route path="/dashboard/receptionist" element={<ReceptionistDashboard />} />
            <Route path="/patients/register" element={<RegisterPatient />} />
            <Route path="/patients/list" element={<PatientList />} />
            <Route path="/patients/:patient_id" element={<PatientDetails />} />
            <Route path="/patients/:patient_id/edit" element={<EditPatient />} />
            <Route path="/visits/new" element={<NewVisit />} />
          </Route>

          
          <Route element={<ProtectedRoute allowedRoles={[1, 2, 3, 4, 5]} />}>
            <Route path="/settings/user" element={<UserSettings />} />
            <Route path="/password-change" element={<PasswordChange />} />
          </Route>

          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </main>
  )
}

export default App
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import AdminLogin from './pages/admin/AdminLogin'
import ProtectedAdminRoute from './components/auth/ProtectedAdminRoute'

// Student Area
import Landing from './pages/student/Landing'

import PersonalData from './pages/student/PersonalData'
import ParentData from './pages/student/ParentData'
import Documents from './pages/student/Documents'
import ReviewAndSubmit from './pages/student/ReviewAndSubmit'
import Success from './pages/student/Success'
import Dashboard from './pages/student/Dashboard'
import StudentLogin from './pages/student/StudentLogin'
import StudentRegister from './pages/student/StudentRegister'
import ProtectedStudentRoute from './components/auth/ProtectedStudentRoute'
import PrivacyPolicy from './pages/student/PrivacyPolicy'
import TermsOfService from './pages/student/TermsOfService'

// Admin Area
// Layouts
import AdminLayout from './components/layout/AdminLayout'
import RegistrationLayout from './components/layout/RegistrationLayout'
import StudentDashboardLayout from './components/layout/StudentDashboardLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminVerification from './pages/admin/AdminVerification'
import AdminVerificationDetail from './pages/admin/AdminVerificationDetail'
import AdminScanning from './pages/admin/AdminScanning'
import AdminScanningHistory from './pages/admin/AdminScanningHistory'
import AdminAdministration from './pages/admin/AdminAdministration'
import AdminReports from './pages/admin/AdminReports'

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" richColors />
      <Routes>
        {/* Student Routes (Public & Standalone) */}
        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<Navigate to="/register-siswa" replace />} />
        <Route path="/kebijakan-privasi" element={<PrivacyPolicy />} />
        <Route path="/ketentuan-layanan" element={<TermsOfService />} />

        {/* Student Registration Flow (Wrapped in RegistrationLayout & Protected) */}
        <Route element={<ProtectedStudentRoute />}>
          <Route element={<RegistrationLayout />}>
            <Route path="/step1" element={<PersonalData />} />
            <Route path="/step2" element={<ParentData />} />
            <Route path="/step3" element={<Documents />} />
            <Route path="/step4" element={<ReviewAndSubmit />} />
            <Route path="/success" element={<Success />} />
          </Route>
        </Route>

        {/* Admin Routes (Wrapped in AdminLayout) */}
        <Route path="/admin-login" element={<AdminLogin />} />

        <Route element={<ProtectedAdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/verification" element={<AdminVerification />} />
            <Route path="/verification/detail" element={<AdminVerificationDetail />} />
            <Route path="/scanning" element={<AdminScanning />} />
            <Route path="/scanning/history" element={<AdminScanningHistory />} />
            <Route path="/administration" element={<AdminAdministration />} />
            <Route path="/reports" element={<AdminReports />} />
          </Route>
        </Route>

        <Route path="/login-siswa" element={<StudentLogin />} />
        <Route path="/register-siswa" element={<StudentRegister />} />

        {/* Student Dashboard (Protected) */}
        <Route element={<ProtectedStudentRoute />}>
          <Route element={<StudentDashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App

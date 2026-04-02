import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import LandingPage from './pages/LandingPage';
import { PrivateRoute } from './components/PrivateRoute';
import { StudentLayout } from './layouts/StudentLayout';
import { TutorLayout } from './layouts/TutorLayout';
import { SearchTutorsPage } from './pages/student/SearchTutorsPage';
import { StudentDashboardPage } from './pages/student/StudentDashboardPage';
import { JobListPage } from './pages/tutor/JobListPage';
import { TutorDashboardPage } from './pages/tutor/TutorDashboardPage';
import { MyClassesPage } from './pages/shared/MyClassesPage';
import { PaymentPage } from './pages/shared/PaymentPage';
import { TutorProfilePage } from './pages/tutor/TutorProfilePage';
import { TutorInvitationsPage } from './pages/tutor/TutorInvitationsPage';
import { TutorApplicationsPage } from './pages/tutor/TutorApplicationsPage';
import { TutorDetailPage } from './pages/student/TutorDetailPage';
import { StudentProfilePage } from './pages/student/StudentProfilePage';
import { StudentApplicantsPage } from './pages/student/StudentApplicantsPage';
import { StudentRequestPage } from './pages/student/StudentRequestPage';
import UsersPage from './pages/UsersPage';
import NotFoundPage from './pages/error/NotFoundPage';
import ServerErrorPage from './pages/error/ServerErrorPage';
import { AIAssistant } from './components/AIAssistant';
import DeletedUsersPage from './pages/DeletedUsersPage';
import ClassesManagementPage from './pages/ClassesManagementPage';
import DashBoardPage from './pages/DashBoardPage';
import { OAuth2RedirectHandler } from './pages/auth/OAuth2RedirectHandler';
import { SelectRolePage } from './pages/auth/SelectRolePage';



const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/oauth2/redirect" element={<OAuth2RedirectHandler />} />
          <Route path="/oauth2/select-role" element={<SelectRolePage />} />
          {/* Admin Routes */}
          <Route element={<PrivateRoute allowedRole="ADMIN" />}>
            <Route path="/dashboard" element={<DashBoardPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/users/deleted" element={<DeletedUsersPage />} />
            <Route path="/admin/classes" element={<ClassesManagementPage />} />
          </Route>

          {/* Student Routes */}
          <Route path="/student" element={<PrivateRoute allowedRole="HOC_VIEN" />}>
            <Route element={<StudentLayout />}>
              <Route path="dashboard" element={<StudentDashboardPage />} />
              <Route path="search" element={<SearchTutorsPage />} />
              <Route path="classes" element={<MyClassesPage />} />
              <Route path="tutor/:id" element={<TutorDetailPage />} />
              <Route path="profile" element={<StudentProfilePage />} />
              <Route path="applicants" element={<StudentApplicantsPage />} />
              <Route path="requests" element={<StudentRequestPage />} />
              <Route path="payments" element={<PaymentPage />} />
            </Route>
          </Route>

          {/* Tutor Routes */}
          <Route path="/tutor" element={<PrivateRoute allowedRole="GIA_SU" />}>
            <Route element={<TutorLayout />}>
              <Route path="dashboard" element={<TutorDashboardPage />} />
              <Route path="jobs" element={<JobListPage />} />
              <Route path="invitations" element={<TutorInvitationsPage />} />
              <Route path="applications" element={<TutorApplicationsPage />} />
              <Route path="classes" element={<MyClassesPage />} />
              <Route path="profile" element={<TutorProfilePage />} />
              <Route path="payments" element={<PaymentPage />} />
            </Route>
          </Route>

          {/* Error Routes */}
          <Route path="/500" element={<ServerErrorPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        
        {/* Global Chat components */}
        <AIAssistant />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

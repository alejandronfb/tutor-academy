import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Onboarding from "./pages/Onboarding";
import DashboardLayout from "./components/DashboardLayout";
import DashboardHome from "./pages/dashboard/DashboardHome";
import CourseCatalog from "./pages/dashboard/CourseCatalog";
import CourseDetail from "./pages/dashboard/CourseDetail";
import PathwaysPage from "./pages/dashboard/PathwaysPage";
import CertificationsPage from "./pages/dashboard/CertificationsPage";
import BadgesPage from "./pages/dashboard/BadgesPage";
import OpportunitiesPage from "./pages/dashboard/OpportunitiesPage";
import ProficiencyPage from "./pages/dashboard/ProficiencyPage";
import ProfilePage from "./pages/dashboard/ProfilePage";
import TutorPublicProfile from "./pages/TutorPublicProfile";
import VerifyCertificate from "./pages/VerifyCertificate";
import NotFound from "./pages/NotFound";
import AdminLayout from "./components/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminTutors from "./pages/admin/AdminTutors";
import AdminCourses from "./pages/admin/AdminCourses";
import AdminCodes from "./pages/admin/AdminCodes";
import AdminOpportunities from "./pages/admin/AdminOpportunities";
import AdminBadges from "./pages/admin/AdminBadges";
import AdminCertifications from "./pages/admin/AdminCertifications";
import CreatorLayout from "./components/CreatorLayout";
import CreatorDashboard from "./pages/creator/CreatorDashboard";
import CreatorCourses from "./pages/creator/CreatorCourses";
import CreatorCourseEdit from "./pages/creator/CreatorCourseEdit";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="courses" element={<CourseCatalog />} />
            <Route path="courses/:courseId" element={<CourseDetail />} />
            <Route path="pathways" element={<PathwaysPage />} />
            <Route path="certifications" element={<CertificationsPage />} />
            <Route path="badges" element={<BadgesPage />} />
            <Route path="opportunities" element={<OpportunitiesPage />} />
            <Route path="proficiency" element={<ProficiencyPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="tutors" element={<AdminTutors />} />
            <Route path="courses" element={<AdminCourses />} />
            <Route path="codes" element={<AdminCodes />} />
            <Route path="opportunities" element={<AdminOpportunities />} />
            <Route path="badges" element={<AdminBadges />} />
            <Route path="certifications" element={<AdminCertifications />} />
          </Route>
          <Route path="/creator" element={<CreatorLayout />}>
            <Route index element={<CreatorDashboard />} />
            <Route path="courses" element={<CreatorCourses />} />
            <Route path="courses/:id" element={<CreatorCourseEdit />} />
          </Route>
          <Route path="/tutor/:id" element={<TutorPublicProfile />} />
          <Route path="/verify/:id" element={<VerifyCertificate />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

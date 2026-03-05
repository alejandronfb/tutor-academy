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
          <Route path="/tutor/:id" element={<TutorPublicProfile />} />
          <Route path="/verify/:id" element={<VerifyCertificate />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

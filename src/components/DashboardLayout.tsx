import { useState, useEffect } from "react";
import { useNavigate, Link, Outlet, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import { GraduationCap, LayoutDashboard, BookOpen, Route, Award, Trophy, User, Briefcase, LogOut, FlaskConical, Shield, Paintbrush, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/NotificationBell";

const NAV_ITEMS = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Learning Library", url: "/dashboard/courses", icon: BookOpen },
  { title: "Specializations", url: "/dashboard/pathways", icon: Route },
  { title: "Certifications", url: "/dashboard/certifications", icon: Award },
  { title: "Badges", url: "/dashboard/badges", icon: Trophy },
  { title: "Advanced Eligibility", url: "/dashboard/opportunities", icon: Briefcase },
  { title: "Skills Check", url: "/dashboard/proficiency", icon: FlaskConical },
  { title: "Resources", url: "/dashboard/resources", icon: FolderOpen },
  { title: "Profile", url: "/dashboard/profile", icon: User },
];

function AppSidebar() {
  const location = useLocation();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
        setIsAdmin(!!data);
        const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
        const hasCreator = (roles ?? []).some((r: any) => r.role === "content_creator");
        setIsCreator(!!data || hasCreator);
      }
    })();
  }, []);

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarContent>
        <div className="px-4 py-4">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="gradient-orange flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
              <GraduationCap className="h-4 w-4 text-accent-foreground" />
            </div>
            {!collapsed && (
              <span className="text-sm font-bold text-sidebar-foreground">
                LatinHire Academy
              </span>
            )}
          </Link>
        </div>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end={item.url === "/dashboard"} className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium">
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {isCreator && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/creator" className="hover:bg-sidebar-accent/50 text-primary" activeClassName="bg-sidebar-accent font-medium">
                      <Paintbrush className="mr-2 h-4 w-4" />
                      {!collapsed && <span>Content Studio</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/admin" className="hover:bg-sidebar-accent/50 text-amber-600 dark:text-amber-400" activeClassName="bg-sidebar-accent font-medium">
                      <Shield className="mr-2 h-4 w-4" />
                      {!collapsed && <span>Admin</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export default function DashboardLayout() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center justify-between border-b px-4 bg-card">
            <SidebarTrigger className="ml-0" />
            <div className="flex items-center gap-3">
              <NotificationBell />
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="mr-1 h-4 w-4" /> Sign Out
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto bg-secondary/30 p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

import { useAuth } from "@/features/auth/AuthProvider";
import { useTheme } from "@/components/theme-provider";
import { useSiteSettings } from "@/components/SiteSettingsProvider";
import { useLocation, Link } from "wouter";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { createApi } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LayoutDashboard,
  Users,
  FileText,
  ClipboardList,
  BookOpen,
  Bell,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  BarChart3,
  ChevronRight,
  Globe,
  Settings,
  GraduationCap,
} from "lucide-react";
import nfskillsLogo from "@assets/image_1772127253487.png";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

function getNavItems(role: string): NavItem[] {
  switch (role) {
    case "ADMIN":
      return [
        { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
        { label: "Users", href: "/users", icon: <Users className="w-4 h-4" /> },
        { label: "Tests", href: "/tests", icon: <ClipboardList className="w-4 h-4" /> },
        { label: "Results", href: "/results", icon: <BarChart3 className="w-4 h-4" /> },
        { label: "Domains", href: "/domains", icon: <Globe className="w-4 h-4" /> },
        { label: "Analytics", href: "/analytics", icon: <BarChart3 className="w-4 h-4" /> },
        { label: "Activity Logs", href: "/logs", icon: <FileText className="w-4 h-4" /> },
        { label: "Settings", href: "/settings", icon: <Settings className="w-4 h-4" /> },
      ];
    case "TEACHER":
      return [
        { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
        { label: "Students", href: "/students", icon: <GraduationCap className="w-4 h-4" /> },
        { label: "Tests", href: "/tests", icon: <ClipboardList className="w-4 h-4" /> },
        { label: "Results", href: "/results", icon: <BarChart3 className="w-4 h-4" /> },
        { label: "Settings", href: "/settings", icon: <Settings className="w-4 h-4" /> },
      ];
    case "STUDENT":
      return [
        { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
        { label: "My Tests", href: "/my-tests", icon: <ClipboardList className="w-4 h-4" /> },
        { label: "Results", href: "/results", icon: <BarChart3 className="w-4 h-4" /> },
      ];
    default:
      return [];
  }
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, token, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { settings } = useSiteSettings();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const api = createApi(token);

  const { data: notifications } = useQuery({
    queryKey: ["/api/notifications"],
    queryFn: () => api.get("/api/notifications"),
    refetchInterval: 30000,
  });

  const unreadCount = notifications?.filter((n: any) => !n.isRead).length || 0;
  const navItems = getNavItems(user?.role || "");
  const initials = user?.name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  const roleColor = user?.role === "ADMIN" ? "bg-chart-5/10 text-chart-5" :
    user?.role === "TEACHER" ? "bg-chart-1/10 text-chart-1" : "bg-chart-2/10 text-chart-2";

  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  return (
    <div className="flex h-screen w-full bg-background">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-sidebar border-r border-sidebar-border
          transform transition-transform duration-200 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-3 px-5 h-16 border-b border-sidebar-border">
            {settings?.logoBase64 ? (
              <img src={settings.logoBase64} alt={settings.schoolName} className="w-9 h-9 rounded-lg object-cover" />
            ) : (
              <img src={nfskillsLogo} alt="NFSkills" className="w-9 h-9 rounded-lg" />
            )}
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-sidebar-foreground text-sm tracking-tight">{settings?.schoolName || "NFSkills"}</h1>
              <p className="text-[11px] text-muted-foreground truncate">{settings?.sidebarSubtitle || "School Management"}</p>
            </div>
            <button
              className="lg:hidden text-muted-foreground"
              onClick={() => setSidebarOpen(false)}
              data-testid="button-close-sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <ScrollArea className="flex-1 py-4">
            <nav className="px-3 space-y-1">
              {navItems.map((item) => {
                const isActive = location === item.href || (item.href !== "/dashboard" && location.startsWith(item.href));
                return (
                  <Link key={item.href} href={item.href}>
                    <span
                      className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium cursor-pointer
                        transition-colors duration-150
                        ${isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        }
                      `}
                      data-testid={`link-nav-${item.label.toLowerCase().replace(/\s/g, "-")}`}
                    >
                      {item.icon}
                      {item.label}
                      {isActive && <ChevronRight className="w-3 h-3 ml-auto" />}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>

          <div className="p-3 border-t border-sidebar-border">
            <div className="flex items-center gap-3 px-3 py-2">
              <Avatar className="w-9 h-9">
                <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate" data-testid="text-user-name">{user?.name}</p>
                <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${roleColor}`}>
                  {user?.role}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex flex-col flex-1 min-w-0">
        <header className="flex items-center justify-between gap-1 h-16 px-4 border-b border-border bg-background sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <Button
              size="icon"
              variant="ghost"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
              data-testid="button-open-sidebar"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="hidden sm:block">
              <h2 className="text-lg font-semibold text-foreground" data-testid="text-page-title">
                {navItems.find((n) => location === n.href || (n.href !== "/dashboard" && location.startsWith(n.href)))?.label || "Dashboard"}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/notifications">
              <Button size="icon" variant="ghost" className="relative" data-testid="button-notifications">
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-bold">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Button>
            </Link>

            <Button
              size="icon"
              variant="ghost"
              onClick={toggleTheme}
              data-testid="button-toggle-theme"
            >
              {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </Button>

            <Button
              size="icon"
              variant="ghost"
              onClick={logout}
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-6 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

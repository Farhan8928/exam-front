import { Switch, Route, Redirect, useLocation } from "wouter";
import { useAuth } from "@/features/auth/AuthProvider";
import AppLayout from "@/layouts/AppLayout";
import LoginPage from "@/features/auth/LoginPage";
import ChangePasswordPage from "@/features/auth/ChangePasswordPage";
import AdminDashboard from "@/features/admin/pages/AdminDashboard";
import UsersPage from "@/features/admin/pages/UsersPage";
import ActivityLogsPage from "@/features/admin/pages/ActivityLogsPage";
import DomainsPage from "@/features/admin/pages/DomainsPage";
import SettingsPage from "@/features/admin/pages/SettingsPage";
import AnalyticsPage from "@/features/admin/pages/AnalyticsPage";
import TeacherDashboard from "@/features/teacher/pages/TeacherDashboard";
import StudentDashboard from "@/features/student/pages/StudentDashboard";
import MyTestsPage from "@/features/student/pages/MyTestsPage";
import TakeTestPage from "@/features/student/pages/TakeTestPage";
import ResultDetailPage from "@/features/student/pages/ResultDetailPage";
import TestsPage from "@/features/common/pages/TestsPage";
import TestDetailPage from "@/features/common/pages/TestDetailPage";
import ResultsPage from "@/features/common/pages/ResultsPage";
import NotificationsPage from "@/features/common/pages/NotificationsPage";
import { Loader2 } from "lucide-react";

function DashboardRouter() {
  const { user } = useAuth();
  switch (user?.role) {
    case "ADMIN": return <AdminDashboard />;
    case "TEACHER": return <TeacherDashboard />;
    case "STUDENT": return <StudentDashboard />;
    default: return <Redirect to="/dashboard" />;
  }
}

export default function AppRouter() {
  const { user, isLoading, mustChangePassword } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  if (mustChangePassword) {
    return <ChangePasswordPage />;
  }

  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={() => <Redirect to="/dashboard" />} />
        <Route path="/dashboard" component={DashboardRouter} />

        {(user.role === "ADMIN") && <Route path="/users" component={UsersPage} />}
        {(user.role === "ADMIN") && <Route path="/logs" component={ActivityLogsPage} />}
        {(user.role === "ADMIN") && <Route path="/domains" component={DomainsPage} />}
        {(user.role === "ADMIN") && <Route path="/analytics" component={AnalyticsPage} />}

        {(user.role === "TEACHER") && <Route path="/students" component={UsersPage} />}

        {(user.role === "ADMIN" || user.role === "TEACHER") && <Route path="/settings" component={SettingsPage} />}

        {(user.role === "TEACHER" || user.role === "ADMIN") && <Route path="/tests" component={TestsPage} />}
        {(user.role === "TEACHER" || user.role === "ADMIN") && <Route path="/tests/:id" component={TestDetailPage} />}

        {(user.role === "STUDENT") && <Route path="/my-tests" component={MyTestsPage} />}
        {(user.role === "STUDENT") && <Route path="/take-test/:id" component={TakeTestPage} />}

        <Route path="/results" component={ResultsPage} />
        <Route path="/results/:id" component={ResultDetailPage} />

        <Route path="/notifications" component={NotificationsPage} />

        <Route>{() => <Redirect to="/dashboard" />}</Route>
      </Switch>
    </AppLayout>
  );
}

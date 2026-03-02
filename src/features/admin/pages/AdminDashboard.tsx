import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { createApi } from "@/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, ClipboardList, FileText, TrendingUp, GraduationCap, BookOpen } from "lucide-react";

export default function AdminDashboard() {
  const { token } = useAuth();
  const api = createApi(token);

  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    queryFn: () => api.get("/api/dashboard/stats"),
  });

  const { data: recentLogs } = useQuery({
    queryKey: ["/api/activity-logs"],
    queryFn: () => api.get("/api/activity-logs?limit=5"),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Overview of your school system</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    { label: "Total Teachers", value: stats?.totalTeachers || 0, icon: <Users className="w-5 h-5" />, color: "text-chart-1", bg: "bg-chart-1/10" },
    { label: "Total Students", value: stats?.totalStudents || 0, icon: <GraduationCap className="w-5 h-5" />, color: "text-chart-2", bg: "bg-chart-2/10" },
    { label: "Total Tests", value: stats?.totalTests || 0, icon: <ClipboardList className="w-5 h-5" />, color: "text-chart-3", bg: "bg-chart-3/10" },
    { label: "Total Attempts", value: stats?.totalAttempts || 0, icon: <FileText className="w-5 h-5" />, color: "text-chart-4", bg: "bg-chart-4/10" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground" data-testid="text-dashboard-title">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Overview of your school system</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-1 mb-3">
                <span className="text-sm text-muted-foreground font-medium" data-testid={`text-stat-label-${stat.label.toLowerCase().replace(/\s/g, "-")}`}>
                  {stat.label}
                </span>
                <div className={`w-9 h-9 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center`}>
                  {stat.icon}
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground" data-testid={`text-stat-value-${stat.label.toLowerCase().replace(/\s/g, "-")}`}>
                {stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Performance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Average Score</span>
                <span className="text-lg font-semibold text-foreground" data-testid="text-avg-score">
                  {Math.round(stats?.avgScore || 0)}%
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.round(stats?.avgScore || 0))}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentLogs?.logs?.length > 0 ? (
              <div className="space-y-3">
                {recentLogs.logs.slice(0, 5).map((log: any) => (
                  <div key={log.id} className="flex items-start gap-3 text-sm" data-testid={`log-item-${log.id}`}>
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-foreground font-medium">{log.actionType.replace(/_/g, " ")}</p>
                      <p className="text-muted-foreground text-xs truncate">
                        {log.details || "No details"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No recent activity</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

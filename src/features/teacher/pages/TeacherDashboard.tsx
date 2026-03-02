import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { createApi } from "@/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { GraduationCap, ClipboardList, FileCheck, BarChart3, BookOpen, Users, FileText, TrendingUp, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function TeacherDashboard() {
  const { token, user } = useAuth();
  const api = createApi(token);

  const { data: studentsData, isLoading: sLoading } = useQuery({
    queryKey: ["/api/users", "STUDENT"],
    queryFn: () => api.get("/api/users?role=STUDENT&limit=50"),
  });

  const { data: testsData, isLoading: tLoading } = useQuery({
    queryKey: ["/api/tests"],
    queryFn: () => api.get("/api/tests?limit=100"),
  });

  const { data: questionsData, isLoading: qLoading } = useQuery({
    queryKey: ["/api/questions"],
    queryFn: () => api.get("/api/questions?limit=1"),
  });

  const { data: attemptsData, isLoading: aLoading } = useQuery({
    queryKey: ["/api/attempts", "dashboard"],
    queryFn: () => api.get("/api/attempts?period=all"),
  });

  const isLoading = sLoading || tLoading || qLoading || aLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}><CardContent className="p-5"><Skeleton className="h-4 w-24 mb-3" /><Skeleton className="h-8 w-16" /></CardContent></Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card><CardContent className="p-5"><Skeleton className="h-40 w-full" /></CardContent></Card>
          <Card><CardContent className="p-5"><Skeleton className="h-40 w-full" /></CardContent></Card>
        </div>
      </div>
    );
  }

  const totalStudents = studentsData?.total || 0;
  const tests = testsData?.tests || [];
  const totalTests = testsData?.total || 0;
  const activeTests = tests.filter((t: any) => t.status === "ACTIVE").length;
  const draftTests = tests.filter((t: any) => t.status === "DRAFT").length;
  const totalQuestions = questionsData?.total || 0;
  const recentAttempts = attemptsData || [];

  const avgScore = recentAttempts.length > 0
    ? Math.round(recentAttempts.reduce((sum: number, a: any) => sum + (a.totalMarks > 0 ? (a.score / a.totalMarks) * 100 : 0), 0) / recentAttempts.length)
    : 0;

  const stats = [
    { label: "My Students", value: totalStudents, icon: <GraduationCap className="w-5 h-5" />, color: "text-chart-1", bg: "bg-chart-1/10" },
    { label: "Total Questions", value: totalQuestions, icon: <BookOpen className="w-5 h-5" />, color: "text-chart-4", bg: "bg-chart-4/10" },
    { label: "Total Tests", value: totalTests, icon: <ClipboardList className="w-5 h-5" />, color: "text-chart-3", bg: "bg-chart-3/10" },
    { label: "Active Tests", value: activeTests, icon: <FileCheck className="w-5 h-5" />, color: "text-chart-2", bg: "bg-chart-2/10" },
    { label: "Avg Score", value: `${avgScore}%`, icon: <TrendingUp className="w-5 h-5" />, color: "text-chart-5", bg: "bg-chart-5/10" },
  ];

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  };

  const getScoreColor = (score: number, total: number) => {
    if (total === 0) return "text-muted-foreground";
    const pct = (score / total) * 100;
    if (pct >= 80) return "text-green-600 dark:text-green-400";
    if (pct >= 50) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground" data-testid="text-dashboard-title">
            Welcome, {user?.name?.split(" ")[0]}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your students and tests</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/students">
            <Button variant="secondary" data-testid="link-manage-students">
              <GraduationCap className="w-4 h-4 mr-2" />
              Students
            </Button>
          </Link>
          <Link href="/tests">
            <Button data-testid="link-create-test">
              <ClipboardList className="w-4 h-4 mr-2" />
              Create Test
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-1 mb-3">
                <span className="text-sm text-muted-foreground font-medium">{stat.label}</span>
                <div className={`w-9 h-9 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center`}>
                  {stat.icon}
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground" data-testid={`stat-${stat.label.toLowerCase().replace(/\s/g, "-")}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Recent Submissions
              </CardTitle>
              {recentAttempts.length > 0 && (
                <Link href="/results">
                  <Button variant="ghost" size="sm" className="text-xs" data-testid="link-view-all-results">
                    View All
                  </Button>
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {recentAttempts.length > 0 ? (
              <div className="space-y-3">
                {recentAttempts.slice(0, 6).map((attempt: any) => (
                  <Link key={attempt.id} href={`/results/${attempt.id}`}>
                    <div className="flex items-center justify-between gap-2 py-2 cursor-pointer hover-elevate rounded-md px-2" data-testid={`attempt-item-${attempt.id}`}>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{attempt.studentName}</p>
                        <p className="text-xs text-muted-foreground truncate">{attempt.testTitle}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-sm font-semibold ${getScoreColor(attempt.score, attempt.totalMarks)}`}>
                          {attempt.score}/{attempt.totalMarks}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                          <Clock className="w-3 h-3" />
                          {formatDate(attempt.submittedAt)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">No submissions yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                My Tests
              </CardTitle>
              {tests.length > 0 && (
                <Link href="/tests">
                  <Button variant="ghost" size="sm" className="text-xs" data-testid="link-view-all-tests">
                    View All
                  </Button>
                </Link>
              )}
            </div>
            {tests.length > 0 && (
              <div className="flex gap-3 mt-2">
                <Badge variant="default" className="text-xs">{activeTests} Active</Badge>
                <Badge variant="secondary" className="text-xs">{draftTests} Draft</Badge>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {tests.length > 0 ? (
              <div className="space-y-3">
                {tests.slice(0, 6).map((test: any) => {
                  const testAttempts = recentAttempts.filter((a: any) => a.testId === test.id);
                  const completions = testAttempts.length;
                  return (
                    <Link key={test.id} href={`/tests/${test.id}`}>
                      <div className="flex items-center justify-between gap-2 py-2 cursor-pointer hover-elevate rounded-md px-2" data-testid={`test-item-${test.id}`}>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">{test.title}</p>
                          <p className="text-xs text-muted-foreground">{test.duration} min {completions > 0 && `\u00B7 ${completions} submission${completions !== 1 ? "s" : ""}`}</p>
                        </div>
                        <Badge variant={test.status === "ACTIVE" ? "default" : "secondary"} className="shrink-0">
                          {test.status}
                        </Badge>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <ClipboardList className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">No tests created yet</p>
                <Link href="/tests">
                  <Button variant="outline" size="sm" className="mt-3" data-testid="button-create-first-test">
                    Create Your First Test
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

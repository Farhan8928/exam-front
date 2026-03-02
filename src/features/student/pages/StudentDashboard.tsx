import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { createApi } from "@/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ClipboardList, Trophy, Clock, Target } from "lucide-react";
import { Link } from "wouter";

export default function StudentDashboard() {
  const { token, user } = useAuth();
  const api = createApi(token);

  const { data: assignments, isLoading: aLoading } = useQuery({
    queryKey: ["/api/student/assignments"],
    queryFn: () => api.get("/api/student/assignments"),
  });

  const { data: attempts, isLoading: attLoading } = useQuery({
    queryKey: ["/api/student/attempts"],
    queryFn: () => api.get("/api/student/attempts"),
  });

  const isLoading = aLoading || attLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64 mb-2" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}><CardContent className="p-5"><Skeleton className="h-4 w-24 mb-3" /><Skeleton className="h-8 w-16" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  const pendingTests = assignments?.filter((a: any) => a.status === "ASSIGNED").length || 0;
  const completedTests = assignments?.filter((a: any) => a.status === "COMPLETED").length || 0;
  const totalAttempts = attempts?.length || 0;
  const avgScore = totalAttempts > 0
    ? Math.round(attempts.filter((a: any) => a.submittedAt).reduce((sum: number, a: any) => sum + ((a.score || 0) / (a.totalMarks || 1)) * 100, 0) / attempts.filter((a: any) => a.submittedAt).length)
    : 0;

  const stats = [
    { label: "Pending Tests", value: pendingTests, icon: <Clock className="w-5 h-5" />, color: "text-chart-4", bg: "bg-chart-4/10" },
    { label: "Completed", value: completedTests, icon: <Target className="w-5 h-5" />, color: "text-chart-2", bg: "bg-chart-2/10" },
    { label: "Avg Score", value: `${avgScore}%`, icon: <Trophy className="w-5 h-5" />, color: "text-chart-1", bg: "bg-chart-1/10" },
  ];

  const pendingAssignments = assignments?.filter((a: any) => a.status === "ASSIGNED" && a.test?.status === "ACTIVE") || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground" data-testid="text-dashboard-title">
          Welcome, {user?.name?.split(" ")[0]}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Track your progress and take assigned tests</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-1 mb-3">
                <span className="text-sm text-muted-foreground font-medium">{stat.label}</span>
                <div className={`w-9 h-9 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center`}>
                  {stat.icon}
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-primary" />
            Pending Tests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingAssignments.length > 0 ? (
            <div className="space-y-3">
              {pendingAssignments.map((assignment: any) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between gap-2 py-3 px-3 rounded-md bg-muted/30"
                  data-testid={`assignment-item-${assignment.id}`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{assignment.test?.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Duration: {assignment.test?.duration} min | Max attempts: {assignment.test?.maxAttempts}
                    </p>
                  </div>
                  <Link href={`/take-test/${assignment.test?.id}`}>
                    <Button size="sm" data-testid={`button-start-test-${assignment.test?.id}`}>
                      Start Test
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Target className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No pending tests</p>
              <p className="text-muted-foreground/70 text-xs mt-1">You're all caught up!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {attempts?.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="w-4 h-4 text-primary" />
              Recent Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {attempts.filter((a: any) => a.submittedAt).slice(0, 5).map((attempt: any) => {
                const pct = attempt.totalMarks > 0 ? Math.round((attempt.score / attempt.totalMarks) * 100) : 0;
                return (
                  <Link key={attempt.id} href={`/results/${attempt.id}`}>
                    <div className="flex items-center justify-between gap-2 py-2 cursor-pointer hover-elevate rounded-md px-2" data-testid={`result-item-${attempt.id}`}>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">Test #{attempt.testId}</p>
                        <p className="text-xs text-muted-foreground">
                          Score: {attempt.score}/{attempt.totalMarks}
                        </p>
                      </div>
                      <Badge variant={pct >= 70 ? "default" : pct >= 40 ? "secondary" : "destructive"}>
                        {pct}%
                      </Badge>
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { createApi } from "@/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, Trophy, Target, TrendingUp, Calendar, Search, User, Eye } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

type Period = "daily" | "weekly" | "monthly" | "yearly" | "all";

const periodLabels: Record<Period, string> = {
  daily: "Today",
  weekly: "Last 7 Days",
  monthly: "Last 30 Days",
  yearly: "Last Year",
  all: "All Time",
};

export default function ResultsPage() {
  const { token, user } = useAuth();
  const api = createApi(token);
  const [period, setPeriod] = useState<Period>("all");
  const [search, setSearch] = useState("");

  const isStaff = user?.role === "TEACHER" || user?.role === "ADMIN";

  const { data: staffAttempts, isLoading: staffLoading } = useQuery({
    queryKey: ["/api/attempts", period, search],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set("period", period);
      if (search.trim()) params.set("search", search.trim());
      return api.get(`/api/attempts?${params.toString()}`);
    },
    enabled: isStaff,
  });

  const { data: studentAttempts, isLoading: studentLoading } = useQuery({
    queryKey: ["/api/student/attempts"],
    queryFn: () => api.get("/api/student/attempts"),
    enabled: user?.role === "STUDENT",
  });

  if (isStaff) {
    const attempts = staffAttempts || [];
    const submitted = attempts.filter((a: any) => a.submittedAt);
    const totalScore = submitted.reduce((sum: number, a: any) => sum + (a.score || 0), 0);
    const totalMarks = submitted.reduce((sum: number, a: any) => sum + (a.totalMarks || 0), 0);
    const avgPct = totalMarks > 0 ? Math.round((totalScore / totalMarks) * 100) : 0;
    const uniqueStudents = new Set(submitted.map((a: any) => a.studentId)).size;

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground" data-testid="text-results-title">Student Results</h1>
            <p className="text-muted-foreground text-sm mt-1">
              View individual student performance and answer breakdowns
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by student name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search-student"
            />
          </div>
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="w-[180px]" data-testid="select-period">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily" data-testid="option-daily">Today</SelectItem>
              <SelectItem value="weekly" data-testid="option-weekly">Last 7 Days</SelectItem>
              <SelectItem value="monthly" data-testid="option-monthly">Last 30 Days</SelectItem>
              <SelectItem value="yearly" data-testid="option-yearly">Last Year</SelectItem>
              <SelectItem value="all" data-testid="option-all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-1 mb-3">
                <span className="text-sm text-muted-foreground font-medium">Total Results</span>
                <div className="w-9 h-9 rounded-lg bg-chart-1/10 text-chart-1 flex items-center justify-center">
                  <Target className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground" data-testid="text-total-results">{submitted.length}</p>
              <p className="text-xs text-muted-foreground mt-1">{periodLabels[period].toLowerCase()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-1 mb-3">
                <span className="text-sm text-muted-foreground font-medium">Students</span>
                <div className="w-9 h-9 rounded-lg bg-chart-2/10 text-chart-2 flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground" data-testid="text-unique-students">{uniqueStudents}</p>
              <p className="text-xs text-muted-foreground mt-1">unique students</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-1 mb-3">
                <span className="text-sm text-muted-foreground font-medium">Avg Score</span>
                <div className="w-9 h-9 rounded-lg bg-chart-3/10 text-chart-3 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground" data-testid="text-avg-score">{avgPct}%</p>
            </CardContent>
          </Card>
        </div>

        {staffLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Card key={i}><CardContent className="p-5"><Skeleton className="h-16 w-full" /></CardContent></Card>
            ))}
          </div>
        ) : submitted.length > 0 ? (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Individual Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-3 font-medium text-muted-foreground">Student</th>
                      <th className="text-left py-3 px-3 font-medium text-muted-foreground">Test</th>
                      <th className="text-center py-3 px-3 font-medium text-muted-foreground">Score</th>
                      <th className="text-center py-3 px-3 font-medium text-muted-foreground">Percentage</th>
                      <th className="text-center py-3 px-3 font-medium text-muted-foreground">Date</th>
                      <th className="text-center py-3 px-3 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submitted.map((attempt: any) => {
                      const pct = attempt.totalMarks > 0 ? Math.round((attempt.score / attempt.totalMarks) * 100) : 0;
                      return (
                        <tr key={attempt.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors" data-testid={`row-result-${attempt.id}`}>
                          <td className="py-3 px-3">
                            <div>
                              <p className="font-medium text-foreground" data-testid={`text-student-name-${attempt.id}`}>{attempt.studentName}</p>
                              <p className="text-xs text-muted-foreground">{attempt.studentEmail}</p>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <p className="font-medium text-foreground" data-testid={`text-test-title-${attempt.id}`}>{attempt.testTitle}</p>
                            {attempt.testDescription && (
                              <p className="text-xs text-muted-foreground">{attempt.testDescription}</p>
                            )}
                          </td>
                          <td className="text-center py-3 px-3">
                            <span className="text-foreground font-medium">{attempt.score}/{attempt.totalMarks}</span>
                          </td>
                          <td className="text-center py-3 px-3">
                            <Badge variant={pct >= 70 ? "default" : pct >= 40 ? "secondary" : "destructive"} data-testid={`badge-pct-${attempt.id}`}>
                              {pct}%
                            </Badge>
                          </td>
                          <td className="text-center py-3 px-3">
                            <span className="text-xs text-muted-foreground">
                              {new Date(attempt.submittedAt).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="text-center py-3 px-3">
                            <Link href={`/results/${attempt.id}`}>
                              <Button variant="ghost" size="sm" data-testid={`button-view-result-${attempt.id}`}>
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <BarChart3 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No results found</p>
              <p className="text-muted-foreground/70 text-xs mt-1">
                {search ? "Try a different search term" : "No student submissions yet"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  const isLoading = studentLoading;
  const submitted = studentAttempts?.filter((a: any) => a.submittedAt) || [];
  const totalScore = submitted.reduce((sum: number, a: any) => sum + (a.score || 0), 0);
  const totalMarks = submitted.reduce((sum: number, a: any) => sum + (a.totalMarks || 0), 0);
  const avgPct = totalMarks > 0 ? Math.round((totalScore / totalMarks) * 100) : 0;
  const bestScore = submitted.length > 0
    ? Math.max(...submitted.map((a: any) => a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0))
    : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-3">{[...Array(3)].map((_, i) => <Card key={i}><CardContent className="p-5"><Skeleton className="h-16 w-full" /></CardContent></Card>)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Results</h1>
        <p className="text-muted-foreground text-sm mt-1">{submitted.length} completed test(s)</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-1 mb-3">
              <span className="text-sm text-muted-foreground font-medium">Average Score</span>
              <div className="w-9 h-9 rounded-lg bg-chart-1/10 text-chart-1 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">{avgPct}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-1 mb-3">
              <span className="text-sm text-muted-foreground font-medium">Best Score</span>
              <div className="w-9 h-9 rounded-lg bg-chart-2/10 text-chart-2 flex items-center justify-center">
                <Trophy className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">{bestScore}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-1 mb-3">
              <span className="text-sm text-muted-foreground font-medium">Tests Taken</span>
              <div className="w-9 h-9 rounded-lg bg-chart-3/10 text-chart-3 flex items-center justify-center">
                <Target className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">{submitted.length}</p>
          </CardContent>
        </Card>
      </div>

      {submitted.length > 0 ? (
        <div className="space-y-3">
          {submitted.map((attempt: any) => {
            const pct = attempt.totalMarks > 0 ? Math.round((attempt.score / attempt.totalMarks) * 100) : 0;
            return (
              <Link key={attempt.id} href={`/results/${attempt.id}`}>
                <Card className="cursor-pointer hover-elevate">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-foreground" data-testid={`text-result-test-${attempt.id}`}>Test #{attempt.testId}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Score: {attempt.score}/{attempt.totalMarks} |
                          {new Date(attempt.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <Badge variant={pct >= 70 ? "default" : pct >= 40 ? "secondary" : "destructive"}>
                          {pct}%
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${pct >= 70 ? "bg-chart-2" : pct >= 40 ? "bg-chart-4" : "bg-destructive"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <BarChart3 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No results yet</p>
            <p className="text-muted-foreground/70 text-xs mt-1">Complete a test to see your results</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

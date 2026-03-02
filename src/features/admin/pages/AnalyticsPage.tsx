import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { createApi } from "@/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users, GraduationCap, TrendingUp, Eye, Award, ClipboardList,
  BarChart3, Calendar, BookOpen, Target, CheckCircle, XCircle, ExternalLink,
} from "lucide-react";
import { Link } from "wouter";

type Period = "daily" | "weekly" | "monthly" | "yearly" | "all";

const periodLabels: Record<Period, string> = {
  daily: "Today",
  weekly: "Last 7 Days",
  monthly: "Last 30 Days",
  yearly: "Last Year",
  all: "All Time",
};

export default function AnalyticsPage() {
  const { token } = useAuth();
  const api = createApi(token);
  const [period, setPeriod] = useState<Period>("monthly");
  const [activeTab, setActiveTab] = useState("students");
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ["/api/dashboard/students", period],
    queryFn: () => api.get(`/api/dashboard/students?period=${period}`),
  });

  const { data: teachers, isLoading: teachersLoading } = useQuery({
    queryKey: ["/api/dashboard/teachers", period],
    queryFn: () => api.get(`/api/dashboard/teachers?period=${period}`),
  });

  const { data: studentDetail, isLoading: detailLoading } = useQuery({
    queryKey: ["/api/dashboard/students", selectedStudentId, period],
    queryFn: () => api.get(`/api/dashboard/students/${selectedStudentId}?period=${period}`),
    enabled: !!selectedStudentId,
  });

  const studentSummary = students
    ? {
        total: students.length,
        active: students.filter((s: any) => s.totalAttempts > 0).length,
        totalAttempts: students.reduce((sum: number, s: any) => sum + (s.totalAttempts || 0), 0),
        avgScore: students.length > 0
          ? students.reduce((sum: number, s: any) => sum + (s.avgScore || 0), 0) / Math.max(1, students.filter((s: any) => s.totalAttempts > 0).length)
          : 0,
      }
    : null;

  const teacherSummary = teachers
    ? {
        total: teachers.length,
        active: teachers.filter((t: any) => t.totalTests > 0).length,
        totalTests: teachers.reduce((sum: number, t: any) => sum + (t.totalTests || 0), 0),
        totalAttempts: teachers.reduce((sum: number, t: any) => sum + (t.totalAttempts || 0), 0),
      }
    : null;

  function getScoreColor(score: number) {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    if (score >= 40) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  }

  function getScoreBadge(score: number) {
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    return "destructive";
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground" data-testid="text-analytics-title">
            Performance Analytics
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track student and teacher performance across your school
          </p>
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList data-testid="tabs-analytics">
          <TabsTrigger value="students" data-testid="tab-students">
            <GraduationCap className="w-4 h-4 mr-2" />
            Students
          </TabsTrigger>
          <TabsTrigger value="teachers" data-testid="tab-teachers">
            <Users className="w-4 h-4 mr-2" />
            Teachers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="space-y-4 mt-4">
          {studentsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i}><CardContent className="p-5"><Skeleton className="h-4 w-24 mb-3" /><Skeleton className="h-8 w-16" /></CardContent></Card>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-muted-foreground font-medium">Total Students</span>
                      <div className="w-9 h-9 rounded-lg bg-chart-1/10 text-chart-1 flex items-center justify-center">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-foreground" data-testid="text-total-students">{studentSummary?.total || 0}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-muted-foreground font-medium">Active Students</span>
                      <div className="w-9 h-9 rounded-lg bg-chart-2/10 text-chart-2 flex items-center justify-center">
                        <Target className="w-5 h-5" />
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-foreground" data-testid="text-active-students">{studentSummary?.active || 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">in {periodLabels[period].toLowerCase()}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-muted-foreground font-medium">Total Attempts</span>
                      <div className="w-9 h-9 rounded-lg bg-chart-3/10 text-chart-3 flex items-center justify-center">
                        <ClipboardList className="w-5 h-5" />
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-foreground" data-testid="text-student-attempts">{studentSummary?.totalAttempts || 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">in {periodLabels[period].toLowerCase()}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-muted-foreground font-medium">Avg. Score</span>
                      <div className="w-9 h-9 rounded-lg bg-chart-4/10 text-chart-4 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                    </div>
                    <p className={`text-3xl font-bold ${getScoreColor(studentSummary?.avgScore || 0)}`} data-testid="text-avg-student-score">
                      {Math.round(studentSummary?.avgScore || 0)}%
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    Individual Student Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {students && students.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-3 px-3 font-medium text-muted-foreground">Student</th>
                            <th className="text-center py-3 px-3 font-medium text-muted-foreground">Assigned</th>
                            <th className="text-center py-3 px-3 font-medium text-muted-foreground">Attempts</th>
                            <th className="text-center py-3 px-3 font-medium text-muted-foreground">Submitted</th>
                            <th className="text-center py-3 px-3 font-medium text-muted-foreground">Score</th>
                            <th className="text-center py-3 px-3 font-medium text-muted-foreground">Avg %</th>
                            <th className="text-center py-3 px-3 font-medium text-muted-foreground">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {students.map((s: any) => (
                            <tr key={s.studentId} className="border-b border-border/50 hover:bg-muted/30 transition-colors" data-testid={`row-student-${s.studentId}`}>
                              <td className="py-3 px-3">
                                <div>
                                  <p className="font-medium text-foreground">{s.studentName}</p>
                                  <p className="text-xs text-muted-foreground">{s.studentEmail}</p>
                                </div>
                              </td>
                              <td className="text-center py-3 px-3">
                                <span className="text-foreground">{s.totalAssigned}</span>
                              </td>
                              <td className="text-center py-3 px-3">
                                <span className="text-foreground">{s.totalAttempts}</span>
                              </td>
                              <td className="text-center py-3 px-3">
                                <span className="text-foreground">{s.submitted}</span>
                              </td>
                              <td className="text-center py-3 px-3">
                                <span className="text-foreground">
                                  {s.totalScore}/{s.totalMarks}
                                </span>
                              </td>
                              <td className="text-center py-3 px-3">
                                {s.totalAttempts > 0 ? (
                                  <Badge variant={getScoreBadge(s.avgScore)} data-testid={`badge-score-${s.studentId}`}>
                                    {Math.round(s.avgScore)}%
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </td>
                              <td className="text-center py-3 px-3">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedStudentId(s.studentId)}
                                  data-testid={`button-view-student-${s.studentId}`}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm text-center py-8">No students found</p>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="teachers" className="space-y-4 mt-4">
          {teachersLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i}><CardContent className="p-5"><Skeleton className="h-4 w-24 mb-3" /><Skeleton className="h-8 w-16" /></CardContent></Card>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-muted-foreground font-medium">Total Teachers</span>
                      <div className="w-9 h-9 rounded-lg bg-chart-1/10 text-chart-1 flex items-center justify-center">
                        <Users className="w-5 h-5" />
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-foreground" data-testid="text-total-teachers">{teacherSummary?.total || 0}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-muted-foreground font-medium">Active Teachers</span>
                      <div className="w-9 h-9 rounded-lg bg-chart-2/10 text-chart-2 flex items-center justify-center">
                        <Target className="w-5 h-5" />
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-foreground" data-testid="text-active-teachers">{teacherSummary?.active || 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">created tests in {periodLabels[period].toLowerCase()}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-muted-foreground font-medium">Total Tests Created</span>
                      <div className="w-9 h-9 rounded-lg bg-chart-3/10 text-chart-3 flex items-center justify-center">
                        <BookOpen className="w-5 h-5" />
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-foreground" data-testid="text-total-tests-created">{teacherSummary?.totalTests || 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">in {periodLabels[period].toLowerCase()}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-muted-foreground font-medium">Total Attempts</span>
                      <div className="w-9 h-9 rounded-lg bg-chart-4/10 text-chart-4 flex items-center justify-center">
                        <ClipboardList className="w-5 h-5" />
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-foreground" data-testid="text-teacher-total-attempts">{teacherSummary?.totalAttempts || 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">on their tests</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    Individual Teacher Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {teachers && teachers.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-3 px-3 font-medium text-muted-foreground">Teacher</th>
                            <th className="text-center py-3 px-3 font-medium text-muted-foreground">Tests Created</th>
                            <th className="text-center py-3 px-3 font-medium text-muted-foreground">Assignments</th>
                            <th className="text-center py-3 px-3 font-medium text-muted-foreground">Total Attempts</th>
                            <th className="text-center py-3 px-3 font-medium text-muted-foreground">Submitted</th>
                            <th className="text-center py-3 px-3 font-medium text-muted-foreground">Avg Student Score</th>
                          </tr>
                        </thead>
                        <tbody>
                          {teachers.map((t: any) => (
                            <tr key={t.teacherId} className="border-b border-border/50 hover:bg-muted/30 transition-colors" data-testid={`row-teacher-${t.teacherId}`}>
                              <td className="py-3 px-3">
                                <div>
                                  <p className="font-medium text-foreground">{t.teacherName}</p>
                                  <p className="text-xs text-muted-foreground">{t.teacherEmail}</p>
                                </div>
                              </td>
                              <td className="text-center py-3 px-3">
                                <span className="text-foreground font-medium">{t.totalTests}</span>
                              </td>
                              <td className="text-center py-3 px-3">
                                <span className="text-foreground">{t.totalAssignments}</span>
                              </td>
                              <td className="text-center py-3 px-3">
                                <span className="text-foreground">{t.totalAttempts}</span>
                              </td>
                              <td className="text-center py-3 px-3">
                                <span className="text-foreground">{t.submittedAttempts}</span>
                              </td>
                              <td className="text-center py-3 px-3">
                                {t.totalAttempts > 0 ? (
                                  <Badge variant={getScoreBadge(t.avgStudentScore)} data-testid={`badge-teacher-score-${t.teacherId}`}>
                                    {Math.round(t.avgStudentScore)}%
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm text-center py-8">No teachers found</p>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedStudentId} onOpenChange={(open) => !open && setSelectedStudentId(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" data-testid="text-student-detail-title">
              <GraduationCap className="w-5 h-5 text-primary" />
              {studentDetail?.student?.name || "Student"} — Test History
            </DialogTitle>
          </DialogHeader>

          {detailLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : (
            <div className="space-y-4">
              {studentDetail?.student && (
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                    {studentDetail.student.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{studentDetail.student.name}</p>
                    <p className="text-xs text-muted-foreground">{studentDetail.student.email}</p>
                  </div>
                  <Badge variant="outline" className="ml-auto">
                    {studentDetail.attempts?.length || 0} attempts
                  </Badge>
                </div>
              )}

              {studentDetail?.attempts?.length > 0 ? (
                <div className="space-y-3">
                  {studentDetail.attempts.map((a: any) => {
                    const pct = a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0;
                    const isSubmitted = !!a.submittedAt;
                    return (
                      <div key={a.attemptId} className="border border-border rounded-lg p-4 space-y-2" data-testid={`card-attempt-${a.attemptId}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-foreground">{a.testTitle}</p>
                            {a.testDescription && (
                              <p className="text-xs text-muted-foreground">{a.testDescription}</p>
                            )}
                          </div>
                          {isSubmitted ? (
                            <Badge variant={getScoreBadge(pct)}>
                              {a.score}/{a.totalMarks} ({pct}%)
                            </Badge>
                          ) : (
                            <Badge variant="outline">In Progress</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(a.startedAt).toLocaleDateString()}
                          </span>
                          {isSubmitted && (
                            <span className="flex items-center gap-1">
                              <CheckCircle className="w-3 h-3 text-green-500" />
                              Submitted {new Date(a.submittedAt).toLocaleString()}
                            </span>
                          )}
                          {!isSubmitted && (
                            <span className="flex items-center gap-1">
                              <XCircle className="w-3 h-3 text-orange-500" />
                              Not submitted
                            </span>
                          )}
                        </div>
                        {isSubmitted && (
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-yellow-500" : pct >= 40 ? "bg-orange-500" : "bg-red-500"
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <Link href={`/results/${a.attemptId}`} onClick={() => setSelectedStudentId(null)}>
                              <Button variant="ghost" size="sm" className="h-7 text-xs" data-testid={`button-view-answers-${a.attemptId}`}>
                                <ExternalLink className="w-3 h-3 mr-1" />
                                View Answers
                              </Button>
                            </Link>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-8">
                  No attempts found for {periodLabels[period].toLowerCase()}
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

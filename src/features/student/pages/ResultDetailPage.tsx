import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { createApi } from "@/api/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, XCircle, MinusCircle } from "lucide-react";
import { Link, useParams } from "wouter";

export default function ResultDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token, user } = useAuth();
  const api = createApi(token);

  const isStaff = user?.role === "TEACHER" || user?.role === "ADMIN";
  const apiUrl = isStaff ? `/api/attempts/${id}` : `/api/student/attempts/${id}`;

  const { data: attempt, isLoading } = useQuery({
    queryKey: [isStaff ? "/api/attempts" : "/api/student/attempts", id],
    queryFn: () => api.get(apiUrl),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!attempt) {
    return <div className="text-muted-foreground">Result not found</div>;
  }

  const pct = attempt.totalMarks > 0 ? Math.round((attempt.score / attempt.totalMarks) * 100) : 0;
  const answers: any[] = attempt.answers || [];
  const correctCount = answers.filter((a: any) => a.isCorrect).length;
  const wrongCount = answers.filter((a: any) => a.selectedAnswer !== null && !a.isCorrect).length;
  const skippedCount = answers.filter((a: any) => a.selectedAnswer === null).length;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/results">
          <Button size="icon" variant="ghost" data-testid="button-back">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Result Details</h1>
      </div>

      {isStaff && attempt.student && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                {attempt.student.name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-foreground" data-testid="text-student-name">{attempt.student.name}</p>
                <p className="text-xs text-muted-foreground">{attempt.student.email}</p>
              </div>
              {attempt.test && (
                <div className="ml-auto text-right">
                  <p className="text-sm font-medium text-foreground" data-testid="text-test-name">{attempt.test.title}</p>
                  {attempt.test.description && (
                    <p className="text-xs text-muted-foreground">{attempt.test.description}</p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm text-muted-foreground">Score</p>
              <p className="text-4xl font-bold text-foreground" data-testid="text-score">
                {attempt.score}/{attempt.totalMarks}
              </p>
            </div>
            <div className={`w-20 h-20 rounded-full flex items-center justify-center ${pct >= 70 ? "bg-chart-2/10" : pct >= 40 ? "bg-chart-4/10" : "bg-destructive/10"}`}>
              <span className={`text-2xl font-bold ${pct >= 70 ? "text-chart-2" : pct >= 40 ? "text-chart-4" : "text-destructive"}`}>
                {pct}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-6">
            <div className="text-center p-3 rounded-md bg-chart-2/5">
              <CheckCircle2 className="w-5 h-5 text-chart-2 mx-auto mb-1" />
              <p className="text-lg font-bold text-foreground">{correctCount}</p>
              <p className="text-xs text-muted-foreground">Correct</p>
            </div>
            <div className="text-center p-3 rounded-md bg-destructive/5">
              <XCircle className="w-5 h-5 text-destructive mx-auto mb-1" />
              <p className="text-lg font-bold text-foreground">{wrongCount}</p>
              <p className="text-xs text-muted-foreground">Wrong</p>
            </div>
            <div className="text-center p-3 rounded-md bg-muted/50">
              <MinusCircle className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
              <p className="text-lg font-bold text-foreground">{skippedCount}</p>
              <p className="text-xs text-muted-foreground">Skipped</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {answers.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Answer Breakdown</h2>
          {answers.map((ans: any, idx: number) => (
            <Card key={idx}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    ans.selectedAnswer === null
                      ? "bg-muted text-muted-foreground"
                      : ans.isCorrect
                      ? "bg-chart-2/10 text-chart-2"
                      : "bg-destructive/10 text-destructive"
                  }`}>
                    {ans.selectedAnswer === null ? (
                      <MinusCircle className="w-4 h-4" />
                    ) : ans.isCorrect ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <p className="text-sm font-medium text-foreground">
                      {idx + 1}. {ans.questionText}
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {ans.options?.map((opt: string, i: number) => {
                        const isCorrect = i === ans.correctAnswer;
                        const isSelected = i === ans.selectedAnswer;
                        let className = "text-xs px-2.5 py-1.5 rounded-md ";
                        if (isCorrect) {
                          className += "bg-chart-2/10 text-chart-2 font-medium";
                        } else if (isSelected && !isCorrect) {
                          className += "bg-destructive/10 text-destructive";
                        } else {
                          className += "bg-muted/50 text-muted-foreground";
                        }
                        return (
                          <div key={i} className={className}>
                            {String.fromCharCode(65 + i)}. {opt}
                            {isCorrect && " (correct)"}
                            {isSelected && !isCorrect && " (your answer)"}
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={ans.marksAwarded >= 0 ? "text-chart-2" : "text-destructive"}>
                        {ans.marksAwarded >= 0 ? "+" : ""}{ans.marksAwarded} marks
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

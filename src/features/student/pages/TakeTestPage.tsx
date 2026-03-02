import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { createApi } from "@/api/client";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Clock, ChevronLeft, ChevronRight, Send, Loader2, AlertCircle, CheckCircle2, Trophy } from "lucide-react";
import { useParams, useLocation } from "wouter";

interface QuestionData {
  id: number;
  questionText: string;
  options: string[];
  marks: number;
  negativeMarks: number;
}

export default function TakeTestPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const api = createApi(token);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [testInfo, setTestInfo] = useState<{ title: string; duration: number } | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [started, setStarted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);

  const startMutation = useMutation({
    mutationFn: () => api.post(`/api/student/tests/${id}/start`),
    onSuccess: (data) => {
      setAttemptId(data.attemptId);
      setQuestions(data.questions);
      setTestInfo(data.test);
      setTimeLeft(data.test.duration * 60);
      setStarted(true);
    },
    onError: (err: Error) => {
      toast({ title: "Cannot start test", description: err.message, variant: "destructive" });
    },
  });

  const submitMutation = useMutation({
    mutationFn: (submittedAnswers: { questionId: number; selectedAnswer: number | null }[]) =>
      api.post(`/api/student/attempts/${attemptId}/submit`, { answers: submittedAnswers }),
    onSuccess: (data) => {
      setSubmitted(true);
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/student/assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/student/attempts"] });
    },
    onError: (err: Error) => {
      toast({ title: "Submit failed", description: err.message, variant: "destructive" });
    },
  });

  const handleSubmit = useCallback(() => {
    if (submitMutation.isPending || submitted) return;
    const submittedAnswers = questions.map((q) => ({
      questionId: q.id,
      selectedAnswer: answers[q.id] !== undefined ? answers[q.id] : null,
    }));
    submitMutation.mutate(submittedAnswers);
  }, [answers, questions, submitMutation, submitted]);

  useEffect(() => {
    if (!started || submitted || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          handleSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [started, submitted, timeLeft, handleSubmit]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  if (submitted && result) {
    const pct = result.totalMarks > 0 ? Math.round((result.score / result.totalMarks) * 100) : 0;
    return (
      <div className="max-w-lg mx-auto mt-8">
        <Card>
          <CardContent className="p-8 text-center space-y-6">
            <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center ${pct >= 70 ? "bg-chart-2/10" : pct >= 40 ? "bg-chart-4/10" : "bg-destructive/10"}`}>
              <Trophy className={`w-10 h-10 ${pct >= 70 ? "text-chart-2" : pct >= 40 ? "text-chart-4" : "text-destructive"}`} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground" data-testid="text-result-title">Test Completed!</h2>
              <p className="text-muted-foreground text-sm mt-1">{testInfo?.title}</p>
            </div>
            <div className="py-4">
              <p className="text-5xl font-bold text-foreground" data-testid="text-result-score">{result.score}</p>
              <p className="text-muted-foreground text-sm mt-1">out of {result.totalMarks} marks</p>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${pct >= 70 ? "bg-chart-2" : pct >= 40 ? "bg-chart-4" : "bg-destructive"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <Badge variant={pct >= 70 ? "default" : pct >= 40 ? "secondary" : "destructive"} className="text-lg px-4 py-1">
              {pct}%
            </Badge>

            <div className="flex gap-3 justify-center pt-2">
              <Button variant="secondary" onClick={() => setLocation("/results")}>
                View Details
              </Button>
              <Button onClick={() => setLocation("/dashboard")}>
                Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <Card>
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 mx-auto flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Ready to Start?</h2>
              <p className="text-muted-foreground text-sm mt-2">
                Once you begin, the timer will start and you must complete the test within the given duration.
              </p>
            </div>
            <Button
              className="w-full"
              onClick={() => startMutation.mutate()}
              disabled={startMutation.isPending}
              data-testid="button-start-exam"
            >
              {startMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Starting...</>
              ) : (
                "Begin Test"
              )}
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setLocation("/my-tests")} data-testid="button-go-back">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / questions.length) * 100;
  const isLastQuestion = currentIndex === questions.length - 1;
  const isLowTime = timeLeft < 60;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between gap-2 sticky top-0 bg-background z-10 py-2">
        <div>
          <h2 className="text-sm font-semibold text-foreground">{testInfo?.title}</h2>
          <p className="text-xs text-muted-foreground">
            Question {currentIndex + 1} of {questions.length} | {answeredCount} answered
          </p>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-sm font-bold ${isLowTime ? "bg-destructive/10 text-destructive" : "bg-muted text-foreground"}`}>
          <Clock className="w-4 h-4" />
          <span data-testid="text-timer">{formatTime(timeLeft)}</span>
        </div>
      </div>

      <Progress value={progress} className="h-1.5" />

      <div className="flex gap-2 flex-wrap">
        {questions.map((q, i) => (
          <button
            key={q.id}
            onClick={() => setCurrentIndex(i)}
            className={`w-8 h-8 rounded-md text-xs font-medium transition-colors ${
              i === currentIndex
                ? "bg-primary text-primary-foreground"
                : answers[q.id] !== undefined
                ? "bg-chart-2/20 text-chart-2"
                : "bg-muted text-muted-foreground"
            }`}
            data-testid={`button-question-nav-${i}`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {currentQ && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-2 mb-4">
              <Badge variant="secondary">{currentQ.marks} mark(s)</Badge>
              {currentQ.negativeMarks > 0 && (
                <span className="text-xs text-destructive">-{currentQ.negativeMarks} for wrong answer</span>
              )}
            </div>

            <p className="text-foreground font-medium text-lg mb-6" data-testid="text-current-question">
              {currentQ.questionText}
            </p>

            <RadioGroup
              value={answers[currentQ.id] !== undefined ? String(answers[currentQ.id]) : ""}
              onValueChange={(v) => setAnswers({ ...answers, [currentQ.id]: Number(v) })}
              className="space-y-3"
            >
              {currentQ.options.map((opt, i) => (
                <label
                  key={i}
                  className={`flex items-center gap-3 p-3.5 rounded-md cursor-pointer border transition-colors ${
                    answers[currentQ.id] === i
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <RadioGroupItem value={String(i)} id={`answer-${i}`} data-testid={`radio-answer-${i}`} />
                  <Label htmlFor={`answer-${i}`} className="cursor-pointer flex-1 text-sm text-foreground">
                    <span className="font-medium text-muted-foreground mr-2">{String.fromCharCode(65 + i)}.</span>
                    {opt}
                  </Label>
                </label>
              ))}
            </RadioGroup>

            {answers[currentQ.id] !== undefined && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-3"
                onClick={() => {
                  const newAnswers = { ...answers };
                  delete newAnswers[currentQ.id];
                  setAnswers(newAnswers);
                }}
                data-testid="button-clear-answer"
              >
                Clear Answer
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between gap-2 pt-2">
        <Button
          variant="secondary"
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex(currentIndex - 1)}
          data-testid="button-prev-question"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>

        <div className="flex gap-2">
          {!isLastQuestion ? (
            <Button
              onClick={() => setCurrentIndex(currentIndex + 1)}
              data-testid="button-next-question"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitMutation.isPending}
              data-testid="button-submit-test"
            >
              {submitMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</>
              ) : (
                <><Send className="w-4 h-4 mr-2" />Submit Test</>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { createApi } from "@/api/client";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, BookOpen, Trash2, Loader2, Pencil, Upload } from "lucide-react";
import { parseBulkQuestions } from "@/lib/parseQuestions";

export default function QuestionsPage() {
  const { token } = useAuth();
  const api = createApi(token);
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [addMode, setAddMode] = useState<"manual" | "bulk">("manual");
  const [bulkText, setBulkText] = useState("");
  const [bulkSubject, setBulkSubject] = useState("");
  const [bulkTopic, setBulkTopic] = useState("");
  const [bulkMarks, setBulkMarks] = useState(2);
  const [bulkNegativeMarks, setBulkNegativeMarks] = useState(0);
  const [form, setForm] = useState({
    subject: "",
    topic: "",
    questionText: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
    marks: 2,
    negativeMarks: 0,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["/api/questions"],
    queryFn: () => api.get("/api/questions?limit=100"),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => {
      if (editingId) return api.patch(`/api/questions/${editingId}`, data);
      return api.post("/api/questions", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      resetForm();
      toast({ title: editingId ? "Question updated" : "Question created" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/questions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      toast({ title: "Question deleted" });
    },
  });

  const bulkCreateMutation = useMutation({
    mutationFn: async () => {
      const parsed = parseBulkQuestions(bulkText);
      if (parsed.length === 0) throw new Error("No valid questions found. Check the format.");
      const questionsPayload = parsed.map((q) => ({
        subject: bulkSubject,
        topic: bulkTopic,
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswer,
        marks: bulkMarks,
        negativeMarks: bulkNegativeMarks,
      }));
      return api.post("/api/questions/bulk", { questions: questionsPayload });
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      resetForm();
      toast({ title: `${result.count} questions added to question bank` });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  function resetForm() {
    setForm({ subject: "", topic: "", questionText: "", options: ["", "", "", ""], correctAnswer: 0, marks: 2, negativeMarks: 0 });
    setEditingId(null);
    setDialogOpen(false);
    setBulkText("");
    setAddMode("manual");
  }

  function editQuestion(q: any) {
    setForm({
      subject: q.subject,
      topic: q.topic,
      questionText: q.questionText,
      options: [...q.options],
      correctAnswer: q.correctAnswer,
      marks: q.marks,
      negativeMarks: q.negativeMarks,
    });
    setEditingId(q.id);
    setDialogOpen(true);
  }

  const subjects = [...new Set(data?.questions?.map((q: any) => q.subject) || [])];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Question Bank</h1>
          <p className="text-muted-foreground text-sm mt-1">{data?.total || 0} questions</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) resetForm(); else setDialogOpen(true); }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-question">
              <Plus className="w-4 h-4 mr-2" />
              Add Question
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Question" : "Add Questions"}</DialogTitle>
            </DialogHeader>
            {editingId ? (
              <form
                className="space-y-4"
                onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }}
              >
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="e.g. Mathematics" required data-testid="input-question-subject" />
                  </div>
                  <div className="space-y-2">
                    <Label>Topic</Label>
                    <Input value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder="e.g. Algebra" required data-testid="input-question-topic" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Question Text</Label>
                  <Textarea value={form.questionText} onChange={(e) => setForm({ ...form, questionText: e.target.value })} placeholder="Enter the question..." required data-testid="input-question-text" />
                </div>
                <div className="space-y-3">
                  <Label>Options (select the correct answer)</Label>
                  <RadioGroup value={String(form.correctAnswer)} onValueChange={(v) => setForm({ ...form, correctAnswer: Number(v) })}>
                    {form.options.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <RadioGroupItem value={String(i)} id={`opt-${i}`} data-testid={`radio-option-${i}`} />
                        <Input className="flex-1" value={opt} onChange={(e) => { const newOpts = [...form.options]; newOpts[i] = e.target.value; setForm({ ...form, options: newOpts }); }} placeholder={`Option ${String.fromCharCode(65 + i)}`} required data-testid={`input-option-${i}`} />
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Marks</Label>
                    <Input type="number" min={1} value={form.marks} onChange={(e) => setForm({ ...form, marks: Number(e.target.value) })} data-testid="input-question-marks" />
                  </div>
                  <div className="space-y-2">
                    <Label>Negative Marks</Label>
                    <Input type="number" min={0} value={form.negativeMarks} onChange={(e) => setForm({ ...form, negativeMarks: Number(e.target.value) })} data-testid="input-question-negative-marks" />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-question">
                  {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Update Question
                </Button>
              </form>
            ) : (
              <Tabs value={addMode} onValueChange={(v) => setAddMode(v as "manual" | "bulk")}>
                <TabsList className="w-full">
                  <TabsTrigger value="manual" className="flex-1"><Plus className="w-3.5 h-3.5 mr-1.5" />Manual</TabsTrigger>
                  <TabsTrigger value="bulk" className="flex-1"><Upload className="w-3.5 h-3.5 mr-1.5" />Bulk Add</TabsTrigger>
                </TabsList>
                <TabsContent value="manual">
                  <form
                    className="space-y-4"
                    onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }}
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Subject</Label>
                        <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="e.g. Mathematics" required data-testid="input-question-subject" />
                      </div>
                      <div className="space-y-2">
                        <Label>Topic</Label>
                        <Input value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder="e.g. Algebra" required data-testid="input-question-topic" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Question Text</Label>
                      <Textarea value={form.questionText} onChange={(e) => setForm({ ...form, questionText: e.target.value })} placeholder="Enter the question..." required data-testid="input-question-text" />
                    </div>
                    <div className="space-y-3">
                      <Label>Options (select the correct answer)</Label>
                      <RadioGroup value={String(form.correctAnswer)} onValueChange={(v) => setForm({ ...form, correctAnswer: Number(v) })}>
                        {form.options.map((opt, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <RadioGroupItem value={String(i)} id={`opt-${i}`} data-testid={`radio-option-${i}`} />
                            <Input className="flex-1" value={opt} onChange={(e) => { const newOpts = [...form.options]; newOpts[i] = e.target.value; setForm({ ...form, options: newOpts }); }} placeholder={`Option ${String.fromCharCode(65 + i)}`} required data-testid={`input-option-${i}`} />
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Marks</Label>
                        <Input type="number" min={1} value={form.marks} onChange={(e) => setForm({ ...form, marks: Number(e.target.value) })} data-testid="input-question-marks" />
                      </div>
                      <div className="space-y-2">
                        <Label>Negative Marks</Label>
                        <Input type="number" min={0} value={form.negativeMarks} onChange={(e) => setForm({ ...form, negativeMarks: Number(e.target.value) })} data-testid="input-question-negative-marks" />
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-question">
                      {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Create Question
                    </Button>
                  </form>
                </TabsContent>
                <TabsContent value="bulk">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Subject</Label>
                        <Input value={bulkSubject} onChange={(e) => setBulkSubject(e.target.value)} placeholder="e.g. CSS" required />
                      </div>
                      <div className="space-y-2">
                        <Label>Topic</Label>
                        <Input value={bulkTopic} onChange={(e) => setBulkTopic(e.target.value)} placeholder="e.g. Properties" required />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Marks per question</Label>
                        <Input type="number" min={1} value={bulkMarks} onChange={(e) => setBulkMarks(Number(e.target.value))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Negative marks</Label>
                        <Input type="number" min={0} value={bulkNegativeMarks} onChange={(e) => setBulkNegativeMarks(Number(e.target.value))} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Paste Questions</Label>
                      <Textarea
                        value={bulkText}
                        onChange={(e) => setBulkText(e.target.value)}
                        placeholder={`Paste your questions in this format:\n\n1. Which property sets the size of text?\nA) text-size\nB) font-style\nC) font-size\nD) text-style\nAnswer: C\n\n2. Which property makes text bold?\nA) font-weight\nB) font-style\nC) text-bold\nD) font-thickness\nAnswer: A`}
                        className="min-h-[200px] font-mono text-xs"
                        data-testid="input-bulk-questions"
                      />
                    </div>
                    {bulkText.trim() && (
                      <p className="text-xs text-muted-foreground">
                        {parseBulkQuestions(bulkText).length} question(s) detected
                      </p>
                    )}
                    <Button
                      className="w-full"
                      disabled={bulkCreateMutation.isPending || !bulkText.trim() || !bulkSubject.trim() || !bulkTopic.trim()}
                      onClick={() => bulkCreateMutation.mutate()}
                      data-testid="button-submit-bulk"
                    >
                      {bulkCreateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      <Upload className="w-4 h-4 mr-2" />
                      Add All Questions
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {subjects.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {subjects.map((s: string) => (
            <Badge key={s} variant="secondary">{s}</Badge>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : data?.questions?.length > 0 ? (
        <div className="space-y-3">
          {data.questions.map((q: any, idx: number) => (
            <Card key={q.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary">{q.subject}</Badge>
                      <Badge variant="secondary" className="bg-muted text-muted-foreground">{q.topic}</Badge>
                      <span className="text-xs text-muted-foreground">{q.marks} marks</span>
                      {q.negativeMarks > 0 && (
                        <span className="text-xs text-destructive">-{q.negativeMarks}</span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-foreground" data-testid={`text-question-${q.id}`}>
                      {idx + 1}. {q.questionText}
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(q.options as string[]).map((opt: string, i: number) => (
                        <div
                          key={i}
                          className={`text-xs px-2.5 py-1.5 rounded-md ${
                            i === q.correctAnswer
                              ? "bg-chart-2/10 text-chart-2 font-medium"
                              : "bg-muted/50 text-muted-foreground"
                          }`}
                        >
                          {String.fromCharCode(65 + i)}. {opt}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" onClick={() => editQuestion(q)} data-testid={`button-edit-question-${q.id}`}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(q.id)} data-testid={`button-delete-question-${q.id}`}>
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No questions yet</p>
            <p className="text-muted-foreground/70 text-xs mt-1">Create your first question to get started</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

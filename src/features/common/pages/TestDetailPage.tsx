import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { createApi } from "@/api/client";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Clock, FileCheck, Shuffle, Eye, ArrowLeft, Award, Plus, Pencil, Trash2, Loader2, AlertTriangle, CheckCircle, Download, FileText, Upload } from "lucide-react";
import { Link, useParams, useLocation } from "wouter";
import jsPDF from "jspdf";
import { parseBulkQuestions } from "@/lib/parseQuestions";

const MINIMUM_QUESTIONS = 10;

const emptyForm = {
  questionText: "",
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: "",
  correctAnswer: 0,
  marks: 2,
  negativeMarks: 0,
};

function generateTestPDF(testData: any, templateBase64: string | null) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const hasTemplate = !!templateBase64;
  const templateHeaderH = 38;
  const templateFooterH = 10;
  const topMargin = hasTemplate ? templateHeaderH + 5 : 15;
  const bottomMargin = hasTemplate ? templateFooterH + 10 : 15;
  const sideMargin = 20;
  const contentWidth = pageWidth - sideMargin * 2;
  const maxY = pageHeight - bottomMargin;
  let y = topMargin;

  const addTemplateBg = () => {
    if (templateBase64) {
      try {
        const fmt = templateBase64.includes("image/png") ? "PNG" : "JPEG";
        doc.addImage(templateBase64, fmt, 0, 0, pageWidth, pageHeight);
      } catch (e) {}
    }
  };

  const addContentBg = () => {
    if (hasTemplate) {
      doc.setFillColor(255, 255, 255);
      doc.rect(sideMargin - 5, topMargin - 3, contentWidth + 10, maxY - topMargin + 6, "F");
    }
  };

  addTemplateBg();
  addContentBg();

  const checkPageBreak = (needed: number) => {
    if (y + needed > maxY) {
      doc.addPage();
      addTemplateBg();
      addContentBg();
      y = topMargin;
    }
  };

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  const title = testData.title || "Test";
  doc.text(title, pageWidth / 2, y, { align: "center" });
  y += 8;

  if (testData.description) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(testData.description, pageWidth / 2, y, { align: "center" });
    y += 8;
  }

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const info = `Duration: ${testData.duration} min  |  Max Attempts: ${testData.maxAttempts}  |  Total Questions: ${testData.questions?.length || 0}`;
  doc.text(info, pageWidth / 2, y, { align: "center" });
  y += 4;

  doc.setDrawColor(180);
  doc.line(sideMargin, y, pageWidth - sideMargin, y);
  y += 10;

  const questions = testData.questions || [];
  questions.forEach((tq: any, idx: number) => {
    const q = tq.question || tq;
    const options = q.options || [];
    const qText = `Q${idx + 1}. ${q.questionText || "(No question text)"}`;

    checkPageBreak(50);

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    const qLines = doc.splitTextToSize(qText, contentWidth);
    doc.text(qLines, sideMargin, y);
    y += qLines.length * 5 + 2;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`(${q.marks || 0} marks${(q.negativeMarks || 0) > 0 ? `, -${q.negativeMarks} negative` : ""})`, sideMargin, y);
    y += 6;

    doc.setFontSize(10);
    const labels = ["A", "B", "C", "D"];
    options.forEach((opt: string, i: number) => {
      checkPageBreak(8);
      const optText = `    ${labels[i]}) ${opt}`;
      const optLines = doc.splitTextToSize(optText, contentWidth - 10);
      doc.text(optLines, sideMargin, y);
      y += optLines.length * 5 + 1;
    });

    y += 6;
  });

  checkPageBreak(20);
  y += 5;
  doc.setDrawColor(180);
  doc.line(sideMargin, y, pageWidth - sideMargin, y);
  y += 8;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Answer Key", sideMargin, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const labels = ["A", "B", "C", "D"];
  questions.forEach((tq: any, idx: number) => {
    const q = tq.question || tq;
    checkPageBreak(7);
    doc.text(`Q${idx + 1}: ${labels[q.correctAnswer] || "?"}`, sideMargin, y);
    y += 6;
  });

  const filename = `${title.replace(/[^a-zA-Z0-9]/g, "_")}_MCQ.pdf`;
  doc.save(filename);
}

export default function TestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token, user } = useAuth();
  const api = createApi(token);
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [downloadingWithTemplate, setDownloadingWithTemplate] = useState(false);
  const [editInfoDialogOpen, setEditInfoDialogOpen] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [bulkText, setBulkText] = useState("");
  const [bulkSubject, setBulkSubject] = useState("");
  const [bulkTopic, setBulkTopic] = useState("");
  const [bulkMarks, setBulkMarks] = useState(2);
  const [bulkNegativeMarks, setBulkNegativeMarks] = useState(0);
  const [addMode, setAddMode] = useState<"manual" | "bulk">("manual");
  const [editInfoForm, setEditInfoForm] = useState({
    title: "",
    description: "",
    duration: 30,
    maxAttempts: 1,
    publishRule: "INSTANT",
  });

  const { data: testData, isLoading } = useQuery({
    queryKey: ["/api/tests", id],
    queryFn: () => api.get(`/api/tests/${id}`),
  });

  const { data: attemptData } = useQuery({
    queryKey: ["/api/tests", id, "attempts"],
    queryFn: () => api.get(`/api/tests/${id}/attempts`),
    enabled: user?.role === "TEACHER" || user?.role === "ADMIN",
  });

  const { data: pdfTemplates = [] } = useQuery({
    queryKey: ["/api/pdf-templates"],
    queryFn: () => api.get("/api/pdf-templates"),
    enabled: user?.role === "TEACHER" || user?.role === "ADMIN",
  });

  const handleDownloadPDF = async (templateId: number | null) => {
    setDownloadingWithTemplate(true);
    try {
      let templateBase64: string | null = null;
      if (templateId) {
        const tpl = await api.get(`/api/pdf-templates/${templateId}`);
        templateBase64 = tpl.base64 || null;
      }
      generateTestPDF(testData, templateBase64);
      setTemplatePickerOpen(false);
    } catch (err) {
      toast({ title: "Error", description: "Failed to download PDF", variant: "destructive" });
    } finally {
      setDownloadingWithTemplate(false);
    }
  };

  const addQuestionMutation = useMutation({
    mutationFn: async (formData: typeof form) => {
      const questionPayload = {
        subject: testData?.title || "",
        topic: testData?.description || "",
        questionText: formData.questionText,
        options: [formData.optionA, formData.optionB, formData.optionC, formData.optionD],
        correctAnswer: formData.correctAnswer,
        marks: formData.marks,
        negativeMarks: formData.negativeMarks,
      };

      if (editingQuestionId) {
        await api.patch(`/api/questions/${editingQuestionId}`, questionPayload);
        return { updated: true };
      }

      const question = await api.post("/api/questions", questionPayload);
      await api.post(`/api/tests/${id}/questions`, { questionIds: [question.id] });
      return question;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tests", id] });
      resetForm();
      toast({ title: editingQuestionId ? "Question updated" : "Question added to test" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const bulkAddMutation = useMutation({
    mutationFn: async () => {
      const parsed = parseBulkQuestions(bulkText);
      if (parsed.length === 0) throw new Error("No valid questions found. Check the format.");
      const questionsPayload = parsed.map((q) => ({
        subject: testData?.title || "",
        topic: testData?.description || "",
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswer,
        marks: bulkMarks,
        negativeMarks: bulkNegativeMarks,
      }));
      const result = await api.post("/api/questions/bulk", { questions: questionsPayload });
      const questionIds = result.questions.map((q: any) => q.id);
      await api.post(`/api/tests/${id}/questions`, { questionIds });
      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tests", id] });
      setBulkText("");
      setQuestionDialogOpen(false);
      toast({ title: `${result.count} questions added to test` });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const removeQuestionMutation = useMutation({
    mutationFn: (questionId: number) =>
      api.delete(`/api/tests/${id}/questions/${questionId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tests", id] });
      toast({ title: "Question removed from test" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const activateMutation = useMutation({
    mutationFn: () => api.patch(`/api/tests/${id}`, { status: "ACTIVE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tests", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/tests"] });
      toast({ title: "Test activated successfully" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateInfoMutation = useMutation({
    mutationFn: (data: typeof editInfoForm) =>
      api.patch(`/api/tests/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tests", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/tests"] });
      setEditInfoDialogOpen(false);
      toast({ title: "Test details updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/api/tests/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tests"] });
      toast({ title: "Test deleted" });
      navigate("/tests");
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  function resetForm() {
    setForm(emptyForm);
    setEditingQuestionId(null);
    setQuestionDialogOpen(false);
    setBulkText("");
    setAddMode("manual");
  }

  function editQuestion(q: any) {
    const options = q.question?.options || q.options || [];
    setForm({
      questionText: q.question?.questionText || q.questionText || "",
      optionA: options[0] || "",
      optionB: options[1] || "",
      optionC: options[2] || "",
      optionD: options[3] || "",
      correctAnswer: q.question?.correctAnswer ?? q.correctAnswer ?? 0,
      marks: q.question?.marks ?? q.marks ?? 2,
      negativeMarks: q.question?.negativeMarks ?? q.negativeMarks ?? 0,
    });
    setEditingQuestionId(q.question?.id || q.questionId);
    setQuestionDialogOpen(true);
  }

  function openEditInfoDialog() {
    if (testData) {
      setEditInfoForm({
        title: testData.title || "",
        description: testData.description || "",
        duration: testData.duration || 30,
        maxAttempts: testData.maxAttempts || 1,
        publishRule: testData.publishRule || "INSTANT",
      });
      setEditInfoDialogOpen(true);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!testData) {
    return <div className="text-muted-foreground">Test not found</div>;
  }

  const questionCount = testData.questions?.length || 0;
  const canActivate = questionCount >= MINIMUM_QUESTIONS;
  const isTeacher = user?.role === "TEACHER" || user?.role === "ADMIN";
  const isDraft = testData.status === "DRAFT";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/tests">
          <Button size="icon" variant="ghost" data-testid="button-back">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-foreground truncate" data-testid="text-test-title">{testData.title}</h1>
            <Badge variant={testData.status === "ACTIVE" ? "default" : "secondary"}>{testData.status}</Badge>
          </div>
          {testData.description && (
            <p className="text-muted-foreground text-sm mt-1" data-testid="text-test-topic">{testData.description}</p>
          )}
          {user?.role === "ADMIN" && testData.creatorName && (
            <p className="text-xs text-muted-foreground mt-1" data-testid="text-test-creator">
              Created by: <span className="font-medium text-foreground">{testData.creatorName}</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isTeacher && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTemplatePickerOpen(true)}
              data-testid="button-download-pdf"
            >
              <Download className="w-4 h-4 mr-1" />
              Download PDF
            </Button>
          )}
          {isTeacher && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={openEditInfoDialog}
                data-testid="button-edit-test-info"
              >
                <Pencil className="w-4 h-4 mr-1" />
                Edit
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    data-testid="button-delete-test"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Test</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{testData.title}"? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel data-testid="button-cancel-delete-test">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteMutation.mutate()}
                      data-testid="button-confirm-delete-test"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{testData.duration}</p>
            <p className="text-xs text-muted-foreground">Minutes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <FileCheck className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{testData.maxAttempts}</p>
            <p className="text-xs text-muted-foreground">Max Attempts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Eye className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground" data-testid="text-question-count">{questionCount}</p>
            <p className="text-xs text-muted-foreground">Questions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Shuffle className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{testData.randomize ? "Yes" : "No"}</p>
            <p className="text-xs text-muted-foreground">Randomized</p>
          </CardContent>
        </Card>
      </div>

      {isTeacher && isDraft && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                {canActivate ? (
                  <CheckCircle className="w-4 h-4 text-chart-2" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                )}
                <span className="text-sm text-foreground" data-testid="text-question-validation">
                  {questionCount}/{MINIMUM_QUESTIONS} questions added
                  {!canActivate && ` — Minimum ${MINIMUM_QUESTIONS} questions required to activate`}
                </span>
              </div>
              <Button
                disabled={!canActivate || activateMutation.isPending}
                onClick={() => activateMutation.mutate()}
                data-testid="button-activate-test"
              >
                {activateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Activate Test
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isTeacher && isDraft && (
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-lg font-semibold text-foreground">Questions</h2>
          <Dialog open={questionDialogOpen} onOpenChange={(v) => { if (!v) resetForm(); else setQuestionDialogOpen(true); }}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-question">
                <Plus className="w-4 h-4 mr-2" />
                Add Question
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingQuestionId ? "Edit Question" : "Add Questions"}</DialogTitle>
              </DialogHeader>
              {editingQuestionId ? (
                <form
                  className="space-y-4"
                  onSubmit={(e) => { e.preventDefault(); addQuestionMutation.mutate(form); }}
                >
                  <div className="space-y-2">
                    <Label>Question Text</Label>
                    <Textarea
                      value={form.questionText}
                      onChange={(e) => setForm({ ...form, questionText: e.target.value })}
                      placeholder="Enter the question..."
                      required
                      data-testid="input-question-text"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label>Options</Label>
                    <div className="space-y-2">
                      {(["A", "B", "C", "D"] as const).map((letter, i) => {
                        const key = `option${letter}` as keyof typeof form;
                        return (
                          <div key={letter} className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Option {letter}</Label>
                            <Input
                              value={form[key] as string}
                              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                              placeholder={`Option ${letter}`}
                              required
                              data-testid={`input-option-${letter.toLowerCase()}`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Correct Answer</Label>
                    <Select value={String(form.correctAnswer)} onValueChange={(v) => setForm({ ...form, correctAnswer: Number(v) })}>
                      <SelectTrigger data-testid="select-correct-answer"><SelectValue placeholder="Select correct answer" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">A</SelectItem>
                        <SelectItem value="1">B</SelectItem>
                        <SelectItem value="2">C</SelectItem>
                        <SelectItem value="3">D</SelectItem>
                      </SelectContent>
                    </Select>
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
                  <Button type="submit" className="w-full" disabled={addQuestionMutation.isPending} data-testid="button-submit-question">
                    {addQuestionMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
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
                      onSubmit={(e) => { e.preventDefault(); addQuestionMutation.mutate(form); }}
                    >
                      <div className="space-y-2">
                        <Label>Question Text</Label>
                        <Textarea
                          value={form.questionText}
                          onChange={(e) => setForm({ ...form, questionText: e.target.value })}
                          placeholder="Enter the question..."
                          required
                          data-testid="input-question-text"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label>Options</Label>
                        <div className="space-y-2">
                          {(["A", "B", "C", "D"] as const).map((letter, i) => {
                            const key = `option${letter}` as keyof typeof form;
                            return (
                              <div key={letter} className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Option {letter}</Label>
                                <Input
                                  value={form[key] as string}
                                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                                  placeholder={`Option ${letter}`}
                                  required
                                  data-testid={`input-option-${letter.toLowerCase()}`}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Correct Answer</Label>
                        <Select value={String(form.correctAnswer)} onValueChange={(v) => setForm({ ...form, correctAnswer: Number(v) })}>
                          <SelectTrigger data-testid="select-correct-answer"><SelectValue placeholder="Select correct answer" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">A</SelectItem>
                            <SelectItem value="1">B</SelectItem>
                            <SelectItem value="2">C</SelectItem>
                            <SelectItem value="3">D</SelectItem>
                          </SelectContent>
                        </Select>
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
                      <Button type="submit" className="w-full" disabled={addQuestionMutation.isPending} data-testid="button-submit-question">
                        {addQuestionMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Add Question
                      </Button>
                    </form>
                  </TabsContent>
                  <TabsContent value="bulk">
                    <div className="space-y-4">
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
                        disabled={bulkAddMutation.isPending || !bulkText.trim()}
                        onClick={() => bulkAddMutation.mutate()}
                        data-testid="button-submit-bulk"
                      >
                        {bulkAddMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
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
      )}

      {testData.questions?.length > 0 && (user?.role === "TEACHER" || user?.role === "ADMIN") && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Questions ({questionCount})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testData.questions.map((tq: any, idx: number) => (
                <div key={tq.id} className="py-3 px-3 rounded-md bg-muted/30" data-testid={`question-row-${tq.question?.id || tq.questionId}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-muted-foreground font-mono text-xs shrink-0">
                          Q{String(idx + 1).padStart(2, "0")}
                        </span>
                        <Badge variant="secondary" className="text-[10px]">{tq.question?.marks || 0} marks</Badge>
                        {(tq.question?.negativeMarks || 0) > 0 && (
                          <span className="text-xs text-destructive">-{tq.question.negativeMarks}</span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-foreground mb-2" data-testid={`text-question-${tq.question?.id || tq.questionId}`}>
                        {tq.question?.questionText}
                      </p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {(tq.question?.options as string[] || []).map((opt: string, i: number) => (
                          <div
                            key={i}
                            className={`text-xs px-2.5 py-1.5 rounded-md ${
                              i === tq.question?.correctAnswer
                                ? "bg-chart-2/10 text-chart-2 font-medium"
                                : "bg-muted/50 text-muted-foreground"
                            }`}
                          >
                            {String.fromCharCode(65 + i)}. {opt}
                          </div>
                        ))}
                      </div>
                    </div>
                    {isTeacher && isDraft && (
                      <div className="flex gap-1 shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => editQuestion(tq)}
                          data-testid={`button-edit-question-${tq.question?.id || tq.questionId}`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              data-testid={`button-delete-question-${tq.question?.id || tq.questionId}`}
                            >
                              <Trash2 className="w-3.5 h-3.5 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Question</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to remove this question from the test?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => removeQuestionMutation.mutate(tq.question?.id || tq.questionId)}
                                data-testid="button-confirm-delete"
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {(!testData.questions || testData.questions.length === 0) && isTeacher && isDraft && (
        <Card>
          <CardContent className="p-12 text-center">
            <Plus className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No questions added yet</p>
            <p className="text-muted-foreground/70 text-xs mt-1">Click "Add Question" to start building your test</p>
          </CardContent>
        </Card>
      )}

      {attemptData?.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="w-4 h-4 text-primary" />
              Student Attempts ({attemptData.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {attemptData.map((attempt: any) => {
                const pct = attempt.totalMarks > 0 ? Math.round((attempt.score / attempt.totalMarks) * 100) : 0;
                return (
                  <Link key={attempt.id} href={attempt.submittedAt ? `/results/${attempt.id}` : "#"}>
                    <div className={`flex items-center justify-between gap-2 py-2 px-3 rounded-md bg-muted/30 ${attempt.submittedAt ? "cursor-pointer hover:bg-muted/50 transition-colors" : ""}`} data-testid={`attempt-row-${attempt.id}`}>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{attempt.student?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {attempt.submittedAt
                            ? `Submitted ${new Date(attempt.submittedAt).toLocaleDateString()}`
                            : "In progress"}
                        </p>
                      </div>
                      {attempt.submittedAt && (
                        <div className="text-right flex items-center gap-2">
                          <div>
                            <p className="text-sm font-bold text-foreground">{attempt.score}/{attempt.totalMarks}</p>
                            <Badge variant={pct >= 70 ? "default" : pct >= 40 ? "secondary" : "destructive"} className="text-[10px]">
                              {pct}%
                            </Badge>
                          </div>
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={editInfoDialogOpen} onOpenChange={setEditInfoDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Test Details</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => { e.preventDefault(); updateInfoMutation.mutate(editInfoForm); }}
          >
            <div className="space-y-2">
              <Label>Subject Name</Label>
              <Input
                value={editInfoForm.title}
                onChange={(e) => setEditInfoForm({ ...editInfoForm, title: e.target.value })}
                required
                data-testid="input-edit-title"
              />
            </div>
            <div className="space-y-2">
              <Label>Topic Name</Label>
              <Input
                value={editInfoForm.description}
                onChange={(e) => setEditInfoForm({ ...editInfoForm, description: e.target.value })}
                required
                data-testid="input-edit-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  min={5}
                  value={editInfoForm.duration}
                  onChange={(e) => setEditInfoForm({ ...editInfoForm, duration: Number(e.target.value) })}
                  data-testid="input-edit-duration"
                />
              </div>
              <div className="space-y-2">
                <Label>Max Attempts</Label>
                <Input
                  type="number"
                  min={1}
                  value={editInfoForm.maxAttempts}
                  onChange={(e) => setEditInfoForm({ ...editInfoForm, maxAttempts: Number(e.target.value) })}
                  data-testid="input-edit-max-attempts"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Result Publish Type</Label>
              <Select value={editInfoForm.publishRule} onValueChange={(v) => setEditInfoForm({ ...editInfoForm, publishRule: v })}>
                <SelectTrigger data-testid="select-edit-publish-rule">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INSTANT">Instant</SelectItem>
                  <SelectItem value="MANUAL">Manual</SelectItem>
                  <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full" disabled={updateInfoMutation.isPending} data-testid="button-submit-edit-info">
                {updateInfoMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={templatePickerOpen} onOpenChange={setTemplatePickerOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Download PDF</DialogTitle>
            <DialogDescription>Choose a template for your test PDF background, or download without one.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-auto py-3"
              onClick={() => handleDownloadPDF(null)}
              disabled={downloadingWithTemplate}
              data-testid="button-download-no-template"
            >
              <div className="w-10 h-14 rounded border border-border bg-white flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="text-left">
                <p className="font-medium text-sm">No Template</p>
                <p className="text-xs text-muted-foreground">Plain white background</p>
              </div>
            </Button>

            {pdfTemplates.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Templates</p>
                {pdfTemplates.map((t: any) => (
                  <Button
                    key={t.id}
                    variant="outline"
                    className="w-full justify-start gap-3 h-auto py-3"
                    onClick={() => handleDownloadPDF(t.id)}
                    disabled={downloadingWithTemplate}
                    data-testid={`button-download-template-${t.id}`}
                  >
                    <div className="w-10 h-14 rounded border border-border bg-primary/5 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Added {new Date(t.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {downloadingWithTemplate && (
                      <Loader2 className="w-4 h-4 animate-spin ml-auto" />
                    )}
                  </Button>
                ))}
              </div>
            )}

            {pdfTemplates.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">
                No templates uploaded yet. Admin can add templates in Settings.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

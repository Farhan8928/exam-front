import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { createApi } from "@/api/client";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, ClipboardList, Loader2, Users, Clock, FileCheck, Eye, Trash2 } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function TestsPage() {
  const { token, user } = useAuth();
  const api = createApi(token);
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState<number | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [form, setForm] = useState({
    subjectName: "",
    topicName: "",
    duration: 30,
    maxAttempts: 1,
    publishRule: "INSTANT",
  });

  const { data: testsData, isLoading } = useQuery({
    queryKey: ["/api/tests"],
    queryFn: () => api.get("/api/tests?limit=100"),
  });

  const { data: studentsData } = useQuery({
    queryKey: ["/api/users", "STUDENT"],
    queryFn: () => api.get("/api/users?role=STUDENT&limit=100"),
    enabled: user?.role === "TEACHER" || user?.role === "ADMIN",
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) =>
      api.post("/api/tests", {
        title: data.subjectName,
        description: data.topicName,
        duration: data.duration,
        maxAttempts: data.maxAttempts,
        publishRule: data.publishRule,
      }),
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tests"] });
      setDialogOpen(false);
      setForm({ subjectName: "", topicName: "", duration: 30, maxAttempts: 1, publishRule: "INSTANT" });
      toast({ title: "Test created as Draft" });
      navigate(`/tests/${result.id}`);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const assignMutation = useMutation({
    mutationFn: ({ testId, studentIds }: { testId: number; studentIds: number[] }) =>
      api.post(`/api/tests/${testId}/assign`, { studentIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tests"] });
      setAssignDialogOpen(false);
      setSelectedStudents([]);
      toast({ title: "Students assigned successfully" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => api.patch(`/api/tests/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tests"] });
      toast({ title: "Test status updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/tests/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tests"] });
      toast({ title: "Test deleted" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const toggleStudent = (id: number) => {
    setSelectedStudents((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id]
    );
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "default";
      case "DRAFT": return "secondary";
      case "SCHEDULED": return "secondary";
      case "EXPIRED": return "destructive";
      default: return "secondary" as const;
    }
  };

  const isTeacher = user?.role === "TEACHER" || user?.role === "ADMIN";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tests</h1>
          <p className="text-muted-foreground text-sm mt-1">{testsData?.total || 0} tests total</p>
        </div>
        {isTeacher && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-test">
                <Plus className="w-4 h-4 mr-2" />
                Create Test
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Test</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                Step 1: Enter basic test information. You will add questions in the next step.
              </p>
              <form
                className="space-y-4"
                onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }}
              >
                <div className="space-y-2">
                  <Label>Subject Name</Label>
                  <Input
                    value={form.subjectName}
                    onChange={(e) => setForm({ ...form, subjectName: e.target.value })}
                    placeholder="e.g. Mathematics"
                    required
                    data-testid="input-subject-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Topic Name</Label>
                  <Input
                    value={form.topicName}
                    onChange={(e) => setForm({ ...form, topicName: e.target.value })}
                    placeholder="e.g. Algebra - Chapter 5"
                    required
                    data-testid="input-topic-name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Duration (minutes)</Label>
                    <Input
                      type="number"
                      min={5}
                      value={form.duration}
                      onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
                      data-testid="input-test-duration"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Attempts</Label>
                    <Input
                      type="number"
                      min={1}
                      value={form.maxAttempts}
                      onChange={(e) => setForm({ ...form, maxAttempts: Number(e.target.value) })}
                      data-testid="input-test-max-attempts"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Result Publish Type</Label>
                  <Select value={form.publishRule} onValueChange={(v) => setForm({ ...form, publishRule: v })}>
                    <SelectTrigger data-testid="select-publish-rule">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INSTANT">Instant</SelectItem>
                      <SelectItem value="MANUAL">Manual</SelectItem>
                      <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-test">
                  {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save & Add Questions
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Students</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {studentsData?.users?.length > 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <Label>{selectedStudents.length} student(s) selected</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedStudents(selectedStudents.length === studentsData.users.length ? [] : studentsData.users.map((s: any) => s.id))}
                    data-testid="button-select-all-students"
                  >
                    {selectedStudents.length === studentsData.users.length ? "Deselect All" : "Select All"}
                  </Button>
                </div>
                <div className="max-h-64 overflow-y-auto space-y-2 border border-border rounded-md p-3">
                  {studentsData.users.map((student: any) => (
                    <label key={student.id} className="flex items-center gap-2 cursor-pointer text-sm">
                      <Checkbox
                        checked={selectedStudents.includes(student.id)}
                        onCheckedChange={() => toggleStudent(student.id)}
                        data-testid={`checkbox-student-${student.id}`}
                      />
                      <span className="text-foreground">{student.name}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{student.email}</span>
                    </label>
                  ))}
                </div>
                <Button
                  className="w-full"
                  disabled={selectedStudents.length === 0 || assignMutation.isPending}
                  onClick={() => selectedTestId && assignMutation.mutate({ testId: selectedTestId, studentIds: selectedStudents })}
                  data-testid="button-confirm-assign"
                >
                  {assignMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Assign to {selectedStudents.length} Student(s)
                </Button>
              </>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-4">No students available</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}><CardContent className="p-5"><Skeleton className="h-24 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : testsData?.tests?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {testsData.tests.map((test: any) => (
            <Card key={test.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground truncate" data-testid={`text-test-title-${test.id}`}>
                      {test.title}
                    </h3>
                    {test.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{test.description}</p>
                    )}
                    {user?.role === "ADMIN" && test.creatorName && (
                      <p className="text-xs text-muted-foreground mt-1" data-testid={`text-test-creator-${test.id}`}>
                        Created by: <span className="font-medium text-foreground">{test.creatorName}</span>
                      </p>
                    )}
                  </div>
                  <Badge variant={statusColor(test.status) as any}>
                    {test.status}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {test.duration} min
                  </span>
                  <span className="flex items-center gap-1">
                    <FileCheck className="w-3 h-3" />
                    {test.maxAttempts} attempt(s)
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Link href={`/tests/${test.id}`}>
                    <Button size="sm" variant="secondary" data-testid={`button-view-test-${test.id}`}>
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>
                  </Link>
                  {isTeacher && (
                    <>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => { setSelectedTestId(test.id); setAssignDialogOpen(true); }}
                        data-testid={`button-assign-test-${test.id}`}
                      >
                        <Users className="w-3 h-3 mr-1" />
                        Assign
                      </Button>
                      {test.status === "DRAFT" && (
                        <Button
                          size="sm"
                          onClick={() => statusMutation.mutate({ id: test.id, status: "ACTIVE" })}
                          data-testid={`button-activate-test-${test.id}`}
                        >
                          Activate
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            data-testid={`button-delete-test-${test.id}`}
                          >
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Test</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{test.title}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel data-testid="button-cancel-delete-test">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate(test.id)}
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
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <ClipboardList className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No tests found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

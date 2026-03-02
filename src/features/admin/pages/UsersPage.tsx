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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { UserPlus, Search, Shield, GraduationCap, BookOpen, Loader2, Eye, EyeOff, Copy, Check, KeyRound, Pencil, Trash2 } from "lucide-react";

export default function UsersPage() {
  const { token, user: authUser } = useAuth();
  const api = createApi(token);
  const { toast } = useToast();
  const isTeacher = authUser?.role === "TEACHER";
  const [roleFilter, setRoleFilter] = useState<string>(isTeacher ? "STUDENT" : "all");
  const [search, setSearch] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [emailMode, setEmailMode] = useState<"domain" | "manual">("domain");
  const [passwordMode, setPasswordMode] = useState<"auto" | "manual">("auto");
  const [showPassword, setShowPassword] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [copiedGenerated, setCopiedGenerated] = useState(false);

  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "STUDENT" as string,
    selectedDomain: "",
  });

  const [editForm, setEditForm] = useState({
    id: 0,
    name: "",
    email: "",
    role: "STUDENT" as string,
    isActive: true,
  });

  const queryParams = new URLSearchParams();
  if (roleFilter !== "all") queryParams.set("role", roleFilter);
  if (search) queryParams.set("search", search);
  queryParams.set("limit", "50");

  const { data, isLoading } = useQuery({
    queryKey: ["/api/users", roleFilter, search],
    queryFn: () => api.get(`/api/users?${queryParams.toString()}`),
  });

  const { data: domains } = useQuery({
    queryKey: ["/api/domains"],
    queryFn: () => api.get("/api/domains"),
  });

  const generateEmailFromName = (name: string, domain: string) => {
    if (!name.trim() || !domain) return "";
    const parts = name.trim().toLowerCase().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0]}.${parts[parts.length - 1]}@${domain}`;
    }
    return `${parts[0]}@${domain}`;
  };

  const createMutation = useMutation({
    mutationFn: async (formData: typeof createForm) => {
      let email = formData.email;
      if (emailMode === "domain" && formData.selectedDomain) {
        email = generateEmailFromName(formData.name, formData.selectedDomain);
      }
      const body: any = {
        name: formData.name,
        email,
        role: isTeacher ? "STUDENT" : formData.role,
      };
      if (passwordMode === "manual" && formData.password) {
        body.password = formData.password;
      }
      return api.post("/api/users", body);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      if (result.generatedPassword) {
        setGeneratedPassword(result.generatedPassword);
        setCopiedGenerated(false);
      } else {
        setCreateDialogOpen(false);
        resetCreateForm();
      }
      toast({ title: isTeacher ? "Student created successfully" : "User created successfully" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const editMutation = useMutation({
    mutationFn: (formData: typeof editForm) =>
      api.patch(`/api/users/${formData.id}`, {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        isActive: formData.isActive,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setEditDialogOpen(false);
      toast({ title: "User updated successfully" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "User deleted" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (id: number) => api.post(`/api/users/${id}/reset-password`),
    onSuccess: (result) => {
      setTempPassword(result.tempPassword);
      setCopiedPassword(false);
      setResetDialogOpen(true);
      toast({ title: "Password reset successfully" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      api.patch(`/api/users/${id}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
  });

  const resetCreateForm = () => {
    setCreateForm({ name: "", email: "", password: "", role: "STUDENT", selectedDomain: "" });
    setEmailMode("domain");
    setPasswordMode("auto");
    setShowPassword(false);
    setGeneratedPassword(null);
    setCopiedGenerated(false);
  };

  const openEditDialog = (user: any) => {
    setEditForm({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    });
    setEditDialogOpen(true);
  };

  const copyToClipboard = async (text: string, setCopied: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  const roleIcon = (role: string) => {
    switch (role) {
      case "ADMIN": return <Shield className="w-3 h-3" />;
      case "TEACHER": return <BookOpen className="w-3 h-3" />;
      default: return <GraduationCap className="w-3 h-3" />;
    }
  };

  const roleColor = (role: string) => {
    switch (role) {
      case "ADMIN": return "bg-chart-5/10 text-chart-5";
      case "TEACHER": return "bg-chart-1/10 text-chart-1";
      default: return "bg-chart-2/10 text-chart-2";
    }
  };

  const previewEmail = emailMode === "domain" && createForm.selectedDomain
    ? generateEmailFromName(createForm.name, createForm.selectedDomain)
    : createForm.email;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{isTeacher ? "Student Management" : "User Management"}</h1>
          <p className="text-muted-foreground text-sm mt-1">{data?.total || 0} {isTeacher ? "students" : "users"} total</p>
        </div>
        <Dialog
          open={createDialogOpen}
          onOpenChange={(open) => {
            setCreateDialogOpen(open);
            if (!open) resetCreateForm();
          }}
        >
          <DialogTrigger asChild>
            <Button data-testid="button-add-user">
              <UserPlus className="w-4 h-4 mr-2" />
              {isTeacher ? "Add Student" : "Add User"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{isTeacher ? "Create New Student" : "Create New User"}</DialogTitle>
            </DialogHeader>
            {generatedPassword ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  User created successfully. Share this temporary password with the user. They will be required to change it on first login.
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    value={generatedPassword}
                    readOnly
                    className="font-mono"
                    data-testid="input-generated-password"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => copyToClipboard(generatedPassword, setCopiedGenerated)}
                    data-testid="button-copy-generated-password"
                  >
                    {copiedGenerated ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <Button
                  className="w-full"
                  onClick={() => {
                    setCreateDialogOpen(false);
                    resetCreateForm();
                  }}
                  data-testid="button-done-create"
                >
                  Done
                </Button>
              </div>
            ) : (
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  createMutation.mutate(createForm);
                }}
              >
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    required
                    data-testid="input-user-name"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Email</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEmailMode(emailMode === "domain" ? "manual" : "domain")}
                      data-testid="button-toggle-email-mode"
                    >
                      {emailMode === "domain" ? "Enter manually" : "Use domain"}
                    </Button>
                  </div>
                  {emailMode === "domain" ? (
                    <div className="space-y-2">
                      <Select
                        value={createForm.selectedDomain}
                        onValueChange={(v) => setCreateForm({ ...createForm, selectedDomain: v })}
                      >
                        <SelectTrigger data-testid="select-domain">
                          <SelectValue placeholder="Select domain" />
                        </SelectTrigger>
                        <SelectContent>
                          {(domains || []).map((d: any) => (
                            <SelectItem key={d.id} value={d.domain}>{d.domain}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {previewEmail && (
                        <p className="text-xs text-muted-foreground" data-testid="text-email-preview">
                          Email: {previewEmail}
                        </p>
                      )}
                    </div>
                  ) : (
                    <Input
                      type="email"
                      value={createForm.email}
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                      required
                      data-testid="input-user-email"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Password</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setPasswordMode(passwordMode === "auto" ? "manual" : "auto")}
                      data-testid="button-toggle-password-mode"
                    >
                      {passwordMode === "auto" ? "Enter manually" : "Auto-generate"}
                    </Button>
                  </div>
                  {passwordMode === "auto" ? (
                    <p className="text-xs text-muted-foreground" data-testid="text-auto-password-info">
                      A temporary password will be auto-generated and shown after creation.
                    </p>
                  ) : (
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={createForm.password}
                        onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                        required
                        minLength={6}
                        data-testid="input-user-password"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        onClick={() => setShowPassword(!showPassword)}
                        data-testid="button-toggle-password-visibility"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  )}
                </div>

                {!isTeacher && (
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select
                      value={createForm.role}
                      onValueChange={(v) => setCreateForm({ ...createForm, role: v })}
                    >
                      <SelectTrigger data-testid="select-user-role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="STUDENT">Student</SelectItem>
                        <SelectItem value="TEACHER">Teacher</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={createMutation.isPending || (emailMode === "domain" && !createForm.selectedDomain)}
                  data-testid="button-submit-user"
                >
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {isTeacher ? "Create Student" : "Create User"}
                </Button>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={isTeacher ? "Search students..." : "Search users..."}
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search-users"
          />
        </div>
        {!isTeacher && (
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[140px]" data-testid="select-role-filter">
              <SelectValue placeholder="Filter role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="TEACHER">Teacher</SelectItem>
              <SelectItem value="STUDENT">Student</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-12 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : data?.users?.length > 0 ? (
        <div className="space-y-2">
          {data.users.map((u: any) => (
            <Card key={u.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${roleColor(u.role)}`}>
                      {roleIcon(u.role)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate" data-testid={`text-user-name-${u.id}`}>{u.name}</p>
                      <p className="text-xs text-muted-foreground truncate" data-testid={`text-user-email-${u.id}`}>{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    {!isTeacher && (
                      <Badge variant="secondary" className={roleColor(u.role)}>
                        {u.role}
                      </Badge>
                    )}
                    {!isTeacher && (
                      <>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={u.isActive}
                            onCheckedChange={(checked) => toggleMutation.mutate({ id: u.id, isActive: checked })}
                            data-testid={`switch-active-${u.id}`}
                          />
                          <span className="text-xs text-muted-foreground">{u.isActive ? "Active" : "Inactive"}</span>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => resetPasswordMutation.mutate(u.id)}
                          disabled={resetPasswordMutation.isPending}
                          data-testid={`button-reset-password-${u.id}`}
                        >
                          <KeyRound className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEditDialog(u)}
                          data-testid={`button-edit-user-${u.id}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              data-testid={`button-delete-user-${u.id}`}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete User</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {u.name}? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate(u.id)}
                                data-testid="button-confirm-delete"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                    {isTeacher && (
                      <Badge variant="secondary" className="bg-chart-2/10 text-chart-2">
                        {u.isActive ? "Active" : "Inactive"}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <GraduationCap className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">{isTeacher ? "No students found" : "No users found"}</p>
          </CardContent>
        </Card>
      )}

      {!isTeacher && (
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                editMutation.mutate(editForm);
              }}
            >
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                  data-testid="input-edit-name"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  required
                  data-testid="input-edit-email"
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={editForm.role}
                  onValueChange={(v) => setEditForm({ ...editForm, role: v })}
                >
                  <SelectTrigger data-testid="select-edit-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STUDENT">Student</SelectItem>
                    <SelectItem value="TEACHER">Teacher</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3">
                <Label>Active</Label>
                <Switch
                  checked={editForm.isActive}
                  onCheckedChange={(checked) => setEditForm({ ...editForm, isActive: checked })}
                  data-testid="switch-edit-active"
                />
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={editMutation.isPending}
                  data-testid="button-submit-edit"
                >
                  {editMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {!isTeacher && (
        <Dialog
          open={resetDialogOpen}
          onOpenChange={(open) => {
            setResetDialogOpen(open);
            if (!open) setTempPassword(null);
          }}
        >
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Password Reset</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                The password has been reset. Share this temporary password with the user. They will be required to change it on next login.
              </p>
              <div className="flex items-center gap-2">
                <Input
                  value={tempPassword || ""}
                  readOnly
                  className="font-mono"
                  data-testid="input-temp-password"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => tempPassword && copyToClipboard(tempPassword, setCopiedPassword)}
                  data-testid="button-copy-temp-password"
                >
                  {copiedPassword ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <Button
                className="w-full"
                onClick={() => {
                  setResetDialogOpen(false);
                  setTempPassword(null);
                }}
                data-testid="button-done-reset"
              >
                Done
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

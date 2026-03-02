import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { useSiteSettings, THEME_PRESETS } from "@/components/SiteSettingsProvider";
import { createApi } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Loader2, Upload, X, Palette, Type, Image, FileText, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const themeOptions = [
  { value: "blue", label: "Blue", color: "hsl(217 91% 45%)" },
  { value: "green", label: "Green", color: "hsl(142 71% 35%)" },
  { value: "purple", label: "Purple", color: "hsl(262 83% 50%)" },
  { value: "orange", label: "Orange", color: "hsl(25 95% 50%)" },
  { value: "red", label: "Red", color: "hsl(0 72% 45%)" },
  { value: "teal", label: "Teal", color: "hsl(174 72% 35%)" },
];

const MAX_TEMPLATES = 5;

export default function SettingsPage() {
  const { token } = useAuth();
  const { settings, refetch } = useSiteSettings();
  const { toast } = useToast();
  const api = createApi(token);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const templateInputRef = useRef<HTMLInputElement>(null);

  const [schoolName, setSchoolName] = useState("");
  const [loginTitle, setLoginTitle] = useState("");
  const [loginSubtitle, setLoginSubtitle] = useState("");
  const [sidebarSubtitle, setSidebarSubtitle] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [themePreset, setThemePreset] = useState("blue");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ["/api/pdf-templates"],
    queryFn: () => api.get("/api/pdf-templates"),
  });

  const uploadTemplateMutation = useMutation({
    mutationFn: (data: { name: string; base64: string }) =>
      api.post("/api/pdf-templates", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pdf-templates"] });
      toast({ title: "Template uploaded successfully" });
      setUploading(false);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      setUploading(false);
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/pdf-templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pdf-templates"] });
      toast({ title: "Template deleted" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  useEffect(() => {
    if (settings) {
      setSchoolName(settings.schoolName || "");
      setLoginTitle(settings.loginTitle || "");
      setLoginSubtitle(settings.loginSubtitle || "");
      setSidebarSubtitle(settings.sidebarSubtitle || "");
      setLogoPreview(settings.logoBase64 || null);
      setLogoBase64(settings.logoBase64 || null);
      setThemePreset(settings.themePreset || "blue");
    }
  }, [settings]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      toast({ title: "File too large", description: "Logo must be under 500KB", variant: "destructive" });
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image file", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setLogoPreview(base64);
      setLogoBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setLogoPreview(null);
    setLogoBase64(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleTemplateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Template must be under 5MB", variant: "destructive" });
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file type", description: "Please upload an image file (PNG, JPG)", variant: "destructive" });
      return;
    }

    if (templates.length >= MAX_TEMPLATES) {
      toast({ title: "Limit reached", description: `Maximum ${MAX_TEMPLATES} templates allowed. Delete one first.`, variant: "destructive" });
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const name = file.name.replace(/\.[^.]+$/, "");
      uploadTemplateMutation.mutate({ name, base64 });
    };
    reader.readAsDataURL(file);
    if (templateInputRef.current) templateInputRef.current.value = "";
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch("/api/settings", {
        schoolName,
        loginTitle,
        loginSubtitle,
        sidebarSubtitle,
        logoBase64,
        themePreset,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      refetch();
      toast({ title: "Settings saved", description: "Your changes have been applied" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to save settings", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground" data-testid="text-settings-title">Site Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Customize your school's branding and appearance</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="w-5 h-5" />
            Logo
          </CardTitle>
          <CardDescription>Upload your school logo (max 500KB, PNG/JPG)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-6">
            {logoPreview ? (
              <div className="relative">
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="w-20 h-20 rounded-xl object-cover border border-border"
                  data-testid="img-logo-preview"
                />
                <button
                  onClick={removeLogo}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs"
                  data-testid="button-remove-logo"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="w-20 h-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center text-muted-foreground">
                <Image className="w-8 h-8" />
              </div>
            )}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
                data-testid="input-logo-upload"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                data-testid="button-upload-logo"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Logo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            PDF Templates
          </CardTitle>
          <CardDescription>
            Upload template images (PNG/JPG) to use as backgrounds for test PDFs.
            You can add up to {MAX_TEMPLATES} templates. When downloading a test PDF, you'll choose which template to use.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {templates.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {templates.map((t: any) => (
                <div key={t.id} className="relative group">
                  <div className="w-full aspect-[595/842] rounded-lg border border-border bg-muted flex items-center justify-center overflow-hidden">
                    <div className="text-center p-2">
                      <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground truncate max-w-full" data-testid={`text-template-name-${t.id}`}>
                        {t.name}
                      </p>
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        data-testid={`button-delete-template-${t.id}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Template</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete the template "{t.name}"?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteTemplateMutation.mutate(t.id)}
                          data-testid="button-confirm-delete-template"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-4">
            <input
              ref={templateInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              className="hidden"
              onChange={handleTemplateUpload}
              data-testid="input-template-upload"
            />
            <Button
              variant="outline"
              onClick={() => templateInputRef.current?.click()}
              disabled={uploading || templates.length >= MAX_TEMPLATES}
              data-testid="button-upload-template"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              Upload Template
            </Button>
            <span className="text-xs text-muted-foreground">
              {templates.length}/{MAX_TEMPLATES} templates
            </span>
          </div>

          <p className="text-xs text-muted-foreground">
            Use A4-sized images (595×842 px or similar ratio) for best results.
            Templates are used as full-page backgrounds. Test content is placed with 15px spacing from edges.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="w-5 h-5" />
            Text Content
          </CardTitle>
          <CardDescription>Customize the text displayed on your site</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="schoolName">School Name</Label>
            <Input
              id="schoolName"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              placeholder="e.g. NFSkills Academy"
              data-testid="input-school-name"
            />
            <p className="text-xs text-muted-foreground">Shown in the sidebar header</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="loginTitle">Login Page Title</Label>
            <Input
              id="loginTitle"
              value={loginTitle}
              onChange={(e) => setLoginTitle(e.target.value)}
              placeholder="e.g. NFSkills"
              data-testid="input-login-title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="loginSubtitle">Login Page Subtitle</Label>
            <Textarea
              id="loginSubtitle"
              value={loginSubtitle}
              onChange={(e) => setLoginSubtitle(e.target.value)}
              placeholder="e.g. School Management & Examination System"
              rows={2}
              data-testid="input-login-subtitle"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sidebarSubtitle">Sidebar Subtitle</Label>
            <Input
              id="sidebarSubtitle"
              value={sidebarSubtitle}
              onChange={(e) => setSidebarSubtitle(e.target.value)}
              placeholder="e.g. School Management"
              data-testid="input-sidebar-subtitle"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Theme
          </CardTitle>
          <CardDescription>Choose a color theme for the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {themeOptions.map((theme) => (
              <button
                key={theme.value}
                onClick={() => setThemePreset(theme.value)}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                  themePreset === theme.value
                    ? "border-foreground bg-muted"
                    : "border-transparent hover:bg-muted/50"
                }`}
                data-testid={`button-theme-${theme.value}`}
              >
                <div
                  className="w-10 h-10 rounded-full border-2 border-white shadow-md"
                  style={{ backgroundColor: theme.color }}
                />
                <span className="text-xs font-medium text-foreground">{theme.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} data-testid="button-save-settings">
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Settings"
          )}
        </Button>
      </div>
    </div>
  );
}

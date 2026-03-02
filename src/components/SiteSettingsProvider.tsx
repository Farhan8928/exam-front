import { createContext, useContext, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

const THEME_PRESETS: Record<string, { primary: string; primaryForeground: string }> = {
  blue: { primary: "217 91% 45%", primaryForeground: "217 91% 98%" },
  green: { primary: "142 71% 35%", primaryForeground: "142 71% 98%" },
  purple: { primary: "262 83% 50%", primaryForeground: "262 83% 98%" },
  orange: { primary: "25 95% 50%", primaryForeground: "25 95% 98%" },
  red: { primary: "0 72% 45%", primaryForeground: "0 72% 98%" },
  teal: { primary: "174 72% 35%", primaryForeground: "174 72% 98%" },
};

const DARK_THEME_PRESETS: Record<string, { primary: string; primaryForeground: string }> = {
  blue: { primary: "217 91% 55%", primaryForeground: "217 91% 98%" },
  green: { primary: "142 71% 45%", primaryForeground: "142 71% 98%" },
  purple: { primary: "262 83% 60%", primaryForeground: "262 83% 98%" },
  orange: { primary: "25 95% 55%", primaryForeground: "25 95% 98%" },
  red: { primary: "0 72% 50%", primaryForeground: "0 72% 98%" },
  teal: { primary: "174 72% 45%", primaryForeground: "174 72% 98%" },
};

interface SiteSettings {
  id: number;
  schoolName: string;
  loginTitle: string;
  loginSubtitle: string;
  sidebarSubtitle: string;
  logoBase64: string | null;
  themePreset: string;
}

interface SiteSettingsContextType {
  settings: SiteSettings | null;
  isLoading: boolean;
  refetch: () => void;
}

const defaultSettings: SiteSettings = {
  id: 0,
  schoolName: "NFSkills",
  loginTitle: "NFSkills",
  loginSubtitle: "School Management & Examination System",
  sidebarSubtitle: "School Management",
  logoBase64: null,
  themePreset: "blue",
};

const SiteSettingsContext = createContext<SiteSettingsContextType>({
  settings: defaultSettings,
  isLoading: true,
  refetch: () => {},
});

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
  const { data, isLoading, refetch } = useQuery<SiteSettings>({
    queryKey: ["/api/settings"],
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  const settings = data || defaultSettings;

  useEffect(() => {
    if (!settings.themePreset) return;
    const isDark = document.documentElement.classList.contains("dark");
    const presets = isDark ? DARK_THEME_PRESETS : THEME_PRESETS;
    const preset = presets[settings.themePreset] || presets.blue;

    document.documentElement.style.setProperty("--primary", preset.primary);
    document.documentElement.style.setProperty("--primary-foreground", preset.primaryForeground);
    document.documentElement.style.setProperty("--ring", preset.primary);
    document.documentElement.style.setProperty("--sidebar-primary", preset.primary);
    document.documentElement.style.setProperty("--sidebar-primary-foreground", preset.primaryForeground);
    document.documentElement.style.setProperty("--sidebar-ring", preset.primary);
    document.documentElement.style.setProperty("--chart-1", preset.primary);
  }, [settings.themePreset]);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      if (!settings.themePreset) return;
      const isDark = document.documentElement.classList.contains("dark");
      const presets = isDark ? DARK_THEME_PRESETS : THEME_PRESETS;
      const preset = presets[settings.themePreset] || presets.blue;
      document.documentElement.style.setProperty("--primary", preset.primary);
      document.documentElement.style.setProperty("--primary-foreground", preset.primaryForeground);
      document.documentElement.style.setProperty("--ring", preset.primary);
      document.documentElement.style.setProperty("--sidebar-primary", preset.primary);
      document.documentElement.style.setProperty("--sidebar-primary-foreground", preset.primaryForeground);
      document.documentElement.style.setProperty("--sidebar-ring", preset.primary);
      document.documentElement.style.setProperty("--chart-1", preset.primary);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, [settings.themePreset]);

  return (
    <SiteSettingsContext.Provider value={{ settings, isLoading, refetch }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}

export { THEME_PRESETS, DARK_THEME_PRESETS };

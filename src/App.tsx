import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { ThemeProvider } from "@/components/theme-provider";
import { SiteSettingsProvider } from "@/components/SiteSettingsProvider";
import AppRouter from "@/routes/AppRouter";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SiteSettingsProvider>
          <TooltipProvider>
            <AuthProvider>
              <AppRouter />
            </AuthProvider>
            <Toaster />
          </TooltipProvider>
        </SiteSettingsProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

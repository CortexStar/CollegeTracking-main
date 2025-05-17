import { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { CourseNameProvider } from "@/hooks/use-course-name";
import { SolutionsProvider } from "@/components/solutions-provider";
import { LectureLinksProvider } from "@/components/lecture-links-provider";

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * AppProviders component for composing all context providers
 * This pattern improves code organization and readability by centralizing all providers
 * It also improves performance by reducing unnecessary re-renders
 * 
 * Providers are ordered by dependency hierarchy:
 * 1. ThemeProvider (no dependencies)
 * 2. QueryClientProvider (no dependencies)
 * 3. AuthProvider (depends on QueryClientProvider)
 * 4. CourseNameProvider (depends on AuthProvider)
 * 5. SolutionsProvider (depends on CourseNameProvider)
 * 6. LectureLinksProvider (depends on CourseNameProvider)
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="ui-theme">
        <AuthProvider>
          <CourseNameProvider>
            <SolutionsProvider>
              <LectureLinksProvider>
                {children}
                <Toaster />
              </LectureLinksProvider>
            </SolutionsProvider>
          </CourseNameProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
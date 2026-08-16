import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';
import { GpaProvider } from '@/hooks/use-gpa-data';
import { TimetableProvider } from '@/hooks/use-timetable';
import { AppLayout } from '@/components/layout/AppLayout';
import DashboardPage from '@/pages/DashboardPage';
import SchedulePage from '@/pages/SchedulePage';
import CoursesPage from '@/pages/CoursesPage';
import GpaPage from '@/pages/GpaPage';
import TasksPage from '@/pages/TasksPage';
import ExamsPage from '@/pages/ExamsPage';
import AnalyticsPage from '@/pages/AnalyticsPage';
import DegreeProgressPage from '@/pages/DegreeProgressPage';
import SettingsPage from '@/pages/SettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    },
  },
});

function Router() {
  return (
    <RoutedErrorBoundary>
      <AppLayout>
        <Switch>
          <Route path="/" component={DashboardPage} />
          <Route path="/schedule" component={SchedulePage} />
          <Route path="/courses" component={CoursesPage} />
          <Route path="/gpa" component={GpaPage} />
          <Route path="/tasks" component={TasksPage} />
          <Route path="/exams" component={ExamsPage} />
          <Route path="/analytics" component={AnalyticsPage} />
          <Route path="/degree" component={DegreeProgressPage} />
          <Route path="/settings" component={SettingsPage} />
          <Route component={NotFound} />
        </Switch>
      </AppLayout>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <GpaProvider>
        <TimetableProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </TimetableProvider>
      </GpaProvider>
    </QueryClientProvider>
  );
}

export default App;
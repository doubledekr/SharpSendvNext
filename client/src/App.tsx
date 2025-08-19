import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MasterNavigation } from "@/components/master-navigation";
import VNextDashboard from "@/pages/vnext-dashboard";
import { VNextAssignmentDesk } from "@/pages/vnext-assignment-desk";
import { VNextApprovals } from "@/pages/vnext-approvals";
import { VNextSegments } from "@/pages/vnext-segments";
import { ABTestingDashboard } from "@/pages/ab-testing";
import { CampaignsDashboard } from "@/pages/campaigns-dashboard";
import DemoOnboarding from "@/pages/demo-onboarding";
import PublicAssignment from "@/pages/public-assignment";
import AssignmentEditorPage from "@/pages/assignment-editor-page";
import Register from "@/pages/register";
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";
import { useEffect } from "react";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLocation("/login");
    }
  }, [setLocation]);

  const token = localStorage.getItem("token");
  if (!token) {
    return null; // Will redirect in useEffect
  }

  return <Component />;
}

function PublicRoute({ component: Component }: { component: React.ComponentType }) {
  // Remove auto-redirect logic - let users stay on auth pages
  return <Component />;
}

function Router() {
  const [location] = useLocation();
  const isAuthPage = location === "/" || location === "/login" || location === "/register";
  const isDemoOnboarding = location === "/demo-onboarding";
  const isPublicAssignment = location.startsWith("/assignment/");
  const hideNavigation = isAuthPage || isDemoOnboarding || isPublicAssignment;
  
  return (
    <>
      {!hideNavigation && <MasterNavigation />}
      <div className={!hideNavigation ? "pt-16" : ""}>
        <Switch>
          {/* Always start on login page */}
          <Route path="/" component={() => <PublicRoute component={Login} />} />
          <Route path="/dashboard" component={() => <ProtectedRoute component={VNextDashboard} />} />
          <Route path="/assignments" component={() => <ProtectedRoute component={VNextAssignmentDesk} />} />
          <Route path="/assignments/:id/edit" component={() => <ProtectedRoute component={AssignmentEditorPage} />} />
          <Route path="/approvals" component={() => <ProtectedRoute component={VNextApprovals} />} />
          <Route path="/segments" component={() => <ProtectedRoute component={VNextSegments} />} />
          <Route path="/ab-testing" component={() => <ProtectedRoute component={ABTestingDashboard} />} />
          <Route path="/campaigns" component={() => <ProtectedRoute component={CampaignsDashboard} />} />
          <Route path="/analytics" component={() => <ProtectedRoute component={VNextDashboard} />} />
          
          {/* Demo Onboarding */}
          <Route path="/demo-onboarding" component={DemoOnboarding} />
          
          {/* Public Assignment View */}
          <Route path="/assignment/:slug" component={PublicAssignment} />
          
          {/* Authentication routes */}
          <Route path="/register" component={() => <PublicRoute component={Register} />} />
          <Route path="/login" component={() => <PublicRoute component={Login} />} />

          <Route component={NotFound} />
        </Switch>
      </div>
    </>
  );
}

function App() {
  useEffect(() => {
    document.documentElement.classList.add('dark');
    document.body.classList.add('dark');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background text-foreground">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

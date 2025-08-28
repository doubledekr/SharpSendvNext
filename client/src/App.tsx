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
import BroadcastQueue from "@/pages/broadcast-queue";
import DemoOnboarding from "@/pages/demo-onboarding";
import PublicAssignment from "@/pages/public-assignment";
import AssignmentEditorPage from "@/pages/assignment-editor-page";
import { CopywriterAssignment } from "@/pages/copywriter-assignment";
import AssignmentCopywriterFlow from "@/pages/AssignmentCopywriterFlow";
import Register from "@/pages/register";
import Login from "@/pages/login";
import Onboarding from "@/pages/onboarding";
import IntegrationsPage from "@/pages/integrations";
import PublisherSettings from "@/pages/publisher-settings";
import NotFound from "@/pages/not-found";
import { useEffect, useState } from "react";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const [, setLocation] = useLocation();
  const [isAutoLoginAttempted, setIsAutoLoginAttempted] = useState(false);
  
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token && !isAutoLoginAttempted) {
      setIsAutoLoginAttempted(true);
      // Auto-login with demo credentials to access multitenant system
      fetch('/api/multitenant/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'demo@example.com',
          password: 'password123',
          subdomain: 'demo'
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.token) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          localStorage.setItem('publisher', JSON.stringify(data.publisher));
          // Component will re-render with token
        } else {
          setLocation("/login");
        }
      })
      .catch(() => setLocation("/login"));
    } else if (!token) {
      setLocation("/login");
    }
  }, [setLocation, isAutoLoginAttempted]);

  const token = localStorage.getItem("token");
  if (!token) {
    return null; // Will redirect or auto-login in useEffect
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
  const isOnboarding = location === "/onboarding";
  const isPublicAssignment = location.startsWith("/assignment/");
  const hideNavigation = isAuthPage || isDemoOnboarding || isOnboarding || isPublicAssignment;
  
  return (
    <>
      {!hideNavigation && <MasterNavigation />}
      <div className={!hideNavigation ? "pt-16" : ""}>
        <Switch>
          {/* Always start on login page */}
          <Route path="/" component={() => <PublicRoute component={Login} />} />
          <Route path="/dashboard" component={() => <ProtectedRoute component={VNextDashboard} />} />
          <Route path="/assignments" component={() => <ProtectedRoute component={VNextAssignmentDesk} />} />
          <Route path="/assignments/:id" component={() => <ProtectedRoute component={AssignmentCopywriterFlow} />} />
          <Route path="/assignments/:id/edit" component={() => <ProtectedRoute component={AssignmentEditorPage} />} />
          <Route path="/broadcast-queue" component={() => <ProtectedRoute component={BroadcastQueue} />} />
          <Route path="/segments" component={() => <ProtectedRoute component={VNextSegments} />} />
          <Route path="/ab-testing" component={() => <ProtectedRoute component={ABTestingDashboard} />} />
          <Route path="/integrations" component={() => <ProtectedRoute component={IntegrationsPage} />} />
          <Route path="/analytics" component={() => <ProtectedRoute component={VNextDashboard} />} />
          
          {/* Settings Routes */}
          <Route path="/settings/publisher" component={() => <ProtectedRoute component={PublisherSettings} />} />
          
          {/* Onboarding Routes */}
          <Route path="/onboarding" component={() => <ProtectedRoute component={Onboarding} />} />
          <Route path="/demo-onboarding" component={DemoOnboarding} />
          
          {/* Public Assignment View */}
          <Route path="/assignment/:slug" component={AssignmentCopywriterFlow} />
          
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

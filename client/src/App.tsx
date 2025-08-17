import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import Register from "@/pages/register";
import Login from "@/pages/login";
import Onboarding from "@/pages/onboarding";
import EditorialDashboard from "@/pages/editorial-dashboard-enhanced";
import SharpSendIntelligence from "@/pages/sharpsend-intelligence";
import CopywriterPortal from "@/pages/copywriter-portal-enhanced";
import CopywriterCollabPortal from "@/pages/CopywriterPortal";
import EmailPreviewApproval from "@/pages/email-preview-approval-enhanced";
import CohortAnalytics from "@/pages/cohort-analytics-enhanced";
import NotFound from "@/pages/not-found";
import { CampaignManagement } from "@/pages/CampaignManagement";
import { AssignmentPortal } from "@/pages/AssignmentPortal";
import EmailPlatformDashboard from "@/pages/email-platform-dashboard";
import InternalDashboard from "@/pages/internal-dashboard";
import Documentation from "@/pages/documentation";
import Profile from "@/pages/profile";
import ComparativeAnalytics from "@/pages/comparative-analytics";
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
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setLocation("/dashboard");
    }
  }, [setLocation]);

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <PublicRoute component={Login} />} />
      <Route path="/register" component={() => <PublicRoute component={Register} />} />
      <Route path="/login" component={() => <PublicRoute component={Login} />} />
      <Route path="/onboarding" component={() => <ProtectedRoute component={Onboarding} />} />
      <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/editorial" component={() => <ProtectedRoute component={EditorialDashboard} />} />
      <Route path="/copywriter" component={() => <ProtectedRoute component={CopywriterPortal} />} />
      <Route path="/email-preview" component={() => <ProtectedRoute component={EmailPreviewApproval} />} />
      <Route path="/analytics" component={() => <ProtectedRoute component={CohortAnalytics} />} />
      <Route path="/intelligence" component={() => <ProtectedRoute component={SharpSendIntelligence} />} />
      <Route path="/email-platforms" component={() => <ProtectedRoute component={EmailPlatformDashboard} />} />
      <Route path="/internal" component={() => <ProtectedRoute component={InternalDashboard} />} />
      <Route path="/documentation" component={() => <ProtectedRoute component={Documentation} />} />
      <Route path="/profile" component={() => <ProtectedRoute component={Profile} />} />
      <Route path="/comparative-analytics" component={() => <ProtectedRoute component={ComparativeAnalytics} />} />
      <Route path="/campaigns" component={() => <ProtectedRoute component={CampaignManagement} />} />
      <Route path="/assignment/:token" component={AssignmentPortal} />
      <Route path="/copywriter/:id" component={CopywriterCollabPortal} />
      <Route component={NotFound} />
    </Switch>
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

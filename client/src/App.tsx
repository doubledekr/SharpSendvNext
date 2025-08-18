import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import VNextDashboard from "@/pages/vnext-dashboard";
import { VNextAssignmentDesk } from "@/pages/vnext-assignment-desk";
import { VNextApprovals } from "@/pages/vnext-approvals";
import { VNextSegments } from "@/pages/vnext-segments";
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
      {/* vNext is now the main system */}
      <Route path="/" component={() => <ProtectedRoute component={VNextDashboard} />} />
      <Route path="/assignments" component={() => <ProtectedRoute component={VNextAssignmentDesk} />} />
      <Route path="/approvals" component={() => <ProtectedRoute component={VNextApprovals} />} />
      <Route path="/segments" component={() => <ProtectedRoute component={VNextSegments} />} />
      <Route path="/campaigns" component={() => <ProtectedRoute component={VNextDashboard} />} />
      
      {/* Authentication routes */}
      <Route path="/register" component={() => <PublicRoute component={Register} />} />
      <Route path="/login" component={() => <PublicRoute component={Login} />} />

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

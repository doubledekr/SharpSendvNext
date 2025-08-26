import React, { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, LogIn, Building, Sparkles } from "lucide-react";

interface LoginData {
  email: string;
  password: string;
  subdomain: string;
}

export default function Login() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState<LoginData>({
    email: "",
    password: "",
    subdomain: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Login failed");
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Store token and redirect to dashboard
      localStorage.setItem("token", data.token);
      localStorage.setItem("publisher", JSON.stringify(data.publisher));
      localStorage.setItem("user", JSON.stringify(data.user));
      setLocation("/dashboard");
    },
    onError: (error: Error) => {
      setErrors({ general: error.message });
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    if (!formData.subdomain.trim()) {
      newErrors.subdomain = "Subdomain is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      loginMutation.mutate(formData);
    }
  };

  const handleInputChange = (field: keyof LoginData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleDemoLogin = async () => {
    setIsDemoLoading(true);
    setErrors({}); // Clear any existing errors
    
    try {
      const response = await fetch("/api/demo/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}) // Explicitly send empty body
      });

      const data = await response.json();
      
      // Even if response is not ok, if we have token data, use it
      if (data.token) {
        // Store token and redirect to dashboard
        localStorage.setItem("token", data.token);
        localStorage.setItem("publisher", JSON.stringify(data.publisher));
        localStorage.setItem("user", JSON.stringify(data.user));
        setLocation("/dashboard");
        return;
      }
      
      // Only throw error if we don't have a token
      if (!response.ok) {
        throw new Error(data.error || "Failed to start demo");
      }
    } catch (error) {
      console.error("Demo login error:", error);
      setErrors({ general: "Demo temporarily unavailable. Please try again in a moment." });
    } finally {
      setIsDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img 
            src="/sharpsend-logo.png" 
            alt="SharpSend" 
            className="w-16 h-16 mx-auto mb-4 object-contain"
          />
          <h1 className="text-4xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-slate-300">Sign in to your SharpSend account</p>
        </div>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <LogIn className="h-5 w-5" />
              Sign In
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {errors.general && (
                <Alert className="border-red-500 bg-red-500/10">
                  <AlertDescription className="text-red-400">
                    {errors.general}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="subdomain" className="text-slate-300">Company Subdomain</Label>
                <div className="flex items-center">
                  <Input
                    id="subdomain"
                    type="text"
                    value={formData.subdomain}
                    onChange={(e) => handleInputChange("subdomain", e.target.value.toLowerCase())}
                    className="bg-slate-700 border-slate-600 text-white rounded-r-none"
                    placeholder="acme"
                  />
                  <div className="bg-slate-600 border border-l-0 border-slate-600 px-3 py-2 rounded-r-md text-slate-300">
                    .sharpsend.com
                  </div>
                </div>
                {errors.subdomain && <p className="text-red-400 text-sm">{errors.subdomain}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="you@company.com"
                />
                {errors.email && <p className="text-red-400 text-sm">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="Your password"
                />
                {errors.password && <p className="text-red-400 text-sm">{errors.password}</p>}
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>

              <div className="text-center space-y-2">
                <button
                  type="button"
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  Forgot your password?
                </button>
                <p className="text-slate-400 text-sm">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setLocation("/register")}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    Sign up
                  </button>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <h3 className="text-white font-semibold mb-2 flex items-center justify-center gap-2">
              <Building className="h-4 w-4" />
              Demo Environment
            </h3>
            <p className="text-slate-300 text-sm mb-3">
              Experience SharpSend with full demo data
            </p>
            <Button
              onClick={handleDemoLogin}
              disabled={isDemoLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
            >
              {isDemoLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up demo...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Launch Demo Environment
                </>
              )}
            </Button>
            <p className="text-slate-400 text-xs mt-2">
              No signup required • Full feature access • Pre-populated data
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


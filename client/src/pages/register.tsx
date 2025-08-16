import React, { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, Building, Mail, Globe, CreditCard } from "lucide-react";

interface RegistrationData {
  name: string;
  email: string;
  subdomain: string;
  plan: string;
  password: string;
}

export default function Register() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState<RegistrationData>({
    name: "",
    email: "",
    subdomain: "",
    plan: "starter",
    password: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const registerMutation = useMutation({
    mutationFn: async (data: RegistrationData) => {
      const response = await fetch("/api/publishers/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Registration failed");
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Store token and redirect to onboarding
      localStorage.setItem("token", data.token);
      localStorage.setItem("publisher", JSON.stringify(data.publisher));
      localStorage.setItem("user", JSON.stringify(data.user));
      setLocation("/onboarding");
    },
    onError: (error: Error) => {
      setErrors({ general: error.message });
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Company name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.subdomain.trim()) {
      newErrors.subdomain = "Subdomain is required";
    } else if (!/^[a-z0-9-]+$/.test(formData.subdomain)) {
      newErrors.subdomain = "Subdomain can only contain lowercase letters, numbers, and hyphens";
    } else if (formData.subdomain.length < 3) {
      newErrors.subdomain = "Subdomain must be at least 3 characters";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (formData.password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      registerMutation.mutate(formData);
    }
  };

  const handleInputChange = (field: keyof RegistrationData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const planFeatures = {
    starter: {
      price: "Free",
      subscribers: "1,000",
      campaigns: "10",
      emails: "5,000/month",
      features: ["Basic Analytics", "Email Templates", "AI Personalization"],
    },
    pro: {
      price: "$49/month",
      subscribers: "10,000",
      campaigns: "100",
      emails: "50,000/month",
      features: ["Advanced Analytics", "A/B Testing", "CRM Integration", "Priority Support"],
    },
    enterprise: {
      price: "Custom",
      subscribers: "Unlimited",
      campaigns: "Unlimited",
      emails: "500,000+/month",
      features: ["White Label", "Custom Integrations", "Dedicated Support", "SLA"],
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Join SharpSend</h1>
          <p className="text-slate-300 text-lg">Start personalizing your newsletters with AI in minutes</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Registration Form */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Building className="h-5 w-5" />
                Create Your Account
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
                  <Label htmlFor="name" className="text-slate-300">Company Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="Acme Newsletter Co."
                  />
                  {errors.name && <p className="text-red-400 text-sm">{errors.name}</p>}
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
                  <Label htmlFor="subdomain" className="text-slate-300">Choose Your Subdomain</Label>
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
                  <Label htmlFor="plan" className="text-slate-300">Select Plan</Label>
                  <Select value={formData.plan} onValueChange={(value) => handleInputChange("plan", value)}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="starter">Starter - Free</SelectItem>
                      <SelectItem value="pro">Pro - $49/month</SelectItem>
                      <SelectItem value="enterprise">Enterprise - Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-300">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="At least 8 characters"
                  />
                  {errors.password && <p className="text-red-400 text-sm">{errors.password}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-slate-300">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="Confirm your password"
                  />
                  {errors.confirmPassword && <p className="text-red-400 text-sm">{errors.confirmPassword}</p>}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>

                <p className="text-center text-slate-400 text-sm">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setLocation("/login")}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    Sign in
                  </button>
                </p>
              </form>
            </CardContent>
          </Card>

          {/* Plan Details */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white mb-4">Plan Features</h3>
            {Object.entries(planFeatures).map(([planKey, plan]) => (
              <Card
                key={planKey}
                className={`bg-slate-800 border-slate-700 ${
                  formData.plan === planKey ? "ring-2 ring-blue-500" : ""
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-lg font-semibold text-white capitalize">{planKey}</h4>
                    <span className="text-blue-400 font-bold">{plan.price}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                    <div className="text-slate-300">
                      <Mail className="h-4 w-4 inline mr-1" />
                      {plan.subscribers} subscribers
                    </div>
                    <div className="text-slate-300">
                      <Globe className="h-4 w-4 inline mr-1" />
                      {plan.campaigns} campaigns
                    </div>
                    <div className="text-slate-300 col-span-2">
                      <CreditCard className="h-4 w-4 inline mr-1" />
                      {plan.emails}
                    </div>
                  </div>
                  <div className="space-y-1">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center text-sm text-slate-300">
                        <CheckCircle className="h-3 w-3 text-green-400 mr-2" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


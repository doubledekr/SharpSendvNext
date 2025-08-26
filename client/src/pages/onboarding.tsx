import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Loader2, 
  CheckCircle, 
  Upload, 
  Mail, 
  Users, 
  Zap, 
  ArrowRight, 
  ArrowLeft,
  FileText,
  Settings,
  Rocket
} from "lucide-react";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
}

interface SubscriberImport {
  email: string;
  name: string;
  segment: string;
}

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [subscriberData, setSubscriberData] = useState("");
  const [emailProvider, setEmailProvider] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const steps: OnboardingStep[] = [
    {
      id: "welcome",
      title: "Welcome to SharpSend",
      description: "Let's get your newsletter platform set up in just a few minutes",
      icon: <Rocket className="h-6 w-6" />,
      completed: completedSteps.has("welcome"),
    },
    {
      id: "subscribers",
      title: "Import Subscribers",
      description: "Upload your existing subscriber list or start fresh",
      icon: <Users className="h-6 w-6" />,
      completed: completedSteps.has("subscribers"),
    },
    {
      id: "email-service",
      title: "Connect Email Service",
      description: "Connect your email service provider for sending newsletters",
      icon: <Mail className="h-6 w-6" />,
      completed: completedSteps.has("email-service"),
    },
    {
      id: "ai-setup",
      title: "AI Personalization",
      description: "Configure AI settings for personalized content",
      icon: <Zap className="h-6 w-6" />,
      completed: completedSteps.has("ai-setup"),
    },
    {
      id: "complete",
      title: "You're All Set!",
      description: "Start creating and sending personalized newsletters",
      icon: <CheckCircle className="h-6 w-6" />,
      completed: completedSteps.has("complete"),
    },
  ];

  const importSubscribersMutation = useMutation({
    mutationFn: async (subscribers: SubscriberImport[]) => {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/subscribers/bulk-import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ subscribers }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to import subscribers");
      }

      return response.json();
    },
    onSuccess: () => {
      markStepCompleted("subscribers");
      nextStep();
    },
    onError: (error: Error) => {
      setErrors({ subscribers: error.message });
    },
  });

  const connectEmailServiceMutation = useMutation({
    mutationFn: async (data: { platform: string; apiKey: string }) => {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/email-integrations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          platform: data.platform,
          apiKey: data.apiKey,
          isConnected: true,
          status: "active",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to connect email service");
      }

      return response.json();
    },
    onSuccess: () => {
      markStepCompleted("email-service");
      nextStep();
    },
    onError: (error: Error) => {
      setErrors({ emailService: error.message });
    },
  });

  const markStepCompleted = (stepId: string) => {
    setCompletedSteps(prev => new Set([...prev, stepId]));
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const parseSubscriberData = (data: string): SubscriberImport[] => {
    const lines = data.trim().split("\n");
    const subscribers: SubscriberImport[] = [];

    for (const line of lines) {
      const parts = line.split(",").map(part => part.trim());
      if (parts.length >= 2) {
        subscribers.push({
          email: parts[0],
          name: parts[1] || parts[0].split("@")[0],
          segment: parts[2] || "general",
        });
      }
    }

    return subscribers;
  };

  const handleSubscriberImport = () => {
    if (!subscriberData.trim()) {
      setErrors({ subscribers: "Please enter subscriber data" });
      return;
    }

    try {
      const subscribers = parseSubscriberData(subscriberData);
      if (subscribers.length === 0) {
        setErrors({ subscribers: "No valid subscribers found" });
        return;
      }

      importSubscribersMutation.mutate(subscribers);
    } catch (error) {
      setErrors({ subscribers: "Invalid subscriber data format" });
    }
  };

  const handleEmailServiceConnect = () => {
    if (!emailProvider) {
      setErrors({ emailService: "Please select an email provider" });
      return;
    }

    if (!apiKey.trim()) {
      setErrors({ emailService: "Please enter your API key" });
      return;
    }

    connectEmailServiceMutation.mutate({
      platform: emailProvider,
      apiKey: apiKey,
    });
  };

  const skipStep = () => {
    markStepCompleted(steps[currentStep].id);
    nextStep();
  };

  const finishOnboarding = () => {
    markStepCompleted("complete");
    setLocation("/dashboard");
  };

  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

  const renderStepContent = () => {
    switch (steps[currentStep].id) {
      case "welcome":
        return (
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <Rocket className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Welcome to SharpSend!</h2>
              <p className="text-slate-300">
                You're just a few steps away from sending AI-powered, personalized newsletters 
                that your subscribers will love.
              </p>
            </div>
            <div className="bg-slate-700 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-2">What we'll set up:</h3>
              <ul className="text-slate-300 text-sm space-y-1">
                <li>• Import your existing subscribers</li>
                <li>• Connect your email service provider</li>
                <li>• Configure AI personalization</li>
                <li>• Get ready to send your first campaign</li>
              </ul>
            </div>
            <Button 
              onClick={() => {
                markStepCompleted("welcome");
                nextStep();
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Let's Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        );

      case "subscribers":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Users className="mx-auto h-12 w-12 text-blue-400 mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Import Your Subscribers</h2>
              <p className="text-slate-300">
                Upload your existing subscriber list or start with a fresh list
              </p>
            </div>

            {errors.subscribers && (
              <Alert className="border-red-500 bg-red-500/10">
                <AlertDescription className="text-red-400">
                  {errors.subscribers}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div>
                <Label className="text-slate-300">Subscriber Data (CSV format)</Label>
                <p className="text-sm text-slate-400 mb-2">
                  Format: email, name, segment (one per line)
                </p>
                <Textarea
                  value={subscriberData}
                  onChange={(e) => setSubscriberData(e.target.value)}
                  placeholder="john@example.com, John Doe, premium&#10;jane@example.com, Jane Smith, general"
                  className="bg-slate-700 border-slate-600 text-white h-32"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSubscriberImport}
                  disabled={importSubscribersMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {importSubscribersMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Import Subscribers
                    </>
                  )}
                </Button>
                <Button
                  onClick={skipStep}
                  variant="outline"
                  className="border-slate-600 text-slate-300"
                >
                  Skip for Now
                </Button>
              </div>
            </div>
          </div>
        );

      case "email-service":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Mail className="mx-auto h-12 w-12 text-blue-400 mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Connect Email Service</h2>
              <p className="text-slate-300">
                Connect your email service provider to start sending newsletters
              </p>
            </div>

            {errors.emailService && (
              <Alert className="border-red-500 bg-red-500/10">
                <AlertDescription className="text-red-400">
                  {errors.emailService}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div>
                <Label className="text-slate-300">Email Service Provider</Label>
                <Select value={emailProvider} onValueChange={setEmailProvider}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Select your email provider" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600 max-h-[400px]">
                    <SelectItem value="mailchimp">Mailchimp</SelectItem>
                    <SelectItem value="convertkit">ConvertKit</SelectItem>
                    <SelectItem value="sendgrid">SendGrid</SelectItem>
                    <SelectItem value="campaign-monitor">Campaign Monitor</SelectItem>
                    <SelectItem value="activecampaign">ActiveCampaign</SelectItem>
                    <SelectItem value="klaviyo">Klaviyo</SelectItem>
                    <SelectItem value="brevo">Brevo (Sendinblue)</SelectItem>
                    <SelectItem value="constant-contact">Constant Contact</SelectItem>
                    <SelectItem value="getresponse">GetResponse</SelectItem>
                    <SelectItem value="aweber">AWeber</SelectItem>
                    <SelectItem value="drip">Drip</SelectItem>
                    <SelectItem value="mailerlite">MailerLite</SelectItem>
                    <SelectItem value="iterable">Iterable</SelectItem>
                    <SelectItem value="customer-io">Customer.io</SelectItem>
                    <SelectItem value="keap">Keap (Infusionsoft)</SelectItem>
                    <SelectItem value="braze">Braze</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-slate-300">API Key</Label>
                <Input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your API key"
                  className="bg-slate-700 border-slate-600 text-white"
                />
                {emailProvider && (
                  <p className="text-sm text-slate-400 mt-2">
                    {emailProvider === "mailchimp" && "Find your API key in Account → Extras → API keys"}
                    {emailProvider === "sendgrid" && "Get your API key from Settings → API Keys"}
                    {emailProvider === "convertkit" && "Find your API secret in Settings → Advanced"}
                    {emailProvider === "klaviyo" && "Get your private API key from Account → Settings → API Keys"}
                    {emailProvider === "activecampaign" && "Find your API key in Settings → Developer"}
                    {emailProvider === "brevo" && "Get your API key from SMTP & API → API Keys"}
                    {emailProvider === "iterable" && "Find your API key in Integrations → API Keys"}
                    {emailProvider === "customer-io" && "Get your API key from Integrations → Customer.io API"}
                    {emailProvider === "keap" && "Find your API key in Admin → Apps → API"}
                    {emailProvider === "braze" && "Get your REST API key from Settings → API Keys"}
                    {emailProvider === "campaign-monitor" && "Find your API key in Account Settings → API Keys"}
                    {emailProvider === "constant-contact" && "Get your API key from My Applications"}
                    {emailProvider === "getresponse" && "Find your API key in Menu → Integrations → API"}
                    {emailProvider === "aweber" && "Get your API credentials in My Account → Developer Tools"}
                    {emailProvider === "drip" && "Find your API token in Settings → My User Settings → API Token"}
                    {emailProvider === "mailerlite" && "Get your API key from Integrations → Developer API"}
                  </p>
                )}
                {!emailProvider && (
                  <p className="text-sm text-slate-400 mt-2">
                    Select a provider above to see API key instructions
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleEmailServiceConnect}
                  disabled={connectEmailServiceMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {connectEmailServiceMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    "Connect Service"
                  )}
                </Button>
                <Button
                  onClick={skipStep}
                  variant="outline"
                  className="border-slate-600 text-slate-300"
                >
                  Skip for Now
                </Button>
              </div>
            </div>
          </div>
        );

      case "ai-setup":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Zap className="mx-auto h-12 w-12 text-blue-400 mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">AI Personalization</h2>
              <p className="text-slate-300">
                Configure AI settings to personalize content for each subscriber
              </p>
            </div>

            <div className="bg-slate-700 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">Smart Content Generation</h3>
                  <p className="text-slate-400 text-sm">AI-powered subject lines and content</p>
                </div>
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">Subscriber Personalization</h3>
                  <p className="text-slate-400 text-sm">Personalized content based on engagement</p>
                </div>
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">Send Time Optimization</h3>
                  <p className="text-slate-400 text-sm">AI determines the best time to send</p>
                </div>
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
            </div>

            <Button
              onClick={() => {
                markStepCompleted("ai-setup");
                nextStep();
              }}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Enable AI Features
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        );

      case "complete":
        return (
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">You're All Set!</h2>
              <p className="text-slate-300">
                Your SharpSend account is ready. Start creating and sending 
                AI-powered newsletters that your subscribers will love.
              </p>
            </div>
            <div className="bg-slate-700 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-2">What's next?</h3>
              <ul className="text-slate-300 text-sm space-y-1">
                <li>• Create your first campaign</li>
                <li>• Set up A/B tests</li>
                <li>• Monitor analytics and engagement</li>
                <li>• Optimize with AI recommendations</li>
              </ul>
            </div>
            <Button 
              onClick={finishOnboarding}
              className="bg-green-600 hover:bg-green-700"
            >
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-white">Setup Your Account</h1>
            <span className="text-slate-300 text-sm">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Step Navigation */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index <= currentStep
                      ? "bg-blue-600 text-white"
                      : "bg-slate-700 text-slate-400"
                  } ${step.completed ? "bg-green-600" : ""}`}
                >
                  {step.completed ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-8 h-0.5 ${
                      index < currentStep ? "bg-blue-600" : "bg-slate-700"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-8">
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        {currentStep > 0 && currentStep < steps.length - 1 && (
          <div className="flex justify-between mt-6">
            <Button
              onClick={prevStep}
              variant="outline"
              className="border-slate-600 text-slate-300"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}


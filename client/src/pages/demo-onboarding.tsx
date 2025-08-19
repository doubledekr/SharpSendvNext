import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Building, Users, Mail, Target, Zap, ChevronRight, 
  CheckCircle, Newspaper, DollarSign, BarChart3, 
  Globe, Settings, Sparkles, ArrowRight
} from "lucide-react";

interface OnboardingData {
  companyName: string;
  industry: string;
  subscriberCount: string;
  emailPlatform: string;
  primaryGoal: string;
  contentTypes: string[];
  monthlyBudget: string;
  websiteUrl: string;
  description: string;
}

export default function DemoOnboarding() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    companyName: "",
    industry: "",
    subscriberCount: "",
    emailPlatform: "",
    primaryGoal: "",
    contentTypes: [],
    monthlyBudget: "",
    websiteUrl: "",
    description: ""
  });

  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  // Complete onboarding mutation
  const completeOnboardingMutation = useMutation({
    mutationFn: async (data: OnboardingData) => {
      return await apiRequest("/api/demo/onboarding", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Welcome to SharpSend!",
        description: "Your demo environment has been set up successfully.",
      });
      navigate("/vnext-dashboard");
    },
    onError: () => {
      toast({
        title: "Setup Error",
        description: "Failed to complete onboarding. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboardingMutation.mutate(onboardingData);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return onboardingData.companyName && onboardingData.industry;
      case 2:
        return onboardingData.subscriberCount && onboardingData.emailPlatform;
      case 3:
        return onboardingData.primaryGoal && onboardingData.contentTypes.length > 0;
      case 4:
        return onboardingData.monthlyBudget;
      case 5:
        return onboardingData.websiteUrl;
      default:
        return false;
    }
  };

  const toggleContentType = (type: string) => {
    setOnboardingData(prev => ({
      ...prev,
      contentTypes: prev.contentTypes.includes(type)
        ? prev.contentTypes.filter(t => t !== type)
        : [...prev.contentTypes, type]
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome to SharpSend
          </h1>
          <p className="text-lg text-gray-600">
            Let's set up your AI-powered newsletter platform in just a few steps
          </p>
        </div>

        {/* Progress Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Step {currentStep} of {totalSteps}</span>
            <span className="text-sm text-gray-600">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>
              {currentStep === 1 && "Tell us about your company"}
              {currentStep === 2 && "Your audience details"}
              {currentStep === 3 && "Content strategy"}
              {currentStep === 4 && "Budget and investment"}
              {currentStep === 5 && "Final details"}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && "Basic information to personalize your experience"}
              {currentStep === 2 && "Help us understand your subscriber base"}
              {currentStep === 3 && "Define your content goals and types"}
              {currentStep === 4 && "Set your budget expectations"}
              {currentStep === 5 && "Almost there! Just a few more details"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Company Info */}
            {currentStep === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="companyName">
                    <Building className="h-4 w-4 inline mr-2" />
                    Company Name
                  </Label>
                  <Input
                    id="companyName"
                    placeholder="e.g., Financial Times Newsletter"
                    value={onboardingData.companyName}
                    onChange={(e) => setOnboardingData({ ...onboardingData, companyName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">
                    <Target className="h-4 w-4 inline mr-2" />
                    Industry
                  </Label>
                  <Select
                    value={onboardingData.industry}
                    onValueChange={(value) => setOnboardingData({ ...onboardingData, industry: value })}
                  >
                    <SelectTrigger id="industry">
                      <SelectValue placeholder="Select your industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="finance">Finance & Investment</SelectItem>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="retail">Retail & E-commerce</SelectItem>
                      <SelectItem value="media">Media & Publishing</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Step 2: Audience Details */}
            {currentStep === 2 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="subscriberCount">
                    <Users className="h-4 w-4 inline mr-2" />
                    Current Subscriber Count
                  </Label>
                  <Select
                    value={onboardingData.subscriberCount}
                    onValueChange={(value) => setOnboardingData({ ...onboardingData, subscriberCount: value })}
                  >
                    <SelectTrigger id="subscriberCount">
                      <SelectValue placeholder="Select subscriber range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-1000">0 - 1,000</SelectItem>
                      <SelectItem value="1000-5000">1,000 - 5,000</SelectItem>
                      <SelectItem value="5000-10000">5,000 - 10,000</SelectItem>
                      <SelectItem value="10000-50000">10,000 - 50,000</SelectItem>
                      <SelectItem value="50000-100000">50,000 - 100,000</SelectItem>
                      <SelectItem value="100000+">100,000+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emailPlatform">
                    <Mail className="h-4 w-4 inline mr-2" />
                    Current Email Platform
                  </Label>
                  <Select
                    value={onboardingData.emailPlatform}
                    onValueChange={(value) => setOnboardingData({ ...onboardingData, emailPlatform: value })}
                  >
                    <SelectTrigger id="emailPlatform">
                      <SelectValue placeholder="Select your current platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mailchimp">Mailchimp</SelectItem>
                      <SelectItem value="convertkit">ConvertKit</SelectItem>
                      <SelectItem value="sendgrid">SendGrid</SelectItem>
                      <SelectItem value="campaign-monitor">Campaign Monitor</SelectItem>
                      <SelectItem value="iterable">Iterable</SelectItem>
                      <SelectItem value="customer-io">Customer.io</SelectItem>
                      <SelectItem value="keap">Keap</SelectItem>
                      <SelectItem value="none">No platform yet</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Step 3: Content Strategy */}
            {currentStep === 3 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="primaryGoal">
                    <Target className="h-4 w-4 inline mr-2" />
                    Primary Goal
                  </Label>
                  <Select
                    value={onboardingData.primaryGoal}
                    onValueChange={(value) => setOnboardingData({ ...onboardingData, primaryGoal: value })}
                  >
                    <SelectTrigger id="primaryGoal">
                      <SelectValue placeholder="Select your main objective" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="engagement">Increase Engagement</SelectItem>
                      <SelectItem value="revenue">Maximize Revenue</SelectItem>
                      <SelectItem value="growth">Grow Subscriber Base</SelectItem>
                      <SelectItem value="retention">Improve Retention</SelectItem>
                      <SelectItem value="personalization">Enhance Personalization</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>
                    <Newspaper className="h-4 w-4 inline mr-2" />
                    Content Types (Select all that apply)
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      "Daily Newsletter",
                      "Weekly Digest",
                      "Market Analysis",
                      "Investment Tips",
                      "Breaking News",
                      "Educational Content",
                      "Product Updates",
                      "Industry Reports"
                    ].map((type) => (
                      <Button
                        key={type}
                        type="button"
                        variant={onboardingData.contentTypes.includes(type) ? "default" : "outline"}
                        className="justify-start"
                        onClick={() => toggleContentType(type)}
                      >
                        {onboardingData.contentTypes.includes(type) && (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        {type}
                      </Button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Step 4: Budget */}
            {currentStep === 4 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="monthlyBudget">
                    <DollarSign className="h-4 w-4 inline mr-2" />
                    Monthly Budget
                  </Label>
                  <Select
                    value={onboardingData.monthlyBudget}
                    onValueChange={(value) => setOnboardingData({ ...onboardingData, monthlyBudget: value })}
                  >
                    <SelectTrigger id="monthlyBudget">
                      <SelectValue placeholder="Select your budget range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-500">$0 - $500</SelectItem>
                      <SelectItem value="500-1000">$500 - $1,000</SelectItem>
                      <SelectItem value="1000-2500">$1,000 - $2,500</SelectItem>
                      <SelectItem value="2500-5000">$2,500 - $5,000</SelectItem>
                      <SelectItem value="5000-10000">$5,000 - $10,000</SelectItem>
                      <SelectItem value="10000+">$10,000+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center">
                    <Sparkles className="h-4 w-4 mr-2 text-blue-600" />
                    What's Included in Your Demo
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                      AI-powered content personalization
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                      Advanced segmentation & targeting
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                      Real-time analytics & tracking
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                      A/B/C/D/E testing capabilities
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                      Email fatigue prevention
                    </li>
                  </ul>
                </div>
              </>
            )}

            {/* Step 5: Final Details */}
            {currentStep === 5 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="websiteUrl">
                    <Globe className="h-4 w-4 inline mr-2" />
                    Website URL
                  </Label>
                  <Input
                    id="websiteUrl"
                    type="url"
                    placeholder="https://your-website.com"
                    value={onboardingData.websiteUrl}
                    onChange={(e) => setOnboardingData({ ...onboardingData, websiteUrl: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">
                    <Settings className="h-4 w-4 inline mr-2" />
                    Tell us more about your needs (optional)
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Any specific requirements or goals you'd like us to know about..."
                    value={onboardingData.description}
                    onChange={(e) => setOnboardingData({ ...onboardingData, description: e.target.value })}
                    rows={4}
                  />
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center">
                    <Zap className="h-4 w-4 mr-2 text-green-600" />
                    Ready to Launch!
                  </h4>
                  <p className="text-sm text-gray-700">
                    We'll set up your demo environment with sample data and pre-configured campaigns 
                    so you can explore all features immediately.
                  </p>
                </div>
              </>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
              >
                Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={!isStepValid() || completeOnboardingMutation.isPending}
              >
                {completeOnboardingMutation.isPending ? (
                  "Setting up..."
                ) : currentStep === totalSteps ? (
                  <>
                    Complete Setup
                    <CheckCircle className="h-4 w-4 ml-2" />
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Skip Demo Link */}
        <div className="text-center mt-6">
          <Button
            variant="link"
            onClick={() => navigate("/vnext-dashboard")}
            className="text-gray-600"
          >
            Skip setup and explore demo
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
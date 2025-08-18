import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  CheckCircle, Circle, ArrowRight, ArrowLeft, Globe, Mail, Newspaper, 
  TrendingUp, Users, Zap, DollarSign, AlertCircle, MessageSquare, 
  Heart, Sparkles, Send, Target, CreditCard, BarChart3, ChevronRight,
  Loader2, Check, Brain, Eye, RocketIcon, Search
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface Publication {
  title: string;
  url: string;
  cadence: string;
  topicTags: string[];
  description?: string;
  editors?: string[];
  subscriberCount?: number;
}

interface Editor {
  name: string;
  role: string;
  bio?: string;
  expertise?: string[];
}

interface DetectedSegment {
  id: string;
  name: string;
  subscriberCount: number;
  isDetected: boolean;
}

export default function VNextOnboardingNew() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState({
    emailType: "",
    espPlatform: "",
    espCredentials: {},
    domain: "",
    publications: [] as Publication[],
    editors: [] as Editor[],
    segments: [] as DetectedSegment[],
    testEmailAddress: "",
    selectedPlan: "",
    billingCycle: "monthly"
  });

  const steps = [
    { number: 1, title: "Welcome", icon: Sparkles },
    { number: 2, title: "Connect Platform", icon: Mail },
    { number: 3, title: "Detect Publications", icon: Newspaper },
    { number: 4, title: "Preview Email", icon: Eye },
    { number: 5, title: "First Send", icon: Send },
    { number: 6, title: "ROI Dashboard", icon: BarChart3 },
    { number: 7, title: "Choose Plan", icon: CreditCard },
    { number: 8, title: "Dashboard Ready", icon: RocketIcon }
  ];

  const getStepProgress = () => (currentStep / steps.length) * 100;

  // Mutation for ESP connection
  const connectESPMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/vnext/esp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to connect ESP");
      return response.json();
    },
    onSuccess: (data) => {
      setOnboardingData(prev => ({
        ...prev,
        segments: data.detectedSegments || []
      }));
      toast({ title: "Platform Connected!", description: "Successfully connected to your email platform" });
      setCurrentStep(3);
    },
  });

  // Mutation for publication detection
  const detectPublicationsMutation = useMutation({
    mutationFn: async (domain: string) => {
      const response = await fetch("/api/vnext/publications/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });
      if (!response.ok) throw new Error("Failed to detect publications");
      return response.json();
    },
    onSuccess: (data) => {
      setOnboardingData(prev => ({
        ...prev,
        publications: data.publications || [],
        editors: data.editors || []
      }));
      if (data.publications?.length > 0) {
        toast({ 
          title: "Publications Found!", 
          description: `Detected ${data.publications.length} publications and ${data.editors?.length || 0} editors` 
        });
      }
      setCurrentStep(4);
    },
  });

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold">
                Welcome to SharpSend
              </CardTitle>
              <CardDescription className="text-lg mt-2">
                Let's cut through the noise together
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-semibold mb-4 block">
                  What kind of emails do you send most often?
                </Label>
                <RadioGroup 
                  value={onboardingData.emailType}
                  onValueChange={(value) => setOnboardingData(prev => ({ ...prev, emailType: value }))}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="marketing" id="marketing" />
                    <Label htmlFor="marketing" className="cursor-pointer flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Marketing & Promotions
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="editorial" id="editorial" />
                    <Label htmlFor="editorial" className="cursor-pointer flex items-center gap-2">
                      <Newspaper className="w-4 h-4" />
                      Editorial / Newsletters
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="fulfillment" id="fulfillment" />
                    <Label htmlFor="fulfillment" className="cursor-pointer flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Paid Fulfillment (stock picks, alerts)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="premium" id="premium" />
                    <Label htmlFor="premium" className="cursor-pointer flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Premium Alerts (time-sensitive trades)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="engagement" id="engagement" />
                    <Label htmlFor="engagement" className="cursor-pointer flex items-center gap-2">
                      <Heart className="w-4 h-4" />
                      Engagement/Nurture
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              <Button 
                onClick={() => setCurrentStep(2)} 
                className="w-full"
                disabled={!onboardingData.emailType}
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">
                Connect your platform
              </CardTitle>
              <CardDescription className="text-lg mt-2">
                One click, many automations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {["Mailchimp", "ActiveCampaign", "ConvertKit", "SendGrid", "Iterable", "Customer.io", "Keap", "Other"].map((platform) => (
                  <Button
                    key={platform}
                    variant={onboardingData.espPlatform === platform.toLowerCase() ? "default" : "outline"}
                    className="h-20 flex flex-col gap-2"
                    onClick={() => {
                      setOnboardingData(prev => ({ ...prev, espPlatform: platform.toLowerCase() }));
                      // Simulate connection for demo
                      if (platform !== "Other") {
                        connectESPMutation.mutate({ 
                          platform: platform.toLowerCase(),
                          demo: true 
                        });
                      }
                    }}
                  >
                    <Mail className="h-6 w-6" />
                    <span>{platform}</span>
                  </Button>
                ))}
              </div>
              
              <div className="flex items-center justify-center">
                <Button variant="ghost" onClick={() => setCurrentStep(3)}>
                  Skip for now → Try Demo Mode
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card className="max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">
                We found your publications
              </CardTitle>
              <CardDescription className="text-lg mt-2">
                SharpSend auto-detects newsletters from your domain
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label>Enter your domain</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      placeholder="investorsalley.com"
                      value={onboardingData.domain}
                      onChange={(e) => setOnboardingData(prev => ({ ...prev, domain: e.target.value }))}
                    />
                    <Button 
                      onClick={() => detectPublicationsMutation.mutate(onboardingData.domain)}
                      disabled={!onboardingData.domain || detectPublicationsMutation.isPending}
                    >
                      {detectPublicationsMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Detecting...
                        </>
                      ) : (
                        <>
                          <Search className="mr-2 h-4 w-4" />
                          Detect
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {onboardingData.publications.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold">Detected Publications</h3>
                    <div className="grid gap-3">
                      {onboardingData.publications.map((pub, idx) => (
                        <div key={idx} className="p-4 border rounded-lg space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold">{pub.title}</h4>
                              <p className="text-sm text-muted-foreground">{pub.description}</p>
                            </div>
                            <Badge variant="secondary">{pub.cadence}</Badge>
                          </div>
                          {pub.editors && pub.editors.length > 0 && (
                            <div className="text-sm text-muted-foreground">
                              Editors: {pub.editors.join(", ")}
                            </div>
                          )}
                          <div className="flex gap-1 flex-wrap">
                            {pub.topicTags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {onboardingData.editors.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold">Detected Editors</h3>
                    <div className="grid gap-2">
                      {onboardingData.editors.map((editor, idx) => (
                        <div key={idx} className="p-3 border rounded-lg">
                          <div className="font-medium">{editor.name}</div>
                          <div className="text-sm text-muted-foreground">{editor.role}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={() => setCurrentStep(4)}
                  className="flex-1"
                  disabled={onboardingData.publications.length === 0}
                >
                  Looks good
                  <Check className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={() => setCurrentStep(4)}>
                  Add manually
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">
                Here's what SharpSend can do for you
              </CardTitle>
              <CardDescription className="text-lg mt-2">
                A sample campaign auto-generated using your brand
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border rounded-lg p-6 bg-muted/30">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-500">AI Generated</Badge>
                    <Badge variant="outline">North American Markets</Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">Sample Subject Lines:</h3>
                    <ul className="space-y-1">
                      <li className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-yellow-500" />
                        <span>📈 Markets surge on Fed signals - Your portfolio's next move</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-yellow-500" />
                        <span>Breaking: Tech rally continues - 3 stocks to watch today</span>
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold">Preview Content:</h3>
                    <div className="p-4 bg-background rounded-lg">
                      <p className="text-sm">
                        Good morning [Subscriber Name],<br/><br/>
                        The markets are showing strong momentum today with the S&P 500 up 1.2% 
                        following positive economic data. Here's what you need to know...
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-green-500" />
                    SharpSend pixel automatically attached for tracking
                  </div>
                </div>
              </div>

              <div>
                <Label>Send test email to:</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={onboardingData.testEmailAddress}
                    onChange={(e) => setOnboardingData(prev => ({ ...prev, testEmailAddress: e.target.value }))}
                  />
                  <Button variant="outline">
                    <Send className="mr-2 h-4 w-4" />
                    Send Test
                  </Button>
                </div>
              </div>

              <Button onClick={() => setCurrentStep(5)} className="w-full">
                Continue to First Send
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        );

      case 5:
        return (
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">
                Guided First Send
              </CardTitle>
              <CardDescription className="text-lg mt-2">
                Let's walk through your first SharpSend campaign
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/30">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    1
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">Assign a copywriter or let AI generate</h4>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" variant="outline">Assign Writer</Button>
                      <Button size="sm">Use AI</Button>
                    </div>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>

                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    2
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">Approve the master email</h4>
                    <p className="text-sm text-muted-foreground">Review and approve the content</p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>

                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    3
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">SharpSend generates segment variations</h4>
                    <p className="text-sm text-muted-foreground">Automatically creates personalized versions</p>
                  </div>
                  <div className="animate-pulse">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    4
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">Review → Approve → Send</h4>
                    <p className="text-sm text-muted-foreground">Final review before sending</p>
                  </div>
                  <Circle className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>

              <Button onClick={() => setCurrentStep(6)} className="w-full">
                Send Test Campaign
                <Send className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        );

      case 6:
        return (
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">
                ROI Dashboard (Projected)
              </CardTitle>
              <CardDescription className="text-lg mt-2">
                Here's what SharpSend can achieve for you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-green-600">+23%</div>
                    <p className="text-sm text-muted-foreground">Projected Open Rate</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-blue-600">+18%</div>
                    <p className="text-sm text-muted-foreground">Projected CTR</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-purple-600">Bullish</div>
                    <p className="text-sm text-muted-foreground">Market Sentiment</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">Sentiment Impact Analysis</h3>
                  <p className="text-sm">
                    Your audience is more bullish today — perfect timing for this message. 
                    SharpSend's AI detected positive market sentiment and optimized your 
                    content accordingly.
                  </p>
                </CardContent>
              </Card>

              <Button onClick={() => setCurrentStep(7)} className="w-full">
                Choose Your Plan
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        );

      case 7:
        return (
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">
                Pick the plan that matches your list
              </CardTitle>
              <CardDescription className="text-lg mt-2">
                Based on your 45,000 subscribers and daily sends, we recommend Pro Tier 2
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-center gap-2 mb-4">
                <Button
                  variant={onboardingData.billingCycle === "monthly" ? "default" : "outline"}
                  onClick={() => setOnboardingData(prev => ({ ...prev, billingCycle: "monthly" }))}
                >
                  Monthly
                </Button>
                <Button
                  variant={onboardingData.billingCycle === "yearly" ? "default" : "outline"}
                  onClick={() => setOnboardingData(prev => ({ ...prev, billingCycle: "yearly" }))}
                >
                  Yearly (Save 20%)
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Card className={onboardingData.selectedPlan === "starter" ? "border-primary" : ""}>
                  <CardHeader>
                    <CardTitle>Starter</CardTitle>
                    <div className="text-2xl font-bold">
                      ${onboardingData.billingCycle === "monthly" ? "299" : "239"}/mo
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li>✓ 30K credits/month</li>
                      <li>✓ Up to 10K subscribers</li>
                      <li>✓ Basic analytics</li>
                    </ul>
                    <Button 
                      className="w-full mt-4"
                      variant={onboardingData.selectedPlan === "starter" ? "default" : "outline"}
                      onClick={() => setOnboardingData(prev => ({ ...prev, selectedPlan: "starter" }))}
                    >
                      Select
                    </Button>
                  </CardContent>
                </Card>

                <Card className={`border-2 ${onboardingData.selectedPlan === "pro" ? "border-primary" : "border-blue-500"}`}>
                  <CardHeader>
                    <Badge className="mb-2 bg-blue-500">RECOMMENDED</Badge>
                    <CardTitle>Pro Tier 2</CardTitle>
                    <div className="text-2xl font-bold">
                      ${onboardingData.billingCycle === "monthly" ? "599" : "479"}/mo
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li>✓ 120K credits/month</li>
                      <li>✓ Up to 50K subscribers</li>
                      <li>✓ Advanced analytics</li>
                      <li>✓ Priority support</li>
                    </ul>
                    <Button 
                      className="w-full mt-4"
                      variant={onboardingData.selectedPlan === "pro" ? "default" : "outline"}
                      onClick={() => setOnboardingData(prev => ({ ...prev, selectedPlan: "pro" }))}
                    >
                      Select
                    </Button>
                  </CardContent>
                </Card>

                <Card className={onboardingData.selectedPlan === "enterprise" ? "border-primary" : ""}>
                  <CardHeader>
                    <CardTitle>Enterprise</CardTitle>
                    <div className="text-2xl font-bold">Custom</div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li>✓ Unlimited credits</li>
                      <li>✓ Unlimited subscribers</li>
                      <li>✓ Custom integrations</li>
                      <li>✓ Dedicated support</li>
                    </ul>
                    <Button 
                      className="w-full mt-4"
                      variant={onboardingData.selectedPlan === "enterprise" ? "default" : "outline"}
                      onClick={() => setOnboardingData(prev => ({ ...prev, selectedPlan: "enterprise" }))}
                    >
                      Contact Sales
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div className="flex items-center gap-2 p-4 border rounded-lg bg-muted/30">
                <CreditCard className="h-5 w-5" />
                <span className="text-sm">
                  <strong>Auto-Credit Top-Ups:</strong> Never run out of credits. 
                  Automatically purchase additional credits when you're running low.
                </span>
                <Checkbox />
              </div>

              <Button 
                onClick={() => setCurrentStep(8)} 
                className="w-full"
                disabled={!onboardingData.selectedPlan}
              >
                Complete Setup
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        );

      case 8:
        return (
          <Card className="max-w-4xl mx-auto">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold">
                Done! Your Dashboard Awaits
              </CardTitle>
              <CardDescription className="text-lg mt-2">
                Your SharpSend platform is ready to use
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-6 border rounded-lg bg-muted/30">
                <h3 className="font-semibold mb-4">Your dashboard tabs are ready:</h3>
                <Tabs defaultValue="marketing" className="w-full">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="marketing">Marketing</TabsTrigger>
                    <TabsTrigger value="editorial">Editorial</TabsTrigger>
                    <TabsTrigger value="fulfillment">Fulfillment</TabsTrigger>
                    <TabsTrigger value="alerts">Alerts</TabsTrigger>
                    <TabsTrigger value="engagement">Engagement</TabsTrigger>
                  </TabsList>
                  <TabsContent value="marketing" className="mt-4 p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Marketing emails ready for personalization
                    </p>
                  </TabsContent>
                  <TabsContent value="editorial" className="mt-4 p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Editorial content with AI enhancements
                    </p>
                  </TabsContent>
                </Tabs>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Button variant="outline" className="flex flex-col h-auto py-4">
                  <Brain className="h-6 w-6 mb-2" />
                  <span>Generate Campaign</span>
                </Button>
                <Button variant="outline" className="flex flex-col h-auto py-4">
                  <Users className="h-6 w-6 mb-2" />
                  <span>Assign to Writer</span>
                </Button>
                <Button variant="outline" className="flex flex-col h-auto py-4">
                  <BarChart3 className="h-6 w-6 mb-2" />
                  <span>View Performance</span>
                </Button>
              </div>

              <Button 
                onClick={() => setLocation("/vnext-dashboard")} 
                className="w-full"
                size="lg"
              >
                Go to Dashboard
                <RocketIcon className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-semibold">SharpSend vNext</span>
            </div>
            <span className="text-sm text-muted-foreground">
              Step {currentStep} of {steps.length}
            </span>
          </div>
          <Progress value={getStepProgress()} className="h-2" />
          <div className="flex justify-between mt-2">
            {steps.map((step) => (
              <div
                key={step.number}
                className={`flex items-center gap-1 text-xs ${
                  step.number <= currentStep ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <step.icon className="h-3 w-3" />
                <span className="hidden sm:inline">{step.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pt-24 pb-12">
        {renderStep()}
        
        {/* Navigation Buttons */}
        {currentStep > 1 && currentStep < 8 && (
          <div className="flex justify-center mt-6">
            <Button 
              variant="ghost" 
              onClick={() => setCurrentStep(currentStep - 1)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
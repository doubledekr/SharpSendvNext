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
  Loader2, Check, Brain, Eye, RocketIcon, Search, Copy, Shield, Lock,
  CheckSquare, CloudUpload, Activity
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

// Helper function to generate segment suggestions
function generateSegmentSuggestions(publications: Publication[]): string[] {
  const segments = new Set<string>();
  
  // Add cadence-based segments
  publications.forEach(pub => {
    if (pub.cadence === "daily") segments.add("Daily Readers");
    if (pub.cadence === "weekly") segments.add("Weekly Digest Subscribers");
    if (pub.cadence === "monthly") segments.add("Monthly Newsletter Group");
  });
  
  // Add topic-based segments
  const allTopics = publications.flatMap(pub => pub.topicTags);
  if (allTopics.includes("stocks") || allTopics.includes("trading")) segments.add("Active Traders");
  if (allTopics.includes("value-investing")) segments.add("Value Investors");
  if (allTopics.includes("options")) segments.add("Options Traders");
  if (allTopics.includes("cryptocurrency")) segments.add("Crypto Enthusiasts");
  if (allTopics.includes("forex")) segments.add("Forex Traders");
  if (allTopics.includes("precious-metals")) segments.add("Commodities Investors");
  
  // Add engagement-based segments
  segments.add("High Engagement Readers");
  segments.add("New Subscribers");
  segments.add("VIP Premium Members");
  
  return Array.from(segments);
}

export default function VNextOnboardingNew() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [copywriterLink, setCopywriterLink] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [enableCDN, setEnableCDN] = useState(false);
  const [onboardingData, setOnboardingData] = useState({
    emailType: "",
    espPlatforms: [] as string[],
    espCredentials: {},
    domain: "",
    publications: [] as Publication[],
    editors: [] as Editor[],
    segments: [] as DetectedSegment[],
    suggestedSegments: [] as string[],
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
      // Generate automatic segment suggestions based on publications
      const suggestedSegments = generateSegmentSuggestions(data.publications || []);
      
      setOnboardingData(prev => ({
        ...prev,
        publications: data.publications || [],
        editors: data.editors || [],
        suggestedSegments: suggestedSegments
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
                Connect your platforms
              </CardTitle>
              <CardDescription className="text-lg mt-2">
                Select all the email services you use (you can connect multiple)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {["Mailchimp", "ActiveCampaign", "ConvertKit", "SendGrid", "Iterable", "Customer.io", "Keap", "Other"].map((platform) => (
                  <Button
                    key={platform}
                    variant={onboardingData.espPlatforms.includes(platform.toLowerCase()) ? "default" : "outline"}
                    className="h-20 flex flex-col gap-2 relative"
                    onClick={() => {
                      setOnboardingData(prev => {
                        const platforms = [...prev.espPlatforms];
                        const platformLower = platform.toLowerCase();
                        if (platforms.includes(platformLower)) {
                          return { ...prev, espPlatforms: platforms.filter(p => p !== platformLower) };
                        } else {
                          return { ...prev, espPlatforms: [...platforms, platformLower] };
                        }
                      });
                    }}
                  >
                    {onboardingData.espPlatforms.includes(platform.toLowerCase()) && (
                      <CheckCircle className="absolute top-2 right-2 h-4 w-4 text-green-500" />
                    )}
                    <Mail className="h-6 w-6" />
                    <span>{platform}</span>
                  </Button>
                ))}
              </div>
              
              {onboardingData.espPlatforms.length > 0 && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">Selected platforms:</p>
                  <div className="flex flex-wrap gap-2">
                    {onboardingData.espPlatforms.map(platform => (
                      <Badge key={platform} variant="secondary">
                        {platform}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button 
                  onClick={() => {
                    if (onboardingData.espPlatforms.length > 0) {
                      connectESPMutation.mutate({ 
                        platforms: onboardingData.espPlatforms,
                        demo: true 
                      });
                    }
                  }}
                  className="flex-1"
                  disabled={onboardingData.espPlatforms.length === 0}
                >
                  Connect Selected Platforms
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="ghost" onClick={() => setCurrentStep(3)}>
                  Skip → Demo Mode
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
          <Card className="max-w-5xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">
                Here's what SharpSend can do for you
              </CardTitle>
              <CardDescription className="text-lg mt-2">
                AI-generated campaign with automatic segmentation based on your publications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Automatic Segmentation Suggestions */}
              {onboardingData.suggestedSegments.length > 0 && (
                <div className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    Automatic Segment Suggestions
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Based on your publications, we recommend these segments:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {onboardingData.suggestedSegments.map((segment, idx) => (
                      <Badge key={idx} variant="secondary" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                        <Users className="h-3 w-3 mr-1" />
                        {segment}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                {/* Subject Lines Section */}
                <div className="border rounded-lg p-4 bg-muted/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className="bg-blue-500">AI Generated</Badge>
                    <Badge variant="outline">North American Markets</Badge>
                  </div>
                  
                  <h3 className="font-semibold text-lg mb-3">Smart Subject Lines by Segment:</h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-background rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">Active Traders</div>
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-3 w-3 text-yellow-500" />
                        <span className="text-sm">📈 SPY breaks resistance - Entry points for today's session</span>
                      </div>
                    </div>
                    <div className="p-3 bg-background rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">Value Investors</div>
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-3 w-3 text-yellow-500" />
                        <span className="text-sm">🎯 Buffett-style opportunity: This blue-chip now 30% undervalued</span>
                      </div>
                    </div>
                    <div className="p-3 bg-background rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">Options Traders</div>
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-3 w-3 text-yellow-500" />
                        <span className="text-sm">⚡ Unusual options activity detected - 3 plays for next week</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Full Email Preview */}
                <div className="border rounded-lg p-4 bg-muted/30">
                  <h3 className="font-semibold text-lg mb-3">Full Email Preview:</h3>
                  <div className="h-96 overflow-y-auto p-4 bg-background rounded-lg text-sm space-y-3">
                    <p><strong>Good morning [Subscriber Name],</strong></p>
                    
                    <p>The markets are showing strong momentum today with the S&P 500 up 1.2% following positive economic data. Here's what you need to know for today's session:</p>
                    
                    <div className="border-l-4 border-blue-500 pl-3 my-3">
                      <p className="font-semibold">🔥 Market Movers</p>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Tech sector leads gains (NASDAQ +1.8%)</li>
                        <li>Fed minutes suggest pause in rate hikes</li>
                        <li>Oil prices stabilize at $78/barrel</li>
                      </ul>
                    </div>
                    
                    <p><strong>For Active Traders:</strong></p>
                    <p>Watch the 4,550 resistance level on SPX. A clean break above with volume could signal continuation to 4,600. Key support sits at 4,520.</p>
                    
                    <p><strong>For Value Investors:</strong></p>
                    <p>Financial sector showing deep value opportunities. BAC trading at 0.8x book value with strong Q3 earnings expected. Consider accumulating on any weakness.</p>
                    
                    <p><strong>For Options Traders:</strong></p>
                    <p>Elevated call volume in NVDA Nov 500C. IV rank at 35%, suggesting potential for volatility expansion. Consider bull call spreads for leveraged upside.</p>
                    
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 p-3 rounded-lg my-3">
                      <p className="font-semibold">💡 SharpSend AI Insight</p>
                      <p className="text-sm mt-1">Market sentiment: BULLISH (7.2/10). Historical data shows 73% win rate for longs when sentiment exceeds 7.0.</p>
                    </div>
                    
                    <p><strong>Action Items for Today:</strong></p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Review your stop losses on existing positions</li>
                      <li>Consider scaling into strength sectors (Tech, Healthcare)</li>
                      <li>Watch for Fed speaker at 2 PM EST - potential volatility</li>
                    </ol>
                    
                    <p className="mt-4">Best regards,<br/>
                    Your SharpSend Team</p>
                    
                    <div className="text-xs text-muted-foreground mt-4 pt-3 border-t">
                      <p>📊 Powered by SharpSend AI | Real-time market data | Personalized for your investment style</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3">
                    <Check className="h-3 w-3 text-green-500" />
                    SharpSend pixel automatically attached for tracking
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
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
                Continue to Guided Send
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        );

      case 5:
        const generateCopywriterLink = () => {
          const uniqueId = Math.random().toString(36).substring(2, 15);
          const link = `${window.location.origin}/copywriter/${uniqueId}`;
          setCopywriterLink(link);
          return link;
        };
        
        const copyToClipboard = async () => {
          if (copywriterLink) {
            await navigator.clipboard.writeText(copywriterLink);
            setLinkCopied(true);
            toast({ title: "Link copied!", description: "Share this link with your copywriter" });
            setTimeout(() => setLinkCopied(false), 3000);
          }
        };
        
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
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          const link = generateCopywriterLink();
                          toast({ 
                            title: "Writer link generated!", 
                            description: "Copy and share with your copywriter" 
                          });
                        }}
                      >
                        Generate Writer Link
                      </Button>
                      <Button size="sm">Use AI</Button>
                    </div>
                    {copywriterLink && (
                      <div className="mt-3 p-3 bg-background rounded-lg">
                        <Label className="text-xs">Unique Copywriter Link:</Label>
                        <div className="flex gap-2 mt-1">
                          <Input 
                            value={copywriterLink} 
                            readOnly 
                            className="text-xs"
                          />
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={copyToClipboard}
                          >
                            {linkCopied ? (
                              <>
                                <Check className="h-3 w-3 mr-1" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3 mr-1" />
                                Copy
                              </>
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Share this secure link with your copywriter to allow them to input email content
                        </p>
                      </div>
                    )}
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
        const subscriberCount = 45000; // Would come from actual data
        const dailySends = Math.floor(subscriberCount * 0.3); // Estimate 30% daily active
        
        return (
          <Card className="max-w-5xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">
                Pick the plan that matches your needs
              </CardTitle>
              <CardDescription className="text-lg mt-2">
                Based on your {subscriberCount.toLocaleString()} subscribers and ~{dailySends.toLocaleString()} daily sends
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Security & Compliance Badge */}
              <div className="p-4 border rounded-lg bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950">
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold">Enterprise Security & Compliance</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="flex items-center gap-1">
                    <CheckSquare className="h-3 w-3 text-green-600" />
                    <span>SOC 2 Type II</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Lock className="h-3 w-3 text-green-600" />
                    <span>GDPR Compliant</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield className="h-3 w-3 text-green-600" />
                    <span>CCPA Ready</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Lock className="h-3 w-3 text-green-600" />
                    <span>256-bit Encryption</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-center gap-2">
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
                    <p className="text-xs text-muted-foreground mt-1">
                      Up to 10K subscribers
                    </p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-1">
                        <Activity className="h-3 w-3 mt-0.5 text-green-600" />
                        <span><strong>1,000 sends/day</strong></span>
                      </li>
                      <li className="flex items-start gap-1">
                        <Users className="h-3 w-3 mt-0.5" />
                        <span>10,000 subscribers max</span>
                      </li>
                      <li className="flex items-start gap-1">
                        <Check className="h-3 w-3 mt-0.5" />
                        <span>30K credits/month</span>
                      </li>
                      <li className="flex items-start gap-1">
                        <BarChart3 className="h-3 w-3 mt-0.5" />
                        <span>Basic analytics</span>
                      </li>
                      <li className="flex items-start gap-1">
                        <CloudUpload className="h-3 w-3 mt-0.5 text-gray-400" />
                        <span className="text-muted-foreground">CDN not included</span>
                      </li>
                    </ul>
                    <Button 
                      className="w-full mt-4"
                      variant={onboardingData.selectedPlan === "starter" ? "default" : "outline"}
                      onClick={() => setOnboardingData(prev => ({ ...prev, selectedPlan: "starter" }))}
                    >
                      Select Starter
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
                    <p className="text-xs text-muted-foreground mt-1">
                      Up to 50K subscribers
                    </p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-1">
                        <Activity className="h-3 w-3 mt-0.5 text-green-600" />
                        <span><strong>15,000 sends/day</strong></span>
                      </li>
                      <li className="flex items-start gap-1">
                        <Users className="h-3 w-3 mt-0.5" />
                        <span>50,000 subscribers max</span>
                      </li>
                      <li className="flex items-start gap-1">
                        <Check className="h-3 w-3 mt-0.5" />
                        <span>120K credits/month</span>
                      </li>
                      <li className="flex items-start gap-1">
                        <BarChart3 className="h-3 w-3 mt-0.5" />
                        <span>Advanced analytics</span>
                      </li>
                      <li className="flex items-start gap-1">
                        <CloudUpload className="h-3 w-3 mt-0.5 text-blue-600" />
                        <span className="font-semibold">CDN included</span>
                      </li>
                      <li className="flex items-start gap-1">
                        <Heart className="h-3 w-3 mt-0.5" />
                        <span>Priority support</span>
                      </li>
                    </ul>
                    <Button 
                      className="w-full mt-4"
                      variant={onboardingData.selectedPlan === "pro" ? "default" : "outline"}
                      onClick={() => setOnboardingData(prev => ({ ...prev, selectedPlan: "pro" }))}
                    >
                      Select Pro
                    </Button>
                  </CardContent>
                </Card>

                <Card className={onboardingData.selectedPlan === "enterprise" ? "border-primary" : ""}>
                  <CardHeader>
                    <CardTitle>Enterprise</CardTitle>
                    <div className="text-2xl font-bold">Custom</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      50K+ subscribers
                    </p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-1">
                        <Activity className="h-3 w-3 mt-0.5 text-green-600" />
                        <span><strong>Unlimited sends/day</strong></span>
                      </li>
                      <li className="flex items-start gap-1">
                        <Users className="h-3 w-3 mt-0.5" />
                        <span>Unlimited subscribers</span>
                      </li>
                      <li className="flex items-start gap-1">
                        <Check className="h-3 w-3 mt-0.5" />
                        <span>Unlimited credits</span>
                      </li>
                      <li className="flex items-start gap-1">
                        <CloudUpload className="h-3 w-3 mt-0.5 text-green-600" />
                        <span className="font-semibold">Premium CDN</span>
                      </li>
                      <li className="flex items-start gap-1">
                        <Shield className="h-3 w-3 mt-0.5" />
                        <span>Custom integrations</span>
                      </li>
                      <li className="flex items-start gap-1">
                        <Heart className="h-3 w-3 mt-0.5" />
                        <span>Dedicated support</span>
                      </li>
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

              {/* CDN Add-on for Starter Plan */}
              {onboardingData.selectedPlan === "starter" && (
                <div className="p-4 border rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CloudUpload className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-semibold">Add CDN for Email Content</p>
                        <p className="text-sm text-muted-foreground">
                          Faster email loads, image optimization, global delivery
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">+$99/mo</span>
                      <Checkbox 
                        checked={enableCDN}
                        onCheckedChange={(checked) => setEnableCDN(checked as boolean)}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 p-4 border rounded-lg bg-muted/30">
                <CreditCard className="h-5 w-5" />
                <span className="text-sm">
                  <strong>Auto-Credit Top-Ups:</strong> Never run out of credits. 
                  Automatically purchase additional credits at $0.005 per credit.
                </span>
                <Checkbox />
              </div>

              {/* Pricing Formula Explanation */}
              <div className="p-3 bg-muted rounded-lg text-xs text-muted-foreground">
                <p className="font-semibold mb-1">How we calculate your tier:</p>
                <p>Plans are based on subscriber count (revenue indicator) balanced with daily send volume. 
                Publishers with more subscribers typically have higher revenue and can afford premium features while needing higher send limits.</p>
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
              <span className="font-semibold">SharpSend</span>
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
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
import { CheckCircle, Circle, ArrowRight, ArrowLeft, Globe, Mail, Newspaper, TrendingUp, Users, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

interface Publication {
  title: string;
  url: string;
  cadence: string;
  topicTags: string[];
  rssUrl?: string;
}

interface DetectedSegment {
  id: string;
  name: string;
  subscriberCount: number;
  isDetected: boolean;
}

interface NewsBundle {
  sentimentScore: number;
  topNarratives: string[];
  suggestedTopics: Array<{
    topic: string;
    relevance: number;
  }>;
}

export default function VNextOnboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState({
    espPlatform: "",
    espCredentials: {},
    domain: "",
    selectedPublications: [] as string[],
    cdnEnabled: false,
    newsScope: "north-america",
    selectedSegments: [] as string[],
    masterEmailTitle: "",
    masterEmailContent: ""
  });

  const [detectedPublications, setDetectedPublications] = useState<Publication[]>([]);
  const [detectedSegments, setDetectedSegments] = useState<DetectedSegment[]>([]);
  const [detectionData, setDetectionData] = useState<any>(null);

  const steps = [
    { number: 1, title: "Connect Email Platform", description: "Link your ESP account", icon: Mail },
    { number: 2, title: "Detect Publications", description: "Discover your content", icon: Newspaper },
    { number: 3, title: "Connect CDN (Optional)", description: "Enable asset optimization", icon: Globe },
    { number: 4, title: "News Scope", description: "Select market coverage", icon: TrendingUp },
    { number: 5, title: "Define Segments", description: "Configure your audience", icon: Users },
    { number: 6, title: "Create Master Email", description: "Generate your first email", icon: Zap }
  ];

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
      setDetectedSegments(data.detectedSegments || []);
      toast({ title: "ESP Connected", description: "Successfully connected to your email platform" });
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
      setDetectedPublications(data.publications || []);
      setDetectionData(data);
      if (data.publications?.length > 0) {
        toast({ 
          title: "Publications Found", 
          description: `Detected ${data.publications.length} publications from ${data.domain}` 
        });
      }
    },
  });

  // Query for NA news bundle
  const { data: newsBundle } = useQuery<NewsBundle>({
    queryKey: ["/api/vnext/news/na/bundle", "demo-publisher"],
    enabled: currentStep >= 4,
  });

  const handleStepComplete = () => {
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding
      toast({ 
        title: "Onboarding Complete!", 
        description: "Your SharpSend vNext platform is ready to use" 
      });
      // Redirect to main dashboard
      window.location.href = "/vnext-dashboard";
    }
  };

  const handleStepBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6" data-testid="step-esp-connect">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold" data-testid="title-esp-connect">Connect Your Email Platform</h2>
              <p className="text-muted-foreground" data-testid="desc-esp-connect">
                Choose your email service provider to get started with segment detection
              </p>
            </div>

            <div className="space-y-4">
              <Label htmlFor="esp-platform" data-testid="label-esp-platform">Email Service Provider</Label>
              <Select 
                value={onboardingData.espPlatform} 
                onValueChange={(value) => setOnboardingData({...onboardingData, espPlatform: value})}
                data-testid="select-esp-platform"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your ESP" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mailchimp" data-testid="option-mailchimp">Mailchimp</SelectItem>
                  <SelectItem value="hubspot" data-testid="option-hubspot">HubSpot</SelectItem>
                  <SelectItem value="brevo" data-testid="option-brevo">Brevo (Sendinblue)</SelectItem>
                </SelectContent>
              </Select>

              {onboardingData.espPlatform && (
                <div className="space-y-4 p-4 border rounded-lg" data-testid="card-esp-credentials">
                  <h3 className="font-semibold" data-testid="title-credentials">Enter Your Credentials</h3>
                  {onboardingData.espPlatform === "mailchimp" && (
                    <div className="space-y-2">
                      <Label htmlFor="api-key" data-testid="label-api-key">API Key</Label>
                      <Input 
                        id="api-key"
                        type="password" 
                        placeholder="Enter your Mailchimp API key"
                        data-testid="input-api-key"
                      />
                    </div>
                  )}
                  <Button 
                    onClick={() => connectESPMutation.mutate({ platform: onboardingData.espPlatform })}
                    disabled={connectESPMutation.isPending}
                    data-testid="button-connect-esp"
                  >
                    {connectESPMutation.isPending ? "Connecting..." : "Connect Platform"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6" data-testid="step-publication-detect">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold" data-testid="title-publication-detect">Detect Your Publications</h2>
              <p className="text-muted-foreground" data-testid="desc-publication-detect">
                Enter your website domain to automatically discover newsletters and publications
              </p>
            </div>

            <div className="space-y-4">
              <Label htmlFor="domain" data-testid="label-domain">Website Domain</Label>
              <div className="flex gap-2">
                <Input 
                  id="domain"
                  placeholder="e.g., investorsalley.com"
                  value={onboardingData.domain}
                  onChange={(e) => setOnboardingData({...onboardingData, domain: e.target.value})}
                  data-testid="input-domain"
                />
                <Button 
                  onClick={() => detectPublicationsMutation.mutate(onboardingData.domain)}
                  disabled={!onboardingData.domain || detectPublicationsMutation.isPending}
                  data-testid="button-detect-publications"
                >
                  {detectPublicationsMutation.isPending ? "Detecting..." : "Detect"}
                </Button>
              </div>

              {detectPublicationsMutation.isSuccess && detectedPublications.length > 0 && (
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-3" data-testid="card-detected-publications">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold" data-testid="title-found-publications">Found Publications</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="animate-pulse">
                        {detectedPublications.length} publications
                      </Badge>
                      {detectionData?.editors?.length > 0 && (
                        <Badge variant="outline">
                          {detectionData.editors.length} editors
                        </Badge>
                      )}
                    </div>
                  </div>
                  {detectedPublications.map((pub, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg" data-testid={`publication-item-${index}`}>
                      <Checkbox 
                        checked={onboardingData.selectedPublications.includes(pub.title)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setOnboardingData({
                              ...onboardingData, 
                              selectedPublications: [...onboardingData.selectedPublications, pub.title]
                            });
                          } else {
                            setOnboardingData({
                              ...onboardingData, 
                              selectedPublications: onboardingData.selectedPublications.filter(t => t !== pub.title)
                            });
                          }
                        }}
                        data-testid={`checkbox-publication-${index}`}
                      />
                      <div className="flex-1">
                        <p className="font-medium" data-testid={`text-publication-title-${index}`}>{pub.title}</p>
                        <p className="text-sm text-muted-foreground" data-testid={`text-publication-url-${index}`}>{pub.url}</p>
                        <div className="flex gap-1 mt-1">
                          <Badge variant="secondary" data-testid={`badge-cadence-${index}`}>{pub.cadence}</Badge>
                          {pub.topicTags.map((tag, tagIndex) => (
                            <Badge key={tagIndex} variant="outline" data-testid={`badge-tag-${index}-${tagIndex}`}>{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6" data-testid="step-cdn-connect">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold" data-testid="title-cdn-connect">Connect CDN (Optional)</h2>
              <p className="text-muted-foreground" data-testid="desc-cdn-connect">
                Enable Azure CDN for optimized image delivery and asset management
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="cdn-enabled"
                  checked={onboardingData.cdnEnabled}
                  onCheckedChange={(checked) => setOnboardingData({...onboardingData, cdnEnabled: !!checked})}
                  data-testid="checkbox-cdn-enabled"
                />
                <Label htmlFor="cdn-enabled" data-testid="label-cdn-enabled">Enable CDN for asset optimization</Label>
              </div>

              {onboardingData.cdnEnabled && (
                <div className="p-4 border rounded-lg space-y-4" data-testid="card-cdn-config">
                  <h3 className="font-semibold" data-testid="title-cdn-config">CDN Configuration</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label data-testid="label-cdn-domain">Custom Domain (Optional)</Label>
                      <Input placeholder="cdn.yoursite.com" data-testid="input-cdn-domain" />
                    </div>
                    <div>
                      <Label data-testid="label-optimization">Optimization Level</Label>
                      <Select defaultValue="balanced" data-testid="select-optimization">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="minimal" data-testid="option-minimal">Minimal</SelectItem>
                          <SelectItem value="balanced" data-testid="option-balanced">Balanced</SelectItem>
                          <SelectItem value="aggressive" data-testid="option-aggressive">Aggressive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground" data-testid="text-cdn-info">
                    Estimated cost: &lt; $50/month for ~300GB of traffic
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6" data-testid="step-news-scope">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold" data-testid="title-news-scope">News & Market Scope</h2>
              <p className="text-muted-foreground" data-testid="desc-news-scope">
                Configure your market intelligence and topic suggestions
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label data-testid="label-market-scope">Market Coverage</Label>
                <Select 
                  value={onboardingData.newsScope} 
                  onValueChange={(value) => setOnboardingData({...onboardingData, newsScope: value})}
                  data-testid="select-market-scope"
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="north-america" data-testid="option-north-america">North America Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newsBundle && (
                <div className="p-4 border rounded-lg space-y-4" data-testid="card-news-preview">
                  <h3 className="font-semibold" data-testid="title-news-preview">Today's Market Pulse</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium" data-testid="label-sentiment">Sentiment Score</Label>
                      <p className="text-2xl font-bold text-green-600" data-testid="text-sentiment-score">
                        {(newsBundle.sentimentScore * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium" data-testid="label-narratives">Top Narratives</Label>
                      <div className="text-sm space-y-1">
                        {newsBundle.topNarratives?.slice(0, 2).map((narrative, index) => (
                          <p key={index} data-testid={`text-narrative-${index}`}>• {narrative}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium" data-testid="label-suggested-topics">Suggested Topics</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {newsBundle.suggestedTopics?.map((topic, index) => (
                        <Badge key={index} variant="outline" data-testid={`badge-topic-${index}`}>
                          {topic.topic} ({Math.round(topic.relevance * 100)}%)
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6" data-testid="step-segments">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold" data-testid="title-segments">Define Your Segments</h2>
              <p className="text-muted-foreground" data-testid="desc-segments">
                Review detected segments and create custom ones
              </p>
            </div>

            <div className="space-y-4">
              {detectedSegments.length > 0 && (
                <div data-testid="card-detected-segments">
                  <h3 className="font-semibold mb-3" data-testid="title-detected-segments">Detected Segments</h3>
                  {detectedSegments.map((segment, index) => (
                    <div key={segment.id} className="flex items-center space-x-3 p-3 border rounded-lg mb-2" data-testid={`segment-item-${index}`}>
                      <Checkbox 
                        checked={onboardingData.selectedSegments.includes(segment.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setOnboardingData({
                              ...onboardingData, 
                              selectedSegments: [...onboardingData.selectedSegments, segment.id]
                            });
                          } else {
                            setOnboardingData({
                              ...onboardingData, 
                              selectedSegments: onboardingData.selectedSegments.filter(id => id !== segment.id)
                            });
                          }
                        }}
                        data-testid={`checkbox-segment-${index}`}
                      />
                      <div className="flex-1">
                        <p className="font-medium" data-testid={`text-segment-name-${index}`}>{segment.name}</p>
                        <p className="text-sm text-muted-foreground" data-testid={`text-segment-count-${index}`}>
                          {segment.subscriberCount} subscribers
                        </p>
                      </div>
                      <Badge variant="secondary" data-testid={`badge-detected-${index}`}>Detected</Badge>
                    </div>
                  ))}
                </div>
              )}

              <div className="p-4 border-2 border-dashed rounded-lg" data-testid="card-custom-segment">
                <h3 className="font-semibold mb-3" data-testid="title-custom-segment">Create Custom Segment</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label data-testid="label-segment-name">Segment Name</Label>
                    <Input placeholder="e.g., High-Value Investors" data-testid="input-segment-name" />
                  </div>
                  <div>
                    <Label data-testid="label-segment-criteria">Criteria</Label>
                    <Select data-testid="select-segment-criteria">
                      <SelectTrigger>
                        <SelectValue placeholder="Select criteria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tags" data-testid="option-tags">By Tags</SelectItem>
                        <SelectItem value="engagement" data-testid="option-engagement">By Engagement</SelectItem>
                        <SelectItem value="custom" data-testid="option-custom">Custom Fields</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button className="mt-3" variant="outline" data-testid="button-add-segment">Add Segment</Button>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6" data-testid="step-master-email">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold" data-testid="title-master-email">Create Your First Master Email</h2>
              <p className="text-muted-foreground" data-testid="desc-master-email">
                Create a master email that will generate personalized variants for each segment
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="email-title" data-testid="label-email-title">Email Title</Label>
                <Input 
                  id="email-title"
                  placeholder="e.g., Weekly Market Update"
                  value={onboardingData.masterEmailTitle}
                  onChange={(e) => setOnboardingData({...onboardingData, masterEmailTitle: e.target.value})}
                  data-testid="input-email-title"
                />
              </div>
              
              <div>
                <Label htmlFor="email-content" data-testid="label-email-content">Email Content</Label>
                <textarea 
                  id="email-content"
                  className="w-full h-32 p-3 border rounded-md"
                  placeholder="Enter your email content here. This will be personalized for each segment."
                  value={onboardingData.masterEmailContent}
                  onChange={(e) => setOnboardingData({...onboardingData, masterEmailContent: e.target.value})}
                  data-testid="textarea-email-content"
                />
              </div>

              {newsBundle && (
                <div className="p-4 border rounded-lg" data-testid="card-suggested-content">
                  <h3 className="font-semibold mb-3" data-testid="title-suggested-content">Suggested Content from Today's News</h3>
                  <div className="space-y-2">
                    {newsBundle.suggestedTopics?.map((topic, index) => (
                      <Button 
                        key={index} 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const suggestion = `\n\n**${topic.topic}**\n[Add relevant content about ${topic.topic.toLowerCase()}]`;
                          setOnboardingData({
                            ...onboardingData, 
                            masterEmailContent: onboardingData.masterEmailContent + suggestion
                          });
                        }}
                        data-testid={`button-insert-topic-${index}`}
                      >
                        Insert: {topic.topic}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg" data-testid="card-next-steps">
                <h3 className="font-semibold text-blue-900" data-testid="title-next-steps">What happens next?</h3>
                <ul className="text-sm text-blue-800 mt-2 space-y-1">
                  <li data-testid="text-step-1">• We'll generate personalized variants for each selected segment</li>
                  <li data-testid="text-step-2">• Unique tracking pixels will be created for each variant</li>
                  <li data-testid="text-step-3">• You can review and approve before sending</li>
                </ul>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4" data-testid="page-vnext-onboarding">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8" data-testid="header-onboarding">
          <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="title-main">
            Welcome to SharpSend vNext
          </h1>
          <p className="text-gray-600" data-testid="desc-main">
            Get your AI-powered newsletter platform ready in just a few minutes
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8" data-testid="progress-container">
          <Progress value={(currentStep / 6) * 100} className="h-2" data-testid="progress-bar" />
          <div className="flex justify-between mt-4">
            {steps.map((step) => (
              <div key={step.number} className="flex flex-col items-center" data-testid={`step-indicator-${step.number}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                  currentStep === step.number ? 'bg-blue-600 text-white' :
                  currentStep > step.number ? 'bg-green-600 text-white' :
                  'bg-gray-200 text-gray-600'
                }`} data-testid={`step-circle-${step.number}`}>
                  {currentStep > step.number ? (
                    <CheckCircle className="w-5 h-5" data-testid={`icon-complete-${step.number}`} />
                  ) : (
                    <step.icon className="w-5 h-5" data-testid={`icon-step-${step.number}`} />
                  )}
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium" data-testid={`text-step-title-${step.number}`}>{step.title}</p>
                  <p className="text-xs text-gray-500" data-testid={`text-step-desc-${step.number}`}>{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Current Step */}
        <Card className="mb-8" data-testid="card-current-step">
          <CardContent className="p-8">
            {renderStep()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between" data-testid="nav-container">
          <Button 
            variant="outline" 
            onClick={handleStepBack}
            disabled={currentStep === 1}
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button 
            onClick={handleStepComplete}
            disabled={
              (currentStep === 1 && !onboardingData.espPlatform) ||
              (currentStep === 2 && onboardingData.selectedPublications.length === 0) ||
              (currentStep === 5 && onboardingData.selectedSegments.length === 0) ||
              (currentStep === 6 && (!onboardingData.masterEmailTitle || !onboardingData.masterEmailContent))
            }
            data-testid="button-next"
          >
            {currentStep === 6 ? 'Complete Setup' : 'Continue'}
            {currentStep !== 6 && <ArrowRight className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
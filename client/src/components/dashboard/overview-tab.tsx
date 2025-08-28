import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  UserMinus, 
  Lightbulb, 
  Target, 
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  TrendingDown,
  AlertCircle,
  Newspaper,
  Clock,
  Send,
  FileEdit,
  Zap,
  AlertTriangle,
  UserX,
  Mail,
  Shield,
  Eye,
  EyeOff,
  FileText,
  Save,
  Loader2,
  Link,
  Copy,
  CheckCircle,
  Folder,
  Edit2,
  RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import AIEnhancedAssignmentForm from "@/components/ai-enhanced-assignment-form";
import "../../styles/dashboard-improvements.css";
import "../../styles/draft-animation.css";

interface MarketSentimentData {
  sentiment: 'bullish' | 'bearish' | 'neutral';
  vixLevel: number;
  sentimentDescription: string;
  sentimentColor: string;
  sentimentAdvice: string;
  marketCondition: string;
  topSectors: Array<{ sector: string; performance: number }>;
  timestamp: string;
}

interface MarketEvent {
  id: string;
  type: 'alert' | 'opportunity' | 'bullish' | 'bearish' | 'news';
  priority: 'high' | 'medium' | 'low';
  timestamp: string;
  title: string;
  description: string;
  emailOpportunity: {
    suggested: boolean;
    template: string;
    segments: string[];
    urgency: string;
    content: string;
  };
  assignment: {
    needed: boolean;
    type: string;
    deadline: string;
    focus: string;
  };
}

interface MarketEventsFeed {
  events: MarketEvent[];
  marketSentiment: string;
  totalOpportunities: number;
  urgentAssignments: number;
  lastUpdated: string;
}

interface FatigueStats {
  guardrailsEnabled: boolean;
  totalSubscribers: number;
  tiredSubscribers: number;
  blockedToday: number;
  warningCount: number;
  criticalCount: number;
  averageFatigueScore: number;
  topTiredSegments: Array<{
    name: string;
    avgDaily: number;
    avgWeekly: number;
    subscribers: number;
  }>;
  recommendations: string[];
}

interface TrackingStats {
  trackingEnabled: boolean;
  privacyCompliant: boolean;
  totalEmailsTracked: number;
  totalOpens: number;
  uniqueOpeners: number;
  averageOpenRate: string;
  opensLast24Hours: number;
  topCampaigns: Array<{
    campaignId: string;
    uniqueOpens: number;
    totalOpens: number;
    openRate: string;
  }>;
  emailOverrides?: {
    total: number;
    disabled: number;
  };
}

// Helper function to format email frequency as a range
function formatEmailFrequency(avg: number): string {
  if (avg === 0) return "0";
  if (avg < 1) return "<1";
  
  const floor = Math.floor(avg);
  const ceil = Math.ceil(avg);
  
  // If it's a whole number, just show that
  if (floor === ceil) {
    return floor.toString();
  }
  
  // Otherwise show as a range
  return `${floor}-${ceil}`;
}

export default function OverviewTab() {
  const [, setLocation] = useLocation();
  // Use demo data that matches the header values
  const analytics = {
    totalSubscribers: 12847,
    engagementRate: 74.2,
    monthlyRevenue: 89450,
    churnRate: 2.8
  };

  // Market sentiment state
  const [marketSentiment, setMarketSentiment] = useState<MarketSentimentData | null>(null);
  const [loadingMarket, setLoadingMarket] = useState(true);
  const [marketEvents, setMarketEvents] = useState<MarketEventsFeed | null>(null);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [fatigueStats, setFatigueStats] = useState<FatigueStats | null>(null);
  const [loadingFatigue, setLoadingFatigue] = useState(true);
  const [trackingStats, setTrackingStats] = useState<TrackingStats | null>(null);
  const [loadingTracking, setLoadingTracking] = useState(true);
  
  // New states for generation status and drafts
  const [showGenerationModal, setShowGenerationModal] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState("");
  const [emailDrafts, setEmailDrafts] = useState<any[]>([]);
  const [showDraftsModal, setShowDraftsModal] = useState(false);
  const [copiedLinks, setCopiedLinks] = useState<Set<number>>(new Set());
  const [showDraftAnimation, setShowDraftAnimation] = useState(false);
  const [editingEvent, setEditingEvent] = useState<string | null>(null);
  const [showAIAssignmentForm, setShowAIAssignmentForm] = useState(false);
  const [assignmentFormData, setAssignmentFormData] = useState<any>(null);
  const [editedEvents, setEditedEvents] = useState<Map<string, any>>(new Map());
  const { toast } = useToast();

  // Fetch market data on component mount
  useEffect(() => {
    fetchMarketData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchMarketData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchMarketData = async () => {
    // Fetch sentiment, events, fatigue, and tracking data in parallel
    const [sentimentResponse, eventsResponse, fatigueResponse, trackingResponse] = await Promise.all([
      fetch('/api/market-sentiment').catch(() => null),
      fetch('/api/market-events-feed').catch(() => null),
      fetch('/api/fatigue/dashboard-stats').catch(() => null),
      fetch('/api/tracking/dashboard-stats').catch(() => null)
    ]);
    
    if (sentimentResponse) {
      try {
        const data = await sentimentResponse.json();
        setMarketSentiment(data);
        setLoadingMarket(false);
      } catch (error) {
        console.error('Error parsing market sentiment:', error);
        setLoadingMarket(false);
      }
    }
    
    if (eventsResponse) {
      try {
        const data = await eventsResponse.json();
        setMarketEvents(data);
        setLoadingEvents(false);
      } catch (error) {
        console.error('Error parsing market events:', error);
        setLoadingEvents(false);
      }
    }
    
    if (fatigueResponse) {
      try {
        const data = await fatigueResponse.json();
        setFatigueStats(data);
        setLoadingFatigue(false);
      } catch (error) {
        console.error('Error parsing fatigue stats:', error);
        setLoadingFatigue(false);
      }
    }
    
    if (trackingResponse) {
      try {
        const data = await trackingResponse.json();
        setTrackingStats(data);
        setLoadingTracking(false);
      } catch (error) {
        console.error('Error parsing tracking stats:', error);
        setLoadingTracking(false);
      }
    }
  };

  const metrics = [
    {
      title: "Total Subscribers",
      value: analytics.totalSubscribers.toLocaleString(),
      change: "+12.5% from last month",
      changeType: "positive",
      icon: Users,
      color: "#3b82f6"
    },
    {
      title: "Engagement Rate",
      value: `${analytics.engagementRate}%`,
      change: "+8.3% improvement",
      changeType: "positive",
      icon: TrendingUp,
      color: "#10b981"
    },
    {
      title: "Monthly Revenue",
      value: `$${analytics.monthlyRevenue.toLocaleString()}`,
      change: "+23.8% vs baseline",
      changeType: "positive",
      icon: DollarSign,
      color: "#f59e0b"
    },
    {
      title: "Churn Rate",
      value: `${analytics.churnRate}%`,
      change: "-15.2% reduction",
      changeType: "positive",
      icon: UserMinus,
      color: "#ef4444"
    }
  ];

  const getSentimentIcon = () => {
    if (!marketSentiment) return Activity;
    switch (marketSentiment.sentiment) {
      case 'bullish': return TrendingUp;
      case 'bearish': return TrendingDown;
      default: return Activity;
    }
  };

  const getSentimentColor = () => {
    if (!marketSentiment) return "gray";
    switch (marketSentiment.sentimentColor) {
      case 'green': return "text-green-500 bg-green-500/10 border-green-500/30";
      case 'red': return "text-red-500 bg-red-500/10 border-red-500/30";
      case 'yellow': return "text-yellow-500 bg-yellow-500/10 border-yellow-500/30";
      default: return "text-gray-500 bg-gray-500/10 border-gray-500/30";
    }
  };

  const handleCreateAssignment = async () => {
    if (!marketSentiment) return;
    
    setShowGenerationModal(true);
    setGenerationProgress(0);
    setGenerationStatus("Analyzing market conditions...");
    
    const urgency = marketSentiment.vixLevel > 25 ? 'urgent' : 'standard';
    const focus = marketSentiment.vixLevel > 25 ? 
      'Risk management and capital preservation' : 
      marketSentiment.vixLevel < 16 ? 
      'Growth opportunities and new positions' : 
      'Balanced market analysis';
    
    // Simulate progress stages
    const stages = [
      { progress: 20, status: "Gathering market data...", delay: 800 },
      { progress: 40, status: "Analyzing sentiment indicators...", delay: 1000 },
      { progress: 60, status: "Generating personalized content...", delay: 1200 },
      { progress: 80, status: "Optimizing for engagement...", delay: 1000 },
      { progress: 95, status: "Finalizing assignment...", delay: 800 }
    ];
    
    for (const stage of stages) {
      await new Promise(resolve => setTimeout(resolve, stage.delay));
      setGenerationProgress(stage.progress);
      setGenerationStatus(stage.status);
    }
    
    try {
      const response = await apiRequest('POST', '/api/assignments', {
        title: `Market ${marketSentiment.sentiment} Alert - ${new Date().toLocaleDateString()}`,
        description: `AI-detected market opportunity requiring immediate content creation`,
        type: 'newsletter',
        priority: urgency === 'urgent' ? 'high' : 'medium',
        brief: {
          objective: `Create timely content addressing current ${marketSentiment.sentiment} market conditions`,
          angle: focus,
          keyPoints: [
            `VIX Level: ${marketSentiment.vixLevel.toFixed(1)} - ${marketSentiment.sentimentDescription}`,
            `Market Sentiment: ${marketSentiment.sentiment.toUpperCase()}`,
            `Top Performing Sectors: ${marketSentiment.topSectors?.slice(0, 3).join(', ') || 'Mixed performance'}`
          ]
        },
        notes: `Market Context:
• Sentiment Score: ${marketSentiment.sentiment}
• Volatility Index: ${marketSentiment.vixLevel}
• Market Condition: ${marketSentiment.marketCondition}
• SharpSend Suggestion: ${urgency === 'urgent' ? 'Send within 2-4 hours for maximum impact' : 'Send within 24 hours while conditions remain relevant'}

AI-Generated Content Focus: ${focus}

This assignment was auto-created from market intelligence detection. Priority level reflects current market volatility and opportunity timing.`
      });
      
      const result = await response.json();
      setGenerationProgress(100);
      setGenerationStatus("Assignment created successfully!");
      
      // Refresh assignments
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      
      setTimeout(() => {
        setShowGenerationModal(false);
        toast({
          title: "Assignment Created",
          description: "New assignment created with market context for copywriter",
        });
      }, 2000);
      return;
      
    } catch (error) {
      console.error('Error creating assignment:', error);
      toast({
        title: "Creation Failed",
        description: "Failed to create assignment. Creating draft instead...",
        variant: "destructive"
      });
      
      // Generate unique copywriter link
      const copywriterId = Math.random().toString(36).substring(2, 15);
      const copywriterLink = `${window.location.origin}/copywriter/${copywriterId}`;
      
      // Create a draft email
      const newDraft = {
        id: Date.now(),
        copywriterId,
        copywriterLink,
        subject: `🚨 ${marketSentiment.sentiment === 'bullish' ? '📈' : marketSentiment.sentiment === 'bearish' ? '📉' : '⚖️'} Market ${marketSentiment.sentiment.toUpperCase()} Alert: ${focus}`,
        content: `Dear Valued Investor,

${marketSentiment.marketCondition}

Key Market Indicators:
• VIX Level: ${marketSentiment.vixLevel.toFixed(1)} - ${marketSentiment.sentimentDescription}
• Market Sentiment: ${marketSentiment.sentiment.toUpperCase()}
• Investment Focus: ${focus}

${marketSentiment.sentimentAdvice}

Top Performing Sectors:
${marketSentiment.topSectors?.map(s => `• ${s.sector}: ${s.performance > 0 ? '+' : ''}${s.performance}%`).join('\n') || 'No sector data available'}

Action Required: ${urgency === 'urgent' ? 'IMMEDIATE ATTENTION' : 'Review within 24 hours'}

Best regards,
Your SharpSend Team`,
        createdAt: new Date().toISOString(),
        status: 'draft',
        urgency,
        sentiment: marketSentiment.sentiment
      };
      
      setEmailDrafts(prev => [newDraft, ...prev]);
      
      // Show draft animation
      setShowDraftAnimation(true);
      
      setTimeout(() => {
        setShowGenerationModal(false);
        setShowDraftAnimation(false);
        toast({
          title: "Email Draft Created",
          description: "Your AI-generated email has been saved to drafts",
        });
      }, 2000);
      
    }
  };

  // Create assignment from specific market event with AI enhancement
  const handleCreateAssignmentFromEvent = (event: any) => {
    // Prepare prefilled data for the AI-enhanced form
    const prefilledData = {
      title: `${event.title} - Content Assignment`,
      description: event.description,
      referenceUrl: event.url || event.articleUrl || "",
      marketContext: {
        eventType: event.type,
        priority: event.priority,
        source: event.source || 'Market Intelligence',
        impactScore: event.impactScore || 'Medium',
        sentimentScore: event.sentimentScore || 'Neutral',
        emailOpportunity: event.emailOpportunity,
        assignment: event.assignment
      }
    };

    setAssignmentFormData(prefilledData);
    setShowAIAssignmentForm(true);
  };

  return (
    <div className="dashboard-container p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="dashboard-title">Dashboard Overview</h1>
            <p className="dashboard-subtitle">AI-powered newsletter personalization insights</p>
          </div>
          <Button 
            onClick={() => setShowDraftsModal(true)}
            variant="outline"
            size="sm"
            className="relative"
          >
            <FileText className="h-4 w-4 mr-2" />
            View Drafts
            {emailDrafts.length > 0 && (
              <Badge className="ml-2 bg-orange-500" variant="secondary">
                {emailDrafts.length}
              </Badge>
            )}
          </Button>
        </div>
      </div>



      {/* Market Intelligence Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Market Sentiment Card */}
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Market Sentiment Analysis
              </CardTitle>
              <Badge className={getSentimentColor()}>
                {loadingMarket ? "Loading..." : marketSentiment?.sentiment?.toUpperCase() || "NEUTRAL"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loadingMarket ? (
              <div className="animate-pulse">
                <div className="h-4 bg-slate-700 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-slate-700 rounded w-1/2"></div>
              </div>
            ) : marketSentiment ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="text-2xl font-bold text-white">
                        VIX: {marketSentiment.vixLevel?.toFixed(1) || "N/A"}
                      </div>
                      <div className={`flex items-center gap-1 ${
                        marketSentiment.sentiment === 'bullish' ? 'text-green-400' :
                        marketSentiment.sentiment === 'bearish' ? 'text-red-400' :
                        'text-yellow-400'
                      }`}>
                        {getSentimentIcon() && React.createElement(getSentimentIcon(), { className: "w-5 h-5" })}
                        <span className="font-semibold">{marketSentiment.sentimentDescription}</span>
                      </div>
                    </div>
                    <p className="text-slate-300 text-sm">{marketSentiment.marketCondition}</p>
                  </div>
                </div>
                
                <div className="border-t border-slate-700 pt-3">
                  <p className="text-sm font-semibold text-slate-400 mb-1">AI Email Guidance:</p>
                  <p className="text-white">{marketSentiment.sentimentAdvice}</p>
                </div>

                {marketSentiment.topSectors && marketSentiment.topSectors.length > 0 && (
                  <div className="border-t border-slate-700 pt-3">
                    <p className="text-sm font-semibold text-slate-400 mb-2">Top Performing Sectors:</p>
                    <div className="flex gap-2 flex-wrap">
                      {marketSentiment.topSectors.map((sector, idx) => (
                        <Badge key={idx} variant="secondary" className="bg-slate-700 text-slate-200">
                          {sector.sector}: {sector.performance > 0 ? '+' : ''}{sector.performance}%
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons for Market Sentiment */}
                <div className="border-t border-slate-700 pt-3 flex gap-2">
                  <Button 
                    size="sm" 
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={async () => {
                      // Generate email based on current market sentiment
                      const template = marketSentiment.vixLevel > 25 ? 
                        'Market Volatility Alert' : 
                        marketSentiment.vixLevel < 16 ? 
                        'Growth Opportunities Update' : 
                        'Market Conditions Update';
                      
                      try {
                        const response = await fetch('/api/generate-email', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                          },
                          body: JSON.stringify({
                            template,
                            marketContext: {
                              sentiment: marketSentiment.sentiment,
                              vixLevel: marketSentiment.vixLevel,
                              description: marketSentiment.sentimentDescription,
                              advice: marketSentiment.sentimentAdvice
                            },
                            urgency: marketSentiment.vixLevel > 25 ? 'immediate' : 'standard'
                          })
                        });
                        
                        if (response.ok) {
                          const result = await response.json();
                          console.log('Email generated:', result);
                          // Could navigate to email preview or show success message
                        }
                      } catch (error) {
                        console.error('Error generating email:', error);
                      }
                    }}
                  >
                    <Zap className="w-3 h-3 mr-1" />
                    Generate Email
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                    onClick={() => handleCreateAssignment()}
                  >
                    <FileEdit className="w-3 h-3 mr-1" />
                    Create Assignment
                  </Button>
                </div>

                <div className="text-xs text-slate-500 mt-2">
                  Updated: {marketSentiment.timestamp ? new Date(marketSentiment.timestamp).toLocaleTimeString() : 'Recently'}
                </div>
              </div>
            ) : (
              <div className="text-slate-400">Unable to fetch market data</div>
            )}
          </CardContent>
        </Card>

        {/* Market Events News Feed */}
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <Newspaper className="w-5 h-5" />
                Market Events & Email Opportunities
              </CardTitle>
              <div className="flex items-center gap-2">
                {marketEvents && (
                  <div className="flex gap-2">
                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                    {marketEvents.totalOpportunities} Opportunities
                  </Badge>
                  {marketEvents.urgentAssignments > 0 && (
                    <Badge variant="destructive" className="bg-red-500/20 text-red-400">
                      {marketEvents.urgentAssignments} Urgent
                    </Badge>
                  )}
                  </div>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    queryClient.invalidateQueries({ queryKey: ['/api/market-events-feed'] });
                    toast({
                      title: "Market Events Refreshed",
                      description: "Latest market events have been loaded",
                    });
                  }}
                  className="h-8 px-2"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingEvents ? (
              <div className="animate-pulse space-y-3">
                <div className="h-16 bg-slate-700 rounded"></div>
                <div className="h-16 bg-slate-700 rounded"></div>
                <div className="h-16 bg-slate-700 rounded"></div>
              </div>
            ) : marketEvents && marketEvents.events.length > 0 ? (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {marketEvents.events.map((event) => {
                    const isEditing = editingEvent === event.id;
                    const editedEvent = editedEvents.get(event.id) || event;
                    
                    return (
                      <div key={event.id} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {editedEvent.type === 'alert' && <AlertTriangle className="w-4 h-4 text-red-400" />}
                            {editedEvent.type === 'opportunity' && <TrendingUp className="w-4 h-4 text-green-400" />}
                            {editedEvent.type === 'bullish' && <TrendingUp className="w-4 h-4 text-green-400" />}
                            {editedEvent.type === 'bearish' && <TrendingDown className="w-4 h-4 text-red-400" />}
                            {editedEvent.type === 'news' && <Newspaper className="w-4 h-4 text-blue-400" />}
                            {isEditing ? (
                              <input
                                type="text"
                                value={editedEvent.title}
                                onChange={(e) => {
                                  setEditedEvents(prev => {
                                    const newMap = new Map(prev);
                                    newMap.set(event.id, { ...editedEvent, title: e.target.value });
                                    return newMap;
                                  });
                                }}
                                className="flex-1 px-2 py-1 text-sm bg-slate-900 border border-slate-600 rounded text-white"
                              />
                            ) : (
                              <h4 className="font-semibold text-white text-sm">{editedEvent.title}</h4>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {isEditing ? (
                              <select
                                value={editedEvent.priority}
                                onChange={(e) => {
                                  setEditedEvents(prev => {
                                    const newMap = new Map(prev);
                                    newMap.set(event.id, { ...editedEvent, priority: e.target.value });
                                    return newMap;
                                  });
                                }}
                                className="px-2 py-1 text-xs bg-slate-900 border border-slate-600 rounded text-white"
                              >
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                              </select>
                            ) : (
                              <Badge className={
                                editedEvent.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                                editedEvent.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-gray-500/20 text-gray-400'
                              }>
                                {editedEvent.priority}
                              </Badge>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => {
                                if (isEditing) {
                                  setEditingEvent(null);
                                  toast({
                                    title: "Event Updated",
                                    description: "Market event has been updated successfully",
                                  });
                                } else {
                                  setEditingEvent(event.id);
                                  if (!editedEvents.has(event.id)) {
                                    setEditedEvents(prev => new Map(prev).set(event.id, { ...event }));
                                  }
                                }
                              }}
                            >
                              {isEditing ? <CheckCircle className="w-3 h-3 text-green-400" /> : <Edit2 className="w-3 h-3 text-slate-400" />}
                            </Button>
                          </div>
                        </div>
                        
                        {isEditing ? (
                          <div className="space-y-2">
                            <textarea
                              value={editedEvent.description}
                              onChange={(e) => {
                                setEditedEvents(prev => {
                                  const newMap = new Map(prev);
                                  newMap.set(event.id, { ...editedEvent, description: e.target.value });
                                  return newMap;
                                });
                              }}
                              className="w-full px-2 py-1 text-xs bg-slate-900 border border-slate-600 rounded text-slate-300 h-16"
                            />
                            <select
                              value={editedEvent.type}
                              onChange={(e) => {
                                setEditedEvents(prev => {
                                  const newMap = new Map(prev);
                                  newMap.set(event.id, { ...editedEvent, type: e.target.value });
                                  return newMap;
                                });
                              }}
                              className="px-2 py-1 text-xs bg-slate-900 border border-slate-600 rounded text-white"
                            >
                              <option value="alert">Alert</option>
                              <option value="opportunity">Opportunity</option>
                              <option value="bullish">Bullish</option>
                              <option value="bearish">Bearish</option>
                              <option value="news">News</option>
                            </select>
                          </div>
                        ) : (
                          <p className="text-slate-300 text-xs mb-3">{editedEvent.description}</p>
                        )}
                        
                        {editedEvent.emailOpportunity.suggested && (
                          <div className="bg-slate-900/50 rounded p-2 mb-2">
                            <div className="flex items-center gap-2 text-xs mb-1">
                              <Send className="w-3 h-3 text-blue-400" />
                              <span className="text-blue-400 font-semibold">Email Opportunity</span>
                              {isEditing ? (
                                <select
                                  value={editedEvent.emailOpportunity.urgency}
                                  onChange={(e) => {
                                    setEditedEvents(prev => {
                                      const newMap = new Map(prev);
                                      newMap.set(event.id, { 
                                        ...editedEvent, 
                                        emailOpportunity: {
                                          ...editedEvent.emailOpportunity,
                                          urgency: e.target.value
                                        }
                                      });
                                      return newMap;
                                    });
                                  }}
                                  className="px-2 py-1 text-xs bg-slate-900 border border-slate-600 rounded text-blue-300"
                                >
                                  <option value="high">High</option>
                                  <option value="medium">Medium</option>
                                  <option value="low">Low</option>
                                </select>
                              ) : (
                                <Badge className="bg-blue-500/10 text-blue-300 text-xs">
                                  {editedEvent.emailOpportunity.urgency}
                                </Badge>
                              )}
                            </div>
                            {isEditing ? (
                              <input
                                type="text"
                                value={editedEvent.emailOpportunity.template}
                                onChange={(e) => {
                                  setEditedEvents(prev => {
                                    const newMap = new Map(prev);
                                    newMap.set(event.id, { 
                                      ...editedEvent, 
                                      emailOpportunity: {
                                        ...editedEvent.emailOpportunity,
                                        template: e.target.value
                                      }
                                    });
                                    return newMap;
                                  });
                                }}
                                className="w-full px-2 py-1 text-xs bg-slate-900 border border-slate-600 rounded text-slate-400 mb-1"
                                placeholder="Template"
                              />
                            ) : (
                              <p className="text-slate-400 text-xs">
                                Template: {editedEvent.emailOpportunity.template}
                              </p>
                            )}
                            {isEditing ? (
                              <input
                                type="text"
                                value={editedEvent.emailOpportunity.segments.join(', ')}
                                onChange={(e) => {
                                  setEditedEvents(prev => {
                                    const newMap = new Map(prev);
                                    newMap.set(event.id, { 
                                      ...editedEvent, 
                                      emailOpportunity: {
                                        ...editedEvent.emailOpportunity,
                                        segments: e.target.value.split(',').map(s => s.trim())
                                      }
                                    });
                                    return newMap;
                                  });
                                }}
                                className="w-full px-2 py-1 text-xs bg-slate-900 border border-slate-600 rounded text-slate-500"
                                placeholder="Segments (comma-separated)"
                              />
                            ) : (
                              <p className="text-slate-500 text-xs">
                                Segments: {editedEvent.emailOpportunity.segments.join(', ')}
                              </p>
                            )}
                          </div>
                        )}
                      
                        {event.assignment.needed && (
                          <div className="bg-orange-900/20 rounded p-2">
                          <div className="flex items-center gap-2 text-xs mb-1">
                            <FileEdit className="w-3 h-3 text-orange-400" />
                            <span className="text-orange-400 font-semibold">Assignment Needed</span>
                            <Badge className="bg-orange-500/10 text-orange-300 text-xs">
                              <Clock className="w-3 h-3 mr-1" />
                              {event.assignment.deadline}
                            </Badge>
                          </div>
                          <p className="text-slate-400 text-xs">
                            {event.assignment.focus}
                          </p>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 mt-2">
                        <Button size="sm" variant="outline" className="h-7 text-xs">
                          <Zap className="w-3 h-3 mr-1" />
                          Generate Email
                        </Button>
                        {event.assignment.needed && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-7 text-xs"
                            onClick={() => handleCreateAssignmentFromEvent(event)}
                          >
                            <FileEdit className="w-3 h-3 mr-1" />
                            Create Assignment
                          </Button>
                        )}
                      </div>
                    </div>
                    );
                  })}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-slate-400 text-center py-8">
                <Newspaper className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No market events available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Email Tracking Pixel Card */}
      <Card className="mb-6 border-indigo-500/20 bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/10 dark:to-gray-900">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-indigo-600" />
              Email Open Tracking
              {trackingStats && (
                <Badge 
                  variant={trackingStats.trackingEnabled ? "default" : "secondary"}
                  className={trackingStats.trackingEnabled ? "bg-indigo-500" : "bg-gray-500"}
                >
                  {trackingStats.trackingEnabled ? "Platform Active" : "Platform Disabled"}
                </Badge>
              )}
            </CardTitle>
            {trackingStats && (
              <div className="flex gap-2">
                <Badge className="bg-blue-500 text-white">
                  {trackingStats.averageOpenRate}% Open Rate
                </Badge>
                {trackingStats.privacyCompliant && (
                  <Badge className="bg-green-500 text-white">
                    Privacy Compliant
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loadingTracking ? (
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ) : trackingStats ? (
            <div className="space-y-4">
              {/* Platform-wide Tracking Status */}
              {!trackingStats.trackingEnabled && (
                <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <EyeOff className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      Platform Tracking Disabled - No pixels will be added to any emails
                    </span>
                  </div>
                </div>
              )}
              
              {/* Email Override Info */}
              {trackingStats.emailOverrides && trackingStats.emailOverrides.total > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        Email-Specific Overrides Active
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {trackingStats.emailOverrides.disabled} disabled / {trackingStats.emailOverrides.total} total
                    </Badge>
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    {trackingStats.emailOverrides.disabled} email{trackingStats.emailOverrides.disabled !== 1 ? 's' : ''} have tracking disabled despite platform settings
                  </p>
                </div>
              )}
              
              {/* Tracking Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Tracked</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {trackingStats.totalEmailsTracked.toLocaleString()}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Opens</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {trackingStats.totalOpens.toLocaleString()}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Unique Openers</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {trackingStats.uniqueOpeners.toLocaleString()}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">24hr Opens</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {trackingStats.opensLast24Hours.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Top Campaigns */}
              {trackingStats.topCampaigns.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Top Performing Campaigns
                  </h4>
                  <div className="space-y-2">
                    {trackingStats.topCampaigns.map((campaign, idx) => (
                      <div key={idx} className="flex items-center justify-between group">
                        <button
                          onClick={() => {
                            setLocation(`/campaigns?campaign=${encodeURIComponent(campaign.campaignId)}`);
                          }}
                          className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline transition-colors cursor-pointer flex items-center gap-1"
                        >
                          {campaign.campaignId}
                          <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {campaign.uniqueOpens} opens
                          </Badge>
                          <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 text-xs">
                            {campaign.openRate}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button 
                  size="sm" 
                  variant={trackingStats.trackingEnabled ? "destructive" : "default"}
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/tracking/toggle', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ enabled: !trackingStats.trackingEnabled })
                      });
                      
                      if (response.ok) {
                        // Refresh the stats
                        fetchMarketData();
                      }
                    } catch (error) {
                      console.error('Error toggling tracking:', error);
                    }
                  }}
                >
                  {trackingStats.trackingEnabled ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
                  {trackingStats.trackingEnabled ? 'Disable Platform Tracking' : 'Enable Platform Tracking'}
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    console.log('View tracking details');
                    // Could navigate to detailed tracking view
                  }}
                >
                  <Mail className="w-3 h-3 mr-1" />
                  Generate Pixel
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/tracking/privacy-mode', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ compliant: !trackingStats.privacyCompliant })
                      });
                      
                      if (response.ok) {
                        fetchMarketData();
                      }
                    } catch (error) {
                      console.error('Error toggling privacy mode:', error);
                    }
                  }}
                >
                  <Shield className="w-3 h-3 mr-1" />
                  {trackingStats.privacyCompliant ? 'Full Tracking' : 'Privacy Mode'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              No tracking data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Fatigue Monitoring Card */}
      <Card className="mb-6 border-orange-500/20 bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/10 dark:to-gray-900">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-orange-600" />
              Email Fatigue Guardian
              {fatigueStats && (
                <Badge 
                  variant={fatigueStats.guardrailsEnabled ? "default" : "secondary"}
                  className={fatigueStats.guardrailsEnabled ? "bg-green-500" : "bg-gray-500"}
                >
                  {fatigueStats.guardrailsEnabled ? "Active" : "Monitoring Only"}
                </Badge>
              )}
            </CardTitle>
            {fatigueStats && (
              <div className="flex gap-2">
                {fatigueStats.guardrailsEnabled && fatigueStats.blockedToday > 0 && (
                  <Badge variant="destructive" className="bg-red-500/90">
                    <UserX className="w-3 h-3 mr-1" />
                    {fatigueStats.blockedToday} Blocked
                  </Badge>
                )}
                {!fatigueStats.guardrailsEnabled && fatigueStats.tiredSubscribers > 0 && (
                  <Badge className="bg-yellow-500 text-white">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {fatigueStats.tiredSubscribers} Over Limit
                  </Badge>
                )}
                {fatigueStats.criticalCount > 0 && (
                  <Badge className="bg-orange-500 text-white">
                    {fatigueStats.criticalCount} Critical
                  </Badge>
                )}
                {fatigueStats.warningCount > 0 && (
                  <Badge className="bg-yellow-500 text-white">
                    {fatigueStats.warningCount} Warnings
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loadingFatigue ? (
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ) : fatigueStats ? (
            <div className="space-y-4">
              {/* Guardrails Status Notice */}
              {!fatigueStats.guardrailsEnabled && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Guardrails Disabled - Tracking only, no blocking
                    </span>
                  </div>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                    Statistics are being collected but subscribers won't be blocked from receiving emails.
                  </p>
                </div>
              )}
              
              {/* Fatigue Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {fatigueStats.tiredSubscribers}
                  </div>
                  <div className="text-xs text-gray-500">Tired Subscribers</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {fatigueStats.averageFatigueScore}%
                  </div>
                  <div className="text-xs text-gray-500">Avg Fatigue Score</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  <div className="text-2xl font-bold text-red-600">
                    {fatigueStats.blockedToday}
                  </div>
                  <div className="text-xs text-gray-500">Blocked Today</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  <div className="text-2xl font-bold text-green-600">
                    {fatigueStats.totalSubscribers - fatigueStats.tiredSubscribers}
                  </div>
                  <div className="text-xs text-gray-500">Healthy</div>
                </div>
              </div>

              {/* Top Tired Segments */}
              {fatigueStats.topTiredSegments && fatigueStats.topTiredSegments.length > 0 && (
                <div className="border-t pt-3">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Most Emailed Segments
                  </h4>
                  <div className="space-y-2">
                    {fatigueStats.topTiredSegments.map((segment, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded p-2">
                        <div className="flex-1">
                          <span className="font-medium text-sm">{segment.name}</span>
                          <span className="text-xs text-gray-500 ml-2">({segment.subscribers} subscribers)</span>
                        </div>
                        <div className="flex gap-3 text-xs">
                          <Badge className={segment.avgDaily >= 2.5 ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"}>
                            {formatEmailFrequency(segment.avgDaily)}/day
                          </Badge>
                          <Badge className={segment.avgWeekly >= 8 ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-700"}>
                            {formatEmailFrequency(segment.avgWeekly)}/week
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {fatigueStats.recommendations && fatigueStats.recommendations.length > 0 && (
                <div className="border-t pt-3">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <Lightbulb className="w-4 h-4 inline mr-1" />
                    Smart Recommendations
                  </h4>
                  <div className="space-y-1">
                    {fatigueStats.recommendations.map((rec, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button 
                  size="sm" 
                  variant={fatigueStats.guardrailsEnabled ? "destructive" : "default"}
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/fatigue/toggle-guardrails', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ enabled: !fatigueStats.guardrailsEnabled })
                      });
                      
                      if (response.ok) {
                        // Refresh the stats
                        fetchMarketData();
                      }
                    } catch (error) {
                      console.error('Error toggling guardrails:', error);
                    }
                  }}
                >
                  <Shield className="w-3 h-3 mr-1" />
                  {fatigueStats.guardrailsEnabled ? 'Disable Guardrails' : 'Enable Guardrails'}
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    console.log('View tired list');
                    // Could navigate to detailed tired list view
                  }}
                >
                  <UserX className="w-3 h-3 mr-1" />
                  View Tired List
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    console.log('Configure limits');
                    // Could open settings modal
                  }}
                >
                  <Shield className="w-3 h-3 mr-1" />
                  Configure Limits
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-gray-500">Fatigue monitoring data unavailable</div>
          )}
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <div className="metrics-grid">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          const ChangeIcon = metric.changeType === "positive" ? ArrowUpRight : ArrowDownRight;
          
          return (
            <div key={index} className="metric-card-enhanced interactive-element">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="metric-label-enhanced">{metric.title}</p>
                  <p className="metric-value-animated" data-testid={`text-${metric.title.toLowerCase().replace(/\s+/g, '-')}`}>
                    {metric.value}
                  </p>
                  <div className={`${metric.changeType === 'positive' ? 'metric-change-positive' : 'metric-change-negative'}`}>
                    <ChangeIcon className="w-4 h-4" />
                    <span>{metric.change}</span>
                  </div>
                </div>
                <div className="metric-icon-container">
                  <Icon className="metric-icon" style={{ color: metric.color }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section - Compact View */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              Engagement Trends
            </h3>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-green-500">34.7%</p>
              <p className="text-xs text-slate-400">Current rate</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-green-400">+8.3%</p>
              <p className="text-xs text-slate-400">This month</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-blue-400">74.2%</p>
              <p className="text-xs text-slate-400">Average</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-yellow-500" />
              Revenue Growth
            </h3>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-yellow-500">$89.5K</p>
              <p className="text-xs text-slate-400">Monthly</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-yellow-400">+23.8%</p>
              <p className="text-xs text-slate-400">Growth</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-purple-400">$2.98</p>
              <p className="text-xs text-slate-400">Per user</p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="ai-insights-card">
        <div className="ai-insights-content">
          <div className="ai-insights-header">
            <div className="ai-insights-icon">
              <Lightbulb className="w-6 h-6" />
            </div>
            <h3 className="ai-insights-title">AI Insights & Recommendations</h3>
          </div>
          
          <div className="space-y-0">
            <div className="ai-insight-item">
              <Target className="ai-insight-icon text-yellow-500" />
              <p className="ai-insight-text">
                Your financial newsletter engagement peaks on Tuesday mornings. Consider scheduling premium content for optimal impact.
              </p>
            </div>
            
            <div className="ai-insight-item">
              <TrendingUp className="ai-insight-icon text-green-500" />
              <p className="ai-insight-text">
                Subscribers responding to "Market Outlook" subject lines show 47% higher lifetime value. Expand this content strategy.
              </p>
            </div>
            
            <div className="ai-insight-item">
              <PieChart className="ai-insight-icon text-blue-400" />
              <p className="ai-insight-text">
                Implement personalized stock recommendations for the "High-Value Investor" segment to increase engagement by an estimated 12%.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Generation Progress Modal */}
      <Dialog open={showGenerationModal} onOpenChange={setShowGenerationModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating AI Email Assignment
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{generationStatus}</span>
                <span className="font-medium">{generationProgress}%</span>
              </div>
              <Progress value={generationProgress} className="h-2" />
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Creating personalized content based on:</p>
              <ul className="mt-2 space-y-1">
                <li>• Current market sentiment: {marketSentiment?.sentiment}</li>
                <li>• VIX Level: {marketSentiment?.vixLevel.toFixed(1)}</li>
                <li>• Top performing sectors</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Drafts Modal */}
      <Dialog open={showDraftsModal} onOpenChange={setShowDraftsModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Email Drafts ({emailDrafts.length})
              </span>
              <Badge variant="secondary" className="ml-2">Auto-saved</Badge>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {emailDrafts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No drafts yet</p>
                <p className="text-sm mt-1">Generated emails will appear here</p>
              </div>
            ) : (
              emailDrafts.map((draft) => (
                <Card key={draft.id} className="hover:bg-muted/50 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm">{draft.subject}</h4>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <Badge variant={draft.urgency === 'urgent' ? 'destructive' : 'secondary'} className="text-xs">
                            {draft.urgency}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {draft.sentiment}
                          </Badge>
                          <span>{new Date(draft.createdAt).toLocaleString()}</span>
                        </div>
                        {draft.copywriterLink && (
                          <div className="mt-3 p-2 bg-muted rounded-md">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <Link className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground truncate">
                                  {draft.copywriterLink}
                                </span>
                              </div>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="h-6 px-2"
                                onClick={() => {
                                  navigator.clipboard.writeText(draft.copywriterLink);
                                  setCopiedLinks(prev => new Set(prev).add(draft.id));
                                  toast({
                                    title: "Link Copied",
                                    description: "Copywriter link copied to clipboard",
                                  });
                                  setTimeout(() => {
                                    setCopiedLinks(prev => {
                                      const newSet = new Set(prev);
                                      newSet.delete(draft.id);
                                      return newSet;
                                    });
                                  }, 2000);
                                }}
                              >
                                {copiedLinks.has(draft.id) ? (
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Share this link with copywriters to collaborate on content
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-3 w-3 mr-1" />
                          Preview
                        </Button>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                          <Send className="h-3 w-3 mr-1" />
                          Send
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">
                      {draft.content}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          <div className="flex justify-between items-center mt-4 pt-4 border-t">
            <Button variant="outline" size="sm" onClick={() => setEmailDrafts([])}>
              Clear All Drafts
            </Button>
            <Button size="sm" onClick={() => setShowDraftsModal(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Draft Animation Overlay */}
      {showDraftAnimation && (
        <div className="draft-animation-overlay">
          <div className="draft-animation-item">
            <div className="draft-animation-icon">
              <FileText className="h-6 w-6" />
            </div>
            <div className="draft-animation-content">
              <div className="draft-animation-title">Saving to Drafts</div>
              <div className="draft-animation-subtitle">Email assignment created</div>
            </div>
          </div>
          <div className="draft-folder-indicator">
            <Folder className="h-8 w-8" />
          </div>
        </div>
      )}

      {/* AI-Enhanced Assignment Form Dialog */}
      {showAIAssignmentForm && (
        <Dialog open={showAIAssignmentForm} onOpenChange={setShowAIAssignmentForm}>
          <DialogContent className="max-w-5xl">
            <AIEnhancedAssignmentForm
              prefilledData={assignmentFormData}
              onClose={() => setShowAIAssignmentForm(false)}
              onSuccess={() => {
                // Refresh assignments data
                queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
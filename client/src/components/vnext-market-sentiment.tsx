import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  TrendingUp, TrendingDown, AlertTriangle, Newspaper, 
  DollarSign, Activity, Zap, Send, ArrowUp, ArrowDown,
  Clock, Bell, ChevronRight, Plus, FileText, ExternalLink
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface NewsItem {
  id: string;
  headline: string;
  source: string;
  impact: "high" | "medium" | "low";
  sentiment: "bullish" | "bearish" | "neutral";
  time: string;
  suggestedAction?: string;
  articleUrl?: string;
}

export default function VNextMarketSentiment() {
  const [vixLevel, setVixLevel] = useState(18.5);
  const [marketSentiment, setMarketSentiment] = useState(7.2);
  const [fearGreedIndex, setFearGreedIndex] = useState(65);
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<any>(null);
  const { toast } = useToast();
  
  const newsItems: NewsItem[] = [
    {
      id: "news_001",
      headline: "Dollar Advances as Trump Tariff Threats Fuel Risk-Off Sentiment",
      source: "Reuters",
      impact: "high",
      sentiment: "bearish",
      time: "30 min ago",
      suggestedAction: "Send currency market update to forex and international investors",
      articleUrl: "https://www.reuters.com/markets/currencies/dollar-gains-trump-tariff-threats-peso-slides-2025-01-23/"
    },
    {
      id: "news_002",
      headline: "Nvidia Hits Record High on AI Chip Demand Surge",
      source: "Bloomberg",
      impact: "high",
      sentiment: "bullish",
      time: "1 hour ago",
      suggestedAction: "Create AI sector opportunity email for tech-focused investors",
      articleUrl: "https://www.bloomberg.com/news/articles/2025-01-23/nvidia-stock-hits-record-on-ai-chip-demand"
    },
    {
      id: "news_003",
      headline: "European Central Bank Cuts Rates by 25 Basis Points",
      source: "Financial Times",
      impact: "high",
      sentiment: "bullish",
      time: "2 hours ago",
      suggestedAction: "Alert European market subscribers about rate cut implications",
      articleUrl: "https://www.ft.com/content/ecb-rate-cut-january-2025-economic-outlook"
    }
  ];

  const getSentimentColor = (value: number) => {
    if (value >= 7) return "text-green-600";
    if (value >= 4) return "text-yellow-600";
    return "text-red-600";
  };

  const getFearGreedLabel = (value: number) => {
    if (value >= 75) return "Extreme Greed";
    if (value >= 55) return "Greed";
    if (value >= 45) return "Neutral";
    if (value >= 25) return "Fear";
    return "Extreme Fear";
  };

  // Create assignment from opportunity
  const createAssignmentMutation = useMutation({
    mutationFn: async (data: any) => apiRequest('/api/assignments', 'POST', data),
    onSuccess: () => {
      toast({ title: "Success", description: "Assignment created successfully" });
      setShowCreateAssignment(false);
      setSelectedOpportunity(null);
      queryClient.invalidateQueries({ queryKey: ['/api/assignments'] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create assignment", variant: "destructive" });
    }
  });

  const handleCreateAssignment = (opportunity: any) => {
    setSelectedOpportunity(opportunity);
    setShowCreateAssignment(true);
  };

  const handleSubmitAssignment = (formData: any) => {
    const assignmentData = {
      title: formData.title,
      description: formData.description,
      type: formData.type,
      urgency: formData.urgency,
      targetSegment: formData.targetSegment || "All Subscribers",
      status: "draft",
      context: {
        source: "market_opportunity",
        marketData: selectedOpportunity
      }
    };
    createAssignmentMutation.mutate(assignmentData);
  };

  return (
    <div className="space-y-6">
      {/* Market Indicators */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" />
              VIX Index
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{vixLevel.toFixed(2)}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {vixLevel < 20 ? "Low Volatility" : vixLevel < 30 ? "Moderate Volatility" : "High Volatility"}
            </p>
            <div className="flex items-center gap-1 mt-2">
              {vixLevel < 20 ? (
                <ArrowDown className="h-4 w-4 text-green-600" />
              ) : (
                <ArrowUp className="h-4 w-4 text-red-600" />
              )}
              <span className="text-sm">2.3% from yesterday</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Market Sentiment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getSentimentColor(marketSentiment)}`}>
              {marketSentiment.toFixed(1)}/10
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {marketSentiment >= 7 ? "Bullish" : marketSentiment >= 4 ? "Neutral" : "Bearish"}
            </p>
            <Badge variant="outline" className="mt-2">
              73% historical win rate
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Fear & Greed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{fearGreedIndex}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {getFearGreedLabel(fearGreedIndex)}
            </p>
            <Progress value={fearGreedIndex} className="h-2 mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Sentiment-Based Suggestions */}
      <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
        <Zap className="h-4 w-4 text-blue-600" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-semibold">Market Opportunity Detected</p>
            <p className="text-sm">
              VIX is up 15% today - Historical data shows your "volatility play" emails 
              get 45% higher open rates during market uncertainty.
            </p>
            <Button 
              size="sm" 
              className="mt-2"
              onClick={() => handleCreateAssignment({
                type: "market_alert",
                title: "Volatility Play Email",
                description: "VIX spike detected - create targeted campaign for volatility-sensitive subscribers",
                suggestedSegments: ["Active Traders", "Options Traders"],
                marketContext: { vix: vixLevel, sentiment: marketSentiment }
              })}
            >
              <Send className="h-3 w-3 mr-1" />
              Create Assignment
            </Button>
          </div>
        </AlertDescription>
      </Alert>

      {/* Live News Feed */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Finance News Feed (NA Region)</CardTitle>
              <CardDescription>Real-time opportunities for targeted campaigns</CardDescription>
            </div>
            <Badge variant="default" className="gap-1">
              <Bell className="h-3 w-3" />
              Live
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {newsItems.map((item) => (
            <div key={item.id} className="p-4 border rounded-lg space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge 
                      variant={item.impact === "high" ? "destructive" : 
                               item.impact === "medium" ? "secondary" : "outline"}
                    >
                      {item.impact} impact
                    </Badge>
                    <Badge 
                      variant="outline"
                      className={item.sentiment === "bullish" ? "text-green-600" : 
                                 item.sentiment === "bearish" ? "text-red-600" : ""}
                    >
                      {item.sentiment === "bullish" ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : item.sentiment === "bearish" ? (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      ) : null}
                      {item.sentiment}
                    </Badge>
                  </div>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold">
                        {item.articleUrl ? (
                          <a
                            href={item.articleUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-blue-600 hover:underline cursor-pointer transition-colors"
                          >
                            {item.headline}
                          </a>
                        ) : (
                          item.headline
                        )}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.source} • {item.time}
                      </p>
                    </div>
                    {item.articleUrl && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="ml-2"
                              onClick={() => window.open(item.articleUrl, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Open article in new tab</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>
              </div>
              
              {item.suggestedAction && (
                <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">SharpSend Suggestion:</p>
                      <p className="text-sm text-muted-foreground">{item.suggestedAction}</p>
                    </div>
                    <Button 
                      size="sm"
                      onClick={() => handleCreateAssignment({
                        type: "news_based",
                        title: item.headline.substring(0, 50) + "...",
                        description: item.suggestedAction || "Create targeted email based on this news event",
                        urgency: item.impact === "high" ? "priority" : "standard",
                        suggestedSegments: item.sentiment === "bullish" ? ["Growth Investors", "Tech Sector"] : ["Risk-Averse", "Value Investors"],
                        marketContext: { 
                          news: item.headline,
                          source: item.source,
                          sentiment: item.sentiment,
                          impact: item.impact
                        }
                      })}
                    >
                      <Zap className="h-3 w-3 mr-1" />
                      Create Assignment
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Campaign Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle>Proactive Campaign Opportunities</CardTitle>
          <CardDescription>Based on current market conditions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button 
            variant="outline" 
            className="w-full justify-between"
            onClick={() => handleCreateAssignment({
              type: "market_alert",
              title: "VIX Spike Alert Campaign",
              description: "Create urgent market volatility alert for subscribers tracking VIX movements",
              urgency: "priority",
              suggestedSegments: ["Options Traders", "Risk-Aware Investors"],
              marketContext: { vix: vixLevel, alertType: "volatility_spike" }
            })}
          >
            <span className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              VIX Spike Alert Campaign
            </span>
            <Plus className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-between"
            onClick={() => handleCreateAssignment({
              type: "email_series",
              title: "Bullish Momentum Email Series",
              description: "Multi-part series capitalizing on current bullish market sentiment",
              urgency: "standard",
              suggestedSegments: ["Growth Investors", "Momentum Traders"],
              marketContext: { sentiment: marketSentiment, fearGreed: fearGreedIndex }
            })}
          >
            <span className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Bullish Momentum Email Series
            </span>
            <Plus className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-between"
            onClick={() => handleCreateAssignment({
              type: "countdown_sequence",
              title: "Fed Meeting Countdown Sequence",
              description: "Time-sensitive email sequence leading up to Fed rate decision",
              urgency: "priority",
              suggestedSegments: ["All Subscribers", "Macro Investors"],
              marketContext: { eventType: "fed_meeting", daysUntil: 5 }
            })}
          >
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              Fed Meeting Countdown Sequence
            </span>
            <Plus className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      {/* Create Assignment Dialog */}
      <Dialog open={showCreateAssignment} onOpenChange={setShowCreateAssignment}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Create Assignment from Opportunity
            </DialogTitle>
            <DialogDescription>
              Convert this market opportunity into an actionable content assignment
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Assignment Title</Label>
                <Input
                  id="title"
                  defaultValue={selectedOpportunity?.title}
                  placeholder="e.g., Market Volatility Alert"
                />
              </div>
              <div>
                <Label htmlFor="type">Assignment Type</Label>
                <Select defaultValue={selectedOpportunity?.type || "email_content"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email_content">Email Content</SelectItem>
                    <SelectItem value="subject_line">Subject Line</SelectItem>
                    <SelectItem value="email_series">Email Series</SelectItem>
                    <SelectItem value="market_alert">Market Alert</SelectItem>
                    <SelectItem value="countdown_sequence">Countdown Sequence</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={3}
                defaultValue={selectedOpportunity?.description}
                placeholder="Describe the assignment requirements..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="urgency">Urgency</Label>
                <Select defaultValue={selectedOpportunity?.urgency || "standard"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard (72h)</SelectItem>
                    <SelectItem value="priority">Priority (24h)</SelectItem>
                    <SelectItem value="rush">Rush (6h)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="segment">Target Segment</Label>
                <Select defaultValue="All Subscribers">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Subscribers">All Subscribers</SelectItem>
                    <SelectItem value="Active Traders">Active Traders</SelectItem>
                    <SelectItem value="Options Traders">Options Traders</SelectItem>
                    <SelectItem value="Growth Investors">Growth Investors</SelectItem>
                    <SelectItem value="Value Investors">Value Investors</SelectItem>
                    <SelectItem value="Risk-Aware">Risk-Aware Investors</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedOpportunity?.marketContext && (
              <div className="p-4 bg-muted rounded-lg">
                <Label>Market Context</Label>
                <div className="mt-2 space-y-1 text-sm">
                  {selectedOpportunity.marketContext.vix && (
                    <div>VIX Level: {selectedOpportunity.marketContext.vix}</div>
                  )}
                  {selectedOpportunity.marketContext.sentiment && (
                    <div>Market Sentiment: {selectedOpportunity.marketContext.sentiment}/10</div>
                  )}
                  {selectedOpportunity.marketContext.news && (
                    <div>Related News: {selectedOpportunity.marketContext.news}</div>
                  )}
                  {selectedOpportunity.marketContext.source && (
                    <div>Source: {selectedOpportunity.marketContext.source}</div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateAssignment(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  const title = (document.getElementById('title') as HTMLInputElement)?.value;
                  const description = (document.getElementById('description') as HTMLTextAreaElement)?.value;
                  const type = selectedOpportunity?.type || 'email_content';
                  const urgency = selectedOpportunity?.urgency || 'standard';
                  const targetSegment = 'All Subscribers';
                  
                  handleSubmitAssignment({
                    title,
                    description,
                    type,
                    urgency,
                    targetSegment
                  });
                }}
                disabled={createAssignmentMutation.isPending}
              >
                {createAssignmentMutation.isPending ? 'Creating...' : 'Create Assignment'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
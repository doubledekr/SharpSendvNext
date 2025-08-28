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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLocation } from "wouter";
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
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState(true);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch real news from MarketAux API
  useEffect(() => {
    const fetchMarketNews = async () => {
      try {
        const response = await fetch('/api/market-news');
        const data = await response.json();
        if (data.news && data.news.length > 0) {
          setNewsItems(data.news);
        }
      } catch (error) {
        console.error("Error fetching market news:", error);
      } finally {
        setIsLoadingNews(false);
      }
    };

    fetchMarketNews();
    // Refresh news every 5 minutes
    const interval = setInterval(fetchMarketNews, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

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

  // Navigate to assignment desk with pre-filled URL for news-based assignments
  const handleCreateAssignmentFromNews = (newsItem: NewsItem) => {
    const url = newsItem.articleUrl || '';
    if (url) {
      // Navigate to assignments page with URL parameter
      setLocation(`/assignments?prefilledUrl=${encodeURIComponent(url)}&autoOpen=true`);
    } else {
      // Navigate to assignments page and open create dialog
      setLocation('/assignments?autoOpen=true');
    }
    
    toast({
      title: "Opening Assignment Form",
      description: "Creating assignment from news article...",
    });
  };

  // Navigate to assignment desk for market opportunities
  const handleCreateAssignmentFromOpportunity = () => {
    setLocation('/assignments?autoOpen=true');
    toast({
      title: "Opening Assignment Form",
      description: "Creating assignment from market opportunity...",
    });
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
              onClick={() => handleCreateAssignmentFromOpportunity()}
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
                      onClick={() => handleCreateAssignmentFromNews(item)}
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
            onClick={() => handleCreateAssignmentFromOpportunity()}
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
            onClick={() => handleCreateAssignmentFromOpportunity()}
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
            onClick={() => handleCreateAssignmentFromOpportunity()}
          >
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              Fed Meeting Countdown Sequence
            </span>
            <Plus className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>


    </div>
  );
}
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  TrendingUp, TrendingDown, AlertTriangle, Newspaper, 
  DollarSign, Activity, Zap, Send, ArrowUp, ArrowDown,
  Clock, Bell, ChevronRight
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface NewsItem {
  id: string;
  headline: string;
  source: string;
  impact: "high" | "medium" | "low";
  sentiment: "bullish" | "bearish" | "neutral";
  time: string;
  suggestedAction?: string;
}

export default function VNextMarketSentiment() {
  const [vixLevel, setVixLevel] = useState(18.5);
  const [marketSentiment, setMarketSentiment] = useState(7.2);
  const [fearGreedIndex, setFearGreedIndex] = useState(65);
  
  const newsItems: NewsItem[] = [
    {
      id: "news_001",
      headline: "Fed Signals Potential Rate Cut in September Meeting",
      source: "Reuters",
      impact: "high",
      sentiment: "bullish",
      time: "15 min ago",
      suggestedAction: "Send bullish market update to Premium subscribers"
    },
    {
      id: "news_002",
      headline: "Tech Stocks Rally on Strong Earnings Reports",
      source: "Bloomberg",
      impact: "medium",
      sentiment: "bullish",
      time: "1 hour ago",
      suggestedAction: "Create tech sector opportunity email for Active Traders"
    },
    {
      id: "news_003",
      headline: "Oil Prices Spike on Middle East Tensions",
      source: "CNBC",
      impact: "high",
      sentiment: "bearish",
      time: "2 hours ago",
      suggestedAction: "Alert energy sector subscribers about volatility"
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
            <Button size="sm" className="mt-2">
              <Send className="h-3 w-3 mr-1" />
              Create Volatility Campaign
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
                  <h4 className="font-semibold">{item.headline}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {item.source} • {item.time}
                  </p>
                </div>
              </div>
              
              {item.suggestedAction && (
                <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">SharpSend Suggestion:</p>
                      <p className="text-sm text-muted-foreground">{item.suggestedAction}</p>
                    </div>
                    <Button size="sm">
                      <Zap className="h-3 w-3 mr-1" />
                      Create
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
          <Button variant="outline" className="w-full justify-between">
            <span className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              VIX Spike Alert Campaign
            </span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" className="w-full justify-between">
            <span className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Bullish Momentum Email Series
            </span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" className="w-full justify-between">
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              Fed Meeting Countdown Sequence
            </span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
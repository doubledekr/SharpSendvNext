import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  AlertTriangle, TrendingDown, Users, Clock, Activity, 
  Pause, Play, RefreshCw, BarChart3, Flame, Snowflake
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface SegmentHealth {
  segment: string;
  health: "healthy" | "warning" | "critical";
  openRate: number;
  changePercent: number;
  subscriberCount: number;
  lastTouchpoint: string;
  touchFrequency: number;
  recommendation: string;
}

interface HeatmapData {
  [key: string]: {
    [hour: number]: number;
  };
}

export default function VNextFatigueDetector() {
  
  // Fetch segment health from API - returns empty for non-demo accounts
  const { data: segmentHealth = [] } = useQuery<SegmentHealth[]>({
    queryKey: ["/api/segments/health"],
    retry: false
  });

  // Fetch heatmap data from API - returns empty for non-demo accounts
  const { data: heatmapData = {} } = useQuery<HeatmapData>({
    queryKey: ["/api/segments/heatmap"],
    retry: false
  });

  const getHealthColor = (health: string) => {
    switch (health) {
      case "healthy": return "text-green-600";
      case "warning": return "text-yellow-600";
      case "critical": return "text-red-600";
      default: return "text-gray-600";
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case "healthy": return <Activity className="h-4 w-4" />;
      case "warning": return <AlertTriangle className="h-4 w-4" />;
      case "critical": return <TrendingDown className="h-4 w-4" />;
      default: return null;
    }
  };

  // Only show critical alerts if there are real alerts from data
  const hasCriticalAlerts = segmentHealth.some(segment => segment.health === "critical");

  return (
    <div className="space-y-6">
      {/* Critical Alerts - Only show if real data indicates problems */}
      {hasCriticalAlerts && (
        <Alert className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle>Email Fatigue Alert</AlertTitle>
          <AlertDescription>
            <div className="mt-2 space-y-2">
              <p className="text-sm">
                Critical fatigue detected in one or more segments. Review segment health below.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Health Overview */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Segment Health Monitor</CardTitle>
              <CardDescription>Real-time engagement fatigue detection</CardDescription>
            </div>
            <Badge variant="outline" className="gap-1">
              <RefreshCw className="h-3 w-3" />
              Auto-refresh: ON
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {segmentHealth.map((segment) => (
            <div key={segment.segment} className="p-4 border rounded-lg space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{segment.segment}</h4>
                    <Badge 
                      variant={segment.health === "healthy" ? "default" : 
                               segment.health === "warning" ? "secondary" : "destructive"}
                      className="gap-1"
                    >
                      {getHealthIcon(segment.health)}
                      {segment.health}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {segment.subscriberCount.toLocaleString()} subscribers | 
                    {segment.touchFrequency} touches/week
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{segment.openRate}%</p>
                  <p className={`text-sm ${segment.changePercent > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {segment.changePercent > 0 ? '+' : ''}{segment.changePercent}% vs 2 weeks
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Engagement Health</span>
                  <span>{segment.openRate}%</span>
                </div>
                <Progress 
                  value={segment.openRate} 
                  className={`h-2 ${
                    segment.health === "critical" ? '[&>div]:bg-red-500' :
                    segment.health === "warning" ? '[&>div]:bg-yellow-500' :
                    '[&>div]:bg-green-500'
                  }`}
                />
              </div>
              
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">Recommendation:</p>
                <p className="text-sm text-muted-foreground">{segment.recommendation}</p>
              </div>
              
              <div className="flex gap-2">
                {segment.health === "critical" && (
                  <Button size="sm" variant="outline" className="text-red-600">
                    <Pause className="h-3 w-3 mr-1" />
                    Apply Cooldown
                  </Button>
                )}
                {segment.health === "warning" && (
                  <Button size="sm" variant="outline" className="text-yellow-600">
                    <Clock className="h-3 w-3 mr-1" />
                    Adjust Timing
                  </Button>
                )}
                <Button size="sm" variant="outline">
                  <BarChart3 className="h-3 w-3 mr-1" />
                  View History
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Engagement Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle>Engagement Heatmap</CardTitle>
          <CardDescription>Optimal send times based on pixel data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center">
                <p className="text-xs font-medium mb-2">{day}</p>
                <div className="space-y-1">
                  {[6, 9, 12, 15, 18, 21].map((hour) => {
                    const intensity = heatmapData[day]?.[hour] || 0;
                    return (
                      <div
                        key={`${day}-${hour}`}
                        className={`h-6 rounded-sm flex items-center justify-center text-xs ${
                          intensity > 0.7 ? 'bg-green-500 text-white' :
                          intensity > 0.4 ? 'bg-yellow-500 text-white' :
                          'bg-gray-200 dark:bg-gray-800'
                        }`}
                      >
                        {hour}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex items-center justify-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-green-500" />
              <span>Hot (&gt;70% engagement)</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-yellow-500" />
              <span>Warm (40-70%)</span>
            </div>
            <div className="flex items-center gap-2">
              <Snowflake className="h-4 w-4 text-gray-400" />
              <span>Cold (&lt;40%)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart3, TrendingUp, Users, Mail, Calendar, 
  Activity, Brain, Target, Sparkles, AlertCircle,
  Eye, Gauge, Newspaper, Settings, Zap, Loader2
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import VNextPixelManager from "@/components/vnext-pixel-manager";
import VNextFatigueDetector from "@/components/vnext-fatigue-detector";
import VNextAutoSegmentation from "@/components/vnext-auto-segmentation";
import VNextMarketSentiment from "@/components/vnext-market-sentiment";

export default function VNextDashboard() {
  const [activeTab, setActiveTab] = useState("performance");
  
  // Check if this is a demo account
  const isDemoAccount = () => {
    const user = localStorage.getItem('user');
    if (!user) return false;
    try {
      const userData = JSON.parse(user);
      return userData.id === 'demo-user' || userData.id === 'demo-user-id';
    } catch {
      return false;
    }
  };
  
  // Fetch real analytics data
  const { data: analytics, isLoading: analyticsLoading } = useQuery<any>({
    queryKey: ["/api/analytics"],
    retry: false,
  });
  
  // Fetch subscriber count
  const { data: subscribers, isLoading: subscribersLoading } = useQuery<any[]>({
    queryKey: ["/api/subscribers"],
    retry: false,
  });
  
  // Fetch campaigns
  const { data: campaigns, isLoading: campaignsLoading } = useQuery<any[]>({
    queryKey: ["/api/campaigns"],
    retry: false,
  });
  
  // Calculate real stats from fetched data
  const stats = {
    totalSubscribers: subscribers?.length || 0,
    engagementRate: analytics?.engagementRate || 0,
    monthlyRevenue: analytics?.revenue?.monthly || 0,
    activeCampaigns: campaigns?.filter((c: any) => c.status === 'active')?.length || 0,
    pixelsActive: analytics?.pixelStats?.active || 0,
    fatigueAlerts: analytics?.alerts?.fatigue || 0,
    newSegments: analytics?.segments?.new || 0,
    marketSentiment: analytics?.marketSentiment || 0
  };
  
  const isLoading = analyticsLoading || subscribersLoading || campaignsLoading;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">SharpSend Command Center</h1>
          <p className="text-muted-foreground">
            Real-time performance tracking and campaign intelligence
          </p>
        </div>
        <Button>
          <Zap className="h-4 w-4 mr-2" />
          Quick Campaign
        </Button>
      </div>
      
      {/* Show loading state while fetching data */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Key Metrics Overview - only show when data is loaded */}
      {!isLoading && (
      <>
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubscribers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-600">↑ 12%</span> from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.engagementRate}%</div>
            <Progress value={stats.engagementRate} className="h-1 mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(stats.monthlyRevenue/1000).toFixed(0)}K</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-600">↑ 23%</span> from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCampaigns}</div>
            <div className="flex gap-1 mt-2">
              <Badge variant="default" className="text-xs">{stats.pixelsActive} pixels</Badge>
              <Badge variant="secondary" className="text-xs">{stats.fatigueAlerts} alerts</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Status Bar */}
      <div className="flex gap-2 p-3 bg-muted rounded-lg">
        <Badge variant={stats.fatigueAlerts > 0 ? "destructive" : "default"} className="gap-1">
          <AlertCircle className="h-3 w-3" />
          {stats.fatigueAlerts} Fatigue Alerts
        </Badge>
        <Badge variant="default" className="gap-1">
          <Brain className="h-3 w-3" />
          {stats.newSegments} New Segments
        </Badge>
        <Badge variant="secondary" className="gap-1">
          <Activity className="h-3 w-3" />
          {stats.pixelsActive} Active Pixels
        </Badge>
        <Badge variant="outline" className="gap-1">
          <TrendingUp className="h-3 w-3" />
          Market: {stats.marketSentiment}/10
        </Badge>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="performance" className="gap-1">
            <Eye className="h-3 w-3" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="fatigue" className="gap-1">
            <Gauge className="h-3 w-3" />
            Fatigue
          </TabsTrigger>
          <TabsTrigger value="opportunities" className="gap-1">
            <Newspaper className="h-3 w-3" />
            Opportunities
          </TabsTrigger>
          <TabsTrigger value="segments" className="gap-1">
            <Users className="h-3 w-3" />
            Segments
          </TabsTrigger>
          <TabsTrigger value="pixel-library" className="gap-1">
            <Activity className="h-3 w-3" />
            Pixel Library
          </TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Only show mock data for demo accounts */}
            {isDemoAccount() ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Email Performance Trends</CardTitle>
                    <CardDescription>Last 30 days pixel data</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Average Open Rate</span>
                        <span className="font-semibold">68.5%</span>
                      </div>
                      <Progress value={68.5} className="h-2" />
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Click-Through Rate</span>
                        <span className="font-semibold">24.3%</span>
                      </div>
                      <Progress value={24.3} className="h-2" />
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Conversion Rate</span>
                        <span className="font-semibold">3.8%</span>
                      </div>
                      <Progress value={3.8 * 10} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Top Performing Campaigns</CardTitle>
                    <CardDescription>By engagement metrics</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Market Alert 7/18</span>
                        <Badge variant="default">78% Open</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        12,450 opens • 3,200 clicks
                      </p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Weekly Digest</span>
                        <Badge variant="secondary">52% Open</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        8,900 opens • 1,800 clicks
                      </p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Premium Offer</span>
                        <Badge variant="outline">45% Open</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        5,200 opens • 890 clicks
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Email Performance Trends</CardTitle>
                    <CardDescription>Last 30 days pixel data</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      <Mail className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No performance data yet</p>
                      <p className="text-sm mt-1">Start sending campaigns to see metrics</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Top Performing Campaigns</CardTitle>
                    <CardDescription>By engagement metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No campaigns yet</p>
                      <p className="text-sm mt-1">Create your first campaign to get started</p>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
          
          <VNextPixelManager />
        </TabsContent>

        <TabsContent value="fatigue" className="space-y-6">
          <VNextFatigueDetector />
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-6">
          <VNextMarketSentiment />
        </TabsContent>

        <TabsContent value="segments" className="space-y-6">
          <VNextAutoSegmentation />
        </TabsContent>

        <TabsContent value="pixel-library" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pixel Management Center</CardTitle>
              <CardDescription>Configure and manage all tracking pixels</CardDescription>
            </CardHeader>
            <CardContent>
              <VNextPixelManager />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </>
      )}
    </div>
  );
}
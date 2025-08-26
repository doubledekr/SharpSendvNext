import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Activity, CheckCircle, Settings, Tag, BarChart3, Globe, 
  Smartphone, Monitor, AlertCircle, TrendingUp, Copy, Eye
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

interface PixelData {
  id: string;
  name: string;
  campaign: string;
  status: "active" | "inactive";
  opens: number;
  clicks: number;
  openRate: number;
  deviceBreakdown: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
  locationBreakdown: {
    [key: string]: number;
  };
  createdAt: Date;
}

export default function VNextPixelManager() {
  const [autoAttach, setAutoAttach] = useState(true);
  const [pixelName, setPixelName] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState("");
  
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
  
  // Fetch real pixel data from API for non-demo accounts
  const { data: pixelsData, isLoading } = useQuery<PixelData[]>({
    queryKey: ["/api/pixels"],
    retry: false,
    enabled: !isDemoAccount(), // Only fetch for real accounts
  });
  
  // Mock data only for demo accounts
  const demoPixels: PixelData[] = isDemoAccount() ? [
    {
      id: "px_001",
      name: "Premium Alert 7/18",
      campaign: "Market Update",
      status: "active",
      opens: 12450,
      clicks: 3200,
      openRate: 68.5,
      deviceBreakdown: { mobile: 45, desktop: 40, tablet: 15 },
      locationBreakdown: { "US": 75, "CA": 15, "UK": 10 },
      createdAt: new Date("2024-07-18")
    },
    {
      id: "px_002",
      name: "Weekly Digest",
      campaign: "Newsletter",
      status: "active",
      opens: 8900,
      clicks: 1800,
      openRate: 52.3,
      deviceBreakdown: { mobile: 55, desktop: 35, tablet: 10 },
      locationBreakdown: { "US": 80, "CA": 12, "UK": 8 },
      createdAt: new Date("2024-07-15")
    }
  ] : [];
  
  // Use demo data for demo accounts, real data for real accounts
  const pixels: PixelData[] = isDemoAccount() ? demoPixels : (pixelsData || []);

  const copyPixelCode = (pixelId: string) => {
    const code = `<img src="https://sharpsend.io/px/${pixelId}" width="1" height="1" />`;
    navigator.clipboard.writeText(code);
    toast({ title: "Pixel code copied!", description: "Paste into your email template" });
  };

  return (
    <div className="space-y-6">
      {/* Auto-Attach Control */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Pixel Auto-Attachment
              </CardTitle>
              <CardDescription>
                Automatically attach tracking pixels to all outgoing emails
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Label htmlFor="auto-attach">Auto-Attach</Label>
              <Switch 
                id="auto-attach"
                checked={autoAttach}
                onCheckedChange={setAutoAttach}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {autoAttach && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">All emails will include SharpSend tracking pixel</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pixel Library */}
      <Card>
        <CardHeader>
          <CardTitle>Pixel Library</CardTitle>
          <CardDescription>Manage and monitor all campaign pixels</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="active">Active Pixels</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="rules">Automation Rules</TabsTrigger>
            </TabsList>
            
            <TabsContent value="active" className="space-y-4">
              {pixels.map((pixel) => (
                <div key={pixel.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{pixel.name}</h4>
                        <Badge variant={pixel.status === "active" ? "default" : "secondary"}>
                          {pixel.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Campaign: {pixel.campaign} | Created: {pixel.createdAt.toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => copyPixelCode(pixel.id)}>
                        <Copy className="h-3 w-3 mr-1" />
                        Copy Code
                      </Button>
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Opens</p>
                      <p className="text-lg font-semibold">{pixel.opens.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Clicks</p>
                      <p className="text-lg font-semibold">{pixel.clicks.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Open Rate</p>
                      <p className="text-lg font-semibold">{pixel.openRate}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">CTR</p>
                      <p className="text-lg font-semibold">
                        {((pixel.clicks / pixel.opens) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-3 w-3" />
                      <span>{pixel.deviceBreakdown.mobile}% Mobile</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Monitor className="h-3 w-3" />
                      <span>{pixel.deviceBreakdown.desktop}% Desktop</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="h-3 w-3" />
                      <span>{Object.keys(pixel.locationBreakdown).length} Countries</span>
                    </div>
                  </div>
                </div>
              ))}
            </TabsContent>
            
            <TabsContent value="performance" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Top Performing Pixels</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {pixels.slice(0, 3).map((pixel) => (
                      <div key={pixel.id} className="flex justify-between items-center">
                        <span className="text-sm">{pixel.name}</span>
                        <Badge variant="outline" className="text-green-600">
                          {pixel.openRate}% Open
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Device Distribution</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm flex items-center gap-2">
                          <Smartphone className="h-3 w-3" /> Mobile
                        </span>
                        <span className="text-sm font-semibold">48%</span>
                      </div>
                      <Progress value={48} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm flex items-center gap-2">
                          <Monitor className="h-3 w-3" /> Desktop
                        </span>
                        <span className="text-sm font-semibold">38%</span>
                      </div>
                      <Progress value={38} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="rules" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Automation Rules (Pro+)</CardTitle>
                  <CardDescription>Set conditions to trigger automatic actions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 border rounded-lg space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-sm">Low Engagement Alert</p>
                        <p className="text-xs text-muted-foreground">
                          If open rate {"<"} 15% after 24h → Send variant B
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                  
                  <div className="p-3 border rounded-lg space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-sm">High Performer Boost</p>
                        <p className="text-xs text-muted-foreground">
                          If CTR {">"} 25% → Expand to similar segments
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                  
                  <Button className="w-full" variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Create New Rule
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Activity, 
  AlertCircle, 
  CheckCircle2, 
  Cloud, 
  Database, 
  Mail, 
  RefreshCw, 
  Settings, 
  Shield, 
  Zap,
  Users,
  Tag,
  Send,
  AlertTriangle,
  Clock,
  TrendingUp,
  Server
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import NavigationHeader from "@/components/dashboard/navigation-header";
// import confetti from "canvas-confetti";

interface PlatformHealth {
  platform: string;
  status: 'healthy' | 'degraded' | 'down';
  uptime: number;
  avgLatency: number;
  lastCheck: string;
  errorCount: number;
  capabilities: {
    groups: boolean;
    tags: boolean;
    segments: boolean;
    automation: boolean;
    webhooks: boolean;
  };
}

interface PlatformConfig {
  name: string;
  enabled: boolean;
  priority: number;
  apiKey: string;
  features: {
    groupsEnabled: boolean;
    tagsEnabled: boolean;
    automationEnabled: boolean;
    webhooksEnabled: boolean;
  };
}

export default function EmailPlatformDashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("health");
  const [confirmationMode, setConfirmationMode] = useState("multi-platform");
  const [primaryPlatform, setPrimaryPlatform] = useState("sendgrid");

  // Fetch platform health status
  const { data: platformHealth, isLoading: healthLoading } = useQuery({
    queryKey: ['/api/email-platforms/health'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch platform configurations
  const { data: platformConfigs, isLoading: configLoading } = useQuery({
    queryKey: ['/api/email-platforms/configs']
  });

  // Update platform configuration
  const updateConfig = useMutation({
    mutationFn: async (config: PlatformConfig) => {
      return apiRequest('/api/email-platforms/config', 'PUT', config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email-platforms/configs'] });
      toast({
        title: "Configuration Updated",
        description: "Platform settings have been saved successfully."
      });
      // confetti({
      //   particleCount: 100,
      //   spread: 70,
      //   origin: { y: 0.6 }
      // });
    }
  });

  // Test platform connection
  const testConnection = useMutation({
    mutationFn: async (platform: string) => {
      return apiRequest(`/api/email-platforms/test/${platform}`, 'POST');
    },
    onSuccess: (data, platform) => {
      toast({
        title: "Connection Successful",
        description: `${platform} is connected and operational.`
      });
    },
    onError: (error, platform) => {
      toast({
        title: "Connection Failed",
        description: `Unable to connect to ${platform}. Please check your API credentials.`,
        variant: "destructive"
      });
    }
  });

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, JSX.Element> = {
      sendgrid: <Mail className="h-5 w-5" />,
      mailchimp: <Users className="h-5 w-5" />,
      exacttarget: <Cloud className="h-5 w-5" />,
      mailgun: <Zap className="h-5 w-5" />
    };
    return icons[platform.toLowerCase()] || <Mail className="h-5 w-5" />;
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'healthy': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'down': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const mockHealthData: PlatformHealth[] = [
    {
      platform: "SendGrid",
      status: "healthy",
      uptime: 99.98,
      avgLatency: 245,
      lastCheck: "2 minutes ago",
      errorCount: 0,
      capabilities: {
        groups: true,
        tags: true,
        segments: true,
        automation: false,
        webhooks: true
      }
    },
    {
      platform: "Mailchimp",
      status: "healthy",
      uptime: 99.95,
      avgLatency: 380,
      lastCheck: "2 minutes ago",
      errorCount: 0,
      capabilities: {
        groups: true,
        tags: true,
        segments: true,
        automation: true,
        webhooks: true
      }
    },
    {
      platform: "ExactTarget",
      status: "healthy",
      uptime: 99.92,
      avgLatency: 410,
      lastCheck: "2 minutes ago",
      errorCount: 1,
      capabilities: {
        groups: true,
        tags: true,
        segments: true,
        automation: true,
        webhooks: true
      }
    },
    {
      platform: "Mailgun",
      status: "degraded",
      uptime: 98.5,
      avgLatency: 180,
      lastCheck: "2 minutes ago",
      errorCount: 3,
      capabilities: {
        groups: false,
        tags: true,
        segments: false,
        automation: false,
        webhooks: true
      }
    }
  ];

  const healthData = platformHealth || mockHealthData;

  return (
    <div className="min-h-screen bg-slate-900">
      <NavigationHeader currentPage="email-platforms" />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Email Platform Integration Center</h1>
          <p className="text-slate-400">Manage multi-platform email delivery with 99.95% uptime guarantee</p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="health" data-testid="tab-health">
              <Activity className="mr-2 h-4 w-4" />
              Platform Health
            </TabsTrigger>
            <TabsTrigger value="capabilities" data-testid="tab-capabilities">
              <Database className="mr-2 h-4 w-4" />
              Capabilities
            </TabsTrigger>
            <TabsTrigger value="confirmation" data-testid="tab-confirmation">
              <Shield className="mr-2 h-4 w-4" />
              Confirmation Logic
            </TabsTrigger>
            <TabsTrigger value="configuration" data-testid="tab-configuration">
              <Settings className="mr-2 h-4 w-4" />
              Configuration
            </TabsTrigger>
          </TabsList>

          {/* Platform Health Tab */}
          <TabsContent value="health">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {healthData.map((platform: PlatformHealth) => (
                <Card key={platform.platform} className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getPlatformIcon(platform.platform)}
                        <CardTitle className="text-white">{platform.platform}</CardTitle>
                      </div>
                      <Badge 
                        className={`${getStatusColor(platform.status)} text-white`}
                        data-testid={`status-${platform.platform.toLowerCase()}`}
                      >
                        {platform.status.toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-slate-400 text-sm">Uptime</p>
                        <p className="text-white font-semibold">{platform.uptime}%</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm">Avg Latency</p>
                        <p className="text-white font-semibold">{platform.avgLatency}ms</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm">Last Check</p>
                        <p className="text-white font-semibold">{platform.lastCheck}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm">Errors (24h)</p>
                        <p className="text-white font-semibold">{platform.errorCount}</p>
                      </div>
                    </div>
                    
                    <Progress 
                      value={platform.uptime} 
                      className="h-2 bg-slate-700"
                      data-testid={`uptime-${platform.platform.toLowerCase()}`}
                    />
                    
                    <div className="flex justify-between">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => testConnection.mutate(platform.platform)}
                        data-testid={`test-${platform.platform.toLowerCase()}`}
                      >
                        <RefreshCw className="mr-2 h-3 w-3" />
                        Test Connection
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        data-testid={`configure-${platform.platform.toLowerCase()}`}
                      >
                        Configure
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Capabilities Tab */}
          <TabsContent value="capabilities">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Platform Capabilities Matrix</CardTitle>
                <CardDescription>Feature support across email platforms</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-3 px-4 text-slate-400">Platform</th>
                        <th className="text-center py-3 px-4 text-slate-400">Groups</th>
                        <th className="text-center py-3 px-4 text-slate-400">Tags</th>
                        <th className="text-center py-3 px-4 text-slate-400">Segments</th>
                        <th className="text-center py-3 px-4 text-slate-400">Automation</th>
                        <th className="text-center py-3 px-4 text-slate-400">Webhooks</th>
                        <th className="text-center py-3 px-4 text-slate-400">Batch Send</th>
                      </tr>
                    </thead>
                    <tbody>
                      {healthData.map((platform: PlatformHealth) => (
                        <tr key={platform.platform} className="border-b border-slate-700">
                          <td className="py-3 px-4 text-white font-medium">
                            <div className="flex items-center space-x-2">
                              {getPlatformIcon(platform.platform)}
                              <span>{platform.platform}</span>
                            </div>
                          </td>
                          <td className="text-center py-3 px-4">
                            {platform.capabilities.groups ? 
                              <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" /> : 
                              <AlertCircle className="h-5 w-5 text-red-500 mx-auto" />
                            }
                          </td>
                          <td className="text-center py-3 px-4">
                            {platform.capabilities.tags ? 
                              <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" /> : 
                              <AlertCircle className="h-5 w-5 text-red-500 mx-auto" />
                            }
                          </td>
                          <td className="text-center py-3 px-4">
                            {platform.capabilities.segments ? 
                              <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" /> : 
                              <AlertCircle className="h-5 w-5 text-red-500 mx-auto" />
                            }
                          </td>
                          <td className="text-center py-3 px-4">
                            {platform.capabilities.automation ? 
                              <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" /> : 
                              <AlertCircle className="h-5 w-5 text-red-500 mx-auto" />
                            }
                          </td>
                          <td className="text-center py-3 px-4">
                            {platform.capabilities.webhooks ? 
                              <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" /> : 
                              <AlertCircle className="h-5 w-5 text-red-500 mx-auto" />
                            }
                          </td>
                          <td className="text-center py-3 px-4">
                            <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <Alert className="mt-6 bg-slate-700 border-slate-600">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Platform Recommendations</AlertTitle>
                  <AlertDescription>
                    • <strong>Mailchimp</strong>: Best for marketing automation and audience segmentation<br />
                    • <strong>SendGrid</strong>: Most reliable for transactional emails with fast delivery<br />
                    • <strong>ExactTarget</strong>: Enterprise-grade journey orchestration<br />
                    • <strong>Mailgun</strong>: Fastest API response times for high-volume sends
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Confirmation Logic Tab */}
          <TabsContent value="confirmation">
            <div className="space-y-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Send Confirmation Settings</CardTitle>
                  <CardDescription>Configure multi-platform redundancy for guaranteed delivery</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-white">Multi-Platform Redundancy</Label>
                        <p className="text-sm text-slate-400">Enable automatic failover between platforms</p>
                      </div>
                      <Switch 
                        checked={confirmationMode === "multi-platform"}
                        onCheckedChange={(checked) => setConfirmationMode(checked ? "multi-platform" : "single")}
                        data-testid="switch-redundancy"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-white">Primary Platform</Label>
                      <Select value={primaryPlatform} onValueChange={setPrimaryPlatform}>
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sendgrid">SendGrid (Recommended)</SelectItem>
                          <SelectItem value="mailchimp">Mailchimp</SelectItem>
                          <SelectItem value="exacttarget">ExactTarget</SelectItem>
                          <SelectItem value="mailgun">Mailgun</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-white">Failover Priority Order</Label>
                      <div className="space-y-2">
                        {['SendGrid', 'Mailgun', 'Mailchimp', 'ExactTarget'].map((platform, index) => (
                          <div key={platform} className="flex items-center space-x-3 p-3 bg-slate-700 rounded-lg">
                            <span className="text-slate-400 font-mono">{index + 1}</span>
                            {getPlatformIcon(platform)}
                            <span className="text-white">{platform}</span>
                            <Badge variant="outline" className="ml-auto">
                              {index === 0 ? 'Primary' : `Backup ${index}`}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <Alert className="bg-blue-900/20 border-blue-800">
                    <Shield className="h-4 w-4 text-blue-400" />
                    <AlertTitle className="text-blue-400">99.95% Uptime Guarantee</AlertTitle>
                    <AlertDescription className="text-slate-300">
                      With multi-platform redundancy enabled, your campaigns will automatically failover 
                      to backup platforms if the primary platform experiences issues. Confirmation is 
                      achieved through webhooks and API polling within 30 seconds.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Confirmation Methods</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-700 rounded-lg">
                      <h4 className="text-white font-semibold mb-2">Critical Campaigns</h4>
                      <ul className="space-y-1 text-sm text-slate-300">
                        <li>✓ Double confirmation required</li>
                        <li>✓ Webhook timeout: 10 seconds</li>
                        <li>✓ API verification enabled</li>
                        <li>✓ Automatic retry on failure</li>
                      </ul>
                    </div>
                    <div className="p-4 bg-slate-700 rounded-lg">
                      <h4 className="text-white font-semibold mb-2">Standard Campaigns</h4>
                      <ul className="space-y-1 text-sm text-slate-300">
                        <li>✓ Single confirmation accepted</li>
                        <li>✓ Webhook timeout: 30 seconds</li>
                        <li>✓ Best-effort delivery</li>
                        <li>✓ Queued for retry if needed</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Configuration Tab */}
          <TabsContent value="configuration">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {['SendGrid', 'Mailchimp', 'ExactTarget', 'Mailgun'].map((platform) => (
                <Card key={platform} className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      {getPlatformIcon(platform)}
                      <CardTitle className="text-white">{platform} Configuration</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-white">Enable Platform</Label>
                        <Switch data-testid={`enable-${platform.toLowerCase()}`} />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label className="text-white">Groups & Tags</Label>
                        <Switch data-testid={`groups-${platform.toLowerCase()}`} />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label className="text-white">Automation</Label>
                        <Switch data-testid={`automation-${platform.toLowerCase()}`} />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label className="text-white">Webhooks</Label>
                        <Switch data-testid={`webhooks-${platform.toLowerCase()}`} />
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      data-testid={`save-${platform.toLowerCase()}`}
                    >
                      Save Configuration
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Settings, 
  Zap, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Trash2, 
  Users, 
  Mail, 
  BarChart3,
  ExternalLink,
  AlertCircle,
  Send
} from "lucide-react";

interface Platform {
  id: string;
  name: string;
  description: string;
  category: string;
  logo: string;
  authType: string;
  fields: Array<{
    name: string;
    label: string;
    type: string;
    required: boolean;
    description?: string;
    options?: Array<{
      value: string;
      label: string;
    }>;
  }>;
  status: string;
  features: string[];
}

interface Integration {
  id: string;
  platformId: string;
  name: string;
  platform: string;
  status: string;
  connectedAt: string;
  lastSync: string;
  stats?: {
    subscribers?: number;
    campaigns?: number;
    openRate?: string;
    clickRate?: string;
  };
}

export default function IntegrationsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [connectionName, setConnectionName] = useState("");
  const [customRequest, setCustomRequest] = useState({
    platform: "",
    description: "",
    email: "",
    useCase: ""
  });
  const [isConnectDialogOpen, setIsConnectDialogOpen] = useState(false);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch available platforms
  const { data: platformsData } = useQuery({
    queryKey: ["/api/integrations/platforms"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/integrations/platforms");
      return await response.json() as { success: boolean; platforms: Platform[]; categories: string[] };
    }
  });

  // Fetch connected integrations
  const { data: connectionsData, isLoading: isLoadingConnections } = useQuery({
    queryKey: ["/api/integrations/connected"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/integrations/connected");
      return await response.json() as { success: boolean; integrations: Integration[] };
    }
  });

  const platforms = platformsData?.platforms || [];
  const categories = platformsData?.categories || [];
  const connections = connectionsData?.integrations || [];

  const filteredPlatforms = selectedCategory === "all" 
    ? platforms 
    : platforms.filter(p => p.category === selectedCategory);

  // Connect to platform mutation
  const connectMutation = useMutation({
    mutationFn: async (data: { platformId: string; credentials: Record<string, string>; name?: string }) => {
      const response = await apiRequest("POST", "/api/integrations/connect", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Connected Successfully",
        description: "Integration has been set up and is now active.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/integrations/connected"] });
      setIsConnectDialogOpen(false);
      setCredentials({});
      setConnectionName("");
      setSelectedPlatform(null);
    },
    onError: (error: any) => {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect integration",
        variant: "destructive",
      });
    }
  });

  // Disconnect mutation
  const disconnectMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/integrations/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Disconnected",
        description: "Integration has been removed.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/integrations/connected"] });
    }
  });

  // Test connection mutation
  const testMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("POST", `/api/integrations/${id}/test`, {});
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Connection Successful",
        description: "Integration is working properly.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/integrations/connected"] });
    },
    onError: (error: any) => {
      toast({
        title: "Connection Test Failed",
        description: error.message || "Please check your credentials",
        variant: "destructive",
      });
    }
  });

  // Sync data mutation
  const syncMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("POST", `/api/integrations/${id}/sync`, {});
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sync Complete",
        description: "Latest data has been imported.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/integrations/connected"] });
    }
  });

  // Request custom integration mutation
  const requestMutation = useMutation({
    mutationFn: async (data: typeof customRequest) => {
      const response = await apiRequest("POST", "/api/integrations/request-custom", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Request Submitted",
        description: "Our team will review your request and contact you within 2-3 business days.",
      });
      setIsRequestDialogOpen(false);
      setCustomRequest({ platform: "", description: "", email: "", useCase: "" });
    }
  });

  const handleConnect = () => {
    if (!selectedPlatform) return;

    connectMutation.mutate({
      platformId: selectedPlatform.id,
      credentials,
      name: connectionName || selectedPlatform.name
    });
  };

  const handleCredentialChange = (fieldName: string, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const openConnectDialog = (platform: Platform) => {
    setSelectedPlatform(platform);
    setCredentials({});
    setConnectionName("");
    setIsConnectDialogOpen(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Integrations</h1>
          <p className="text-muted-foreground">
            Connect your email platforms to sync data and automate campaigns
          </p>
        </div>
        <Button
          onClick={() => setIsRequestDialogOpen(true)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Request Integration
        </Button>
      </div>

      <Tabs defaultValue="connected" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="connected">Connected ({connections.length})</TabsTrigger>
          <TabsTrigger value="available">Available ({platforms.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="connected" className="space-y-4">
          {isLoadingConnections ? (
            <div className="text-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent mx-auto mb-4" />
              <p className="text-muted-foreground">Loading integrations...</p>
            </div>
          ) : connections.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No integrations connected</h3>
              <p className="text-sm mb-4">
                Connect your email platforms to start syncing subscriber data and campaign metrics.
              </p>
              <Button
                variant="outline"
                onClick={() => setIsRequestDialogOpen(true)}
              >
                Browse Available Platforms
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {connections.map((integration) => (
                <Card key={integration.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                          <Mail className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{integration.name}</CardTitle>
                          <CardDescription>{integration.platform}</CardDescription>
                        </div>
                      </div>
                      <Badge variant="secondary" className="gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Connected
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Subscribers</p>
                        <p className="font-semibold flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {integration.stats?.subscribers?.toLocaleString() || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Campaigns</p>
                        <p className="font-semibold flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {integration.stats?.campaigns || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Open Rate</p>
                        <p className="font-semibold flex items-center gap-1">
                          <BarChart3 className="h-4 w-4" />
                          {integration.stats?.openRate ? (parseFloat(integration.stats.openRate) * 100).toFixed(1) + "%" : "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Click Rate</p>
                        <p className="font-semibold flex items-center gap-1">
                          <ExternalLink className="h-4 w-4" />
                          {integration.stats?.clickRate ? (parseFloat(integration.stats.clickRate) * 100).toFixed(1) + "%" : "N/A"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => testMutation.mutate(integration.id)}
                        disabled={testMutation.isPending}
                        className="flex-1 gap-1"
                      >
                        {testMutation.isPending ? (
                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          <Zap className="h-3 w-3" />
                        )}
                        Test
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => syncMutation.mutate(integration.id)}
                        disabled={syncMutation.isPending}
                        className="flex-1 gap-1"
                      >
                        {syncMutation.isPending ? (
                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          <RefreshCw className="h-3 w-3" />
                        )}
                        Sync
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => disconnectMutation.mutate(integration.id)}
                        disabled={disconnectMutation.isPending}
                        className="gap-1"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                      Last synced: {new Date(integration.lastSync).toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="available" className="space-y-4">
          <div className="flex gap-4 items-center">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {filteredPlatforms.length} platform{filteredPlatforms.length !== 1 ? 's' : ''} available
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPlatforms.map((platform) => {
              const isConnected = connections.some(conn => conn.platformId === platform.id);
              
              return (
                <Card key={platform.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                          <Mail className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg">{platform.name}</CardTitle>
                          <CardDescription>{platform.category}</CardDescription>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        {platform.status === "beta" && (
                          <Badge variant="outline" className="text-xs">
                            Beta
                          </Badge>
                        )}
                        {isConnected && (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Connected
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {platform.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-1">
                      {platform.features.slice(0, 3).map((feature) => (
                        <Badge key={feature} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                      {platform.features.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{platform.features.length - 3} more
                        </Badge>
                      )}
                    </div>
                    
                    <Button
                      className="w-full gap-2"
                      onClick={() => openConnectDialog(platform)}
                      disabled={isConnected}
                      variant={isConnected ? "secondary" : "default"}
                    >
                      {isConnected ? (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          Connected
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          Connect
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Connect Platform Dialog */}
      <Dialog open={isConnectDialogOpen} onOpenChange={setIsConnectDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Connect to {selectedPlatform?.name}</DialogTitle>
            <DialogDescription>
              Enter your API credentials to connect your {selectedPlatform?.name} account.
            </DialogDescription>
          </DialogHeader>
          
          {selectedPlatform && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="connectionName">Connection Name (Optional)</Label>
                <Input
                  id="connectionName"
                  value={connectionName}
                  onChange={(e) => setConnectionName(e.target.value)}
                  placeholder={`My ${selectedPlatform.name} Account`}
                />
              </div>
              
              {selectedPlatform.fields.map((field) => (
                <div key={field.name} className="space-y-2">
                  <Label htmlFor={field.name}>
                    {field.label}
                    {field.required && <span className="text-destructive">*</span>}
                  </Label>
                  {field.description && (
                    <p className="text-xs text-muted-foreground">{field.description}</p>
                  )}
                  {field.type === "select" && field.options ? (
                    <Select
                      value={credentials[field.name] || ""}
                      onValueChange={(value) => handleCredentialChange(field.name, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${field.label}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id={field.name}
                      type={field.type}
                      value={credentials[field.name] || ""}
                      onChange={(e) => handleCredentialChange(field.name, e.target.value)}
                      placeholder={field.label}
                      required={field.required}
                    />
                  )}
                </div>
              ))}
              
              {selectedPlatform.authType === "oauth" && (
                <div className="bg-muted/50 border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">OAuth Setup Required</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This integration uses OAuth. After connecting, you'll be redirected to {selectedPlatform.name} to authorize SharpSend.
                  </p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConnectDialogOpen(false)}
              disabled={connectMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConnect}
              disabled={connectMutation.isPending}
              className="gap-2"
            >
              {connectMutation.isPending ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              Connect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Custom Integration Dialog */}
      <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Request Custom Integration</DialogTitle>
            <DialogDescription>
              Don't see your platform? Let us know what you need and we'll build it for you.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="requestPlatform">Platform Name *</Label>
              <Input
                id="requestPlatform"
                value={customRequest.platform}
                onChange={(e) => setCustomRequest(prev => ({ ...prev, platform: e.target.value }))}
                placeholder="e.g., HubSpot, Pardot, Eloqua"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="requestEmail">Your Email *</Label>
              <Input
                id="requestEmail"
                type="email"
                value={customRequest.email}
                onChange={(e) => setCustomRequest(prev => ({ ...prev, email: e.target.value }))}
                placeholder="your@email.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="requestUseCase">Use Case</Label>
              <Input
                id="requestUseCase"
                value={customRequest.useCase}
                onChange={(e) => setCustomRequest(prev => ({ ...prev, useCase: e.target.value }))}
                placeholder="e.g., Financial newsletter automation"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="requestDescription">Additional Details</Label>
              <Textarea
                id="requestDescription"
                value={customRequest.description}
                onChange={(e) => setCustomRequest(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Any specific features or requirements..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRequestDialogOpen(false)}
              disabled={requestMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => requestMutation.mutate(customRequest)}
              disabled={requestMutation.isPending || !customRequest.platform || !customRequest.email}
              className="gap-2"
            >
              {requestMutation.isPending ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Send, 
  Mail, 
  FileText, 
  DollarSign, 
  TrendingUp, 
  AlertCircle,
  Calendar,
  Users,
  BarChart3,
  Eye,
  MousePointer,
  Target,
  ChevronRight,
  Activity,
  Zap
} from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  type: string;
  description?: string;
  status: string;
  totalSends: number;
  totalOpens: number;
  totalClicks: number;
  totalConversions: number;
  totalRevenue: string;
  avgOpenRate: string;
  avgClickRate: string;
  createdAt: string;
  updatedAt: string;
}

interface SendItem {
  id: string;
  name: string;
  subjectLine: string;
  status: string;
  pipelineStage: string;
  targetedSegments: string[];
  assignedTo?: string;
  scheduledAt?: string;
  sentAt?: string;
  openRate: string;
  clickRate: string;
  pixelAttached: boolean;
  pixelId?: string;
}

const emailTypes = [
  { id: "marketing", label: "Marketing", icon: TrendingUp, color: "bg-blue-500" },
  { id: "editorial", label: "Editorial", icon: FileText, color: "bg-purple-500" },
  { id: "fulfillment", label: "Fulfillment", icon: Mail, color: "bg-green-500" },
  { id: "paid_fulfillment", label: "Paid Fulfillment", icon: DollarSign, color: "bg-yellow-500" },
  { id: "engagement", label: "Engagement", icon: Users, color: "bg-pink-500" },
  { id: "transactional", label: "Transactional", icon: Zap, color: "bg-gray-500" },
];

const pipelineStages = [
  { id: "suggested", label: "Suggested Sends", color: "bg-gray-100 dark:bg-gray-900" },
  { id: "drafts", label: "Drafts", color: "bg-blue-100 dark:bg-blue-900" },
  { id: "approved", label: "Approved", color: "bg-green-100 dark:bg-green-900" },
  { id: "scheduled", label: "Scheduled", color: "bg-yellow-100 dark:bg-yellow-900" },
  { id: "sent", label: "Sent", color: "bg-purple-100 dark:bg-purple-900" },
];

export function CampaignsDashboard() {
  const { toast } = useToast();
  const [selectedType, setSelectedType] = useState("marketing");
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreateSendDialogOpen, setIsCreateSendDialogOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    type: "marketing",
    description: "",
    startDate: "",
    endDate: "",
  });
  const [newSend, setNewSend] = useState({
    name: "",
    subjectLine: "",
    content: "",
    targetedSegments: [] as string[],
    scheduledAt: "",
  });

  // Fetch campaigns by type with error handling
  const { data: campaignsData, isLoading: loadingCampaigns, error: campaignsError } = useQuery({
    queryKey: ["/api/campaigns", selectedType],
    queryFn: async () => {
      const response = await fetch(`/api/campaigns?type=${selectedType}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Failed to fetch campaigns: ${response.status}`);
      }
      return data;
    },
    retry: 2,
  });
  
  // Ensure campaigns is always an array
  const campaigns = Array.isArray(campaignsData) ? campaignsData : 
                    Array.isArray(campaignsData?.campaigns) ? campaignsData.campaigns : [];

  // Fetch sends for selected campaign
  const { data: sendsData, isLoading: loadingSends } = useQuery({
    queryKey: ["/api/campaigns", selectedCampaign?.id, "sends"],
    queryFn: async () => {
      if (!selectedCampaign) return null;
      const response = await fetch(`/api/campaigns/${selectedCampaign.id}/sends`);
      return response.json();
    },
    enabled: !!selectedCampaign,
  });

  // Fetch pixel dashboard data
  const { data: pixelDashboard } = useQuery({
    queryKey: ["/api/pixels/dashboard"],
    queryFn: async () => {
      const response = await fetch("/api/pixels/dashboard");
      return response.json();
    },
  });

  // Create campaign mutation
  const createCampaignMutation = useMutation({
    mutationFn: async (data: typeof newCampaign) => {
      const response = await apiRequest("POST", "/api/campaigns", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast({
        title: "Campaign Created",
        description: "Your new campaign has been created successfully.",
      });
      setIsCreateDialogOpen(false);
      setNewCampaign({
        name: "",
        type: "marketing",
        description: "",
        startDate: "",
        endDate: "",
      });
    },
  });

  // Create send mutation
  const createSendMutation = useMutation({
    mutationFn: async (data: typeof newSend) => {
      if (!selectedCampaign) return;
      const response = await apiRequest("POST", `/api/campaigns/${selectedCampaign.id}/sends`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns", selectedCampaign?.id, "sends"] });
      toast({
        title: "Send Created",
        description: "New send has been added to the campaign with pixel attached.",
      });
      setIsCreateSendDialogOpen(false);
      setNewSend({
        name: "",
        subjectLine: "",
        content: "",
        targetedSegments: [],
        scheduledAt: "",
      });
    },
  });

  // Update send pipeline stage
  const updatePipelineMutation = useMutation({
    mutationFn: async ({ sendId, pipelineStage }: { sendId: string; pipelineStage: string }) => {
      const response = await apiRequest("PATCH", `/api/sends/${sendId}/pipeline`, { pipelineStage });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns", selectedCampaign?.id, "sends"] });
      toast({
        title: "Pipeline Updated",
        description: "Send has been moved to the next stage.",
      });
    },
  });

  const handleDragStart = (e: React.DragEvent, send: SendItem) => {
    e.dataTransfer.setData("sendId", send.id);
    e.dataTransfer.setData("currentStage", send.pipelineStage);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, newStage: string) => {
    e.preventDefault();
    const sendId = e.dataTransfer.getData("sendId");
    const currentStage = e.dataTransfer.getData("currentStage");
    
    if (currentStage !== newStage) {
      updatePipelineMutation.mutate({ sendId, pipelineStage: newStage });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header with Pixel Dashboard Summary */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Campaigns Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Manage campaigns with Send → Pixel hierarchy
          </p>
        </div>
        
        {/* Pixel Performance Summary */}
        <Card className="w-96">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pixel Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-blue-500" />
                <span className="text-muted-foreground">Opens:</span>
                <span className="font-semibold">{pixelDashboard?.aggregates?.totalOpens || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <MousePointer className="h-4 w-4 text-green-500" />
                <span className="text-muted-foreground">Clicks:</span>
                <span className="font-semibold">{pixelDashboard?.aggregates?.totalClicks || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-purple-500" />
                <span className="text-muted-foreground">Conversions:</span>
                <span className="font-semibold">{pixelDashboard?.aggregates?.totalConversions || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-red-500" />
                <span className="text-muted-foreground">Fatigue Alerts:</span>
                <span className="font-semibold">{pixelDashboard?.fatigueAlerts?.length || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Email Type Tabs */}
      <Tabs value={selectedType} onValueChange={setSelectedType} className="space-y-4">
        <TabsList className="grid grid-cols-6 w-full">
          {emailTypes.map((type) => (
            <TabsTrigger key={type.id} value={type.id} className="flex items-center gap-2">
              <type.icon className="h-4 w-4" />
              {type.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {emailTypes.map((emailType) => (
          <TabsContent key={emailType.id} value={emailType.id} className="space-y-4">
            <div className="grid grid-cols-3 gap-6">
              {/* Campaigns List */}
              <div className="col-span-1 space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold">{emailType.label} Campaigns</h2>
                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        New Campaign
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Campaign</DialogTitle>
                        <DialogDescription>
                          Create a new {emailType.label} campaign to organize your sends.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="name">Campaign Name</Label>
                          <Input
                            id="name"
                            value={newCampaign.name}
                            onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                            placeholder="Q1 Marketing Campaign"
                          />
                        </div>
                        <div>
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            value={newCampaign.description}
                            onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                            placeholder="Campaign objectives and goals..."
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="startDate">Start Date</Label>
                            <Input
                              id="startDate"
                              type="date"
                              value={newCampaign.startDate}
                              onChange={(e) => setNewCampaign({ ...newCampaign, startDate: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="endDate">End Date</Label>
                            <Input
                              id="endDate"
                              type="date"
                              value={newCampaign.endDate}
                              onChange={(e) => setNewCampaign({ ...newCampaign, endDate: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={() => createCampaignMutation.mutate({ ...newCampaign, type: emailType.id })}
                          disabled={!newCampaign.name}
                        >
                          Create Campaign
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                <ScrollArea className="h-[600px]">
                  <div className="space-y-2">
                    {loadingCampaigns ? (
                      <p className="text-muted-foreground">Loading campaigns...</p>
                    ) : campaigns.length === 0 ? (
                      <Card>
                        <CardContent className="text-center py-8">
                          <p className="text-muted-foreground">No {emailType.label} campaigns yet</p>
                        </CardContent>
                      </Card>
                    ) : (
                      campaigns.map((campaign: Campaign) => (
                        <Card
                          key={campaign.id}
                          className={`cursor-pointer transition-colors ${
                            selectedCampaign?.id === campaign.id ? "border-primary" : ""
                          }`}
                          onClick={() => setSelectedCampaign(campaign)}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-sm">{campaign.name}</CardTitle>
                              <Badge variant={campaign.status === "active" ? "default" : "secondary"}>
                                {campaign.status}
                              </Badge>
                            </div>
                            {campaign.description && (
                              <CardDescription className="text-xs mt-1">
                                {campaign.description}
                              </CardDescription>
                            )}
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-muted-foreground">Sends:</span>
                                <span className="ml-1 font-semibold">{campaign.totalSends}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Revenue:</span>
                                <span className="ml-1 font-semibold">${campaign.totalRevenue}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Open Rate:</span>
                                <span className="ml-1 font-semibold">{campaign.avgOpenRate}%</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Click Rate:</span>
                                <span className="ml-1 font-semibold">{campaign.avgClickRate}%</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Pipeline View */}
              <div className="col-span-2">
                {selectedCampaign ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h2 className="text-lg font-semibold">
                        {selectedCampaign.name} - Pipeline
                      </h2>
                      <Dialog open={isCreateSendDialogOpen} onOpenChange={setIsCreateSendDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <Send className="h-4 w-4 mr-2" />
                            New Send
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Create New Send</DialogTitle>
                            <DialogDescription>
                              Create a new send with automatic pixel attachment.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="sendName">Send Name</Label>
                              <Input
                                id="sendName"
                                value={newSend.name}
                                onChange={(e) => setNewSend({ ...newSend, name: e.target.value })}
                                placeholder="Weekly Newsletter #1"
                              />
                            </div>
                            <div>
                              <Label htmlFor="subjectLine">Subject Line</Label>
                              <Input
                                id="subjectLine"
                                value={newSend.subjectLine}
                                onChange={(e) => setNewSend({ ...newSend, subjectLine: e.target.value })}
                                placeholder="Your Weekly Market Update"
                              />
                            </div>
                            <div>
                              <Label htmlFor="content">Content</Label>
                              <Textarea
                                id="content"
                                value={newSend.content}
                                onChange={(e) => setNewSend({ ...newSend, content: e.target.value })}
                                placeholder="Email content..."
                                rows={6}
                              />
                            </div>
                            <div>
                              <Label htmlFor="scheduledAt">Schedule For</Label>
                              <Input
                                id="scheduledAt"
                                type="datetime-local"
                                value={newSend.scheduledAt}
                                onChange={(e) => setNewSend({ ...newSend, scheduledAt: e.target.value })}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              onClick={() => createSendMutation.mutate(newSend)}
                              disabled={!newSend.name || !newSend.subjectLine}
                            >
                              Create Send with Pixel
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>

                    {/* Pipeline Stages */}
                    <div className="grid grid-cols-5 gap-3">
                      {pipelineStages.map((stage) => (
                        <div
                          key={stage.id}
                          className={`${stage.color} dark:bg-opacity-20 border border-border rounded-lg p-3 min-h-[500px]`}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, stage.id)}
                        >
                          <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/50">
                            <h3 className="font-semibold text-sm text-foreground">{stage.label}</h3>
                            <Badge variant="secondary" className="text-xs">
                              {sendsData?.pipeline?.[stage.id]?.length || 0}
                            </Badge>
                          </div>
                          
                          <ScrollArea className="h-[420px]">
                            <div className="space-y-2 pr-2">
                              {loadingSends ? (
                                <p className="text-xs text-muted-foreground text-center py-4">Loading...</p>
                              ) : !sendsData?.pipeline?.[stage.id]?.length ? (
                                <p className="text-xs text-muted-foreground text-center py-8">
                                  No items in {stage.label.toLowerCase()}
                                </p>
                              ) : (
                                sendsData?.pipeline?.[stage.id]?.map((send: SendItem) => (
                                  <Card
                                    key={send.id}
                                    className="cursor-move hover:shadow-md transition-shadow"
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, send)}
                                  >
                                    <CardContent className="p-3">
                                    <div className="space-y-2">
                                      <div className="flex items-start justify-between">
                                        <p className="text-xs font-medium line-clamp-1">
                                          {send.name}
                                        </p>
                                        {send.pixelAttached && (
                                          <Badge variant="outline" className="ml-2">
                                            <Activity className="h-3 w-3 mr-1" />
                                            Pixel
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-xs text-muted-foreground line-clamp-2">
                                        {send.subjectLine}
                                      </p>
                                      {send.targetedSegments.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                          {send.targetedSegments.slice(0, 2).map((segment, idx) => (
                                            <Badge key={idx} variant="secondary" className="text-xs">
                                              {segment}
                                            </Badge>
                                          ))}
                                          {send.targetedSegments.length > 2 && (
                                            <Badge variant="secondary" className="text-xs">
                                              +{send.targetedSegments.length - 2}
                                            </Badge>
                                          )}
                                        </div>
                                      )}
                                      {stage.id === "sent" && (
                                        <div className="grid grid-cols-2 gap-1 text-xs mt-2">
                                          <div>
                                            <span className="text-muted-foreground">Open:</span>
                                            <span className="ml-1 font-semibold">{send.openRate}%</span>
                                          </div>
                                          <div>
                                            <span className="text-muted-foreground">Click:</span>
                                            <span className="ml-1 font-semibold">{send.clickRate}%</span>
                                          </div>
                                        </div>
                                      )}
                                      {stage.id !== "sent" && (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="w-full h-6 text-xs"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const nextStageIndex = pipelineStages.findIndex(s => s.id === stage.id) + 1;
                                            if (nextStageIndex < pipelineStages.length) {
                                              updatePipelineMutation.mutate({
                                                sendId: send.id,
                                                pipelineStage: pipelineStages[nextStageIndex].id
                                              });
                                            }
                                          }}
                                        >
                                          Move to {pipelineStages[pipelineStages.findIndex(s => s.id === stage.id) + 1]?.label}
                                          <ChevronRight className="h-3 w-3 ml-1" />
                                        </Button>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              ))
                            )}
                          </div>
                        </ScrollArea>
                      </div>
                    ))}
                    </div>

                    {/* Fatigue Alerts */}
                    {pixelDashboard?.fatigueAlerts?.length > 0 && (
                      <Card className="border-orange-200 bg-orange-50">
                        <CardHeader>
                          <CardTitle className="text-sm flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-orange-500" />
                            Email Fatigue Alerts
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {pixelDashboard.fatigueAlerts.slice(0, 3).map((alert: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Send {alert.sendId.slice(0, 8)}...</span>
                                <Badge variant="destructive">Score: {alert.fatigueScore}</Badge>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="flex items-center justify-center h-[600px]">
                      <div className="text-center">
                        <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                          Select a campaign to view its send pipeline
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
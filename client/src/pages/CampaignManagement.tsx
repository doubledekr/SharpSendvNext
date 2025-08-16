import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, Users, Mail, Plus, CheckCircle, XCircle, AlertCircle, Copy, ExternalLink, FileText, Pencil, Eye, Settings, Sparkles, Zap, Target } from "lucide-react";
import { format } from "date-fns";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { SparklyEffects, triggerSparkly } from "@/components/SparklyEffects";
import type { CampaignProject, EmailAssignment } from "../../../shared/schema";

interface ProjectWithDetails {
  project: CampaignProject;
  assignments: EmailAssignment[];
  collaborators: any[];
}

interface CampaignAnalytics {
  totalAssignments: number;
  completedAssignments: number;
  pendingAssignments: number;
  submittedAssignments: number;
  approvedAssignments: number;
  revisionRequests: number;
  averageCompletionTime: number;
  collaboratorActivity: Array<{
    email: string;
    name: string;
    role: string;
    assignmentsCompleted: number;
    lastActivity: Date;
  }>;
}

export function CampaignManagement() {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [sparklyTrigger, setSparklyTrigger] = useState(false);
  const { toast } = useToast();

  // Fetch campaign projects
  const { data: projects, isLoading: projectsLoading } = useQuery<{ data: CampaignProject[] }>({
    queryKey: ['/api/campaigns/projects'],
    enabled: true,
  });

  // Fetch project details when selected
  const { data: projectDetails, isLoading: detailsLoading } = useQuery<{ data: ProjectWithDetails }>({
    queryKey: ['/api/campaigns/projects', selectedProject],
    enabled: !!selectedProject,
  });

  // Fetch project analytics when selected
  const { data: analytics } = useQuery<{ data: CampaignAnalytics }>({
    queryKey: ['/api/campaigns/projects', selectedProject, 'analytics'],
    enabled: !!selectedProject,
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (data: any) => apiRequest('/api/campaigns/projects', 'POST', data),
    onSuccess: () => {
      toast({ title: "Success", description: "Campaign project created successfully" });
      triggerSparkly('success');
      setSparklyTrigger(true);
      setTimeout(() => setSparklyTrigger(false), 100);
      setShowCreateProject(false);
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns/projects'] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create campaign project", variant: "destructive" });
    },
  });

  // Create assignment mutation
  const createAssignmentMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/campaigns/projects/${selectedProject}/assignments`, 'POST', data);
    },
    onSuccess: (result: any) => {
      toast({ title: "Success", description: "Assignment created and sent successfully" });
      triggerSparkly('assignment');
      setSparklyTrigger(true);
      setTimeout(() => setSparklyTrigger(false), 100);
      setShowCreateAssignment(false);
      // Copy link to clipboard
      if (result.data.uniqueLink) {
        navigator.clipboard.writeText(result.data.uniqueLink);
        toast({ title: "Link Copied", description: "Assignment link copied to clipboard" });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns/projects', selectedProject] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create assignment", variant: "destructive" });
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      draft: "outline",
      pending: "secondary",
      in_progress: "default",
      submitted: "default",
      approved: "default",
      revision_requested: "destructive",
      completed: "default",
      cancelled: "destructive",
    };

    const colors: Record<string, string> = {
      draft: "text-gray-600",
      pending: "text-yellow-600",
      in_progress: "text-blue-600",
      submitted: "text-purple-600",
      approved: "text-green-600",
      revision_requested: "text-red-600",
      completed: "text-green-700",
      cancelled: "text-red-700",
    };

    return (
      <Badge variant={variants[status] || "default"} className={colors[status]}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Campaign Management</h1>
          <p className="text-gray-600 mt-1">
            Manage collaborative email campaigns with unique assignment links
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={() => setShowAIAssistant(true)} 
            variant="outline"
            data-testid="button-ai-assistant"
          >
            <Settings className="w-4 h-4 mr-2" />
            AI Assistant
          </Button>
          <Button onClick={() => setShowCreateProject(true)} data-testid="button-create-project">
            <Plus className="w-4 h-4 mr-2" />
            New Campaign
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Campaign Projects
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {projectsLoading ? (
              <div className="text-center py-4">Loading projects...</div>
            ) : projects?.data && projects.data.length > 0 ? (
              projects.data.map((project: CampaignProject) => (
                <Card 
                  key={project.id} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedProject === project.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setSelectedProject(project.id)}
                  data-testid={`card-project-${project.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm">{project.name}</h4>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {project.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          {getStatusBadge(project.status)}
                          <span className="text-xs text-gray-500">
                            {project.createdAt ? format(new Date(project.createdAt), 'MMM d') : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No campaign projects yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Project Details */}
        <Card className="lg:col-span-2">
          {selectedProject && projectDetails ? (
            <Tabs defaultValue="overview">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{projectDetails.data.project.name}</CardTitle>
                  <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="assignments">Assignments</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  </TabsList>
                </div>
              </CardHeader>

              <CardContent>
                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Status</Label>
                      <div className="mt-1">
                        {getStatusBadge(projectDetails.data.project.status)}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Created</Label>
                      <p className="text-sm text-gray-600 mt-1">
                        {projectDetails.data.project.createdAt 
                          ? format(new Date(projectDetails.data.project.createdAt), 'MMM d, yyyy') 
                          : 'Unknown'
                        }
                      </p>
                    </div>
                  </div>
                  
                  {projectDetails.data.project.description && (
                    <div>
                      <Label className="text-sm font-medium">Description</Label>
                      <p className="text-sm text-gray-600 mt-1">
                        {projectDetails.data.project.description}
                      </p>
                    </div>
                  )}

                  {projectDetails.data.project.targetAudience && (
                    <div>
                      <Label className="text-sm font-medium">Target Audience</Label>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span className="text-sm">
                            {projectDetails.data.project.targetAudience.estimatedReach.toLocaleString()} subscribers
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {projectDetails.data.project.targetAudience.cohorts.map((cohort) => (
                            <Badge key={cohort} variant="outline" className="text-xs">
                              {cohort}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="assignments" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold">Email Assignments</h4>
                    <Button 
                      onClick={() => setShowCreateAssignment(true)} 
                      size="sm"
                      data-testid="button-create-assignment"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      New Assignment
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {projectDetails.data.assignments.length > 0 ? (
                      projectDetails.data.assignments.map((assignment) => (
                        <Card key={assignment.id} data-testid={`card-assignment-${assignment.id}`}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h5 className="font-medium text-sm">
                                    {assignment.assignmentType.replace('_', ' ')}
                                  </h5>
                                  {getStatusBadge(assignment.status)}
                                </div>
                                <p className="text-xs text-gray-600 mt-1">
                                  Assigned to: {assignment.assigneeName || assignment.assigneeEmail}
                                </p>
                                {assignment.briefing && (
                                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                    {assignment.briefing.instructions}
                                  </p>
                                )}
                                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                  <span>Created {assignment.createdAt ? format(new Date(assignment.createdAt), 'MMM d') : 'Unknown'}</span>
                                  {assignment.expiresAt && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      Expires {format(new Date(assignment.expiresAt), 'MMM d')}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {assignment.status === 'submitted' && (
                                  <Button size="sm" variant="outline" data-testid="button-view-submission">
                                    <Eye className="w-4 h-4 mr-1" />
                                    Review
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    const link = `${window.location.origin}/assignment/${assignment.uniqueToken}`;
                                    navigator.clipboard.writeText(link);
                                    toast({ title: "Link Copied", description: "Assignment link copied to clipboard" });
                                  }}
                                  data-testid="button-copy-link"
                                >
                                  <Copy className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No assignments created yet
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-4">
                  {analytics?.data && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {analytics.data.totalAssignments}
                          </div>
                          <p className="text-sm text-gray-600">Total Assignments</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {analytics.data.completedAssignments}
                          </div>
                          <p className="text-sm text-gray-600">Completed</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-yellow-600">
                            {analytics.data.pendingAssignments}
                          </div>
                          <p className="text-sm text-gray-600">Pending</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {analytics.data.averageCompletionTime}h
                          </div>
                          <p className="text-sm text-gray-600">Avg Time</p>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </TabsContent>
              </CardContent>
            </Tabs>
          ) : (
            <CardContent className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Select a campaign project to view details</p>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Create Project Dialog */}
      <CreateProjectDialog
        open={showCreateProject}
        onOpenChange={setShowCreateProject}
        onSubmit={(data) => createProjectMutation.mutate(data)}
        isLoading={createProjectMutation.isPending}
      />

      {/* Create Assignment Dialog */}
      <CreateAssignmentDialog
        open={showCreateAssignment}
        onOpenChange={setShowCreateAssignment}
        onSubmit={(data) => createAssignmentMutation.mutate(data)}
        isLoading={createAssignmentMutation.isPending}
      />

      {/* AI Assistant Dialog */}
      <AIAssistantDialog
        open={showAIAssistant}
        onOpenChange={setShowAIAssistant}
      />

      {/* Sparkly Effects */}
      <SparklyEffects trigger={sparklyTrigger} type="success" />
    </div>
  );
}

// AI Assistant Dialog Component
function AIAssistantDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [activeTab, setActiveTab] = useState('one-off');
  const [oneOffData, setOneOffData] = useState({
    assignmentType: 'email_content',
    targetCohort: 'High-Value Investor',
    urgency: 'standard',
    customInstructions: '',
    marketEvent: '',
  });
  const [sentimentEnabled, setSentimentEnabled] = useState(true);
  const { toast } = useToast();

  // Generate daily assignments
  const { data: dailyAssignments, refetch: refetchDaily } = useQuery({
    queryKey: ['/api/campaigns/ai-suggestions/daily'],
    enabled: false,
  });

  // One-off assignment mutation
  const oneOffMutation = useMutation({
    mutationFn: async (data: any) => apiRequest('/api/campaigns/ai-suggestions/one-off', 'POST', data),
    onSuccess: (result) => {
      toast({
        title: "Assignment Generated!",
        description: "AI has created a customized assignment ready for collaboration.",
      });
      triggerSparkly('celebration');
    },
  });

  // Sentiment analysis mutation
  const sentimentMutation = useMutation({
    mutationFn: async (data: any) => apiRequest('/api/campaigns/ai-suggestions/sentiment-based', 'POST', data),
    onSuccess: (result) => {
      toast({
        title: "Sentiment Analysis Complete",
        description: result.data ? "Assignment created with sentiment awareness" : "Sentiment analysis is disabled",
      });
      triggerSparkly('completion');
    },
  });

  const handleDailyGeneration = async () => {
    try {
      await refetchDaily();
      toast({
        title: "Daily Assignments Generated",
        description: "AI has analyzed market conditions and created personalized assignments.",
      });
      triggerSparkly('success');
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Could not generate daily assignments. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleOneOffGeneration = () => {
    oneOffMutation.mutate(oneOffData);
  };

  const handleSentimentAnalysis = () => {
    sentimentMutation.mutate({
      sentimentEnabled,
      currentSentiment: 'bullish' // Could be dynamic from market data
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-500" />
            AI Assignment Assistant
          </DialogTitle>
          <DialogDescription>
            Generate intelligent assignments using market data and cohort analysis
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="one-off">One-Off Assignment</TabsTrigger>
            <TabsTrigger value="daily">Daily Suggestions</TabsTrigger>
            <TabsTrigger value="sentiment">Sentiment Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="one-off" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="assignmentType">Assignment Type</Label>
                <Select
                  value={oneOffData.assignmentType}
                  onValueChange={(value) => setOneOffData({ ...oneOffData, assignmentType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email_content">Email Content</SelectItem>
                    <SelectItem value="subject_line">Subject Line</SelectItem>
                    <SelectItem value="email_design">Email Design</SelectItem>
                    <SelectItem value="content_review">Content Review</SelectItem>
                    <SelectItem value="fact_check">Fact Check</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="urgency">Urgency Level</Label>
                <Select
                  value={oneOffData.urgency}
                  onValueChange={(value) => setOneOffData({ ...oneOffData, urgency: value })}
                >
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
            </div>

            <div>
              <Label htmlFor="targetCohort">Target Cohort</Label>
              <Select
                value={oneOffData.targetCohort}
                onValueChange={(value) => setOneOffData({ ...oneOffData, targetCohort: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="High-Value Investor">High-Value Investor</SelectItem>
                  <SelectItem value="Day Trader">Day Trader</SelectItem>
                  <SelectItem value="Long-term Investor">Long-term Investor</SelectItem>
                  <SelectItem value="Options Trader">Options Trader</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="marketEvent">Market Event (Optional)</Label>
              <Input
                value={oneOffData.marketEvent}
                onChange={(e) => setOneOffData({ ...oneOffData, marketEvent: e.target.value })}
                placeholder="e.g., Fed Rate Decision, Earnings Season"
              />
            </div>

            <div>
              <Label htmlFor="customInstructions">Custom Instructions</Label>
              <Textarea
                value={oneOffData.customInstructions}
                onChange={(e) => setOneOffData({ ...oneOffData, customInstructions: e.target.value })}
                placeholder="Specific requirements or context for this assignment..."
              />
            </div>

            <Button 
              onClick={handleOneOffGeneration} 
              className="w-full"
              disabled={oneOffMutation.isPending}
            >
              {oneOffMutation.isPending ? 'Generating...' : 'Generate One-Off Assignment'}
              <Zap className="w-4 h-4 ml-2" />
            </Button>
          </TabsContent>

          <TabsContent value="daily" className="space-y-4">
            <div className="text-center space-y-4">
              <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                <Target className="w-12 h-12 mx-auto text-blue-600 mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  AI Daily Assignment Generator
                </h3>
                <p className="text-gray-600 mb-4">
                  Generate personalized assignments based on:
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-left space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Market volatility analysis
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Breaking news integration
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Cohort engagement trends
                    </div>
                  </div>
                  <div className="text-left space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Seasonal investment patterns
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Federal Reserve announcements
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Earnings calendar events
                    </div>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleDailyGeneration}
                size="lg"
                className="w-full"
              >
                Generate Today's AI Suggestions
                <Sparkles className="w-4 h-4 ml-2" />
              </Button>

              {dailyAssignments?.data && dailyAssignments.data.length > 0 && (
                <div className="mt-4 text-left">
                  <h4 className="font-semibold mb-2">Generated Assignments:</h4>
                  <div className="space-y-2">
                    {dailyAssignments.data.slice(0, 3).map((assignment: any, index: number) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{assignment.title}</span>
                          <Badge variant={assignment.priority === 'urgent' ? 'destructive' : 'default'}>
                            {assignment.priority}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{assignment.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="sentiment" className="space-y-4">
            <div className="space-y-6">
              <div className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  What is Sentiment Analysis?
                </h3>
                <p className="text-gray-700 mb-4">
                  Sentiment analysis automatically adjusts your email content based on real-time market emotions and investor psychology.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-medium text-green-700">When ENABLED:</h4>
                    <ul className="text-sm space-y-1 text-gray-600">
                      <li>• Subject lines adapt to fear/greed indicators</li>
                      <li>• Content tone matches market sentiment</li>
                      <li>• Risk warnings adjust to volatility levels</li>
                      <li>• Call-to-actions leverage emotional triggers</li>
                      <li>• Timing optimized for market psychology</li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-700">When DISABLED:</h4>
                    <ul className="text-sm space-y-1 text-gray-600">
                      <li>• Consistent, neutral messaging</li>
                      <li>• Static subject lines and tone</li>
                      <li>• Standard risk disclosures</li>
                      <li>• No emotional market triggers</li>
                      <li>• Regular publishing schedule</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="text-base font-medium">
                    Sentiment Analysis Status
                  </Label>
                  <p className="text-sm text-gray-600">
                    {sentimentEnabled 
                      ? "Content will adapt to market emotions and investor psychology" 
                      : "Content will use neutral, balanced messaging"
                    }
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="sentiment-toggle">
                    {sentimentEnabled ? 'Enabled' : 'Disabled'}
                  </Label>
                  <Switch
                    id="sentiment-toggle"
                    checked={sentimentEnabled}
                    onCheckedChange={setSentimentEnabled}
                  />
                </div>
              </div>

              <Button 
                onClick={handleSentimentAnalysis}
                className="w-full"
                disabled={sentimentMutation.isPending}
              >
                {sentimentMutation.isPending ? 'Analyzing...' : 'Generate Sentiment-Based Assignment'}
                <Target className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// Create Project Dialog Component
function CreateProjectDialog({ 
  open, 
  onOpenChange, 
  onSubmit, 
  isLoading 
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    dueDate: '',
    publishDate: '',
    cohorts: [] as string[],
    estimatedReach: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: formData.name,
      description: formData.description,
      targetAudience: {
        cohorts: formData.cohorts,
        estimatedReach: formData.estimatedReach,
        segmentCriteria: {},
      },
      timeline: {
        dueDate: formData.dueDate,
        publishDate: formData.publishDate,
        milestones: [],
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Campaign Project</DialogTitle>
          <DialogDescription>
            Set up a new collaborative email campaign
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Campaign Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Q4 Investment Newsletter"
              required
              data-testid="input-campaign-name"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the campaign goals..."
              data-testid="textarea-campaign-description"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                data-testid="input-due-date"
              />
            </div>
            <div>
              <Label htmlFor="publishDate">Publish Date</Label>
              <Input
                id="publishDate"
                type="date"
                value={formData.publishDate}
                onChange={(e) => setFormData({ ...formData, publishDate: e.target.value })}
                data-testid="input-publish-date"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="estimatedReach">Estimated Reach</Label>
            <Input
              id="estimatedReach"
              type="number"
              value={formData.estimatedReach}
              onChange={(e) => setFormData({ ...formData, estimatedReach: parseInt(e.target.value) || 0 })}
              placeholder="Number of subscribers"
              data-testid="input-estimated-reach"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} data-testid="button-submit-project">
              {isLoading ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Create Assignment Dialog Component
function CreateAssignmentDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    assigneeEmail: '',
    assigneeName: '',
    assignmentType: 'email_content',
    instructions: '',
    targetCohort: 'High-Value Investor',
    tone: 'Professional',
    expiresInDays: 7,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      assigneeEmail: formData.assigneeEmail,
      assigneeName: formData.assigneeName,
      assignmentType: formData.assignmentType,
      briefing: {
        instructions: formData.instructions,
        targetCohort: formData.targetCohort,
        keyPoints: [],
        tone: formData.tone,
        requirements: {},
      },
      expiresInDays: formData.expiresInDays,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Email Assignment</DialogTitle>
          <DialogDescription>
            Assign email creation tasks with unique collaboration links
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="assigneeEmail">Assignee Email</Label>
            <Input
              id="assigneeEmail"
              type="email"
              value={formData.assigneeEmail}
              onChange={(e) => setFormData({ ...formData, assigneeEmail: e.target.value })}
              placeholder="copywriter@example.com"
              required
              data-testid="input-assignee-email"
            />
          </div>
          <div>
            <Label htmlFor="assigneeName">Assignee Name</Label>
            <Input
              id="assigneeName"
              value={formData.assigneeName}
              onChange={(e) => setFormData({ ...formData, assigneeName: e.target.value })}
              placeholder="John Smith"
              data-testid="input-assignee-name"
            />
          </div>
          <div>
            <Label htmlFor="assignmentType">Assignment Type</Label>
            <Select
              value={formData.assignmentType}
              onValueChange={(value) => setFormData({ ...formData, assignmentType: value })}
            >
              <SelectTrigger data-testid="select-assignment-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email_content">Email Content</SelectItem>
                <SelectItem value="subject_line">Subject Line</SelectItem>
                <SelectItem value="email_design">Email Design</SelectItem>
                <SelectItem value="content_review">Content Review</SelectItem>
                <SelectItem value="fact_check">Fact Check</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="instructions">Instructions</Label>
            <Textarea
              id="instructions"
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              placeholder="Detailed instructions for the assignment..."
              required
              data-testid="textarea-instructions"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="targetCohort">Target Cohort</Label>
              <Select
                value={formData.targetCohort}
                onValueChange={(value) => setFormData({ ...formData, targetCohort: value })}
              >
                <SelectTrigger data-testid="select-target-cohort">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="High-Value Investor">High-Value Investor</SelectItem>
                  <SelectItem value="Day Trader">Day Trader</SelectItem>
                  <SelectItem value="Long-term Investor">Long-term Investor</SelectItem>
                  <SelectItem value="Options Trader">Options Trader</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="expiresInDays">Expires In (Days)</Label>
              <Input
                id="expiresInDays"
                type="number"
                min="1"
                max="30"
                value={formData.expiresInDays}
                onChange={(e) => setFormData({ ...formData, expiresInDays: parseInt(e.target.value) || 7 })}
                data-testid="input-expires-days"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} data-testid="button-submit-assignment">
              {isLoading ? 'Creating...' : 'Create Assignment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
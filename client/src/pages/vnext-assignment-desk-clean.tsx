import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Link as WouterLink } from "wouter";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { SimpleAssignmentMaker } from "./simple-assignment-maker";
import { Plus, Calendar, User, AlertCircle, CheckCircle, Clock, FileText, TrendingUp, Users, Link, Copy, ExternalLink, DollarSign, Target, Briefcase, Zap, Settings, Play } from "lucide-react";

interface Assignment {
  id: string;
  title: string;
  description?: string;
  type: string;
  priority: string;
  status: string;
  assignedTo?: string;
  assignedBy?: string;
  dueDate?: string;
  content?: string;
  notes?: string;
  tags?: string[];
  shareableSlug?: string;
  shareableUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface Opportunity {
  id: string;
  title: string;
  description?: string;
  type: string;
  status: string;
  potentialValue?: number;
  probability?: number;
  contactCompany?: string;
  nextActionDate?: string;
  createdAt: string;
}

export function VNextAssignmentDesk() {
  const { toast } = useToast();
  const [activeView, setActiveView] = useState<"assignments" | "opportunities">("assignments");
  const [selectedTab, setSelectedTab] = useState("all");
  const [isRunningDetection, setIsRunningDetection] = useState(false);

  // Fetch assignments
  const { data: assignments = [], isLoading } = useQuery<Assignment[]>({
    queryKey: ["/api/assignments"],
  });

  // Fetch opportunities
  const { data: opportunities = [], isLoading: isLoadingOpportunities } = useQuery<Opportunity[]>({
    queryKey: ["/api/opportunities"],
    enabled: activeView === "opportunities",
  });

  // Update assignment status
  const updateAssignmentMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Assignment> }) => {
      return await apiRequest(`/api/assignments/${id}`, "PATCH", updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      toast({
        title: "Assignment Updated",
        description: "Assignment status has been updated.",
      });
    },
  });

  // Generate shareable link mutation
  const generateShareableLinkMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/assignments/${id}/share`, "POST", {});
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      if (data && data.shareableUrl) {
        navigator.clipboard.writeText(data.shareableUrl);
        toast({
          title: "Link Copied",
          description: "Shareable link has been copied to clipboard.",
        });
      }
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "unassigned":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "assigned":
      case "in_progress":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "review":
        return <User className="h-4 w-4 text-orange-500" />;
      case "approved":
      case "published":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };

  const filterAssignments = (assignments: Assignment[]) => {
    switch (selectedTab) {
      case "unassigned":
        return assignments.filter(a => a.status === "unassigned");
      case "in_progress":
        return assignments.filter(a => ["assigned", "in_progress"].includes(a.status));
      case "review":
        return assignments.filter(a => a.status === "review");
      case "completed":
        return assignments.filter(a => ["approved", "published"].includes(a.status));
      default:
        return assignments;
    }
  };

  const filteredAssignments = filterAssignments(assignments);

  // Run AI opportunity detection
  const handleRunDetection = async () => {
    setIsRunningDetection(true);
    try {
      await apiRequest("/api/opportunity-detection/initialize", "POST", {});
      
      // Run detection
      const response = await apiRequest("/api/opportunity-detection/run", "POST", {});
      
      toast({
        title: "Detection Complete",
        description: `Found ${response.opportunitiesDetected || 0} new opportunities based on market conditions.`,
      });
      
      // Refresh opportunities list
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities"] });
    } catch (error) {
      toast({
        title: "Detection Failed",
        description: "Unable to run opportunity detection. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRunningDetection(false);
    }
  };

  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl">
      {/* Header with View Toggle */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="order-2 sm:order-1">
          <h1 className="text-2xl sm:text-3xl font-bold">
            {activeView === "assignments" ? "Assignment Desk" : "Opportunities"}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            {activeView === "assignments" 
              ? "Manage content planning and assignments" 
              : "Track revenue and growth opportunities"}
          </p>
        </div>
        
        {/* View Toggle */}
        <div className="flex items-center justify-between gap-2 sm:gap-4 order-1 sm:order-2">
          <div className="flex bg-muted rounded-lg p-1 flex-1 sm:flex-initial">
            <Button
              variant={activeView === "assignments" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveView("assignments")}
              className="gap-1 sm:gap-2 flex-1 sm:flex-initial text-xs sm:text-sm"
            >
              <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Assignments</span>
              <span className="xs:hidden">Tasks</span>
            </Button>
            <Button
              variant={activeView === "opportunities" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveView("opportunities")}
              className="gap-1 sm:gap-2 flex-1 sm:flex-initial text-xs sm:text-sm"
            >
              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Opportunities</span>
              <span className="xs:hidden">Opps</span>
            </Button>
          </div>
        </div>
        
        <div className="fixed bottom-4 right-4 sm:relative sm:bottom-auto sm:right-auto z-50">
          <SimpleAssignmentMaker />
        </div>
      </div>

      {/* Conditional Content based on View */}
      {activeView === "assignments" ? (
        <>
        {/* Assignment Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <Card>
            <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Total Assignments</CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <div className="text-xl sm:text-2xl font-bold">{assignments.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Unassigned</CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <div className="text-xl sm:text-2xl font-bold text-yellow-600">
                {assignments.filter(a => a.status === "unassigned").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">In Progress</CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <div className="text-xl sm:text-2xl font-bold text-blue-600">
                {assignments.filter(a => ["assigned", "in_progress"].includes(a.status)).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Completed</CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <div className="text-xl sm:text-2xl font-bold text-green-600">
                {assignments.filter(a => ["approved", "published"].includes(a.status)).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assignments List */}
        <Card>
          <CardHeader>
            <CardTitle>Assignments</CardTitle>
            <CardDescription>View and manage all content assignments</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="mb-4 w-full flex-wrap h-auto p-1">
                <TabsTrigger value="all" className="text-xs sm:text-sm">All</TabsTrigger>
                <TabsTrigger value="unassigned" className="text-xs sm:text-sm">Unassigned</TabsTrigger>
                <TabsTrigger value="in_progress" className="text-xs sm:text-sm">In Progress</TabsTrigger>
                <TabsTrigger value="review" className="text-xs sm:text-sm">Review</TabsTrigger>
                <TabsTrigger value="completed" className="text-xs sm:text-sm">Completed</TabsTrigger>
              </TabsList>

              <TabsContent value={selectedTab} className="mt-0">
                {isLoading ? (
                  <div className="text-center py-8">Loading assignments...</div>
                ) : filteredAssignments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No assignments found for this filter.
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {filteredAssignments.map((assignment) => (
                      <div key={assignment.id} className="border rounded-lg p-3 sm:p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-start gap-2">
                              {getStatusIcon(assignment.status)}
                              <div className="flex-1">
                                <h3 className="font-semibold text-sm sm:text-base">{assignment.title}</h3>
                                {assignment.description && (
                                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                                    {assignment.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="outline" className="text-xs">
                                {assignment.type}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {assignment.priority}
                              </Badge>
                              {assignment.tags && assignment.tags.map((tag, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            
                            {assignment.dueDate && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {assignment.shareableUrl && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  navigator.clipboard.writeText(assignment.shareableUrl!);
                                  toast({
                                    title: "Link Copied",
                                    description: "Assignment link copied to clipboard.",
                                  });
                                }}
                                className="text-xs sm:text-sm"
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Copy Link
                              </Button>
                            )}
                            
                            {!assignment.shareableUrl && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => generateShareableLinkMutation.mutate(assignment.id)}
                                disabled={generateShareableLinkMutation.isPending}
                                className="text-xs sm:text-sm"
                              >
                                <Link className="h-3 w-3 mr-1" />
                                Share
                              </Button>
                            )}
                            
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs sm:text-sm"
                            >
                              Edit
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        </>
      ) : (
        <>
        {/* Opportunities Content */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold">Revenue Opportunities</h2>
            <p className="text-sm text-muted-foreground">AI-detected market opportunities for content creation</p>
          </div>
          <Button
            onClick={handleRunDetection}
            disabled={isRunningDetection}
            className="gap-2"
          >
            <Play className="h-4 w-4" />
            {isRunningDetection ? "Running..." : "Run Detection"}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Market Opportunities</CardTitle>
            <CardDescription>AI-powered opportunity detection based on market triggers</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingOpportunities ? (
              <div className="text-center py-8">Loading opportunities...</div>
            ) : opportunities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No opportunities found. Run detection to scan for new opportunities.
              </div>
            ) : (
              <div className="space-y-4">
                {opportunities.map((opportunity) => (
                  <div key={opportunity.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-start gap-2">
                          <Target className="h-4 w-4 text-green-500 mt-1" />
                          <div>
                            <h3 className="font-semibold text-sm sm:text-base">{opportunity.title}</h3>
                            {opportunity.description && (
                              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                                {opportunity.description}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="text-xs">
                            {opportunity.type}
                          </Badge>
                          {opportunity.potentialValue && (
                            <Badge variant="outline" className="text-xs text-green-600">
                              ${opportunity.potentialValue.toLocaleString()}
                            </Badge>
                          )}
                          {opportunity.probability && (
                            <Badge variant="outline" className="text-xs text-blue-600">
                              {opportunity.probability}% probability
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                          {opportunity.contactCompany && (
                            <div className="flex items-center gap-1">
                              <Briefcase className="h-3 w-3" />
                              <span>{opportunity.contactCompany}</span>
                            </div>
                          )}
                          {opportunity.nextActionDate && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>Next: {new Date(opportunity.nextActionDate).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs sm:text-sm"
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        </>
      )}
    </div>
  );
}
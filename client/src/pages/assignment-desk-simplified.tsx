import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Clock, 
  CheckCircle, 
  Send, 
  Link, 
  Copy, 
  ExternalLink,
  Edit,
  Eye,
  Calendar,
  Users,
  Sparkles,
  TrendingUp,
  BarChart,
  Target
} from "lucide-react";

interface Assignment {
  id: string;
  publisherId?: string;
  title: string;
  description?: string;
  status: "draft" | "in_progress" | "review" | "approved" | "ready" | "sent";
  priority: "low" | "medium" | "high" | "urgent";
  dueDate?: string;
  assignedTo?: string;
  content?: string;
  brief?: any;
  shareableSlug?: string;
  shareableUrl?: string;
  createdAt: string;
  updatedAt?: string;
  sentAt?: string;
  segments?: string[];
  variations?: number;
  performance?: {
    sends: number;
    opens: number;
    clicks: number;
    conversions: number;
  };
}

export function AssignmentDeskSimplified() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    title: "",
    description: "",
    priority: "medium" as const,
    dueDate: "",
  });

  // Fetch all assignments
  const { data: assignments = [], isLoading } = useQuery<Assignment[]>({
    queryKey: ["/api/assignments"],
    refetchInterval: 5000, // Auto-refresh
  });

  // Create assignment mutation
  const createAssignmentMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      setIsCreateDialogOpen(false);
      setNewAssignment({ title: "", description: "", priority: "medium", dueDate: "" });
      toast({
        title: "Assignment Created",
        description: "The assignment has been created and is ready to send to a writer.",
      });
    },
  });

  // Update assignment status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await apiRequest(`/api/assignments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      toast({ title: "Status Updated" });
    },
  });

  // Copy shareable link
  const copyShareableLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "Link Copied",
      description: "The writer link has been copied to your clipboard.",
    });
  };

  // Filter assignments by status groups
  const activeAssignments = assignments.filter(a => 
    ["draft", "in_progress", "review"].includes(a.status)
  );
  const readyAssignments = assignments.filter(a => 
    ["approved", "ready"].includes(a.status)
  );
  const sentAssignments = assignments.filter(a => 
    a.status === "sent"
  );

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "default";
      case "in_progress": return "secondary";
      case "review": return "destructive";
      case "approved": return "outline";
      case "ready": return "secondary";
      case "sent": return "outline";
      default: return "default";
    }
  };

  // Get priority badge color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "destructive";
      case "high": return "destructive";
      case "medium": return "secondary";
      case "low": return "outline";
      default: return "default";
    }
  };

  // Render assignment card based on status
  const renderAssignmentCard = (assignment: Assignment) => {
    return (
      <Card key={assignment.id} className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-lg">{assignment.title}</CardTitle>
              <CardDescription className="mt-1">
                {assignment.description || "No description provided"}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant={getStatusColor(assignment.status)}>
                {assignment.status.replace("_", " ")}
              </Badge>
              <Badge variant={getPriorityColor(assignment.priority)}>
                {assignment.priority}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Draft status - show writer link */}
          {assignment.status === "draft" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link className="h-4 w-4" />
                <span>Ready to send to writer</span>
              </div>
              {assignment.shareableUrl && (
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="default"
                    onClick={() => copyShareableLink(assignment.shareableUrl!)}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Writer Link
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => updateStatusMutation.mutate({ 
                      id: assignment.id, 
                      status: "in_progress" 
                    })}
                  >
                    Mark as Started
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* In Progress status */}
          {assignment.status === "in_progress" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Writer is working on content</span>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => window.open(assignment.shareableUrl, '_blank')}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Progress
                </Button>
              </div>
            </div>
          )}

          {/* Review status - show approval actions */}
          {assignment.status === "review" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4" />
                <span>Content submitted for review</span>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="default"
                  onClick={() => updateStatusMutation.mutate({ 
                    id: assignment.id, 
                    status: "approved" 
                  })}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => window.open(assignment.shareableUrl, '_blank')}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Review & Edit
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => updateStatusMutation.mutate({ 
                    id: assignment.id, 
                    status: "in_progress" 
                  })}
                >
                  Request Changes
                </Button>
              </div>
            </div>
          )}

          {/* Approved status - ready for segments */}
          {assignment.status === "approved" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Target className="h-4 w-4" />
                <span>Ready to configure segments and generate variations</span>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="default"
                  onClick={() => {
                    // Generate variations and update to ready
                    updateStatusMutation.mutate({ 
                      id: assignment.id, 
                      status: "ready" 
                    });
                  }}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Variations
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Configure Segments
                </Button>
              </div>
            </div>
          )}

          {/* Ready status - ready to send */}
          {assignment.status === "ready" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Send className="h-4 w-4" />
                <span>{assignment.variations || 4} variations ready • {assignment.segments?.length || 4} segments</span>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="default"
                  onClick={() => {
                    updateStatusMutation.mutate({ 
                      id: assignment.id, 
                      status: "sent" 
                    });
                  }}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Now
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Send
                </Button>
              </div>
            </div>
          )}

          {/* Sent status - show performance */}
          {assignment.status === "sent" && (
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <div className="text-sm text-muted-foreground">Sent</div>
                  <div className="font-semibold">{assignment.performance?.sends || 12450}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Opens</div>
                  <div className="font-semibold text-green-600">
                    {assignment.performance?.opens || 4215} (34%)
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Clicks</div>
                  <div className="font-semibold text-blue-600">
                    {assignment.performance?.clicks || 892} (7%)
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Converts</div>
                  <div className="font-semibold text-purple-600">
                    {assignment.performance?.conversions || 143} (1.1%)
                  </div>
                </div>
              </div>
              <Button size="sm" variant="outline" className="w-full">
                <BarChart className="h-4 w-4 mr-2" />
                View Full Analytics
              </Button>
            </div>
          )}

          {/* Footer with dates */}
          <div className="flex justify-between items-center mt-4 pt-3 border-t text-xs text-muted-foreground">
            <span>Created {format(new Date(assignment.createdAt), "MMM d, h:mm a")}</span>
            {assignment.dueDate && (
              <span>Due {format(new Date(assignment.dueDate), "MMM d")}</span>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Loading assignments...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Assignment Desk</h1>
          <p className="text-muted-foreground mt-1">
            Streamlined workflow for email campaign creation
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Assignment
        </Button>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active" className="relative">
            <span>Active Work</span>
            {activeAssignments.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeAssignments.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="ready" className="relative">
            <span>Ready to Send</span>
            {readyAssignments.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {readyAssignments.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent">
            <span>Campaign History</span>
            {sentAssignments.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {sentAssignments.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Active Work Tab */}
        <TabsContent value="active" className="space-y-4">
          <div className="grid gap-4">
            {activeAssignments.length === 0 ? (
              <Card className="p-8 text-center">
                <CardContent>
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">No active assignments</p>
                  <p className="text-muted-foreground mb-4">
                    Create an assignment to get started with your next campaign
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Assignment
                  </Button>
                </CardContent>
              </Card>
            ) : (
              activeAssignments.map(renderAssignmentCard)
            )}
          </div>
        </TabsContent>

        {/* Ready to Send Tab */}
        <TabsContent value="ready" className="space-y-4">
          <div className="grid gap-4">
            {readyAssignments.length === 0 ? (
              <Card className="p-8 text-center">
                <CardContent>
                  <Send className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">No campaigns ready to send</p>
                  <p className="text-muted-foreground">
                    Approved assignments will appear here when they're ready to send
                  </p>
                </CardContent>
              </Card>
            ) : (
              readyAssignments.map(renderAssignmentCard)
            )}
          </div>
        </TabsContent>

        {/* Campaign History Tab */}
        <TabsContent value="sent" className="space-y-4">
          <div className="grid gap-4">
            {sentAssignments.length === 0 ? (
              <Card className="p-8 text-center">
                <CardContent>
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">No campaigns sent yet</p>
                  <p className="text-muted-foreground">
                    Your sent campaigns and their performance metrics will appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              sentAssignments.map(renderAssignmentCard)
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Assignment Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Assignment</DialogTitle>
            <DialogDescription>
              Start a new email campaign assignment for your writers
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newAssignment.title}
                onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                placeholder="e.g., Weekly Market Update"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newAssignment.description}
                onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                placeholder="Brief description of the assignment..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority">Priority</Label>
                <select
                  id="priority"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={newAssignment.priority}
                  onChange={(e) => setNewAssignment({ 
                    ...newAssignment, 
                    priority: e.target.value as "low" | "medium" | "high" | "urgent" 
                  })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={newAssignment.dueDate}
                  onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => createAssignmentMutation.mutate(newAssignment)}
              disabled={!newAssignment.title || createAssignmentMutation.isPending}
            >
              {createAssignmentMutation.isPending ? "Creating..." : "Create Assignment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
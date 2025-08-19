import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Link as WouterLink } from "wouter";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Calendar, User, AlertCircle, CheckCircle, Clock, FileText, TrendingUp, Users, Link, Copy, ExternalLink } from "lucide-react";

interface Assignment {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  priority: string;
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

export function VNextAssignmentDesk() {
  const { toast } = useToast();
  const [newAssignment, setNewAssignment] = useState({
    title: "",
    description: "",
    type: "newsletter",
    priority: "medium",
    dueDate: "",
    notes: "",
    tags: [] as string[],
  });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState("all");

  // Fetch assignments
  const { data: assignments = [], isLoading } = useQuery<Assignment[]>({
    queryKey: ["/api/assignments"],
  });

  // Create assignment mutation
  const createAssignmentMutation = useMutation({
    mutationFn: async (data: typeof newAssignment) => {
      return await apiRequest("/api/assignments", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      toast({
        title: "Assignment Created",
        description: "New assignment has been added to the desk.",
      });
      setIsCreateDialogOpen(false);
      setNewAssignment({
        title: "",
        description: "",
        type: "newsletter",
        priority: "medium",
        dueDate: "",
        notes: "",
        tags: [],
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create assignment.",
        variant: "destructive",
      });
    },
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
          title: "Link Copied!",
          description: "Shareable link has been copied to clipboard.",
        });
      }
    },
  });

  // Copy shareable link function
  const copyShareableLink = (assignment: Assignment) => {
    if (assignment.shareableUrl) {
      navigator.clipboard.writeText(assignment.shareableUrl);
      toast({
        title: "Link Copied!",
        description: "Shareable link has been copied to clipboard.",
      });
    } else {
      // Generate new shareable link if doesn't exist
      generateShareableLinkMutation.mutate(assignment.id);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-blue-100 text-blue-800";
      case "low":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "unassigned":
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
      case "assigned":
        return <User className="h-4 w-4 text-blue-500" />;
      case "in_progress":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "review":
        return <FileText className="h-4 w-4 text-purple-500" />;
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "published":
        return <TrendingUp className="h-4 w-4 text-indigo-500" />;
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Assignment Desk</h1>
          <p className="text-muted-foreground">Manage content planning and assignments</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Assignment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Create New Assignment</DialogTitle>
                <DialogDescription>
                  Add a new assignment to the content planning desk.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newAssignment.title}
                    onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                    placeholder="Assignment title"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newAssignment.description}
                    onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                    placeholder="Describe the assignment..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="type">Type</Label>
                    <Select
                      value={newAssignment.type}
                      onValueChange={(value) => setNewAssignment({ ...newAssignment, type: value })}
                    >
                      <SelectTrigger id="type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newsletter">Newsletter</SelectItem>
                        <SelectItem value="article">Article</SelectItem>
                        <SelectItem value="research">Research</SelectItem>
                        <SelectItem value="analysis">Analysis</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={newAssignment.priority}
                      onValueChange={(value) => setNewAssignment({ ...newAssignment, priority: value })}
                    >
                      <SelectTrigger id="priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={newAssignment.dueDate}
                    onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={newAssignment.notes}
                    onChange={(e) => setNewAssignment({ ...newAssignment, notes: e.target.value })}
                    placeholder="Additional notes..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => createAssignmentMutation.mutate(newAssignment)}
                  disabled={!newAssignment.title || createAssignmentMutation.isPending}
                >
                  Create Assignment
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Assignment Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{assignments.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Unassigned</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {assignments.filter(a => a.status === "unassigned").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {assignments.filter(a => ["assigned", "in_progress"].includes(a.status)).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
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
              <TabsList className="mb-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="unassigned">Unassigned</TabsTrigger>
                <TabsTrigger value="in_progress">In Progress</TabsTrigger>
                <TabsTrigger value="review">Review</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>

              <TabsContent value={selectedTab}>
                {isLoading ? (
                  <div className="text-center py-8 text-gray-500">Loading assignments...</div>
                ) : filteredAssignments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No assignments found in this category
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredAssignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              {getStatusIcon(assignment.status)}
                              <h3 className="font-semibold text-lg">{assignment.title}</h3>
                              <Badge className={getPriorityColor(assignment.priority)}>
                                {assignment.priority}
                              </Badge>
                              <Badge variant="outline">{assignment.type}</Badge>
                            </div>
                            {assignment.description && (
                              <p className="text-muted-foreground mb-2">{assignment.description}</p>
                            )}
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              {assignment.dueDate && (
                                <div className="flex items-center space-x-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                                </div>
                              )}
                              {assignment.assignedTo && (
                                <div className="flex items-center space-x-1">
                                  <User className="h-3 w-3" />
                                  <span>Assigned</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {/* Shareable link buttons */}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyShareableLink(assignment)}
                              title="Copy shareable link"
                            >
                              <Link className="h-4 w-4" />
                            </Button>
                            {assignment.shareableUrl && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => window.open(assignment.shareableUrl, '_blank')}
                                title="Open public view"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            )}
                            
                            {/* Edit button */}
                            <WouterLink href={`/assignments/${assignment.id}/edit`}>
                              <Button
                                size="sm"
                                variant="outline"
                              >
                                Edit
                              </Button>
                            </WouterLink>
                            
                            {/* Status action buttons */}
                            {assignment.status === "unassigned" && (
                              <Button
                                size="sm"
                                onClick={() => updateAssignmentMutation.mutate({
                                  id: assignment.id,
                                  updates: { status: "assigned", assignedTo: "current-user" }
                                })}
                              >
                                Assign to Me
                              </Button>
                            )}
                            {assignment.status === "assigned" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateAssignmentMutation.mutate({
                                  id: assignment.id,
                                  updates: { status: "in_progress" }
                                })}
                              >
                                Start Work
                              </Button>
                            )}
                            {assignment.status === "in_progress" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateAssignmentMutation.mutate({
                                  id: assignment.id,
                                  updates: { status: "review" }
                                })}
                              >
                                Submit for Review
                              </Button>
                            )}
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
    </div>
  );
}
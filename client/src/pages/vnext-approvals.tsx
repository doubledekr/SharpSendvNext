import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Clock, MessageSquare, FileText, Mail, Users, AlertTriangle } from "lucide-react";

interface Approval {
  id: string;
  publisherId: string;
  entityType: string;
  entityId: string;
  entityTitle?: string;
  entityContent?: string;
  requestedBy: string;
  requestedByName?: string;
  status: string;
  reviewedBy?: string;
  feedback?: string;
  approvalLevel: number;
  metadata?: Record<string, any>;
  requestedAt: string;
  reviewedAt?: string;
}

export function VNextApprovals() {
  const { toast } = useToast();
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [feedback, setFeedback] = useState("");
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState("pending");

  // Fetch approvals
  const { data: approvals = [], isLoading } = useQuery<Approval[]>({
    queryKey: ["/api/approvals"],
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async ({ id, feedback }: { id: string; feedback: string }) => {
      return await apiRequest(`/api/approvals/${id}/approve`, "POST", { feedback });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/approvals"] });
      toast({
        title: "Content Approved",
        description: "The content has been approved successfully.",
      });
      setIsReviewDialogOpen(false);
      setFeedback("");
      setSelectedApproval(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve content.",
        variant: "destructive",
      });
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ id, feedback }: { id: string; feedback: string }) => {
      return await apiRequest(`/api/approvals/${id}/reject`, "POST", { feedback });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/approvals"] });
      toast({
        title: "Content Rejected",
        description: "The content has been rejected with feedback.",
      });
      setIsReviewDialogOpen(false);
      setFeedback("");
      setSelectedApproval(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reject content.",
        variant: "destructive",
      });
    },
  });

  // Request changes mutation
  const requestChangesMutation = useMutation({
    mutationFn: async ({ id, feedback }: { id: string; feedback: string }) => {
      return await apiRequest(`/api/approvals/${id}/request-changes`, "POST", { feedback });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/approvals"] });
      toast({
        title: "Changes Requested",
        description: "Feedback has been sent to the content creator.",
      });
      setIsReviewDialogOpen(false);
      setFeedback("");
      setSelectedApproval(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to request changes.",
        variant: "destructive",
      });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "changes_requested":
        return <MessageSquare className="h-4 w-4 text-orange-500" />;
      default:
        return null;
    }
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case "assignment":
        return <FileText className="h-4 w-4" />;
      case "campaign":
        return <Mail className="h-4 w-4" />;
      case "email_variant":
        return <Users className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const filterApprovals = (approvals: Approval[]) => {
    switch (selectedTab) {
      case "pending":
        return approvals.filter(a => a.status === "pending");
      case "approved":
        return approvals.filter(a => a.status === "approved");
      case "rejected":
        return approvals.filter(a => a.status === "rejected");
      case "changes_requested":
        return approvals.filter(a => a.status === "changes_requested");
      default:
        return approvals;
    }
  };

  const filteredApprovals = filterApprovals(approvals);

  const openReviewDialog = (approval: Approval) => {
    setSelectedApproval(approval);
    setIsReviewDialogOpen(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Approval Workflows</h1>
          <p className="text-muted-foreground">Review and approve content before publication</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            {approvals.filter(a => a.status === "pending").length} Pending
          </Badge>
        </div>
      </div>

      {/* Approval Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {approvals.filter(a => a.status === "pending").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {approvals.filter(a => a.status === "approved").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {approvals.filter(a => a.status === "rejected").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Changes Requested</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {approvals.filter(a => a.status === "changes_requested").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Approvals List */}
        <Card>
          <CardHeader>
            <CardTitle>Approval Queue</CardTitle>
            <CardDescription>Review and approve content submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="pending">
                  Pending
                  {approvals.filter(a => a.status === "pending").length > 0 && (
                    <Badge className="ml-2" variant="secondary">
                      {approvals.filter(a => a.status === "pending").length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
                <TabsTrigger value="changes_requested">Changes Requested</TabsTrigger>
              </TabsList>

              <TabsContent value={selectedTab}>
                {isLoading ? (
                  <div className="text-center py-8 text-gray-500">Loading approvals...</div>
                ) : filteredApprovals.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No approvals found in this category
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredApprovals.map((approval) => (
                      <div
                        key={approval.id}
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              {getStatusIcon(approval.status)}
                              <h3 className="font-semibold text-lg">
                                {approval.entityTitle || `${approval.entityType} #${approval.entityId}`}
                              </h3>
                              <div className="flex items-center space-x-1">
                                {getEntityIcon(approval.entityType)}
                                <Badge variant="outline">{approval.entityType}</Badge>
                              </div>
                              {approval.approvalLevel > 1 && (
                                <Badge variant="secondary">Level {approval.approvalLevel}</Badge>
                              )}
                            </div>
                            {approval.entityContent && (
                              <p className="text-gray-600 mb-2 line-clamp-2">
                                {approval.entityContent}
                              </p>
                            )}
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>Requested by: {approval.requestedByName || approval.requestedBy}</span>
                              <span>
                                {new Date(approval.requestedAt).toLocaleDateString()}
                              </span>
                              {approval.reviewedBy && (
                                <span>Reviewed by: {approval.reviewedBy}</span>
                              )}
                            </div>
                            {approval.feedback && (
                              <div className="mt-2 p-2 bg-gray-100 rounded text-sm">
                                <span className="font-medium">Feedback:</span> {approval.feedback}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {approval.status === "pending" && (
                              <Button
                                size="sm"
                                onClick={() => openReviewDialog(approval)}
                              >
                                Review
                              </Button>
                            )}
                            {approval.status === "changes_requested" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openReviewDialog(approval)}
                              >
                                Re-review
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

        {/* Review Dialog */}
        <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
              <DialogTitle>Review Content</DialogTitle>
              <DialogDescription>
                Review the content and provide your feedback.
              </DialogDescription>
            </DialogHeader>
            {selectedApproval && (
              <div className="space-y-4 py-4">
                <div>
                  <h4 className="font-medium mb-2">Content Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      {getEntityIcon(selectedApproval.entityType)}
                      <span className="font-medium">Type:</span>
                      <span>{selectedApproval.entityType}</span>
                    </div>
                    <div>
                      <span className="font-medium">Title:</span>{" "}
                      {selectedApproval.entityTitle || "Untitled"}
                    </div>
                    {selectedApproval.entityContent && (
                      <div>
                        <span className="font-medium">Preview:</span>
                        <p className="mt-1 p-2 bg-gray-50 rounded text-gray-700">
                          {selectedApproval.entityContent}
                        </p>
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Requested by:</span>{" "}
                      {selectedApproval.requestedByName || selectedApproval.requestedBy}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Your Feedback</label>
                  <Textarea
                    placeholder="Provide your feedback (optional for approval, required for rejection)"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={4}
                  />
                </div>

                {selectedApproval.status === "pending" && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start space-x-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      This action cannot be undone. Make sure you've thoroughly reviewed the content.
                    </div>
                  </div>
                )}
              </div>
            )}
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsReviewDialogOpen(false);
                  setFeedback("");
                  setSelectedApproval(null);
                }}
              >
                Cancel
              </Button>
              {selectedApproval && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => requestChangesMutation.mutate({
                      id: selectedApproval.id,
                      feedback: feedback || "Please review and make necessary changes."
                    })}
                    disabled={requestChangesMutation.isPending}
                  >
                    Request Changes
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => rejectMutation.mutate({
                      id: selectedApproval.id,
                      feedback: feedback || "Content rejected."
                    })}
                    disabled={!feedback || rejectMutation.isPending}
                  >
                    Reject
                  </Button>
                  <Button
                    onClick={() => approveMutation.mutate({
                      id: selectedApproval.id,
                      feedback: feedback || "Approved."
                    })}
                    disabled={approveMutation.isPending}
                  >
                    Approve
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  );
}
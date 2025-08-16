import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Clock, AlertCircle, Mail, FileText, User, Calendar, Target } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AssignmentData {
  assignment: {
    id: string;
    uniqueToken: string;
    assigneeEmail: string;
    assigneeName?: string;
    assignmentType: string;
    status: string;
    briefing: {
      instructions: string;
      targetCohort: string;
      keyPoints: string[];
      tone: string;
      requirements: Record<string, any>;
    };
    submittedContent?: {
      subject: string;
      content: string;
      metadata: Record<string, any>;
      submittedAt: string;
    };
    feedback?: {
      comments: string;
      approved: boolean;
      revisionRequests: string[];
      reviewedBy: string;
      reviewedAt: string;
    };
    expiresAt: string;
    createdAt: string;
    updatedAt: string;
  };
  project: {
    id: string;
    publisherId: string;
    name: string;
    description?: string;
    status: string;
    targetAudience: {
      cohorts: string[];
      estimatedReach: number;
      segmentCriteria: Record<string, any>;
    };
    timeline: {
      dueDate: string;
      publishDate: string;
      milestones: Array<{ name: string; date: string; completed: boolean }>;
    };
    createdAt: string;
    updatedAt: string;
    createdBy: string;
  };
}

export function AssignmentPortal() {
  const params = useParams();
  const token = params.token;
  const [submissionData, setSubmissionData] = useState({
    subject: '',
    content: '',
    metadata: {},
  });
  const { toast } = useToast();

  // Fetch assignment details
  const { 
    data: assignmentResponse, 
    isLoading, 
    error,
    refetch 
  } = useQuery<{ data: AssignmentData }>({
    queryKey: ['/api/campaigns/assignment', token],
    enabled: !!token,
    retry: false,
  });

  // Submit assignment mutation
  const submitMutation = useMutation({
    mutationFn: async (data: any) => 
      apiRequest(`/api/campaigns/assignment/${token}/submit`, 'POST', data),
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Your assignment has been submitted successfully.",
      });
      refetch();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit assignment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!submissionData.subject.trim() || !submissionData.content.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide both subject and content.",
        variant: "destructive",
      });
      return;
    }

    submitMutation.mutate(submissionData);
  };

  // Pre-fill form if editing existing submission
  useEffect(() => {
    if (assignmentResponse?.data?.assignment.submittedContent) {
      const content = assignmentResponse.data.assignment.submittedContent;
      setSubmissionData({
        subject: content.subject,
        content: content.content,
        metadata: content.metadata,
      });
    }
  }, [assignmentResponse]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading assignment...</p>
        </div>
      </div>
    );
  }

  if (error || !assignmentResponse?.data) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="border-red-200">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-red-700 mb-2">
              Assignment Not Found
            </h2>
            <p className="text-gray-600">
              This assignment link may have expired or is invalid.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { assignment, project } = assignmentResponse.data;
  const isExpired = new Date() > new Date(assignment.expiresAt);
  const isSubmitted = assignment.status === 'submitted' || assignment.submittedContent;
  const isApproved = assignment.status === 'approved';
  const needsRevision = assignment.status === 'revision_requested';
  const canEdit = !isExpired && (!isSubmitted || needsRevision);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'in_progress':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'submitted':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-700" />;
      case 'revision_requested':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "outline",
      in_progress: "default",
      submitted: "secondary",
      approved: "default",
      revision_requested: "destructive",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-3">
                {getStatusIcon(assignment.status)}
                {assignment.assignmentType.replace('_', ' ')} Assignment
              </CardTitle>
              <CardDescription className="flex items-center gap-2 mt-2">
                <span>Project: {project.name}</span>
                <Separator orientation="vertical" className="h-4" />
                {getStatusBadge(assignment.status)}
              </CardDescription>
            </div>
            <div className="text-right text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {assignment.assigneeName || assignment.assigneeEmail}
              </div>
              <div className="flex items-center gap-1 mt-1">
                <Calendar className="w-4 h-4" />
                Due: {format(new Date(assignment.expiresAt), 'MMM d, yyyy')}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Status Alerts */}
      {isExpired && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            This assignment has expired and can no longer be edited.
          </AlertDescription>
        </Alert>
      )}

      {isApproved && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Your submission has been approved! Great work.
          </AlertDescription>
        </Alert>
      )}

      {needsRevision && assignment.feedback && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <div className="space-y-2">
              <p><strong>Revision Requested:</strong> {assignment.feedback.comments}</p>
              {assignment.feedback.revisionRequests.length > 0 && (
                <ul className="list-disc list-inside space-y-1">
                  {assignment.feedback.revisionRequests.map((request, index) => (
                    <li key={index}>{request}</li>
                  ))}
                </ul>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assignment Brief */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Assignment Brief
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Instructions</Label>
              <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                {assignment.briefing.instructions}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Target Cohort</Label>
                <Badge variant="outline" className="mt-1">
                  {assignment.briefing.targetCohort}
                </Badge>
              </div>
              <div>
                <Label className="text-sm font-medium">Tone</Label>
                <p className="text-sm text-gray-600 mt-1">
                  {assignment.briefing.tone}
                </p>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Target Audience</Label>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-gray-600">
                  Estimated reach: {project.targetAudience.estimatedReach.toLocaleString()} subscribers
                </p>
                <div className="flex flex-wrap gap-1">
                  {project.targetAudience.cohorts.map((cohort) => (
                    <Badge key={cohort} variant="secondary" className="text-xs">
                      {cohort}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {project.timeline && (
              <div>
                <Label className="text-sm font-medium">Timeline</Label>
                <div className="text-sm text-gray-600 mt-1 space-y-1">
                  <p>Publish Date: {format(new Date(project.timeline.publishDate), 'MMM d, yyyy')}</p>
                  <p>Project Due: {format(new Date(project.timeline.dueDate), 'MMM d, yyyy')}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submission Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              {canEdit ? 'Submit Your Work' : 'Your Submission'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="subject">Subject Line</Label>
                <Input
                  id="subject"
                  value={submissionData.subject}
                  onChange={(e) => setSubmissionData({ ...submissionData, subject: e.target.value })}
                  placeholder="Enter the email subject line"
                  disabled={!canEdit}
                  data-testid="input-subject"
                />
              </div>

              <div>
                <Label htmlFor="content">Email Content</Label>
                <Textarea
                  id="content"
                  value={submissionData.content}
                  onChange={(e) => setSubmissionData({ ...submissionData, content: e.target.value })}
                  placeholder="Write the email content here..."
                  rows={12}
                  disabled={!canEdit}
                  data-testid="textarea-content"
                />
              </div>

              {canEdit && (
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={submitMutation.isPending}
                  data-testid="button-submit"
                >
                  {submitMutation.isPending 
                    ? 'Submitting...' 
                    : needsRevision 
                      ? 'Resubmit Assignment' 
                      : 'Submit Assignment'
                  }
                </Button>
              )}

              {isSubmitted && !canEdit && (
                <div className="text-center py-4">
                  <CheckCircle className="w-8 h-8 mx-auto text-green-600 mb-2" />
                  <p className="text-sm text-green-700 font-medium">
                    Assignment submitted successfully
                  </p>
                  <p className="text-xs text-gray-600">
                    Submitted on {format(new Date(assignment.submittedContent!.submittedAt), 'MMM d, yyyy "at" h:mm a')}
                  </p>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
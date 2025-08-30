import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Link as WouterLink, useLocation } from "wouter";

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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Plus, Calendar, User, AlertCircle, CheckCircle, Clock, FileText, TrendingUp, Users, Link, Copy, ExternalLink, ChevronDown, X, Sparkles, DollarSign, Target, Briefcase, Zap, Settings, Play, Image, ThumbsUp, ThumbsDown, MessageCircle, XCircle, Send } from "lucide-react";

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
  // Enhanced workflow fields
  targetSegments?: Array<{ segmentId: string; segmentName: string; subscriberCount: number; platform: string }>;
  emailPlatform?: string;
  reviewers?: Array<{ userId: string; name: string; role: string; status: string; comments?: string[]; reviewedAt?: string }>;
  reviewDeadline?: string;
  reviewNotes?: string;
  autoGenerateVariations?: boolean;
  workflowStage?: string;
  progressPercentage?: number;
  broadcastSettings?: { sendTime?: string; pixelTracking?: boolean; campaignIds?: string[] };
  // Phase 1: Approval System Fields
  approvalStatus?: string; // pending, approved, rejected, changes_requested
  approvalComments?: string;
  approvedBy?: string;
  approvedAt?: string;
  approvalHistory?: Array<{
    action: string;
    userId: string;
    userName: string;
    comments?: string;
    timestamp: string;
  }>;
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

interface VNextAssignmentDeskProps {
  prefilledUrl?: string;
  autoOpenDialog?: boolean;
}

// Function to open assignment form from external components
export function openAssignmentFormWithUrl(url: string) {
  window.dispatchEvent(new CustomEvent('openAssignmentForm', { 
    detail: { url } 
  }));
}

export function VNextAssignmentDesk({ prefilledUrl, autoOpenDialog }: VNextAssignmentDeskProps = {}) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeView, setActiveView] = useState<"assignments" | "opportunities">("assignments");
  
  // Parse URL parameters for external assignment creation
  const urlParams = new URLSearchParams(window.location.search);
  const urlPrefilledUrl = urlParams.get('prefilledUrl');
  const urlAutoOpen = urlParams.get('autoOpen') === 'true';
  
  // Use URL parameters if props are not provided
  const finalPrefilledUrl = prefilledUrl || urlPrefilledUrl || '';
  const finalAutoOpen = autoOpenDialog || urlAutoOpen;
  const [newAssignment, setNewAssignment] = useState({
    title: "",
    objective: "",
    angle: "",
    keyPoints: [] as string[],
    type: "newsletter",
    priority: "medium",
    dueDate: "",
    ctaLabel: "",
    ctaUrl: "",
    assignee: "",
    notes: "",
    tags: [] as string[],
    images: [] as { url: string; type: 'hero' | 'inline' | 'attachment'; caption?: string }[],
    opportunityId: null as string | null,
    // New fields for enhanced workflow
    targetSegments: [] as { segmentId: string; segmentName: string; subscriberCount: number; platform: string }[],
    emailPlatform: "customerio" as string,
    reviewers: [] as { userId: string; name: string; role: string; status: string }[],
    reviewDeadline: "",
    reviewNotes: "",
    autoGenerateVariations: true,
  });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState("all");
  const [keyPointInput, setKeyPointInput] = useState("");
  const [isPrefillOpen, setIsPrefillOpen] = useState(false);
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [patternType, setPatternType] = useState("auto");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isRunningDetection, setIsRunningDetection] = useState(false);
  const [formStep, setFormStep] = useState<"content" | "details" | "segments" | "review" | "settings">("content");

  // Handle prefilled URL and auto-open
  useEffect(() => {
    if (finalPrefilledUrl) {
      setSourceUrl(finalPrefilledUrl);
      setIsPrefillOpen(true);
    }
    if (finalAutoOpen) {
      setIsCreateDialogOpen(true);
    }
  }, [finalPrefilledUrl, finalAutoOpen]);

  // Listen for external assignment form open events
  useEffect(() => {
    const handleOpenAssignmentForm = (event: CustomEvent) => {
      const { url } = event.detail;
      setSourceUrl(url);
      setIsPrefillOpen(true);
      setIsCreateDialogOpen(true);
    };

    window.addEventListener('openAssignmentForm', handleOpenAssignmentForm as EventListener);
    return () => window.removeEventListener('openAssignmentForm', handleOpenAssignmentForm as EventListener);
  }, []);

  // Fetch assignments
  const { data: assignments = [], isLoading } = useQuery<Assignment[]>({
    queryKey: ["/api/assignments"],
    refetchInterval: 5000, // Auto-refresh every 5 seconds to catch status updates
  });

  // Fetch opportunities
  const { data: opportunities = [], isLoading: isLoadingOpportunities } = useQuery<Opportunity[]>({
    queryKey: ["/api/opportunities"],
    enabled: activeView === "opportunities",
  });

  // Validation functions
  const validateField = (field: string, value: any): string => {
    switch(field) {
      case "title":
        if (!value) return "Title is required";
        if (value.length < 2) return "Title must be at least 2 characters";
        if (value.length > 120) return "Title must be less than 120 characters";
        return "";
      case "objective":
        if (!value) return "Objective is required";
        if (value.length > 300) return "Objective must be less than 300 characters";
        return "";
      case "angle":
        if (!value) return "Angle/Hook is required";
        if (value.length > 120) return "Angle must be less than 120 characters";
        return "";
      case "keyPoints":
        if (!value || value.length === 0) return "At least 1 key point is required";
        if (value.length > 3) return "Maximum 3 key points allowed";
        for (const point of value) {
          if (point.length < 5 || point.length > 140) {
            return "Each key point must be 5-140 characters";
          }
        }
        return "";
      case "ctaUrl":
        if (value && !value.match(/^https?:\/\/.+/)) {
          return "Enter a full URL, e.g., https://example.com";
        }
        return "";
      default:
        return "";
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    errors.title = validateField("title", newAssignment.title);
    errors.objective = validateField("objective", newAssignment.objective);
    errors.angle = validateField("angle", newAssignment.angle);
    errors.keyPoints = validateField("keyPoints", newAssignment.keyPoints);
    if (newAssignment.ctaUrl) {
      errors.ctaUrl = validateField("ctaUrl", newAssignment.ctaUrl);
    }
    
    setValidationErrors(errors);
    return !Object.values(errors).some(error => error);
  };

  // Add key point
  const addKeyPoint = () => {
    if (keyPointInput.trim() && newAssignment.keyPoints.length < 3) {
      const trimmed = keyPointInput.trim();
      if (trimmed.length >= 5 && trimmed.length <= 140) {
        setNewAssignment({
          ...newAssignment,
          keyPoints: [...newAssignment.keyPoints, trimmed]
        });
        setKeyPointInput("");
        setValidationErrors({ ...validationErrors, keyPoints: "" });
      }
    }
  };

  // Remove key point
  const removeKeyPoint = (index: number) => {
    setNewAssignment({
      ...newAssignment,
      keyPoints: newAssignment.keyPoints.filter((_, i) => i !== index)
    });
  };

  // Generate AI suggestions
  const generateSuggestions = async () => {
    if (!sourceUrl && !sourceText) {
      toast({
        title: "Input required",
        description: "Please provide a URL or paste text to generate suggestions",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await apiRequest("POST", "/api/ai/assignments/suggest", {
        source_url: sourceUrl || null,
        raw_text: sourceText || null,
        type_hint: patternType === "auto" ? null : patternType,
      });
      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate suggestions",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Use AI suggestion
  const useSuggestion = (suggestion: any) => {
    const updatedAssignment = {
      ...newAssignment,
      title: suggestion.title || newAssignment.title,
      objective: suggestion.objective || newAssignment.objective,
      angle: suggestion.angle || newAssignment.angle,
      keyPoints: suggestion.key_points || newAssignment.keyPoints,
      ctaLabel: suggestion.cta?.label || newAssignment.ctaLabel,
      ctaUrl: suggestion.cta?.url || newAssignment.ctaUrl,
      dueDate: suggestion.due_at_suggestion ? 
        new Date(suggestion.due_at_suggestion).toISOString().split('T')[0] : 
        newAssignment.dueDate,
      assignee: suggestion.assignee || newAssignment.assignee,
    };
    
    setNewAssignment(updatedAssignment);
    
    // Clear validation errors after applying suggestion
    setValidationErrors({});
    
    setIsPrefillOpen(false);
    setSuggestions([]);
    toast({
      title: "Suggestion applied",
      description: "Form has been filled with AI suggestions",
    });
  };

  // Create assignment mutation
  const createAssignmentMutation = useMutation({
    mutationFn: async (data: typeof newAssignment) => {
      console.log("Creating assignment with data:", data);
      
      // Validate before sending
      if (!validateForm()) {
        console.error("Validation failed");
        throw new Error("Please fix validation errors");
      }

      const payload = {
        title: data.title,
        description: data.objective, // Map objective to description for now
        type: data.type,
        priority: data.priority,
        dueDate: data.dueDate || undefined,
        notes: data.notes,
        tags: data.tags,
        opportunityId: data.opportunityId,
        brief: {
          objective: data.objective,
          angle: data.angle,
          keyPoints: data.keyPoints,
          offer: data.ctaLabel ? {
            label: data.ctaLabel,
            url: data.ctaUrl || undefined
          } : undefined,
        },
        // Enhanced workflow fields
        targetSegments: data.targetSegments || [],
        emailPlatform: data.emailPlatform || 'auto-detect',
        reviewers: data.reviewers || [],
        reviewDeadline: data.reviewDeadline || undefined,
        reviewNotes: data.reviewNotes || undefined,
        autoGenerateVariations: data.autoGenerateVariations !== false
      };

      console.log("Making API request with payload:", payload);
      
      try {
        const response = await apiRequest("POST", "/api/assignments", payload);
        console.log("API request successful");
        return await response.json();
      } catch (error) {
        console.error("API request error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      setIsCreateDialogOpen(false);
      setNewAssignment({
        title: "",
        objective: "",
        angle: "",
        keyPoints: [],
        type: "newsletter",
        priority: "medium",
        dueDate: "",
        ctaLabel: "",
        ctaUrl: "",
        assignee: "",
        notes: "",
        tags: [],
        images: [],
        opportunityId: null,
        targetSegments: [],
        emailPlatform: "auto-detect",
        reviewers: [],
        reviewDeadline: "",
        reviewNotes: "",
        autoGenerateVariations: true,
      });
      setValidationErrors({});
      toast({
        title: "Assignment created",
        description: "Assignment created—ready for writer",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create assignment",
        variant: "destructive",
      });
    },
  });

  // Update assignment status
  const updateAssignmentMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Assignment> }) => {
      const response = await apiRequest("PATCH", `/api/assignments/${id}`, updates);
      return await response.json();
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
      const response = await apiRequest("POST", `/api/assignments/${id}/share`, {});
      return await response.json();
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

  // Phase 1: Approval System Mutations
  const approveAssignmentMutation = useMutation({
    mutationFn: async ({ id, comments }: { id: string; comments?: string }) => {
      const response = await apiRequest("POST", `/api/assignments/${id}/approve`, { comments });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      toast({
        title: "Assignment Approved",
        description: "Assignment has been approved and is ready for broadcast.",
      });
    },
    onError: () => {
      toast({
        title: "Approval Failed",
        description: "Unable to approve assignment. Please try again.",
        variant: "destructive",
      });
    }
  });

  const rejectAssignmentMutation = useMutation({
    mutationFn: async ({ id, comments }: { id: string; comments: string }) => {
      const response = await apiRequest("POST", `/api/assignments/${id}/reject`, { comments });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      toast({
        title: "Assignment Rejected",
        description: "Assignment has been rejected and sent back for revision.",
      });
    },
    onError: () => {
      toast({
        title: "Rejection Failed",
        description: "Unable to reject assignment. Please try again.",
        variant: "destructive",
      });
    }
  });

  const requestChangesAssignmentMutation = useMutation({
    mutationFn: async ({ id, comments }: { id: string; comments: string }) => {
      const response = await apiRequest("POST", `/api/assignments/${id}/request-changes`, { comments });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      toast({
        title: "Changes Requested",
        description: "Assignment has been sent back with change requests.",
      });
    },
    onError: () => {
      toast({
        title: "Request Failed",
        description: "Unable to request changes. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Phase 2: Add to Broadcast Queue Mutation
  const addToBroadcastQueueMutation = useMutation({
    mutationFn: async (data: {
      assignmentId: string;
      assignmentTitle: string;
      priority: "high" | "medium" | "low";
      emailSubject: string;
      audienceCount: number;
    }) => {
      const response = await apiRequest("POST", "/api/broadcast-queue", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/broadcast-queue"] });
      toast({
        title: "Added to Broadcast Queue",
        description: "Assignment is now queued for broadcasting.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Add to Queue",
        description: error.message || "Unable to add assignment to broadcast queue.",
        variant: "destructive",
      });
    }
  });

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
      case "completed":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
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
      case "approved":
        return assignments.filter(a => a.status === "approved");
      case "completed":
        return assignments.filter(a => ["completed", "published"].includes(a.status));
      default:
        return assignments;
    }
  };

  const filteredAssignments = filterAssignments(assignments);

  // Create assignment from opportunity
  const handleCreateAssignmentFromOpportunity = (opportunity: Opportunity) => {
    setNewAssignment({
      ...newAssignment,
      title: opportunity.title || "",
      objective: opportunity.description || "",
      angle: opportunity.description || "",
      keyPoints: opportunity.description ? [opportunity.description] : [],
      priority: opportunity.probability && opportunity.probability > 70 ? "high" : "medium",
      notes: `Created from opportunity: ${opportunity.title}`,
      opportunityId: opportunity.id,
    });
    setIsCreateDialogOpen(true);
  };

  // Run AI opportunity detection
  const handleRunDetection = async () => {
    setIsRunningDetection(true);
    try {
      // First initialize triggers if needed
      const initResponse = await apiRequest("POST", "/api/opportunity-detection/initialize", {});
      await initResponse.json();
      
      // Run detection
      const runResponse = await apiRequest("POST", "/api/opportunity-detection/run", {});
      const response = await runResponse.json();
      
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
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="fixed bottom-4 right-4 sm:relative sm:bottom-auto sm:right-auto z-50 shadow-lg sm:shadow-none">
                <Plus className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">New Assignment</span>
                <span className="sm:hidden">New</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-[625px] max-h-[90vh] overflow-y-auto mx-auto">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl">Create New Assignment</DialogTitle>
                <DialogDescription className="text-sm">
                  Add a new assignment to the content planning desk.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-3 sm:gap-4 py-3 sm:py-4">
                {/* Progress Indicator */}
                {/* Enhanced 5-Step Progress Indicator */}
                <div className="flex items-center justify-between mb-4 px-2 overflow-x-auto">
                  <div className="flex items-center gap-1">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                      formStep === "content" ? "bg-primary text-primary-foreground" : 
                      ["details", "segments", "review", "settings"].includes(formStep) ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
                    }`}>
                      1
                    </div>
                    <span className="text-xs font-medium">Content</span>
                  </div>
                  <div className="flex-1 h-0.5 mx-1 bg-gray-200" />
                  <div className="flex items-center gap-1">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                      formStep === "details" ? "bg-primary text-primary-foreground" : 
                      ["segments", "review", "settings"].includes(formStep) ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
                    }`}>
                      2
                    </div>
                    <span className="text-xs font-medium">Details</span>
                  </div>
                  <div className="flex-1 h-0.5 mx-1 bg-gray-200" />
                  <div className="flex items-center gap-1">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                      formStep === "segments" ? "bg-primary text-primary-foreground" : 
                      ["review", "settings"].includes(formStep) ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
                    }`}>
                      3
                    </div>
                    <span className="text-xs font-medium">Segments</span>
                  </div>
                  <div className="flex-1 h-0.5 mx-1 bg-gray-200" />
                  <div className="flex items-center gap-1">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                      formStep === "review" ? "bg-primary text-primary-foreground" : 
                      formStep === "settings" ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
                    }`}>
                      4
                    </div>
                    <span className="text-xs font-medium">Review</span>
                  </div>
                  <div className="flex-1 h-0.5 mx-1 bg-gray-200" />
                  <div className="flex items-center gap-1">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                      formStep === "settings" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>
                      5
                    </div>
                    <span className="text-xs font-medium">Settings</span>
                  </div>
                </div>

                {/* AI Quick Start - More Prominent */}
                {formStep === "content" && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-blue-900 dark:text-blue-100">AI-Assisted Quick Start</h3>
                        <p className="text-sm text-blue-700 dark:text-blue-300">Let AI generate your assignment from a link or text</p>
                      </div>
                    </div>
                    <Collapsible open={isPrefillOpen} onOpenChange={setIsPrefillOpen}>
                      <CollapsibleTrigger asChild>
                        <Button variant="outline" className="w-full justify-between bg-white dark:bg-gray-800">
                          <span>Paste URL or text to auto-generate</span>
                          <ChevronDown className={`h-4 w-4 transition-transform ${isPrefillOpen ? "rotate-180" : ""}`} />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-4 pt-4">
                    <div className="grid gap-2">
                      <Label htmlFor="sourceUrl">Source URL</Label>
                      <Input
                        id="sourceUrl"
                        value={sourceUrl}
                        onChange={(e) => setSourceUrl(e.target.value)}
                        placeholder="Paste source URL"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="sourceText">Or Paste Text</Label>
                      <Textarea
                        id="sourceText"
                        value={sourceText}
                        onChange={(e) => setSourceText(e.target.value)}
                        placeholder="...or paste source text"
                        rows={3}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="patternSelect">Pattern</Label>
                      <Select value={patternType} onValueChange={setPatternType}>
                        <SelectTrigger id="patternSelect">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">Auto-detect</SelectItem>
                          <SelectItem value="newsletter">Newsletter</SelectItem>
                          <SelectItem value="market_alert">Market Alert</SelectItem>
                          <SelectItem value="promo">Promo</SelectItem>
                          <SelectItem value="earnings_recap">Earnings Recap</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      onClick={generateSuggestions}
                      disabled={isGenerating}
                      className="w-full"
                    >
                      {isGenerating ? "Generating..." : "Generate suggestions"}
                    </Button>
                    
                    {/* Suggestions list */}
                    {suggestions.length > 0 && (
                      <div className="space-y-3">
                        {suggestions.map((suggestion, idx) => (
                          <Card key={idx} className="p-3">
                            <div className="space-y-2">
                              <h4 className="font-semibold text-sm">{suggestion.title}</h4>
                              <p className="text-xs text-muted-foreground">{suggestion.angle}</p>
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  onClick={() => useSuggestion(suggestion)}
                                >
                                  Use this
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                )}

                {/* Step 1: Core Content */}
                {formStep === "content" && (
                  <div className="space-y-4">
                    {/* Title */}
                    <div className="grid gap-2">
                      <Label htmlFor="assignmentTitle" className="text-base font-semibold">Title*</Label>
                      <Input
                        id="assignmentTitle"
                        value={newAssignment.title}
                        onChange={(e) => {
                          setNewAssignment({ ...newAssignment, title: e.target.value });
                          setValidationErrors({ ...validationErrors, title: validateField("title", e.target.value) });
                        }}
                        placeholder="e.g., Weekly Market Outlook - Tech Sector Focus"
                        className={`text-lg ${validationErrors.title ? "border-red-500" : ""}`}
                        data-testid="input-title"
                      />
                      {validationErrors.title && (
                        <p className="text-sm text-red-500">{validationErrors.title}</p>
                      )}
                    </div>

                    {/* Objective */}
                    <div className="grid gap-2">
                      <Label htmlFor="assignmentObjective" className="text-base font-semibold">Objective*</Label>
                      <p className="text-sm text-muted-foreground">What should this email accomplish?</p>
                      <Textarea
                        id="assignmentObjective"
                        value={newAssignment.objective}
                        onChange={(e) => {
                          setNewAssignment({ ...newAssignment, objective: e.target.value });
                          setValidationErrors({ ...validationErrors, objective: validateField("objective", e.target.value) });
                        }}
                        placeholder="Drive subscriber engagement with actionable market insights..."
                        rows={3}
                        className={validationErrors.objective ? "border-red-500" : ""}
                        data-testid="textarea-objective"
                      />
                      {validationErrors.objective && (
                        <p className="text-sm text-red-500">{validationErrors.objective}</p>
                      )}
                    </div>

                    {/* Angle/Hook */}
                    <div className="grid gap-2">
                      <Label htmlFor="assignmentAngle" className="text-base font-semibold">Angle/Hook*</Label>
                      <p className="text-sm text-muted-foreground">What's the big idea in one line?</p>
                      <Input
                        id="assignmentAngle"
                        value={newAssignment.angle}
                        onChange={(e) => {
                          setNewAssignment({ ...newAssignment, angle: e.target.value });
                          setValidationErrors({ ...validationErrors, angle: validateField("angle", e.target.value) });
                        }}
                        placeholder="Tech stocks poised for 30% recovery amid AI breakthroughs"
                        className={validationErrors.angle ? "border-red-500" : ""}
                        data-testid="input-angle"
                      />
                      {validationErrors.angle && (
                        <p className="text-sm text-red-500">{validationErrors.angle}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 2: Content Details */}
                {formStep === "details" && (
                  <div className="space-y-4">
                    {/* Key Points */}
                    <div className="grid gap-2">
                      <Label htmlFor="assignmentKeypoints" className="text-base font-semibold">Key Points* (1-3 required)</Label>
                      <div id="assignmentKeypoints" className="space-y-2">
                        {/* Display existing key points as chips */}
                        {newAssignment.keyPoints.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {newAssignment.keyPoints.map((point, idx) => (
                              <div key={idx} className="flex items-center gap-1 bg-secondary px-3 py-1 rounded-full">
                                <span className="text-sm">{point}</span>
                                <button
                                  type="button"
                                  onClick={() => removeKeyPoint(idx)}
                                  className="ml-1 hover:text-destructive"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Input
                            id="keypointInput"
                            value={keyPointInput}
                            onChange={(e) => setKeyPointInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addKeyPoint();
                              }
                            }}
                            placeholder="Add 1-3 facts or proofs to guide the draft"
                            disabled={newAssignment.keyPoints.length >= 3}
                          />
                          <Button
                            type="button"
                            onClick={addKeyPoint}
                            disabled={newAssignment.keyPoints.length >= 3}
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                      {validationErrors.keyPoints && (
                        <p className="text-sm text-red-500">{validationErrors.keyPoints}</p>
                      )}
                    </div>

                    {/* CTA Section */}
                    <div className="grid gap-3">
                      <Label className="text-base font-semibold">Call-to-Action (Optional)</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="grid gap-2">
                          <Label htmlFor="assignmentCtaLabel">CTA Label</Label>
                          <Input
                            id="assignmentCtaLabel"
                            value={newAssignment.ctaLabel}
                            onChange={(e) => setNewAssignment({ ...newAssignment, ctaLabel: e.target.value })}
                            placeholder="e.g., Get Free Report"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="assignmentCtaUrl">CTA URL</Label>
                          <Input
                            id="assignmentCtaUrl"
                            value={newAssignment.ctaUrl}
                            onChange={(e) => setNewAssignment({ ...newAssignment, ctaUrl: e.target.value })}
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Target Segments - NEW */}
                {formStep === "segments" && (
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label className="text-base font-semibold">Select Target Segments*</Label>
                      <p className="text-sm text-muted-foreground">Choose which audience segments will receive this content</p>
                      <div className="space-y-2">
                        {[
                          { id: "all_users", name: "All Subscribers", count: 42, description: "Send to all active Customer.io subscribers" }
                        ].map(segment => (
                          <label 
                            key={segment.id} 
                            className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                          >
                            <input
                              type="checkbox"
                              className="mt-1"
                              checked={newAssignment.targetSegments.some(s => s.segmentId === segment.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewAssignment({
                                    ...newAssignment,
                                    targetSegments: [...newAssignment.targetSegments, {
                                      segmentId: segment.id,
                                      segmentName: segment.name,
                                      subscriberCount: segment.count,
                                      platform: newAssignment.emailPlatform
                                    }]
                                  });
                                } else {
                                  setNewAssignment({
                                    ...newAssignment,
                                    targetSegments: newAssignment.targetSegments.filter(s => s.segmentId !== segment.id)
                                  });
                                }
                              }}
                            />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{segment.name}</span>
                                <Badge variant="secondary">{segment.count.toLocaleString()} subscribers</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{segment.description}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Email Platform Source */}
                    <div className="grid gap-2">
                      <Label htmlFor="emailPlatform">Email Platform Source</Label>
                      <Select
                        value={newAssignment.emailPlatform}
                        onValueChange={(value) => setNewAssignment({ ...newAssignment, emailPlatform: value })}
                      >
                        <SelectTrigger id="emailPlatform">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="customerio">Customer.io (Connected)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Segment Preview */}
                    {newAssignment.targetSegments.length > 0 && (
                      <div className="p-3 bg-accent/50 rounded-lg">
                        <p className="text-sm font-medium">
                          <strong>Real Customer.io Audience:</strong> {newAssignment.targetSegments.reduce((sum, s) => sum + s.subscriberCount, 0).toLocaleString()} active subscribers
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 4: Collaboration & Review - NEW */}
                {formStep === "review" && (
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label className="text-base font-semibold">Assign Reviewers</Label>
                      <p className="text-sm text-muted-foreground">Select team members to review this assignment</p>
                      <div className="space-y-2">
                        {[
                          { id: "sarah.editor", name: "Sarah (Editor)", role: "Content Review" },
                          { id: "mike.compliance", name: "Mike (Compliance)", role: "Regulatory Review" },
                          { id: "lisa.manager", name: "Lisa (Manager)", role: "Final Approval" }
                        ].map(reviewer => (
                          <label 
                            key={reviewer.id} 
                            className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={newAssignment.reviewers.some(r => r.userId === reviewer.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewAssignment({
                                    ...newAssignment,
                                    reviewers: [...newAssignment.reviewers, {
                                      userId: reviewer.id,
                                      name: reviewer.name,
                                      role: reviewer.role,
                                      status: "pending"
                                    }]
                                  });
                                } else {
                                  setNewAssignment({
                                    ...newAssignment,
                                    reviewers: newAssignment.reviewers.filter(r => r.userId !== reviewer.id)
                                  });
                                }
                              }}
                            />
                            <div className="flex-1">
                              <span className="font-medium">{reviewer.name}</span>
                              <Badge variant="outline" className="ml-2">{reviewer.role}</Badge>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Review Deadline */}
                    <div className="grid gap-2">
                      <Label htmlFor="reviewDeadline">Review Deadline</Label>
                      <Input
                        id="reviewDeadline"
                        type="datetime-local"
                        value={newAssignment.reviewDeadline}
                        onChange={(e) => setNewAssignment({ ...newAssignment, reviewDeadline: e.target.value })}
                      />
                    </div>

                    {/* Review Notes */}
                    <div className="grid gap-2">
                      <Label htmlFor="reviewNotes">Review Notes (Optional)</Label>
                      <Textarea
                        id="reviewNotes"
                        value={newAssignment.reviewNotes}
                        onChange={(e) => setNewAssignment({ ...newAssignment, reviewNotes: e.target.value })}
                        placeholder="Special instructions for reviewers..."
                        rows={3}
                      />
                    </div>

                    {/* Auto-Generate Variations */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="autoGenerateVariations"
                        checked={newAssignment.autoGenerateVariations}
                        onChange={(e) => setNewAssignment({ ...newAssignment, autoGenerateVariations: e.target.checked })}
                      />
                      <Label htmlFor="autoGenerateVariations" className="cursor-pointer">
                        Automatically generate segment-specific content after approval
                      </Label>
                    </div>
                  </div>
                )}

                {/* Step 5: Project Settings */}
                {formStep === "settings" && (
                  <div className="space-y-4">
                    {/* Type and Priority */}
                    <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="assignmentType">Type</Label>
                    <Select
                      value={newAssignment.type}
                      onValueChange={(value) => setNewAssignment({ ...newAssignment, type: value })}
                    >
                      <SelectTrigger id="assignmentType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newsletter">Newsletter</SelectItem>
                        <SelectItem value="market_alert">Market Alert</SelectItem>
                        <SelectItem value="promo">Promo</SelectItem>
                        <SelectItem value="earnings_recap">Earnings Recap</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="assignmentPriority">Priority</Label>
                    <Select
                      value={newAssignment.priority}
                      onValueChange={(value) => setNewAssignment({ ...newAssignment, priority: value })}
                    >
                      <SelectTrigger id="assignmentPriority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Due Date */}
                <div className="grid gap-2">
                  <Label htmlFor="assignmentDue">Due Date</Label>
                  <Input
                    id="assignmentDue"
                    type="date"
                    value={newAssignment.dueDate}
                    onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                  />
                </div>

                    {/* Notes */}
                    <div className="grid gap-2">
                      <Label htmlFor="assignmentNotes">Notes (Optional)</Label>
                      <Textarea
                        id="assignmentNotes"
                        value={newAssignment.notes}
                        onChange={(e) => setNewAssignment({ ...newAssignment, notes: e.target.value })}
                        placeholder="Additional context or requirements..."
                        rows={3}
                      />
                    </div>
                  </div>
                )}

                {/* Enhanced Step Navigation for 5-step form */}
                <div className="flex justify-between pt-4 border-t">
                  {formStep !== "content" ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (formStep === "details") setFormStep("content");
                        if (formStep === "segments") setFormStep("details");
                        if (formStep === "review") setFormStep("segments");
                        if (formStep === "settings") setFormStep("review");
                      }}
                    >
                      Back
                    </Button>
                  ) : (
                    <div></div>
                  )}

                  {formStep !== "settings" ? (
                    <Button
                      type="button"
                      onClick={() => {
                        if (formStep === "content") {
                          // Validate core content before proceeding
                          const coreErrors = {
                            title: validateField("title", newAssignment.title),
                            objective: validateField("objective", newAssignment.objective),
                            angle: validateField("angle", newAssignment.angle)
                          };
                          
                          if (Object.values(coreErrors).some(error => error)) {
                            setValidationErrors(coreErrors);
                            toast({
                              title: "Please complete required fields",
                              description: "Title, objective, and angle are required to continue.",
                              variant: "destructive"
                            });
                            return;
                          }
                          setFormStep("details");
                        } else if (formStep === "details") {
                          // Validate key points before proceeding
                          const keyPointsError = validateField("keyPoints", newAssignment.keyPoints);
                          if (keyPointsError) {
                            setValidationErrors({ keyPoints: keyPointsError });
                            toast({
                              title: "Please add key points",
                              description: "At least 1 key point is required to continue.",
                              variant: "destructive"
                            });
                            return;
                          }
                          setFormStep("segments");
                        } else if (formStep === "segments") {
                          // Validate target segments
                          if (newAssignment.targetSegments.length === 0) {
                            toast({
                              title: "Please select target segments",
                              description: "At least 1 segment must be selected.",
                              variant: "destructive"
                            });
                            return;
                          }
                          setFormStep("review");
                        } else if (formStep === "review") {
                          setFormStep("settings");
                        }
                      }}
                    >
                      Continue
                    </Button>
                  ) : (
                    <Button
                      id="btnCreateAssignment"
                      onClick={() => createAssignmentMutation.mutate(newAssignment)}
                      disabled={createAssignmentMutation.isPending}
                    >
                      {createAssignmentMutation.isPending ? "Creating..." : "Create Assignment"}
                    </Button>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

      {/* Conditional Content based on View */}
      {activeView === "assignments" ? (
        <>
        {/* Enhanced Assignment Status Overview */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          <Card className="border-l-4 border-l-gray-400">
            <CardHeader className="pb-2 px-4">
              <CardTitle className="text-xs font-medium text-gray-600">Draft</CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              <div className="text-2xl font-bold">{assignments.filter(a => a.status === "unassigned").length}</div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-yellow-400">
            <CardHeader className="pb-2 px-4">
              <CardTitle className="text-xs font-medium text-gray-600">In Review</CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              <div className="text-2xl font-bold text-yellow-600">
                {assignments.filter(a => a.status === "review").length}
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-green-400">
            <CardHeader className="pb-2 px-4">
              <CardTitle className="text-xs font-medium text-gray-600">Approved</CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              <div className="text-2xl font-bold text-green-600">
                {assignments.filter(a => a.status === "approved").length}
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-blue-400">
            <CardHeader className="pb-2 px-4">
              <CardTitle className="text-xs font-medium text-gray-600">Queued</CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              <div className="text-2xl font-bold text-blue-600">
                {assignments.filter(a => ["queued", "broadcasting"].includes(a.status)).length}
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-purple-400">
            <CardHeader className="pb-2 px-4">
              <CardTitle className="text-xs font-medium text-gray-600">Sent</CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              <div className="text-2xl font-bold text-purple-600">
                {assignments.filter(a => ["completed", "published"].includes(a.status)).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assignments List */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Assignments</CardTitle>
                <CardDescription>View and manage all content assignments</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/assignments"] })}
              >
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="mb-4 w-full flex-wrap h-auto p-1">
                <TabsTrigger value="all" className="text-xs sm:text-sm">All</TabsTrigger>
                <TabsTrigger value="unassigned" className="text-xs sm:text-sm">Unassigned</TabsTrigger>
                <TabsTrigger value="in_progress" className="text-xs sm:text-sm">In Progress</TabsTrigger>
                <TabsTrigger value="review" className="text-xs sm:text-sm">Review</TabsTrigger>
                <TabsTrigger value="approved" className="text-xs sm:text-sm">Approved</TabsTrigger>
                <TabsTrigger value="completed" className="text-xs sm:text-sm">Completed</TabsTrigger>
              </TabsList>

              <TabsContent value={selectedTab}>
                {isLoading ? (
                  <div className="text-center py-8 text-gray-500">Loading assignments...</div>
                ) : filteredAssignments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No assignments found in this category
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {filteredAssignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="border rounded-lg p-3 sm:p-4 hover:bg-muted/50 hover:shadow-md hover:border-primary/20 transition-all duration-200 cursor-pointer"
                        onClick={() => {
                          // Navigate to assignment detail page using the assignment ID
                          setLocation(`/assignments/${assignment.id}`);
                        }}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              {getStatusIcon(assignment.status)}
                              <h3 className="font-semibold text-base sm:text-lg break-words">{assignment.title}</h3>
                              <Badge className={`${getPriorityColor(assignment.priority)} text-xs`}>
                                {assignment.priority}
                              </Badge>
                              <Badge variant="outline" className="text-xs">{assignment.type}</Badge>
                            </div>
                            {assignment.description && (
                              <p className="text-sm text-muted-foreground mb-2">{assignment.description}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                              {assignment.dueDate && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                                </div>
                              )}
                              {assignment.assignedTo && (
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  <span>Assigned</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            {/* Shareable link buttons */}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyShareableLink(assignment);
                              }}
                              title="Copy shareable link"
                              className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
                            >
                              <Link className="h-4 w-4" />
                            </Button>
                            {assignment.shareableUrl && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(assignment.shareableUrl, '_blank');
                                }}
                                title="Open public view"
                                className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            )}
                            
                            {/* Edit button */}
                            <WouterLink href={`/assignments/${assignment.id}/edit`}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs sm:text-sm"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Edit
                              </Button>
                            </WouterLink>
                            
                            {/* Status action buttons */}
                            {assignment.status === "unassigned" && (
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateAssignmentMutation.mutate({
                                    id: assignment.id,
                                    updates: { status: "assigned", assignedTo: "current-user" }
                                  });
                                }}
                                className="text-xs sm:text-sm"
                              >
                                Assign to Me
                              </Button>
                            )}
                            {assignment.status === "assigned" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateAssignmentMutation.mutate({
                                    id: assignment.id,
                                    updates: { status: "in_progress" }
                                  });
                                }}
                                className="text-xs sm:text-sm"
                              >
                                Start Work
                              </Button>
                            )}
                            {assignment.status === "in_progress" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateAssignmentMutation.mutate({
                                    id: assignment.id,
                                    updates: { status: "review" }
                                  });
                                }}
                                className="text-xs sm:text-sm"
                              >
                                Submit for Review
                              </Button>
                            )}
                            {/* Phase 1: Approval System - Review Status Actions */}
                            {assignment.status === "review" && (
                              <div className="flex flex-wrap gap-1 sm:gap-2">
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    approveAssignmentMutation.mutate({ id: assignment.id });
                                  }}
                                  disabled={approveAssignmentMutation.isPending}
                                  className="text-xs sm:text-sm bg-green-600 hover:bg-green-700 text-white"
                                  data-testid={`button-approve-${assignment.id}`}
                                >
                                  <ThumbsUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const comments = prompt("Please provide rejection reason:");
                                    if (comments && comments.trim()) {
                                      rejectAssignmentMutation.mutate({ id: assignment.id, comments });
                                    }
                                  }}
                                  disabled={rejectAssignmentMutation.isPending}
                                  className="text-xs sm:text-sm border-red-200 text-red-600 hover:bg-red-50"
                                  data-testid={`button-reject-${assignment.id}`}
                                >
                                  <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                  Reject
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const comments = prompt("Please provide specific changes needed:");
                                    if (comments && comments.trim()) {
                                      requestChangesAssignmentMutation.mutate({ id: assignment.id, comments });
                                    }
                                  }}
                                  disabled={requestChangesAssignmentMutation.isPending}
                                  className="text-xs sm:text-sm border-yellow-200 text-yellow-600 hover:bg-yellow-50"
                                  data-testid={`button-request-changes-${assignment.id}`}
                                >
                                  <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                  Changes
                                </Button>
                              </div>
                            )}
                            
                            {/* Show approval status for approved/rejected assignments */}
                            {(assignment.status === "approved" || assignment.approvalStatus === "approved") && (
                              <div className="flex items-center gap-2">
                                <Badge className="bg-green-100 text-green-800 text-xs">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Approved
                                </Badge>
                                {assignment.approvalComments && (
                                  <span className="text-xs text-muted-foreground" title={assignment.approvalComments}>
                                    "{assignment.approvalComments.length > 30 ? 
                                      assignment.approvalComments.substring(0, 30) + "..." : 
                                      assignment.approvalComments}"
                                  </span>
                                )}
                              </div>
                            )}
                            
                            {assignment.approvalStatus === "rejected" && (
                              <div className="flex items-center gap-2">
                                <Badge className="bg-red-100 text-red-800 text-xs">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Rejected
                                </Badge>
                                {assignment.approvalComments && (
                                  <span className="text-xs text-muted-foreground" title={assignment.approvalComments}>
                                    "{assignment.approvalComments.length > 30 ? 
                                      assignment.approvalComments.substring(0, 30) + "..." : 
                                      assignment.approvalComments}"
                                  </span>
                                )}
                              </div>
                            )}
                            
                            {assignment.approvalStatus === "changes_requested" && (
                              <div className="flex items-center gap-2">
                                <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                                  <MessageCircle className="h-3 w-3 mr-1" />
                                  Changes Requested
                                </Badge>
                                {assignment.approvalComments && (
                                  <span className="text-xs text-muted-foreground" title={assignment.approvalComments}>
                                    "{assignment.approvalComments.length > 30 ? 
                                      assignment.approvalComments.substring(0, 30) + "..." : 
                                      assignment.approvalComments}"
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Phase 2: Broadcast Queue Button for Approved Assignments */}
                            {assignment.status === "approved" && (
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Navigate to broadcast queue instead of trying to add again
                                  window.location.href = '/broadcast-queue';
                                }}
                                className="text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white"
                                data-testid={`button-view-in-broadcast-${assignment.id}`}
                              >
                                <Send className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                View in Broadcast Queue
                              </Button>
                            )}

                            {assignment.status === "completed" && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toast({
                                      title: "Email Variations Generated",
                                      description: "This assignment has been processed with segment-specific email variations including Growth Investors, Conservative Investors, Day Traders, and Crypto Enthusiasts.",
                                    });
                                  }}
                                  className="text-xs sm:text-sm text-green-600 border-green-200 hover:bg-green-50"
                                >
                                  <Sparkles className="h-4 w-4 mr-1" />
                                  View Variations
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    approveAssignmentMutation.mutate({
                                      id: assignment.id,
                                      comments: "Automatically approved after segment variations completed"
                                    });
                                  }}
                                  disabled={approveAssignmentMutation.isPending}
                                  className="text-xs sm:text-sm bg-green-600 hover:bg-green-700 text-white"
                                  data-testid={`button-approve-completed-${assignment.id}`}
                                >
                                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                  Approve & Queue
                                </Button>
                              </div>
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
        </>
      ) : (
        <>
        {/* Opportunities View */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <Card>
            <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Total Opportunities</CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <div className="text-xl sm:text-2xl font-bold">{opportunities.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Pipeline Value</CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <div className="text-xl sm:text-2xl font-bold text-green-600">
                ${opportunities.reduce((sum, opp) => sum + (opp.potentialValue || 0), 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Qualified</CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <div className="text-xl sm:text-2xl font-bold text-blue-600">
                {opportunities.filter(o => ["qualified", "proposal", "negotiation"].includes(o.status)).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Won This Month</CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <div className="text-xl sm:text-2xl font-bold text-purple-600">
                {opportunities.filter(o => o.status === "won").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Opportunities List */}
        <Card>
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
              <div>
                <CardTitle className="text-lg sm:text-xl">Revenue Opportunities</CardTitle>
                <CardDescription className="text-xs sm:text-sm mt-1">AI-powered detection of sponsorships, partnerships, and growth opportunities</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRunDetection()}
                  disabled={isRunningDetection}
                  className="gap-1 sm:gap-2 text-xs sm:text-sm"
                >
                  {isRunningDetection ? (
                    <div className="h-3 w-3 sm:h-4 sm:w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Zap className="h-3 w-3 sm:h-4 sm:w-4" />
                  )}
                  <span className="hidden sm:inline">{isRunningDetection ? "Detecting..." : "Run Detection"}</span>
                  <span className="sm:hidden">{isRunningDetection ? "..." : "Detect"}</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 sm:gap-2 text-xs sm:text-sm"
                >
                  <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Triggers</span>
                  <span className="sm:hidden">Config</span>
                </Button>
                <Button size="sm" className="text-xs sm:text-sm">
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">New Opportunity</span>
                  <span className="sm:hidden">New</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingOpportunities ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent mx-auto mb-3" />
                <p>Loading opportunities...</p>
              </div>
            ) : opportunities.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <div className="mb-4">
                  <Zap className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-medium mb-2 text-foreground">No opportunities detected</h3>
                <p className="text-sm mb-4 max-w-md mx-auto">
                  AI will automatically detect revenue opportunities based on market events, stock movements, and news sentiment.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRunDetection()}
                    disabled={isRunningDetection}
                    className="gap-2"
                  >
                    {isRunningDetection ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <Zap className="h-4 w-4" />
                    )}
                    {isRunningDetection ? "Scanning Markets..." : "Run Detection Now"}
                  </Button>
                  <Button size="sm">Add Manual</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {opportunities.map((opportunity) => (
                  <div
                    key={opportunity.id}
                    className="border rounded-lg p-4 sm:p-5 hover:bg-muted/50 transition-all hover:shadow-md"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex-1">
                        <div className="mb-3">
                          <h3 className="font-semibold text-base sm:text-lg text-foreground leading-tight mb-2">
                            {opportunity.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={
                              opportunity.status === "won" ? "default" :
                              opportunity.status === "lost" ? "destructive" :
                              opportunity.status === "negotiation" ? "secondary" :
                              "outline"
                            }
                            className="text-xs"
                            >
                              {opportunity.status}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {opportunity.type}
                            </Badge>
                            {/* Show AI badge if source is ai_detected or metadata contains aiGenerated */}
                            {((opportunity as any).source === "ai_detected" || 
                              (opportunity as any)?.metadata?.aiGenerated) && (
                              <Badge variant="secondary" className="gap-1 text-xs">
                                <Sparkles className="h-3 w-3" />
                                <span className="hidden sm:inline">AI Generated</span>
                                <span className="sm:hidden">AI</span>
                              </Badge>
                            )}
                          </div>
                        </div>
                        {opportunity.description && (
                          <p className="text-sm leading-relaxed text-muted-foreground mb-3 line-clamp-3">
                            {opportunity.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm">
                          {opportunity.potentialValue && (
                            <div className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                              <DollarSign className="h-3 w-3" />
                              <span>${opportunity.potentialValue.toLocaleString()}</span>
                            </div>
                          )}
                          {opportunity.probability && (
                            <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                              <Target className="h-3 w-3" />
                              <span>{opportunity.probability}% likely</span>
                            </div>
                          )}
                          {opportunity.contactCompany && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Briefcase className="h-3 w-3" />
                              <span>{opportunity.contactCompany}</span>
                            </div>
                          )}
                          {opportunity.nextActionDate && (
                            <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
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
                          onClick={() => handleCreateAssignmentFromOpportunity(opportunity)}
                          className="text-xs sm:text-sm"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Create Assignment
                        </Button>
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
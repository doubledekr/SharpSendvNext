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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Plus, Calendar, User, AlertCircle, CheckCircle, Clock, FileText, TrendingUp, Users, Link, Copy, ExternalLink, ChevronDown, X, Sparkles, DollarSign, Target, Briefcase, Zap, Settings, Play, Image } from "lucide-react";

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

  // Fetch assignments
  const { data: assignments = [], isLoading } = useQuery<Assignment[]>({
    queryKey: ["/api/assignments"],
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
    setNewAssignment({
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
    });
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
      // Validate before sending
      if (!validateForm()) {
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
        brief: {
          objective: data.objective,
          angle: data.angle,
          keyPoints: data.keyPoints,
          offer: data.ctaLabel ? {
            label: data.ctaLabel,
            url: data.ctaUrl || undefined
          } : undefined,
        }
      };

      const response = await apiRequest("POST", "/api/assignments", payload);
      return await response.json();
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
    <div className="container mx-auto p-6 space-y-6">
      {/* Header with View Toggle */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">
            {activeView === "assignments" ? "Assignment Desk" : "Opportunities"}
          </h1>
          <p className="text-muted-foreground">
            {activeView === "assignments" 
              ? "Manage content planning and assignments" 
              : "Track revenue and growth opportunities"}
          </p>
        </div>
        
        {/* View Toggle */}
        <div className="flex items-center gap-4">
          <div className="flex bg-muted rounded-lg p-1">
            <Button
              variant={activeView === "assignments" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveView("assignments")}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              Assignments
            </Button>
            <Button
              variant={activeView === "opportunities" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveView("opportunities")}
              className="gap-2"
            >
              <DollarSign className="h-4 w-4" />
              Opportunities
            </Button>
          </div>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Assignment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Assignment</DialogTitle>
                <DialogDescription>
                  Add a new assignment to the content planning desk.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                {/* AI Prefill Section */}
                <Collapsible open={isPrefillOpen} onOpenChange={setIsPrefillOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      <span className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Use AI to prefill from a link or pasted text
                      </span>
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

                {/* Title */}
                <div className="grid gap-2">
                  <Label htmlFor="assignmentTitle">Title*</Label>
                  <Input
                    id="assignmentTitle"
                    value={newAssignment.title}
                    onChange={(e) => {
                      setNewAssignment({ ...newAssignment, title: e.target.value });
                      setValidationErrors({ ...validationErrors, title: validateField("title", e.target.value) });
                    }}
                    placeholder="Assignment title"
                    className={validationErrors.title ? "border-red-500" : ""}
                  />
                  {validationErrors.title && (
                    <p className="text-sm text-red-500">{validationErrors.title}</p>
                  )}
                </div>

                {/* Objective */}
                <div className="grid gap-2">
                  <Label htmlFor="assignmentObjective">Objective*</Label>
                  <Textarea
                    id="assignmentObjective"
                    value={newAssignment.objective}
                    onChange={(e) => {
                      setNewAssignment({ ...newAssignment, objective: e.target.value });
                      setValidationErrors({ ...validationErrors, objective: validateField("objective", e.target.value) });
                    }}
                    placeholder="What should this email accomplish (1-2 sentences)?"
                    rows={2}
                    className={validationErrors.objective ? "border-red-500" : ""}
                  />
                  {validationErrors.objective && (
                    <p className="text-sm text-red-500">{validationErrors.objective}</p>
                  )}
                </div>

                {/* Angle/Hook */}
                <div className="grid gap-2">
                  <Label htmlFor="assignmentAngle">Angle/Hook*</Label>
                  <Input
                    id="assignmentAngle"
                    value={newAssignment.angle}
                    onChange={(e) => {
                      setNewAssignment({ ...newAssignment, angle: e.target.value });
                      setValidationErrors({ ...validationErrors, angle: validateField("angle", e.target.value) });
                    }}
                    placeholder="What's the big idea in one line?"
                    className={validationErrors.angle ? "border-red-500" : ""}
                  />
                  {validationErrors.angle && (
                    <p className="text-sm text-red-500">{validationErrors.angle}</p>
                  )}
                </div>

                {/* Key Points */}
                <div className="grid gap-2">
                  <Label htmlFor="assignmentKeypoints">Key Points* (1-3 required)</Label>
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

                {/* CTA */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="ctaLabel">CTA Label (optional)</Label>
                    <Input
                      id="ctaLabel"
                      value={newAssignment.ctaLabel}
                      onChange={(e) => setNewAssignment({ ...newAssignment, ctaLabel: e.target.value })}
                      placeholder="Button or link text (optional)"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="ctaUrl">CTA URL (optional)</Label>
                    <Input
                      id="ctaUrl"
                      value={newAssignment.ctaUrl}
                      onChange={(e) => {
                        setNewAssignment({ ...newAssignment, ctaUrl: e.target.value });
                        if (e.target.value) {
                          setValidationErrors({ ...validationErrors, ctaUrl: validateField("ctaUrl", e.target.value) });
                        }
                      }}
                      placeholder="https://example.com/landing-page (optional)"
                      className={validationErrors.ctaUrl ? "border-red-500" : ""}
                    />
                    {validationErrors.ctaUrl && (
                      <p className="text-sm text-red-500">{validationErrors.ctaUrl}</p>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {/* Image Upload Section */}
                <div className="space-y-3">
                  <Label>Images & Media</Label>
                  <div className="space-y-2">
                    {/* Hero Image Upload */}
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Image className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Hero Image</p>
                          <p className="text-xs text-muted-foreground">Main featured image</p>
                        </div>
                      </div>
                      <ObjectUploader
                        maxNumberOfFiles={1}
                        onGetUploadParameters={async () => {
                          const response = await fetch("/api/assignments/upload-url", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ type: "hero" }),
                          });
                          const data = await response.json();
                          return { method: "PUT" as const, url: data.uploadURL };
                        }}
                        onComplete={async (result) => {
                          if (result.successful.length > 0) {
                            const uploadUrl = result.successful[0].uploadURL;
                            const response = await fetch("/api/assignments/process-image", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ 
                                uploadUrl,
                                imageType: "hero",
                                assignmentId: "temp"
                              }),
                            });
                            const data = await response.json();
                            setNewAssignment({
                              ...newAssignment,
                              images: [...newAssignment.images, { url: data.cdnUrl, type: "hero" }]
                            });
                            toast({
                              title: "Hero image uploaded",
                              description: "Image indexed and ready for CDN delivery",
                            });
                          }
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Upload Hero
                      </ObjectUploader>
                    </div>

                    {/* Inline Images Upload */}
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Image className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Inline Images</p>
                          <p className="text-xs text-muted-foreground">Content body images</p>
                        </div>
                      </div>
                      <ObjectUploader
                        maxNumberOfFiles={5}
                        onGetUploadParameters={async () => {
                          const response = await fetch("/api/assignments/upload-url", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ type: "inline" }),
                          });
                          const data = await response.json();
                          return { method: "PUT" as const, url: data.uploadURL };
                        }}
                        onComplete={async (result) => {
                          for (const file of result.successful) {
                            const response = await fetch("/api/assignments/process-image", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ 
                                uploadUrl: file.uploadURL,
                                imageType: "inline",
                                assignmentId: "temp"
                              }),
                            });
                            const data = await response.json();
                            setNewAssignment({
                              ...newAssignment,
                              images: [...newAssignment.images, { url: data.cdnUrl, type: "inline" }]
                            });
                          }
                          toast({
                            title: "Inline images uploaded",
                            description: `${result.successful.length} images indexed for CDN`,
                          });
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Inline
                      </ObjectUploader>
                    </div>

                    {/* Display uploaded images */}
                    {newAssignment.images.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-sm font-medium">Uploaded Images</p>
                        <div className="grid grid-cols-3 gap-2">
                          {newAssignment.images.map((img, idx) => (
                            <div key={idx} className="relative group">
                              <img 
                                src={img.url} 
                                alt={`${img.type} image`}
                                className="w-full h-20 object-cover rounded-lg border"
                              />
                              <Badge 
                                className="absolute top-1 left-1 text-xs"
                                variant={img.type === "hero" ? "default" : "secondary"}
                              >
                                {img.type}
                              </Badge>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => {
                                  setNewAssignment({
                                    ...newAssignment,
                                    images: newAssignment.images.filter((_, i) => i !== idx)
                                  });
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="assignmentNotes">Notes</Label>
                  <Textarea
                    id="assignmentNotes"
                    value={newAssignment.notes}
                    onChange={(e) => setNewAssignment({ ...newAssignment, notes: e.target.value })}
                    placeholder="Additional notes..."
                    rows={2}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button
                  id="btnCreateAssignment"
                  onClick={() => createAssignmentMutation.mutate(newAssignment)}
                  disabled={createAssignmentMutation.isPending}
                >
                  Create Assignment
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

      {/* Conditional Content based on View */}
      {activeView === "assignments" ? (
        <>
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
        </>
      ) : (
        <>
        {/* Opportunities View */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Opportunities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{opportunities.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Pipeline Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${opportunities.reduce((sum, opp) => sum + (opp.potentialValue || 0), 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Qualified</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {opportunities.filter(o => ["qualified", "proposal", "negotiation"].includes(o.status)).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Won This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {opportunities.filter(o => o.status === "won").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Opportunities List */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Revenue Opportunities</CardTitle>
                <CardDescription>AI-powered detection of sponsorships, partnerships, and growth opportunities</CardDescription>
              </div>
              <div className="flex gap-2">
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
                  {isRunningDetection ? "Detecting..." : "Run Detection"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Triggers
                </Button>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Opportunity
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingOpportunities ? (
              <div className="text-center py-8 text-gray-500">Loading opportunities...</div>
            ) : opportunities.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <div className="mb-4">
                  <Zap className="h-12 w-12 mx-auto mb-3 opacity-50" />
                </div>
                <h3 className="text-lg font-medium mb-2">No opportunities detected</h3>
                <p className="text-sm mb-4">
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
              <div className="space-y-4">
                {opportunities.map((opportunity) => (
                  <div
                    key={opportunity.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-lg">{opportunity.title}</h3>
                          <Badge variant={
                            opportunity.status === "won" ? "default" :
                            opportunity.status === "lost" ? "destructive" :
                            opportunity.status === "negotiation" ? "secondary" :
                            "outline"
                          }>
                            {opportunity.status}
                          </Badge>
                          <Badge variant="outline">
                            {opportunity.type}
                          </Badge>
                          {/* Show AI badge if source is ai_detected or metadata contains aiGenerated */}
                          {(opportunity.source === "ai_detected" || 
                            (opportunity as any)?.metadata?.aiGenerated) && (
                            <Badge variant="secondary" className="gap-1">
                              <Sparkles className="h-3 w-3" />
                              AI Generated
                            </Badge>
                          )}
                        </div>
                        {opportunity.description && (
                          <p className="text-muted-foreground mb-2">{opportunity.description}</p>
                        )}
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          {opportunity.potentialValue && (
                            <div className="flex items-center space-x-1">
                              <DollarSign className="h-3 w-3" />
                              <span>${opportunity.potentialValue.toLocaleString()}</span>
                            </div>
                          )}
                          {opportunity.probability && (
                            <div className="flex items-center space-x-1">
                              <Target className="h-3 w-3" />
                              <span>{opportunity.probability}%</span>
                            </div>
                          )}
                          {opportunity.contactCompany && (
                            <div className="flex items-center space-x-1">
                              <Briefcase className="h-3 w-3" />
                              <span>{opportunity.contactCompany}</span>
                            </div>
                          )}
                          {opportunity.nextActionDate && (
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>Next: {new Date(opportunity.nextActionDate).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
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
import React, { useState, useRef } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  FileText, 
  Calendar, 
  AlertCircle, 
  CheckCircle, 
  Save, 
  Send, 
  Image as ImageIcon, 
  Plus, 
  X, 
  ExternalLink,
  Upload,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ObjectUploader } from "@/components/ObjectUploader";

interface Assignment {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  priority: string;
  dueDate?: string;
  content?: string;
  notes?: string;
  brief?: {
    objective?: string;
    angle?: string;
    keyPoints?: string[];
    offer?: { label: string; url?: string };
    references?: string[];
  };
  shareableSlug?: string;
  shareableUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface CopywriterSubmission {
  content: string;
  images: Array<{
    url: string;
    type: 'hero' | 'inline' | 'attachment';
    caption?: string;
  }>;
  notes?: string;
}

export function CopywriterAssignment() {
  const { toast } = useToast();
  const [, params] = useRoute("/assignment/:slug");
  const slug = params?.slug;
  
  const [submission, setSubmission] = useState<CopywriterSubmission>({
    content: "",
    images: [],
    notes: ""
  });
  
  const [isDraft, setIsDraft] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch assignment by slug
  const { data: assignment, isLoading, error } = useQuery<Assignment>({
    queryKey: ["/api/public/assignment", slug],
    queryFn: async () => {
      const response = await fetch(`/api/public/assignment/${slug}`);
      if (!response.ok) {
        throw new Error("Assignment not found");
      }
      return response.json();
    },
    enabled: !!slug,
  });

  // Load existing submission if any
  React.useEffect(() => {
    if (assignment?.content) {
      setSubmission(prev => ({
        ...prev,
        content: assignment.content || ""
      }));
    }
  }, [assignment]);

  // Save draft mutation
  const saveDraftMutation = useMutation({
    mutationFn: async (data: CopywriterSubmission) => {
      const response = await apiRequest("PATCH", `/api/assignments/${assignment?.id}`, {
        content: data.content,
        status: "in_progress",
        masterDraft: {
          blocks: data.content.split('\n\n').map(paragraph => ({
            type: "paragraph",
            md: paragraph
          }))
        }
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Draft Saved",
        description: "Your work has been saved as a draft.",
      });
    },
  });

  // Submit assignment mutation
  const submitMutation = useMutation({
    mutationFn: async (data: CopywriterSubmission) => {
      const response = await apiRequest("PATCH", `/api/assignments/${assignment?.id}`, {
        content: data.content,
        status: "review",
        masterDraft: {
          blocks: [
            ...data.content.split('\n\n').map(paragraph => ({
              type: "paragraph",
              md: paragraph
            })),
            ...data.images.map(img => ({
              type: "image",
              assetId: img.url,
              alt: img.caption || "",
              caption: img.caption
            }))
          ]
        }
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Assignment Submitted",
        description: "Your assignment has been submitted for review.",
      });
      setIsDraft(false);
    },
  });

  const handleSaveDraft = () => {
    saveDraftMutation.mutate(submission);
  };

  const handleSubmit = () => {
    if (!submission.content.trim()) {
      toast({
        title: "Content Required",
        description: "Please add content before submitting.",
        variant: "destructive",
      });
      return;
    }
    submitMutation.mutate(submission);
  };

  const handleImageUpload = (files: File[]) => {
    // This would typically upload to object storage
    // For now, we'll simulate with placeholder URLs
    const newImages = files.map((file, index) => ({
      url: URL.createObjectURL(file),
      type: 'inline' as const,
      caption: `Uploaded image ${submission.images.length + index + 1}`
    }));
    
    setSubmission(prev => ({
      ...prev,
      images: [...prev.images, ...newImages]
    }));
  };

  const removeImage = (index: number) => {
    setSubmission(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "destructive";
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "default";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "review": return "default";
      case "in_progress": return "default";
      case "approved": return "default";
      case "unassigned": return "secondary";
      default: return "secondary";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading assignment...</p>
        </div>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Assignment Not Found</h1>
          <p className="text-muted-foreground">The assignment link may be invalid or expired.</p>
        </div>
      </div>
    );
  }

  const isSubmitted = assignment.status === "review" || assignment.status === "approved";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <FileText className="h-6 w-6" />
                <h1 className="text-2xl font-bold">{assignment.title}</h1>
                <Badge variant={getPriorityColor(assignment.priority)}>
                  {assignment.priority}
                </Badge>
                <Badge variant={getStatusColor(assignment.status)}>
                  {assignment.status.replace('_', ' ')}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Due: {assignment.dueDate 
                    ? new Date(assignment.dueDate).toLocaleDateString() 
                    : "No deadline set"
                  }
                </div>
                <div className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  Type: {assignment.type}
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              {!isSubmitted && (
                <>
                  <Button 
                    variant="outline" 
                    onClick={handleSaveDraft}
                    disabled={saveDraftMutation.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saveDraftMutation.isPending ? "Saving..." : "Save Draft"}
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={submitMutation.isPending}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {submitMutation.isPending ? "Submitting..." : "Submit"}
                  </Button>
                </>
              )}
              {isSubmitted && (
                <Badge variant="default" className="px-4 py-2">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Submitted for Review
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Assignment Brief - Left Sidebar */}
          <div className="col-span-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Assignment Brief
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {assignment.description}
                  </p>
                </div>

                {assignment.brief?.objective && (
                  <div>
                    <Label className="text-sm font-medium">Objective</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {assignment.brief.objective}
                    </p>
                  </div>
                )}

                {assignment.brief?.angle && (
                  <div>
                    <Label className="text-sm font-medium">Angle</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {assignment.brief.angle}
                    </p>
                  </div>
                )}

                {assignment.brief?.keyPoints && assignment.brief.keyPoints.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Key Points</Label>
                    <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                      {assignment.brief.keyPoints.map((point, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {assignment.brief?.offer && (
                  <div>
                    <Label className="text-sm font-medium">Call to Action</Label>
                    <div className="text-sm text-muted-foreground mt-1">
                      <p>{assignment.brief.offer.label}</p>
                      {assignment.brief.offer.url && (
                        <a 
                          href={assignment.brief.offer.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1 mt-1"
                        >
                          View URL <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {assignment.notes && (
                  <div>
                    <Label className="text-sm font-medium">Additional Notes</Label>
                    <div className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                      {assignment.notes}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Content Editor - Main Area */}
          <div className="col-span-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Content Editor
                  </div>
                  {isDraft && assignment.status === "in_progress" && (
                    <Badge variant="secondary">Draft Saved</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Content Area */}
                <div>
                  <Label htmlFor="content" className="text-sm font-medium">
                    Content *
                  </Label>
                  <Textarea
                    id="content"
                    placeholder="Write your content here..."
                    value={submission.content}
                    onChange={(e) => setSubmission(prev => ({ ...prev, content: e.target.value }))}
                    className="min-h-[400px] mt-2"
                    disabled={isSubmitted}
                  />
                </div>

                {/* Image Upload Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-sm font-medium">Images</Label>
                    {!isSubmitted && (
                      <ObjectUploader
                        onUploadComplete={(result: any) => {
                          if (result.successful && result.successful.length > 0) {
                            const newImages = result.successful.map((file: any, index: number) => ({
                              url: file.uploadURL,
                              type: 'inline' as const,
                              caption: `Image ${submission.images.length + index + 1}`
                            }));
                            setSubmission(prev => ({
                              ...prev,
                              images: [...prev.images, ...newImages]
                            }));
                            toast({
                              title: "Images Uploaded",
                              description: `${result.successful.length} images uploaded successfully.`,
                            });
                          }
                        }}
                      >
                        <Button variant="outline" size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Images
                        </Button>
                      </ObjectUploader>
                    )}
                  </div>

                  {submission.images.length > 0 && (
                    <div className="grid grid-cols-2 gap-3">
                      {submission.images.map((image, index) => (
                        <div key={index} className="relative group border rounded-lg p-2">
                          <img 
                            src={image.url} 
                            alt={image.caption || `Image ${index + 1}`}
                            className="w-full h-32 object-cover rounded"
                          />
                          <div className="mt-2">
                            <input
                              type="text"
                              placeholder="Add caption..."
                              value={image.caption || ""}
                              onChange={(e) => {
                                const newImages = [...submission.images];
                                newImages[index] = { ...newImages[index], caption: e.target.value };
                                setSubmission(prev => ({ ...prev, images: newImages }));
                              }}
                              className="w-full text-xs border rounded px-2 py-1"
                              disabled={isSubmitted}
                            />
                          </div>
                          {!isSubmitted && (
                            <Button
                              size="sm"
                              variant="destructive"
                              className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeImage(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Notes Section */}
                <div>
                  <Label htmlFor="notes" className="text-sm font-medium">
                    Notes for Editor
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder="Any additional notes or questions for the editor..."
                    value={submission.notes}
                    onChange={(e) => setSubmission(prev => ({ ...prev, notes: e.target.value }))}
                    className="mt-2"
                    rows={3}
                    disabled={isSubmitted}
                  />
                </div>

                {isSubmitted && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <h4 className="font-medium text-green-800">Submission Complete</h4>
                        <p className="text-sm text-green-700">
                          Your assignment has been submitted and is under review. You'll be notified of any feedback or approval.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
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
import { CDNImageBrowser } from "@/components/CDNImageBrowser";
import { DragDropContentEditor } from "@/components/DragDropContentEditor";

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
  masterDraft?: {
    blocks: Array<{
      type: string;
      md?: string;
      assetId?: string;
      caption?: string;
      align?: string;
      size?: string;
      level?: number;
    }>;
  };
  shareableSlug?: string;
  shareableUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface ContentBlock {
  id: string;
  type: 'paragraph' | 'image' | 'heading' | 'list' | 'quote';
  content?: string;
  imageUrl?: string;
  imageCaption?: string;
  imageAlign?: 'left' | 'center' | 'right';
  imageSize?: 'small' | 'medium' | 'large' | 'full';
  level?: number;
  listType?: 'bullet' | 'numbered';
}

interface CopywriterSubmission {
  contentBlocks: ContentBlock[];
  notes?: string;
}

export function CopywriterAssignment() {
  const { toast } = useToast();
  const [, params] = useRoute("/assignment/:slug");
  const slug = params?.slug;
  
  const [submission, setSubmission] = useState<CopywriterSubmission>({
    contentBlocks: [],
    notes: ""
  });
  
  const [isDraft, setIsDraft] = useState(true);
  const [showImageBrowser, setShowImageBrowser] = useState(false);
  const [insertAfterBlockId, setInsertAfterBlockId] = useState<string | undefined>();

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
    if (assignment?.masterDraft?.blocks) {
      setSubmission(prev => ({
        ...prev,
        contentBlocks: assignment.masterDraft.blocks.map((block: any) => ({
          id: Math.random().toString(36).substr(2, 9),
          type: block.type,
          content: block.md,
          imageUrl: block.assetId,
          imageCaption: block.caption,
          imageAlign: block.align || 'center',
          imageSize: block.size || 'medium',
          level: block.level || 2,
          listType: 'bullet'
        }))
      }));
    } else if (assignment?.content) {
      // Convert legacy text content to blocks
      const paragraphs = assignment.content.split('\n\n').filter(p => p.trim());
      setSubmission(prev => ({
        ...prev,
        contentBlocks: paragraphs.map(p => ({
          id: Math.random().toString(36).substr(2, 9),
          type: 'paragraph' as const,
          content: p.trim()
        }))
      }));
    }
  }, [assignment]);

  // Save draft mutation
  const saveDraftMutation = useMutation({
    mutationFn: async (data: CopywriterSubmission) => {
      const response = await apiRequest("PATCH", `/api/assignments/${assignment?.id}`, {
        content: data.contentBlocks.map(block => block.content || '').join('\n\n'),
        status: "in_progress",
        masterDraft: {
          blocks: data.contentBlocks.map(block => ({
            type: block.type,
            md: block.content,
            assetId: block.imageUrl,
            alt: block.imageCaption,
            caption: block.imageCaption,
            align: block.imageAlign,
            size: block.imageSize,
            level: block.level
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
        content: data.contentBlocks.map(block => block.content || '').join('\n\n'),
        status: "review",
        masterDraft: {
          blocks: data.contentBlocks.map(block => ({
            type: block.type,
            md: block.content,
            assetId: block.imageUrl,
            alt: block.imageCaption,
            caption: block.imageCaption,
            align: block.imageAlign,
            size: block.imageSize,
            level: block.level
          }))
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
    if (submission.contentBlocks.length === 0) {
      toast({
        title: "Content Required",
        description: "Please add content before submitting.",
        variant: "destructive",
      });
      return;
    }
    submitMutation.mutate(submission);
  };

  const handleImageSelect = (image: any) => {
    const newBlock: ContentBlock = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'image',
      imageUrl: image.url,
      imageAlign: 'center',
      imageSize: 'medium',
      imageCaption: image.name
    };

    if (insertAfterBlockId) {
      const index = submission.contentBlocks.findIndex(block => block.id === insertAfterBlockId);
      const newBlocks = [...submission.contentBlocks];
      newBlocks.splice(index + 1, 0, newBlock);
      setSubmission(prev => ({ ...prev, contentBlocks: newBlocks }));
    } else {
      setSubmission(prev => ({ 
        ...prev, 
        contentBlocks: [...prev.contentBlocks, newBlock] 
      }));
    }

    setShowImageBrowser(false);
    setInsertAfterBlockId(undefined);
  };

  const handleImageInsert = (afterBlockId?: string) => {
    setInsertAfterBlockId(afterBlockId);
    setShowImageBrowser(true);
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
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Content Editor
                    </div>
                    <div className="flex items-center gap-2">
                      {isDraft && assignment.status === "in_progress" && (
                        <Badge variant="secondary">Draft Saved</Badge>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowImageBrowser(true)}
                        disabled={isSubmitted}
                      >
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Browse CDN
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <DragDropContentEditor
                    content={submission.contentBlocks}
                    onChange={(blocks) => setSubmission(prev => ({ ...prev, contentBlocks: blocks }))}
                    onImageInsert={handleImageInsert}
                    placeholder="Start writing your assignment content..."
                    className={isSubmitted ? "pointer-events-none opacity-75" : ""}
                  />
                </CardContent>
              </Card>

              {/* Notes Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Notes for Editor</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Any additional notes or questions for the editor..."
                    value={submission.notes}
                    onChange={(e) => setSubmission(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    disabled={isSubmitted}
                  />
                </CardContent>
              </Card>

              {isSubmitted && (
                <Card>
                  <CardContent className="p-6">
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
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CDN Image Browser Modal */}
      {showImageBrowser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-6xl max-h-[90vh] flex flex-col">
            <CardHeader className="flex-shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  CDN Image Browser
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowImageBrowser(false);
                    setInsertAfterBlockId(undefined);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              <CDNImageBrowser
                onImageSelect={handleImageSelect}
                onImageInsert={handleImageSelect}
                showUpload={true}
                className="h-full"
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
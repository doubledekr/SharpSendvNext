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
  Loader2,
  Mail
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
  // Support both slug-based (public) and ID-based (internal) routes
  const [, slugParams] = useRoute("/assignment/:slug");
  const [, idParams] = useRoute("/assignments/:id");
  const slug = slugParams?.slug;
  const assignmentId = idParams?.id;
  
  const [submission, setSubmission] = useState<CopywriterSubmission>({
    contentBlocks: [],
    notes: ""
  });
  
  const [isDraft, setIsDraft] = useState(true);
  const [showImageBrowser, setShowImageBrowser] = useState(false);
  const [insertAfterBlockId, setInsertAfterBlockId] = useState<string | undefined>();
  const [viewMode, setViewMode] = useState<'edit' | 'email'>('edit');

  // Fetch assignment by slug or ID
  const { data: assignment, isLoading, error } = useQuery<Assignment>({
    queryKey: assignmentId ? ["/api/assignments", assignmentId] : ["/api/public/assignment", slug],
    queryFn: async () => {
      if (assignmentId) {
        // Internal route - fetch by ID
        const response = await fetch(`/api/assignments/${assignmentId}`);
        if (!response.ok) {
          throw new Error("Assignment not found");
        }
        return response.json();
      } else if (slug) {
        // Public route - fetch by slug
        const response = await fetch(`/api/public/assignment/${slug}`);
        if (!response.ok) {
          throw new Error("Assignment not found");
        }
        return response.json();
      }
      throw new Error("No assignment identifier provided");
    },
    enabled: !!(slug || assignmentId),
  });

  // Fetch email variations for completed assignments
  const { data: variationsData } = useQuery({
    queryKey: [`/api/assignments/${assignmentId}/variations`],
    enabled: !!assignmentId && assignment?.status === "completed",
  });

  // Fetch tracked images for the assignment
  const { data: assignmentImages } = useQuery({
    queryKey: [`/api/assignments/${assignmentId}/images`],
    enabled: !!assignmentId,
  });

  // Load existing submission if any
  React.useEffect(() => {
    if (assignment?.masterDraft?.blocks) {
      setSubmission(prev => ({
        ...prev,
        contentBlocks: assignment.masterDraft!.blocks.map((block: any) => ({
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

  // Approve assignment mutation
  const approveMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PATCH", `/api/assignments/${assignment?.id}`, {
        status: "approved"
      });
      return response.json();
    },
    onSuccess: async (data) => {
      toast({
        title: "Assignment Approved",
        description: "The assignment has been approved. Generating email variations for different segments...",
      });
      
      // Trigger email variations generation
      try {
        const variationsResponse = await apiRequest("POST", `/api/assignments/${assignment?.id}/variations`, {});
        toast({
          title: "Email Variations Generated",
          description: "Email variations have been created for different segments.",
        });
        // Refresh assignments list to show updated status
        queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      } catch (error) {
        toast({
          title: "Variations Generation Failed",
          description: "Assignment approved but email variations generation failed.",
          variant: "destructive",
        });
      }
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

  const handleApprove = () => {
    approveMutation.mutate();
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
              <Button 
                variant="outline" 
                onClick={handleSaveDraft}
                disabled={saveDraftMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {saveDraftMutation.isPending ? "Saving..." : isSubmitted ? "Save Revision" : "Save Draft"}
              </Button>
              {!isSubmitted && (
                <Button 
                  onClick={handleSubmit}
                  disabled={submitMutation.isPending}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {submitMutation.isPending ? "Submitting..." : "Submit"}
                </Button>
              )}
              {isSubmitted && (
                <>
                  <Button 
                    onClick={handleSubmit}
                    disabled={submitMutation.isPending}
                    variant="outline"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {submitMutation.isPending ? "Resubmitting..." : "Resubmit"}
                  </Button>
                  <Button 
                    onClick={handleApprove}
                    disabled={approveMutation.isPending}
                    variant="default"
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {approveMutation.isPending ? "Approving..." : "Approve"}
                  </Button>
                </>
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
                      <div className="flex items-center border border-gray-300 rounded-sm overflow-hidden">
                        <Button
                          variant={viewMode === 'edit' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setViewMode('edit')}
                          className="rounded-none border-0"
                        >
                          Edit
                        </Button>
                        <Button
                          variant={viewMode === 'email' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setViewMode('email')}
                          className="rounded-none border-0"
                        >
                          Email Preview
                        </Button>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowImageBrowser(true)}
                      >
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Browse CDN
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isSubmitted && (
                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-sm p-3 mb-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                          Status: {assignment?.status === 'review' ? 'Under Review' : 'Submitted'}
                        </span>
                      </div>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        You can continue editing. Changes will be saved as new revisions.
                      </p>
                    </div>
                  )}
                  {viewMode === 'edit' ? (
                    <DragDropContentEditor
                      content={submission.contentBlocks}
                      onChange={(blocks) => setSubmission(prev => ({ ...prev, contentBlocks: blocks }))}
                      onImageInsert={handleImageInsert}
                      placeholder="Start writing your assignment content..."
                    />
                  ) : (
                    <div className="email-preview bg-white dark:bg-gray-50 border border-gray-200 rounded-sm p-6 max-w-2xl mx-auto shadow-sm">
                      <div className="email-header border-b border-gray-200 pb-4 mb-6">
                        <div className="text-sm text-gray-500 mb-2">From: publisher@example.com</div>
                        <div className="text-sm text-gray-500 mb-2">To: subscribers@example.com</div>
                        <h1 className="text-xl font-bold text-gray-900">{assignment.title}</h1>
                      </div>
                      <div className="email-content space-y-4">
                        {submission.contentBlocks.map((block, index) => (
                          <div key={block.id} className="content-block">
                            {block.type === 'paragraph' && (
                              <p className="text-gray-800 leading-relaxed">{block.content}</p>
                            )}
                            {block.type === 'heading' && (
                              <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3">{block.content}</h2>
                            )}
                            {block.type === 'image' && block.imageUrl && (
                              <div className={`image-block text-${block.imageAlign || 'center'} my-4`}>
                                <img 
                                  src={block.imageUrl} 
                                  alt={block.imageCaption || ''} 
                                  className={`${
                                    block.imageSize === 'small' ? 'max-w-xs' :
                                    block.imageSize === 'medium' ? 'max-w-md' :
                                    block.imageSize === 'large' ? 'max-w-lg' :
                                    'max-w-full'
                                  } h-auto mx-auto`}
                                />
                                {block.imageCaption && (
                                  <p className="text-sm text-gray-600 mt-2 italic">{block.imageCaption}</p>
                                )}
                              </div>
                            )}
                            {block.type === 'list' && (
                              <ul className="list-disc list-inside text-gray-800 space-y-1">
                                {block.content?.split('\n').map((item, i) => (
                                  <li key={i}>{item}</li>
                                ))}
                              </ul>
                            )}
                            {block.type === 'quote' && (
                              <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-700">
                                {block.content}
                              </blockquote>
                            )}
                          </div>
                        ))}
                      </div>
                      {assignment.brief?.offer && (
                        <div className="email-footer mt-8 pt-6 border-t border-gray-200">
                          <div className="text-center">
                            <a 
                              href={assignment.brief.offer.url}
                              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-sm font-medium hover:bg-blue-700 transition-colors"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {assignment.brief.offer.label}
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
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
                    className="border-gray-300 focus:border-blue-500 rounded-sm"
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

      {/* Email Variations Section for Completed Assignments */}
      {assignment?.status === "completed" && variationsData?.variations && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              Email Variations
              <Badge variant="outline" className="ml-2">
                {variationsData.variations.length} Segments
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              {variationsData.variations.map((variation: any) => (
                <Card key={variation.id} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{variation.segmentIcon}</span>
                        <div>
                          <CardTitle className="text-lg">{variation.segmentName}</CardTitle>
                          <p className="text-sm text-gray-600 mt-1">{variation.segmentDescription}</p>
                        </div>
                      </div>
                      <Badge variant="secondary">
                        ~{variation.estimatedReach?.toLocaleString()} subscribers
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Subject Line</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                          <p className="font-medium">{variation.subjectLine}</p>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Email Content Preview</Label>
                        <ScrollArea className="h-32 mt-1 p-3 bg-gray-50 rounded-md border">
                          <div className="whitespace-pre-wrap text-sm">
                            {variation.content}
                          </div>
                        </ScrollArea>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <h4 className="font-medium text-blue-900">Assignment Complete</h4>
              </div>
              <p className="text-sm text-blue-700">
                This assignment has been completed and email variations have been generated for {variationsData.variations.length} different investor segments. 
                Each variation is optimized for the specific interests and communication preferences of that audience segment.
              </p>
              {assignmentImages?.images && assignmentImages.images.length > 0 && (
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <h5 className="font-medium text-blue-900 mb-2">Tracked Images ({assignmentImages.images.length})</h5>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {assignmentImages.images.map((image: any) => (
                      <div key={image.id} className="bg-white rounded border p-2">
                        <img 
                          src={image.imageUrl} 
                          alt={image.altText || 'Assignment image'} 
                          className="w-full h-16 object-cover rounded mb-1"
                        />
                        <p className="text-xs text-gray-600 truncate">{image.caption || 'No caption'}</p>
                        <Badge variant="outline" className="text-xs mt-1">
                          Pixel ID: {image.pixelTrackingId}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  X, 
  Plus, 
  Calendar, 
  Target, 
  Zap, 
  Loader2, 
  ExternalLink, 
  Brain, 
  Sparkles,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AIEnhancedAssignmentFormProps {
  onClose: () => void;
  onSuccess?: () => void;
  prefilledData?: {
    referenceUrl?: string;
    title?: string;
    description?: string;
    marketContext?: any;
  };
}

interface AIAnalysisResult {
  title: string;
  description: string;
  objective: string;
  angle: string;
  keyPoints: string[];
  priority: string;
  contentType: string;
  targetAudience: string;
  marketTriggers: string[];
  estimatedReach: number;
}

export default function AIEnhancedAssignmentForm({ 
  onClose, 
  onSuccess, 
  prefilledData 
}: AIEnhancedAssignmentFormProps) {
  const [formData, setFormData] = useState({
    title: prefilledData?.title || "",
    description: prefilledData?.description || "",
    objective: "",
    angle: "",
    keyPoints: [] as string[],
    contentType: "newsletter",
    priority: "medium",
    dueDate: "",
    estimatedReach: "",
    targetAudience: "",
    targetCohorts: [] as string[],
    marketTriggers: [] as string[],
    referenceUrl: prefilledData?.referenceUrl || "",
  });

  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [showAnalysisResults, setShowAnalysisResults] = useState(false);
  const [newKeyPoint, setNewKeyPoint] = useState("");
  const [newCohort, setNewCohort] = useState("");
  const [newTrigger, setNewTrigger] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Auto-analyze when prefilled reference URL is provided
  useEffect(() => {
    if (prefilledData?.referenceUrl && !aiAnalysis) {
      analyzeArticle(prefilledData.referenceUrl);
    }
  }, [prefilledData?.referenceUrl]);

  const analyzeArticle = async (url: string) => {
    if (!url.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a valid article URL to analyze",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const response = await apiRequest("POST", "/api/ai/assignments/suggest", {
        source_url: url,
        type_hint: "newsletter"
      });

      if (response && response.suggestions) {
        const suggestion = response.suggestions;
        const analysis: AIAnalysisResult = {
          title: suggestion.title || `Market Update: ${suggestion.briefSummary}`,
          description: suggestion.briefSummary || "",
          objective: suggestion.objective || `Analyze and communicate insights from: ${suggestion.title}`,
          angle: suggestion.angle || suggestion.uniqueAngle || "Market analysis perspective",
          keyPoints: suggestion.keyPoints || suggestion.bulletPoints || [],
          priority: suggestion.urgency === "immediate" ? "urgent" : 
                   suggestion.urgency === "high" ? "high" : "medium",
          contentType: "newsletter",
          targetAudience: suggestion.targetAudience || "Financial newsletter subscribers",
          marketTriggers: suggestion.marketTriggers || [],
          estimatedReach: suggestion.estimatedImpact || 5000
        };

        setAiAnalysis(analysis);
        setShowAnalysisResults(true);
      } else {
        throw new Error("No suggestions received from AI analysis");
      }
    } catch (error) {
      console.error("Error analyzing article:", error);
      setAnalysisError(
        error instanceof Error ? error.message : "Failed to analyze article content"
      );
      toast({
        title: "Analysis Failed",
        description: "Could not analyze the article. You can still create the assignment manually.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applyAIAnalysis = () => {
    if (!aiAnalysis) return;

    setFormData(prev => ({
      ...prev,
      title: aiAnalysis.title,
      description: aiAnalysis.description,
      objective: aiAnalysis.objective,
      angle: aiAnalysis.angle,
      keyPoints: aiAnalysis.keyPoints,
      priority: aiAnalysis.priority,
      contentType: aiAnalysis.contentType,
      targetAudience: aiAnalysis.targetAudience,
      marketTriggers: aiAnalysis.marketTriggers,
      estimatedReach: aiAnalysis.estimatedReach.toString()
    }));

    setShowAnalysisResults(false);
    toast({
      title: "AI Analysis Applied",
      description: "Assignment form has been populated with AI-generated content",
    });
  };

  const createAssignmentMutation = useMutation({
    mutationFn: async (data: any) => {
      const assignmentData = {
        ...data,
        estimatedReach: data.estimatedReach ? parseInt(data.estimatedReach) : 0,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
        brief: {
          objective: data.objective,
          angle: data.angle,
          keyPoints: data.keyPoints
        },
        notes: data.referenceUrl ? `Reference Article: ${data.referenceUrl}` : "",
        // Add market context if available
        ...(prefilledData?.marketContext && {
          marketContext: prefilledData.marketContext
        })
      };

      const response = await apiRequest("POST", "/api/assignments", assignmentData);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assignments'] });
      toast({
        title: "Assignment Created",
        description: "Your assignment has been created successfully",
      });
      onSuccess?.();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create assignment",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createAssignmentMutation.mutate(formData);
  };

  const addKeyPoint = () => {
    if (newKeyPoint.trim() && !formData.keyPoints.includes(newKeyPoint.trim())) {
      setFormData(prev => ({
        ...prev,
        keyPoints: [...prev.keyPoints, newKeyPoint.trim()]
      }));
      setNewKeyPoint("");
    }
  };

  const removeKeyPoint = (point: string) => {
    setFormData(prev => ({
      ...prev,
      keyPoints: prev.keyPoints.filter(p => p !== point)
    }));
  };

  const addCohort = () => {
    if (newCohort.trim() && !formData.targetCohorts.includes(newCohort.trim())) {
      setFormData(prev => ({
        ...prev,
        targetCohorts: [...prev.targetCohorts, newCohort.trim()]
      }));
      setNewCohort("");
    }
  };

  const removeCohort = (cohort: string) => {
    setFormData(prev => ({
      ...prev,
      targetCohorts: prev.targetCohorts.filter(c => c !== cohort)
    }));
  };

  const addTrigger = () => {
    if (newTrigger.trim() && !formData.marketTriggers.includes(newTrigger.trim())) {
      setFormData(prev => ({
        ...prev,
        marketTriggers: [...prev.marketTriggers, newTrigger.trim()]
      }));
      setNewTrigger("");
    }
  };

  const removeTrigger = (trigger: string) => {
    setFormData(prev => ({
      ...prev,
      marketTriggers: prev.marketTriggers.filter(t => t !== trigger)
    }));
  };

  return (
    <>
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                AI-Enhanced Assignment Creation
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Create assignments from news articles with AI-powered content analysis
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Reference URL Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <ExternalLink className="w-4 h-4" />
                <Label htmlFor="referenceUrl" className="font-medium">Reference Article (Optional)</Label>
              </div>
              
              <div className="flex gap-2">
                <Input
                  id="referenceUrl"
                  placeholder="Enter news article URL for AI analysis..."
                  value={formData.referenceUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, referenceUrl: e.target.value }))}
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={() => analyzeArticle(formData.referenceUrl)}
                  disabled={!formData.referenceUrl.trim() || isAnalyzing}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Analyze with AI
                    </>
                  )}
                </Button>
              </div>

              {analysisError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{analysisError}</AlertDescription>
                </Alert>
              )}
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Assignment Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter assignment title..."
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="contentType">Content Type</Label>
                <Select
                  value={formData.contentType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, contentType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select content type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newsletter">Newsletter</SelectItem>
                    <SelectItem value="analysis">Market Analysis</SelectItem>
                    <SelectItem value="alert">Price Alert</SelectItem>
                    <SelectItem value="educational">Educational Content</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the assignment..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Enhanced Brief Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                <Label className="font-medium">Assignment Brief</Label>
              </div>
              
              <div>
                <Label htmlFor="objective">Objective</Label>
                <Textarea
                  id="objective"
                  placeholder="What is the main goal of this content?"
                  value={formData.objective}
                  onChange={(e) => setFormData(prev => ({ ...prev, objective: e.target.value }))}
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="angle">Content Angle</Label>
                <Textarea
                  id="angle"
                  placeholder="What unique perspective or angle should this content take?"
                  value={formData.angle}
                  onChange={(e) => setFormData(prev => ({ ...prev, angle: e.target.value }))}
                  rows={2}
                />
              </div>

              <div>
                <Label>Key Points to Cover</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="Add a key point..."
                    value={newKeyPoint}
                    onChange={(e) => setNewKeyPoint(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyPoint())}
                  />
                  <Button type="button" size="sm" onClick={addKeyPoint}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {formData.keyPoints.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.keyPoints.map((point, index) => (
                      <Badge key={index} variant="secondary" className="cursor-pointer">
                        {point}
                        <X 
                          className="w-3 h-3 ml-1" 
                          onClick={() => removeKeyPoint(point)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Settings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="estimatedReach">Estimated Reach</Label>
                <Input
                  id="estimatedReach"
                  type="number"
                  placeholder="Number of subscribers"
                  value={formData.estimatedReach}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimatedReach: e.target.value }))}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={!formData.title.trim() || createAssignmentMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {createAssignmentMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Assignment"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* AI Analysis Results Dialog */}
      <Dialog open={showAnalysisResults} onOpenChange={setShowAnalysisResults}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              AI Analysis Complete
            </DialogTitle>
            <DialogDescription>
              Review the AI-generated suggestions and apply them to your assignment
            </DialogDescription>
          </DialogHeader>

          {aiAnalysis && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">Suggested Title</Label>
                  <p className="text-sm bg-gray-50 p-2 rounded">{aiAnalysis.title}</p>
                </div>
                <div>
                  <Label className="font-medium">Priority</Label>
                  <Badge variant={aiAnalysis.priority === 'urgent' ? 'destructive' : 'default'}>
                    {aiAnalysis.priority}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="font-medium">Description</Label>
                <p className="text-sm bg-gray-50 p-2 rounded">{aiAnalysis.description}</p>
              </div>

              <div>
                <Label className="font-medium">Objective</Label>
                <p className="text-sm bg-gray-50 p-2 rounded">{aiAnalysis.objective}</p>
              </div>

              <div>
                <Label className="font-medium">Content Angle</Label>
                <p className="text-sm bg-gray-50 p-2 rounded">{aiAnalysis.angle}</p>
              </div>

              {aiAnalysis.keyPoints.length > 0 && (
                <div>
                  <Label className="font-medium">Key Points</Label>
                  <ul className="text-sm bg-gray-50 p-2 rounded space-y-1">
                    {aiAnalysis.keyPoints.map((point, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-600">•</span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowAnalysisResults(false)}>
                  Cancel
                </Button>
                <Button onClick={applyAIAnalysis} className="bg-purple-600 hover:bg-purple-700">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Apply AI Suggestions
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
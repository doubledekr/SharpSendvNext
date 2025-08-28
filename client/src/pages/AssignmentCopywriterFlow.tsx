import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  FileText, 
  Send,
  Brain,
  Sparkles,
  Users,
  Target,
  Eye,
  Mail,
  CheckCircle,
  AlertCircle,
  Loader2,
  Copy,
  RefreshCw,
  Zap,
  TrendingUp,
  UserCheck,
  Clock,
  BarChart3,
  MessageSquare,
  Save,
  Pause,
  X,
  ArrowLeft,
  ArrowRight,
  Edit,
  Bold,
  Italic,
  Link,
  Image,
  List,
  Quote,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight
} from 'lucide-react';

interface Assignment {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  dueDate: string;
  marketContext: any;
  createdAt: string;
  copywriterId: string;
  publisherId: string;
}

interface SegmentVariation {
  id: string;
  segmentName: string;
  segmentCriteria: string;
  subjectLine: string;
  content: string;
  estimatedRecipients: number;
  pixelId?: string;
  aiScore: number;
}

interface EmailMetrics {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  converted: number;
  revenue: number;
}

// Helper function to render markdown content with links and formatting
function renderMarkdownContent(text: string): string {
  return text
    .replace(/&/g, '&amp;') // Fix ampersand display issue
    .replace(/^#{1,6}\s*/gm, '') // Remove markdown headers
    .replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">$1 ↗</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-gray-300 pl-4 italic text-gray-600">$1</blockquote>')
    .replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
    .replace(/\n/g, '<br>');
}

function AssignmentCopywriterFlow() {
  const params = useParams<{ id?: string; slug?: string }>();
  const assignmentId = params.id || params.slug;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState('write');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showEditor, setShowEditor] = useState(true);
  const [segments, setSegments] = useState<SegmentVariation[]>([]);
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [metrics, setMetrics] = useState<EmailMetrics | null>(null);
  const [scheduledTime, setScheduledTime] = useState<string>('immediate');
  const [customDateTime, setCustomDateTime] = useState<string>('');
  const [currentVariationIndex, setCurrentVariationIndex] = useState<number>(0);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{
    subjects: string[];
    contents: string[];
  }>({ subjects: [], contents: [] });

  // Rich text formatting functions
  const insertFormatting = (format: string) => {
    const textarea = document.querySelector('[data-testid="textarea-content"]') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    let formattedText = '';
    
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText || 'bold text'}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText || 'italic text'}*`;
        break;
      case 'link':
        formattedText = `[${selectedText || 'link text'}](https://example.com)`;
        break;
      case 'list':
        formattedText = `\n- ${selectedText || 'list item'}`;
        break;
      case 'quote':
        formattedText = `\n> ${selectedText || 'quote text'}`;
        break;
      default:
        return;
    }
    
    const newContent = content.substring(0, start) + formattedText + content.substring(end);
    setContent(newContent);
    
    // Restore focus and cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
    }, 0);
  };

  // Fetch assignment details
  const { data: assignment, isLoading } = useQuery<Assignment>({
    queryKey: [`/api/assignments/${assignmentId}`],
    enabled: !!assignmentId,
  });

  // Generate AI content based on assignment brief
  const generateAIContent = async () => {
    if (!assignment) {
      toast({
        title: "Assignment Required",
        description: "Assignment details are needed for AI content generation",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingContent(true);
    
    try {
      const response = await fetch(`/api/ai/content-helper`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          assignmentId: assignment.id,
          brief: {
            objective: assignment.description || assignment.title,
            angle: '',
            keyPoints: [],
            offer: { label: '', url: '' }
          },
          marketContext: assignment.marketContext,
          existingSubject: subject,
          existingContent: content
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate AI content');
      }

      const suggestions = await response.json();
      
      setAiSuggestions(suggestions);
      setShowAISuggestions(true);
      
      toast({
        title: "AI Content Generated",
        description: `Generated ${suggestions.subjects?.length || 0} subject suggestions and ${suggestions.contents?.length || 0} content options`
      });
      
    } catch (error) {
      console.error("Error generating AI content:", error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate AI content suggestions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingContent(false);
    }
  };

  // Generate AI content variations for segments
  const generateSegmentVariations = async () => {
    if (!subject || !content) {
      toast({
        title: "Content Required",
        description: "Please enter both subject and content first",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const response = await fetch(`/api/assignments/${assignmentId}/generate-variations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subject: subject.trim(),
          content: content.trim()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate variations');
      }

      const variations = await response.json();
      
      setSegments(variations);
      toast({
        title: "AI Variations Generated",
        description: `Created ${variations.length} personalized email variations with pixel tracking`
      });
      
    } catch (error) {
      console.error("Error generating variations:", error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate email variations. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateSubjectForSegment = (segment: string, baseSubject: string): string => {
    const variations: Record<string, string> = {
      'High-Value Investors': `🏆 ${baseSubject} - Exclusive Institutional Insights`,
      'Growth Seekers': `🚀 ${baseSubject} - AI & Tech Growth Opportunities`,
      'Conservative Investors': `🛡️ ${baseSubject} - Stable Returns & Risk Management`,
      'Day Traders': `⚡ ${baseSubject} - Today's Trading Signals`
    };
    return variations[segment] || baseSubject;
  };

  const generateContentForSegment = (segment: string, focus: string, baseContent: string): string => {
    const intro = `[Personalized for ${segment}]\n\n`;
    const tailored = `Key Focus Areas: ${focus}\n\n`;
    return intro + tailored + baseContent;
  };

  // Save to drafts
  const saveToDrafts = useMutation({
    mutationFn: async () => {
      const draftData = {
        assignmentId,
        publisherId: assignment?.publisherId,
        subject,
        content,
        segments: selectedSegments.length > 0 
          ? segments.filter(s => selectedSegments.includes(s.id))
          : segments,
        status: 'draft',
        createdAt: new Date().toISOString()
      };
      
      return fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draftData)
      });
    },
    onSuccess: () => {
      toast({
        title: "Saved to Drafts",
        description: "Content saved for publisher review",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/drafts'] });
    },
    onError: () => {
      toast({
        title: "Save Failed",
        description: "Failed to save draft",
        variant: "destructive"
      });
    }
  });

  // Push to send queue
  const pushToSendQueue = useMutation({
    mutationFn: async () => {
      setIsSending(true);
      const selectedVariations = selectedSegments.length > 0 
        ? segments.filter(s => selectedSegments.includes(s.id))
        : segments;

      const queueData = {
        variations: selectedVariations,
        scheduledTime,
        customDateTime
      };

      return fetch(`/api/assignments/${assignmentId}/send-queue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(queueData)
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Added to Send Queue",
        description: `${segments.length} campaigns queued for sending`,
      });
      
      // Close confirm dialog and editor after submission
      setShowConfirmDialog(false);
      setShowEditor(false);
      
      // Simulate initial metrics
      setTimeout(() => {
        setMetrics({
          sent: segments.reduce((sum, s) => sum + s.estimatedRecipients, 0),
          delivered: Math.floor(segments.reduce((sum, s) => sum + s.estimatedRecipients, 0) * 0.98),
          opened: 0,
          clicked: 0,
          converted: 0,
          revenue: 0
        });
      }, 2000);

      // Simulate tracking updates
      simulateMetricsUpdates();
      setActiveTab('tracking');
    },
    onError: () => {
      toast({
        title: "Queue Failed",
        description: "Failed to add to send queue",
        variant: "destructive"
      });
    },
    onSettled: () => {
      setIsSending(false);
    }
  });

  // Simulate real-time metrics updates
  const simulateMetricsUpdates = () => {
    let openRate = 0;
    let clickRate = 0;
    
    const interval = setInterval(() => {
      setMetrics(prev => {
        if (!prev) return null;
        
        openRate = Math.min(openRate + Math.random() * 5, 35);
        clickRate = Math.min(clickRate + Math.random() * 2, 12);
        
        const opened = Math.floor(prev.delivered * (openRate / 100));
        const clicked = Math.floor(opened * (clickRate / 100));
        const converted = Math.floor(clicked * 0.08);
        const revenue = converted * 297; // Average order value
        
        return {
          ...prev,
          opened,
          clicked,
          converted,
          revenue
        };
      });
      
      if (openRate >= 35) {
        clearInterval(interval);
      }
    }, 1500);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-center">Assignment not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Copywriter Assignment Portal
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Assignment ID: {assignmentId}
              </p>
            </div>
            <Badge className="bg-orange-500 text-white">
              <Clock className="w-4 h-4 mr-1" />
              Due: {new Date(assignment.dueDate).toLocaleDateString()}
            </Badge>
          </div>
        </div>

        {/* Assignment Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{assignment.title}</CardTitle>
            <CardDescription>{assignment.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Badge variant={assignment.priority === 'urgent' ? 'destructive' : 'default'}>
                {assignment.priority}
              </Badge>
              <Badge variant="outline">
                {assignment.status}
              </Badge>
              {assignment.marketContext && (
                <div className="flex items-center text-sm text-gray-600">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Market Context Available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Workflow Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="write">
              <FileText className="w-4 h-4 mr-2" />
              Write Content
            </TabsTrigger>
            <TabsTrigger value="segments">
              <Users className="w-4 h-4 mr-2" />
              Segment Variations
            </TabsTrigger>
            <TabsTrigger value="queue">
              <Send className="w-4 h-4 mr-2" />
              Send Queue
            </TabsTrigger>
            <TabsTrigger value="tracking">
              <BarChart3 className="w-4 h-4 mr-2" />
              Tracking & Metrics
            </TabsTrigger>
          </TabsList>

          {/* Write Content & Variations Tab */}
          <TabsContent value="write" className="space-y-6">
            {/* Section Headers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Master Email Content</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Write your master email - variations will be generated from this</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Email Preview</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Real-time preview of your email content</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Panel - Master Email Editor */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Edit className="w-5 h-5" />
                    Master Email Content
                  </CardTitle>
                  <CardDescription>Create your newsletter content with rich formatting tools</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="subject">Subject Line</Label>
                    <Input
                      id="subject"
                      placeholder="Enter compelling subject line..."
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      data-testid="input-subject"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="content">Email Content</Label>
                    
                    {/* Rich Text Toolbar */}
                    <div className="flex items-center gap-1 p-2 border rounded-t-md bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-center gap-1 border-r pr-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => insertFormatting('bold')}
                          title="Bold"
                        >
                          <Bold className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => insertFormatting('italic')}
                          title="Italic"
                        >
                          <Italic className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => insertFormatting('link')}
                          title="Insert Link"
                        >
                          <Link className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-1 border-r pr-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => insertFormatting('list')}
                          title="Bullet List"
                        >
                          <List className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => insertFormatting('quote')}
                          title="Quote"
                        >
                          <Quote className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-1 border-r pr-2">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Align Left">
                          <AlignLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Align Center">
                          <AlignCenter className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Align Right">
                          <AlignRight className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Insert Image">
                          <Image className="h-4 w-4" />
                        </Button>
                        <Select>
                          <SelectTrigger className="h-8 w-24">
                            <SelectValue placeholder="Font" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="arial">Arial</SelectItem>
                            <SelectItem value="helvetica">Helvetica</SelectItem>
                            <SelectItem value="georgia">Georgia</SelectItem>
                            <SelectItem value="times">Times</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <Textarea
                      id="content"
                      placeholder="Write your email content... Use the toolbar above for formatting or type markdown:

**Bold text**
*Italic text*  
[Link text](https://example.com)

- Bullet point 1
- Bullet point 2

> Quote or important note

Use the toolbar above for rich formatting options, or let AI help you create compelling content!"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="min-h-[300px] border-t-0 rounded-t-none"
                      data-testid="textarea-content"
                    />
                    <div className="mt-2 text-sm text-gray-600">
                      <p><strong>Formatting Tips:</strong></p>
                      <p>• Links: [Click here](https://example.com)</p>
                      <p>• Bold: **bold text** • Italic: *italic text*</p>
                      <p>• Use toolbar buttons or type markdown directly</p>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <Button 
                      onClick={generateAIContent}
                      disabled={isGeneratingContent}
                      variant="outline"
                      data-testid="button-ai-helper"
                    >
                      {isGeneratingContent ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4 mr-2" />
                      )}
                      AI Content Helper
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={() => saveToDrafts.mutate()}
                      disabled={!subject || !content}
                      data-testid="button-save-draft"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Save to Drafts
                    </Button>
                  </div>

                  {/* AI Content Suggestions */}
                  {showAISuggestions && (aiSuggestions.subjects.length > 0 || aiSuggestions.contents.length > 0) && (
                    <Card className="bg-blue-50 border-2 border-blue-200">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base flex items-center">
                            <Sparkles className="w-4 h-4 mr-2 text-blue-600" />
                            AI Content Suggestions
                          </CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowAISuggestions(false)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {aiSuggestions.subjects.length > 0 && (
                          <div>
                            <Label className="text-sm font-medium text-blue-800">Subject Line Suggestions:</Label>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {aiSuggestions.subjects.map((suggestedSubject, index) => (
                                <Button
                                  key={index}
                                  size="sm"
                                  variant="outline"
                                  className="text-left justify-start max-w-xs"
                                  onClick={() => setSubject(suggestedSubject.replace(/^#{1,6}\s*/g, ''))}
                                  title={suggestedSubject.replace(/^#{1,6}\s*/g, '')}
                                >
                                  <span className="mr-2 font-bold">{index + 1}</span>
                                  <span className="truncate">{suggestedSubject.replace(/^#{1,6}\s*/g, '').substring(0, 30)}...</span>
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {aiSuggestions.contents.length > 0 && (
                          <div>
                            <Label className="text-sm font-medium text-blue-800">Content Suggestions:</Label>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {aiSuggestions.contents.map((suggestedContent, index) => (
                                <Button
                                  key={index}
                                  size="sm"
                                  variant="outline"
                                  className="text-left justify-start max-w-xs"
                                  onClick={() => setContent(suggestedContent.replace(/^#{1,6}\s*/g, ''))}
                                  title={suggestedContent.replace(/^#{1,6}\s*/g, '').substring(0, 100)}
                                >
                                  <span className="mr-2 font-bold">{index + 1}</span>
                                  <span className="truncate">{suggestedContent.replace(/^#{1,6}\s*/g, '').substring(0, 25)}...</span>
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}


                </CardContent>
              </Card>

              {/* Right Panel - Email Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Email Preview</CardTitle>
                  <CardDescription>Real-time preview of your email content</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Preview Controls */}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      📱 Mobile
                    </Button>
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      🖥️ Desktop
                    </Button>
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      📧 Test Send
                    </Button>
                  </div>

                  {/* Email Preview */}
                  <div className="border rounded-lg p-4 bg-white min-h-[400px]">
                    <div className="text-sm text-gray-500 mb-3 pb-3 border-b">
                      <div>From: publisher@example.com</div>
                      <div>Subject: {subject || 'Your subject line will appear here'}</div>
                    </div>
                    
                    <div 
                      className="text-sm text-gray-800 space-y-2 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: content ? renderMarkdownContent(content) : '<span class="text-gray-400">Your email content will appear here as you type...</span>'
                      }}
                    />
                  </div>

                  {/* Email Stats */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      <span>Est. Opens: 2.5k-5k</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>Subscribers: 12.5k</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Email Preview Stack Tab */}
          <TabsContent value="segments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Segment Selection & Email Variations</CardTitle>
                <CardDescription>
                  Generate and preview targeted email variations for different subscriber segments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {segments.length === 0 ? (
                  <div className="space-y-6">
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Ready to create segment variations</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Generate AI-powered email variations tailored to different subscriber segments
                      </p>
                    </div>

                    {/* Generate Variations Button */}
                    <div className="text-center">
                      <Button 
                        onClick={generateSegmentVariations}
                        disabled={isGenerating || !subject || !content}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                      >
                        {isGenerating ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Generating Variations...
                          </>
                        ) : (
                          <>
                            <Users className="w-4 h-4 mr-2" />
                            Generate Segment Variations
                          </>
                        )}
                      </Button>
                      {(!subject || !content) && (
                        <p className="text-sm text-gray-500 mt-2">
                          Complete the master email content to generate variations
                        </p>
                      )}
                    </div>

                    {/* Preview Available Segments */}
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <h4 className="font-medium text-gray-800 mb-3">Target Segments Available:</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 p-2 bg-white rounded border">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm">Growth Investors</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-white rounded border">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-sm">Conservative Investors</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-white rounded border">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          <span className="text-sm">Day Traders</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-white rounded border">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span className="text-sm">Crypto Enthusiasts</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Segment Stack Navigation */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">Email Stack:</h3>
                        <div className="flex gap-1">
                          {segments.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentVariationIndex(index)}
                              className={`w-8 h-8 rounded text-xs font-medium transition-colors ${
                                currentVariationIndex === index
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                              }`}
                            >
                              {index + 1}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        {currentVariationIndex + 1} of {segments.length} variations
                      </div>
                    </div>

                    {/* Email Preview Stack Container */}
                    <div className="relative min-h-[500px]">
                      {segments.map((segment, index) => {
                        const isActive = index === currentVariationIndex;
                        const stackOffset = Math.max(0, index - currentVariationIndex);
                        
                        return (
                          <div
                            key={segment.id}
                            onClick={() => setCurrentVariationIndex(index)}
                            className={`absolute w-full transition-all duration-300 ease-in-out cursor-pointer hover:shadow-lg ${
                              isActive 
                                ? 'z-30 opacity-100' 
                                : 'opacity-75 hover:opacity-90'
                            }`}
                            style={{
                              transform: isActive 
                                ? 'translateX(0px) translateY(0px) scale(1)' 
                                : `translateX(${stackOffset * 8}px) translateY(${stackOffset * 8}px) scale(${1 - stackOffset * 0.05})`,
                              zIndex: 30 - stackOffset
                            }}
                          >
                            <Card className={`border-2 ${isActive ? 'border-blue-500 shadow-xl' : 'border-gray-200 shadow-md'}`}>
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <CardTitle className="text-lg">{segment.segmentName}</CardTitle>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge variant="secondary" className="text-xs">
                                        <Users className="w-3 h-3 mr-1" />
                                        {segment.estimatedRecipients.toLocaleString()}
                                      </Badge>
                                      <Badge className="bg-green-500 text-white text-xs">
                                        AI: {segment.aiScore?.toFixed(0) || 92}%
                                      </Badge>
                                    </div>
                                  </div>
                                  {isActive && (
                                    <Badge className="bg-blue-600 text-white">Active</Badge>
                                  )}
                                </div>
                              </CardHeader>
                              <CardContent>
                                {/* Email Preview */}
                                <div className="border rounded-lg p-4 bg-white mb-4">
                                  <div className="text-xs text-gray-500 mb-3 pb-2 border-b">
                                    <div>From: publisher@example.com</div>
                                    <div className="font-semibold">Subject: {segment.subjectLine}</div>
                                  </div>
                                  
                                  <div 
                                    className="text-sm text-gray-800 space-y-2 max-h-32 overflow-y-auto"
                                    dangerouslySetInnerHTML={{
                                      __html: renderMarkdownContent(segment.content)
                                    }}
                                  />
                                </div>

                                {/* Segment Info */}
                                <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded">
                                  <div className="font-medium mb-1">Target Criteria:</div>
                                  <div>{segment.segmentCriteria}</div>
                                </div>

                                {/* Action Button */}
                                {isActive && (
                                  <div className="flex items-center justify-between mt-4 pt-3 border-t">
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        id={segment.id}
                                        checked={selectedSegments.includes(segment.id)}
                                        onChange={(e) => {
                                          const checked = e.target.checked;
                                          if (checked) {
                                            setSelectedSegments([...selectedSegments, segment.id]);
                                          } else {
                                            setSelectedSegments(selectedSegments.filter(id => id !== segment.id));
                                          }
                                        }}
                                        className="w-4 h-4"
                                      />
                                      <label htmlFor={segment.id} className="text-sm cursor-pointer">
                                        Select for sending
                                      </label>
                                    </div>
                                    
                                    <Button size="sm" variant="outline">
                                      <Eye className="w-4 h-4 mr-1" />
                                      Edit Variation
                                    </Button>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          </div>
                        );
                      })}
                    </div>

                    {/* Stack Navigation Controls */}
                    <div className="flex items-center justify-between pt-4">
                      <div className="flex items-center gap-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentVariationIndex(Math.max(0, currentVariationIndex - 1))}
                          disabled={currentVariationIndex === 0}
                        >
                          <ArrowLeft className="w-4 h-4 mr-1" />
                          Previous
                        </Button>
                        
                        <div className="text-sm text-gray-600 px-4">
                          {segments[currentVariationIndex]?.segmentName}
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentVariationIndex(Math.min(segments.length - 1, currentVariationIndex + 1))}
                          disabled={currentVariationIndex === segments.length - 1}
                        >
                          Next
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>

                      {/* Selection Summary */}
                      <div className="text-sm text-gray-600">
                        {selectedSegments.length > 0 ? (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                            {selectedSegments.length} segment{selectedSegments.length !== 1 ? 's' : ''} selected
                          </span>
                        ) : (
                          <span className="text-gray-500">No segments selected</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default AssignmentCopywriterFlow;

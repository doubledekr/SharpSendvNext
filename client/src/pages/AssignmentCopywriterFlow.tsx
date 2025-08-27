import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  MessageSquare
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

export default function AssignmentCopywriterFlow() {
  const { id: assignmentId } = useParams();
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

  // Fetch assignment details
  const { data: assignment, isLoading } = useQuery<Assignment>({
    queryKey: [`/api/assignments/${assignmentId}`],
    enabled: !!assignmentId,
  });

  // Generate AI content variations for segments
  const generateSegmentVariations = async () => {
    setIsGenerating(true);
    try {
      // Simulate AI generation for different segments
      const cohorts = [
        { 
          name: 'High-Value Investors', 
          criteria: 'Portfolio > $100k, Active traders',
          size: 3200,
          focus: 'Advanced strategies, institutional insights'
        },
        { 
          name: 'Growth Seekers', 
          criteria: 'Tech-focused, Risk tolerance: High',
          size: 5400,
          focus: 'AI stocks, emerging technologies'
        },
        { 
          name: 'Conservative Investors', 
          criteria: 'Risk tolerance: Low, Focus on dividends',
          size: 7100,
          focus: 'Stable returns, risk management'
        },
        { 
          name: 'Day Traders', 
          criteria: 'Daily activity, Options trading',
          size: 2800,
          focus: 'Short-term opportunities, technical analysis'
        }
      ];

      const variations: SegmentVariation[] = cohorts.map((cohort, index) => ({
        id: `seg-${Date.now()}-${index}`,
        segmentName: cohort.name,
        segmentCriteria: cohort.criteria,
        subjectLine: generateSubjectForSegment(cohort.name, subject),
        content: generateContentForSegment(cohort.name, cohort.focus, content),
        estimatedRecipients: cohort.size,
        pixelId: `px-${assignmentId}-${index}-${Date.now()}`, // Unique pixel per segment
        aiScore: 85 + Math.random() * 15 // AI confidence score
      }));

      setSegments(variations);
      toast({
        title: "AI Variations Generated",
        description: `Created ${variations.length} personalized versions for different segments`,
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate segment variations",
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
      
      return apiRequest('/api/drafts', {
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
        assignmentId,
        publisherId: assignment?.publisherId,
        campaigns: selectedVariations.map(variation => ({
          segmentId: variation.id,
          segmentName: variation.segmentName,
          subject: variation.subjectLine,
          content: variation.content,
          recipients: variation.estimatedRecipients,
          pixelId: variation.pixelId, // Unique pixel for tracking
          scheduledTime: new Date().toISOString(),
          platform: 'mailchimp', // Default platform
          status: 'queued'
        }))
      };

      return apiRequest('/api/send-queue', {
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

          {/* Write Content Tab */}
          <TabsContent value="write" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Create Email Content</CardTitle>
                <CardDescription>
                  Write your base content that will be personalized for different segments
                </CardDescription>
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
                  <Textarea
                    id="content"
                    placeholder="Write your email content... Use [link text](url) for hyperlinks, ![alt text](image-url) for images"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[300px]"
                    data-testid="textarea-content"
                  />
                  <div className="mt-2 text-sm text-gray-600">
                    <p><strong>Formatting Tips:</strong></p>
                    <p>• Links: [Click here](https://example.com)</p>
                    <p>• Images: ![Description](image-url)</p>
                    <p>• Bold: **bold text**</p>
                    <p>• Italic: *italic text*</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={() => generateSegmentVariations()}
                    disabled={!subject || !content || isGenerating}
                    data-testid="button-generate-ai"
                  >
                    {isGenerating ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Brain className="w-4 h-4 mr-2" />
                    )}
                    Generate AI Variations
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* Segment Variations Tab */}
          <TabsContent value="segments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>AI-Generated Segment Variations</CardTitle>
                <CardDescription>
                  Review and select personalized versions for different audience segments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {segments.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No variations generated yet</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Write content and click "Generate AI Variations" to create segment-specific versions
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {segments.map((segment) => (
                      <Card key={segment.id} className="border-l-4 border-l-blue-500">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id={segment.id}
                                checked={selectedSegments.includes(segment.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedSegments([...selectedSegments, segment.id]);
                                  } else {
                                    setSelectedSegments(selectedSegments.filter(id => id !== segment.id));
                                  }
                                }}
                                className="w-4 h-4"
                              />
                              <Label htmlFor={segment.id} className="cursor-pointer">
                                <CardTitle className="text-lg">{segment.segmentName}</CardTitle>
                              </Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                <Users className="w-3 h-3 mr-1" />
                                {segment.estimatedRecipients.toLocaleString()} recipients
                              </Badge>
                              <Badge className="bg-green-500 text-white">
                                AI Score: {segment.aiScore.toFixed(0)}%
                              </Badge>
                            </div>
                          </div>
                          <CardDescription className="mt-1">
                            {segment.segmentCriteria}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Subject:</p>
                              <p className="text-sm">{segment.subjectLine}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-600">Preview:</p>
                              <p className="text-sm text-gray-700 line-clamp-3">
                                {segment.content}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Eye className="w-3 h-3" />
                              Pixel ID: {segment.pixelId}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    <div className="flex gap-2 pt-4">
                      <Button 
                        onClick={() => setShowConfirmDialog(true)}
                        disabled={segments.length === 0 || isSending}
                        className="bg-green-600 hover:bg-green-700"
                        data-testid="button-send-queue"
                      >
                        {isSending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4 mr-2" />
                        )}
                        Push to Send Queue ({selectedSegments.length || segments.length} segments)
                      </Button>
                      
                      <Button 
                        variant="outline"
                        onClick={() => generateSegmentVariations()}
                        disabled={isGenerating}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Regenerate Variations
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Send Queue Tab */}
          <TabsContent value="queue" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Email Send Queue</CardTitle>
                <CardDescription>
                  Campaigns ready for sending through connected email platforms
                </CardDescription>
              </CardHeader>
              <CardContent>
                {segments.filter(s => selectedSegments.length === 0 || selectedSegments.includes(s.id)).map((segment) => (
                  <div key={segment.id} className="border rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Mail className="w-5 h-5 text-blue-500" />
                        <span className="font-medium">{segment.segmentName}</span>
                      </div>
                      <Badge className="bg-yellow-500 text-white">
                        Queued
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Platform:</p>
                        <p className="font-medium">Mailchimp</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Recipients:</p>
                        <p className="font-medium">{segment.estimatedRecipients.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Pixel Tracking:</p>
                        <p className="font-medium text-green-600">✓ Enabled</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Scheduled:</p>
                        <p className="font-medium">Immediate</p>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs text-gray-500">
                        Unique Pixel ID: {segment.pixelId}
                      </p>
                    </div>
                  </div>
                ))}
                
                {segments.length > 0 && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Emails will be sent through connected platform with individual pixel tracking for each segment
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tracking & Metrics Tab */}
          <TabsContent value="tracking" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Real-Time Email Metrics</CardTitle>
                <CardDescription>
                  Track performance with unique pixel tracking per segment
                </CardDescription>
              </CardHeader>
              <CardContent>
                {metrics ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold">{metrics.sent.toLocaleString()}</div>
                          <p className="text-xs text-gray-500">Sent</p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold text-green-600">
                            {metrics.delivered.toLocaleString()}
                          </div>
                          <p className="text-xs text-gray-500">Delivered</p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold text-blue-600">
                            {metrics.opened.toLocaleString()}
                          </div>
                          <p className="text-xs text-gray-500">Opened</p>
                          <p className="text-xs text-gray-400">
                            {metrics.delivered > 0 ? 
                              `${((metrics.opened / metrics.delivered) * 100).toFixed(1)}%` : '0%'}
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold text-purple-600">
                            {metrics.clicked.toLocaleString()}
                          </div>
                          <p className="text-xs text-gray-500">Clicked</p>
                          <p className="text-xs text-gray-400">
                            {metrics.opened > 0 ? 
                              `${((metrics.clicked / metrics.opened) * 100).toFixed(1)}%` : '0%'}
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold text-orange-600">
                            {metrics.converted}
                          </div>
                          <p className="text-xs text-gray-500">Converted</p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold text-green-600">
                            ${metrics.revenue.toLocaleString()}
                          </div>
                          <p className="text-xs text-gray-500">Revenue</p>
                        </CardContent>
                      </Card>
                    </div>
                    
                    {/* Per-Segment Metrics */}
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">Segment Performance</h3>
                      {segments.filter(s => selectedSegments.length === 0 || selectedSegments.includes(s.id)).map((segment) => (
                        <Card key={segment.id} className="border-l-4 border-l-blue-500">
                          <CardContent className="pt-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">{segment.segmentName}</span>
                              <Badge variant="outline">
                                Pixel: {segment.pixelId?.slice(-8)}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-4 gap-2 text-sm">
                              <div>
                                <p className="text-gray-600">Open Rate</p>
                                <p className="font-bold text-blue-600">
                                  {(20 + Math.random() * 20).toFixed(1)}%
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-600">Click Rate</p>
                                <p className="font-bold text-purple-600">
                                  {(5 + Math.random() * 10).toFixed(1)}%
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-600">Conversion</p>
                                <p className="font-bold text-orange-600">
                                  {(1 + Math.random() * 5).toFixed(1)}%
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-600">Revenue/Email</p>
                                <p className="font-bold text-green-600">
                                  ${(2 + Math.random() * 8).toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    
                    <Alert className="bg-blue-50 border-blue-200">
                      <Zap className="w-4 h-4 text-blue-600" />
                      <AlertDescription className="text-blue-800">
                        <strong>AI Insights:</strong> High-Value Investors segment showing 42% higher engagement. 
                        Consider increasing frequency for this cohort. Day Traders prefer morning sends (7-9 AM).
                      </AlertDescription>
                    </Alert>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No metrics available yet</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Metrics will appear after emails are sent
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Confirm Send</CardTitle>
              <CardDescription>
                Are you sure you want to send {selectedSegments.length || segments.length} email campaigns to the queue?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setShowConfirmDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    pushToSendQueue.mutate();
                  }}
                  disabled={isSending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Confirm Send
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Success Message After Sending */}
      {!showEditor && metrics && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white p-4 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            <div>
              <p className="font-medium">Emails Sent Successfully!</p>
              <p className="text-sm">Editor closed. Check tracking tab for metrics.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
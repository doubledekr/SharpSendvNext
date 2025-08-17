import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Send,
  Eye,
  Brain,
  Sparkles,
  TrendingUp,
  Target,
  Calendar,
  User,
  MessageSquare,
  Lightbulb
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  type: 'newsletter' | 'campaign' | 'editorial' | 'market_alert';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'assigned' | 'in_progress' | 'review' | 'completed';
  dueDate: string;
  description: string;
  targetAudience: string;
  estimatedReach: number;
  assignedBy: string;
  marketContext?: string[];
  aiSuggestions?: string[];
}

interface ContentDraft {
  id: string;
  taskId: string;
  subject: string;
  content: string;
  personalizationMarkers: string[];
  aiOptimizations: {
    subjectVariations: string[];
    contentSuggestions: string[];
    sentimentScore: number;
    readabilityScore: number;
  };
}

import MainLayout from '@/components/layout/MainLayout';

export default function CopywriterPortal() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [contentDraft, setContentDraft] = useState<ContentDraft | null>(null);
  const [isWriting, setIsWriting] = useState(false);

  // Load demo data
  useEffect(() => {
    loadDemoData();
  }, []);

  const loadDemoData = () => {
    const demoTasks: Task[] = [
      {
        id: '1',
        title: 'Weekly Market Outlook - Tech Sector Focus',
        type: 'newsletter',
        priority: 'high',
        status: 'in_progress',
        dueDate: '2025-08-18',
        description: 'Weekly newsletter focusing on tech sector performance, upcoming earnings, and AI investment opportunities. Target growth-focused investors with emphasis on risk management.',
        targetAudience: 'Tech-focused investors, Growth portfolio subscribers',
        estimatedReach: 15420,
        assignedBy: 'Jennifer Martinez',
        marketContext: [
          'NVDA earnings beat expectations (+8.2%)',
          'AI sector showing momentum with 15% weekly gains',
          'Tech volatility index down 12% from monthly highs',
          'Fed dovish stance supporting growth stocks'
        ],
        aiSuggestions: [
          'Include NVIDIA earnings impact analysis',
          'Mention AI infrastructure investment opportunities',
          'Address recent tech volatility concerns',
          'Highlight defensive tech positions'
        ]
      },
      {
        id: '2',
        title: 'Fed Rate Decision Impact Analysis',
        type: 'market_alert',
        priority: 'urgent',
        status: 'assigned',
        dueDate: '2025-08-16',
        description: 'Immediate analysis of Fed rate decision impact on various asset classes and portfolio recommendations. Needs to be sent within 2 hours of Fed announcement.',
        targetAudience: 'All active subscribers',
        estimatedReach: 28750,
        assignedBy: 'Jennifer Martinez',
        marketContext: [
          'Fed held rates steady at 5.25-5.50%',
          'Powell signals potential cuts in Q4',
          'Market rallied 2.1% on dovish tone',
          'Dollar weakened against major currencies'
        ]
      },
      {
        id: '3',
        title: 'Q3 Earnings Season Prep Guide',
        type: 'editorial',
        priority: 'medium',
        status: 'assigned',
        dueDate: '2025-08-20',
        description: 'Comprehensive guide for Q3 earnings season with key dates, expectations, and trading strategies.',
        targetAudience: 'Active traders, Earnings-focused subscribers',
        estimatedReach: 12300,
        assignedBy: 'Jennifer Martinez'
      }
    ];

    setTasks(demoTasks);
  };

  const startWriting = (task: Task) => {
    setSelectedTask(task);
    setIsWriting(true);
    
    // Initialize content draft
    const draft: ContentDraft = {
      id: Date.now().toString(),
      taskId: task.id,
      subject: '',
      content: '',
      personalizationMarkers: [],
      aiOptimizations: {
        subjectVariations: [],
        contentSuggestions: [],
        sentimentScore: 0,
        readabilityScore: 0
      }
    };
    setContentDraft(draft);
  };

  const generateAIOptimizations = async () => {
    if (!contentDraft) return;

    // Simulate AI processing
    const optimizations = {
      subjectVariations: [
        '🚀 Tech Sector Surge: Your Weekly AI Investment Guide',
        'BREAKING: NVIDIA Earnings Spark Tech Rally - What\'s Next?',
        'Weekly Tech Outlook: AI Revolution Drives Growth Opportunities',
        'Tech Sector Alert: Post-Earnings Analysis & Investment Plays'
      ],
      contentSuggestions: [
        'Add specific NVIDIA earnings metrics for credibility',
        'Include risk management section for conservative investors',
        'Mention specific AI infrastructure stocks to watch',
        'Add technical analysis charts for visual appeal'
      ],
      sentimentScore: 0.75, // Positive sentiment
      readabilityScore: 82 // Good readability
    };

    setContentDraft({
      ...contentDraft,
      aiOptimizations: optimizations
    });
  };

  const submitForReview = () => {
    if (!selectedTask) return;

    // Update task status
    setTasks(prev => prev.map(task => 
      task.id === selectedTask.id 
        ? { ...task, status: 'review' as const }
        : task
    ));

    setIsWriting(false);
    setSelectedTask(null);
    setContentDraft(null);
    
    alert('Content submitted for review! The editorial team will review and process with AI personalization.');
  };

  const getStatusColor = (status: string) => {
    const colors = {
      assigned: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      review: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (isWriting && selectedTask && contentDraft) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{selectedTask.title}</h1>
                <p className="text-gray-600">Due: {selectedTask.dueDate} | Reach: {selectedTask.estimatedReach.toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsWriting(false)}>
                  Back to Tasks
                </Button>
                <Button onClick={submitForReview}>
                  <Send className="h-4 w-4 mr-2" />
                  Submit for Review
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Content Editor */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Content Creation</CardTitle>
                  <CardDescription>Write your content with AI-powered suggestions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="subject">Subject Line</Label>
                    <Input
                      id="subject"
                      value={contentDraft.subject}
                      onChange={(e) => setContentDraft({...contentDraft, subject: e.target.value})}
                      placeholder="Enter compelling subject line..."
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="content">Email Content</Label>
                    <Textarea
                      id="content"
                      value={contentDraft.content}
                      onChange={(e) => setContentDraft({...contentDraft, content: e.target.value})}
                      placeholder="Write your email content here..."
                      rows={15}
                      className="font-mono"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={generateAIOptimizations} variant="outline">
                      <Brain className="h-4 w-4 mr-2" />
                      Get AI Suggestions
                    </Button>
                    <Button variant="outline">
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* AI Optimizations */}
              {contentDraft.aiOptimizations.subjectVariations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      AI-Generated Optimizations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Subject Line Variations</h4>
                      <div className="space-y-2">
                        {contentDraft.aiOptimizations.subjectVariations.map((subject, index) => (
                          <div key={index} className="p-3 border rounded-lg bg-blue-50 hover:bg-blue-100 cursor-pointer"
                               onClick={() => setContentDraft({...contentDraft, subject})}>
                            {subject}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Content Suggestions</h4>
                      <div className="space-y-2">
                        {contentDraft.aiOptimizations.contentSuggestions.map((suggestion, index) => (
                          <div key={index} className="flex items-start gap-2 p-3 border rounded-lg bg-green-50">
                            <Lightbulb className="h-4 w-4 text-green-600 mt-0.5" />
                            <span className="text-sm">{suggestion}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 border rounded-lg text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {Math.round(contentDraft.aiOptimizations.sentimentScore * 100)}%
                        </div>
                        <div className="text-sm text-gray-600">Sentiment Score</div>
                      </div>
                      <div className="p-3 border rounded-lg text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {contentDraft.aiOptimizations.readabilityScore}
                        </div>
                        <div className="text-sm text-gray-600">Readability Score</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Task Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Task Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Type:</span>
                    <Badge className="ml-2">{selectedTask.type}</Badge>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Priority:</span>
                    <Badge className={`ml-2 ${getPriorityColor(selectedTask.priority)}`}>
                      {selectedTask.priority}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Target Audience:</span>
                    <p className="text-sm mt-1">{selectedTask.targetAudience}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Description:</span>
                    <p className="text-sm mt-1">{selectedTask.description}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Market Context */}
              {selectedTask.marketContext && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Market Context
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedTask.marketContext.map((context, index) => (
                        <div key={index} className="p-2 bg-blue-50 rounded text-sm">
                          {context}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* AI Suggestions */}
              {selectedTask.aiSuggestions && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      AI Suggestions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedTask.aiSuggestions.map((suggestion, index) => (
                        <div key={index} className="flex items-start gap-2 p-2 bg-green-50 rounded text-sm">
                          <Lightbulb className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          {suggestion}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <MainLayout currentPage="copywriter">
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Copywriter Portal</h1>
            <p className="text-gray-600">Manage your assigned content tasks and create compelling copy</p>
          </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Assigned Tasks</p>
                  <p className="text-2xl font-bold text-gray-900">3</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-gray-900">1</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">12</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                  <p className="text-2xl font-bold text-gray-900">4.8</p>
                </div>
                <Target className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tasks List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Tasks</CardTitle>
            <CardDescription>Content assignments from the editorial team</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tasks.map((task) => (
                <div key={task.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{task.title}</h3>
                        <Badge className={getStatusColor(task.status)}>
                          {task.status.replace('_', ' ')}
                        </Badge>
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-3">{task.description}</p>
                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Due: {task.dueDate}
                        </span>
                        <span className="flex items-center gap-1">
                          <Target className="h-4 w-4" />
                          Reach: {task.estimatedReach.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          From: {task.assignedBy}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      {task.status === 'assigned' && (
                        <Button onClick={() => startWriting(task)}>
                          <FileText className="h-4 w-4 mr-1" />
                          Start Writing
                        </Button>
                      )}
                      {task.status === 'in_progress' && (
                        <Button onClick={() => startWriting(task)} variant="outline">
                          <FileText className="h-4 w-4 mr-1" />
                          Continue
                        </Button>
                      )}
                      {task.status === 'review' && (
                        <Badge className="bg-purple-100 text-purple-800">
                          Under Review
                        </Badge>
                      )}
                      {task.status === 'completed' && (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Completed
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </MainLayout>
  );
}


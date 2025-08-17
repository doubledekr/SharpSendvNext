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
import MainLayout from '@/components/layout/MainLayout';
import { 
  PlusCircle, 
  FileText, 
  Clock, 
  Users, 
  TrendingUp, 
  Eye, 
  Send, 
  CheckCircle,
  AlertCircle,
  Calendar,
  Target,
  Brain,
  Zap
} from 'lucide-react';

interface ContentRequest {
  id: string;
  title: string;
  type: 'newsletter' | 'campaign' | 'editorial' | 'market_alert';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'draft' | 'assigned' | 'in_progress' | 'review' | 'approved' | 'scheduled' | 'sent';
  assignedTo?: string;
  dueDate: string;
  description: string;
  targetAudience: string;
  estimatedReach: number;
  createdAt: string;
  marketTriggers?: string[];
}

interface CohortPreview {
  id: string;
  name: string;
  size: number;
  characteristics: string[];
  personalizedSubject: string;
  personalizedContent: string;
  engagementPrediction: number;
}

export default function EditorialDashboard() {

  const [contentRequests, setContentRequests] = useState<ContentRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ContentRequest | null>(null);
  const [cohortPreviews, setCohortPreviews] = useState<CohortPreview[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newRequest, setNewRequest] = useState({
    title: '',
    type: 'newsletter' as const,
    priority: 'medium' as const,
    description: '',
    targetAudience: '',
    dueDate: '',
    marketTriggers: [] as string[]
  });

  // Load demo data
  useEffect(() => {
    loadDemoData();
  }, []);

  const loadDemoData = () => {
    const demoRequests: ContentRequest[] = [
      {
        id: '1',
        title: 'Weekly Market Outlook - Tech Sector Focus',
        type: 'newsletter',
        priority: 'high',
        status: 'review',
        assignedTo: 'Sarah Chen',
        dueDate: '2025-08-18',
        description: 'Weekly newsletter focusing on tech sector performance, upcoming earnings, and AI investment opportunities.',
        targetAudience: 'Tech-focused investors, Growth portfolio subscribers',
        estimatedReach: 15420,
        createdAt: '2025-08-15',
        marketTriggers: ['NVDA earnings', 'AI sector momentum', 'Tech volatility']
      },
      {
        id: '2',
        title: 'Fed Rate Decision Impact Analysis',
        type: 'market_alert',
        priority: 'urgent',
        status: 'approved',
        assignedTo: 'Mike Rodriguez',
        dueDate: '2025-08-16',
        description: 'Immediate analysis of Fed rate decision impact on various asset classes and portfolio recommendations.',
        targetAudience: 'All active subscribers',
        estimatedReach: 28750,
        createdAt: '2025-08-16',
        marketTriggers: ['Fed announcement', 'Rate decision', 'Market volatility']
      },
      {
        id: '3',
        title: 'Q3 Earnings Season Prep Guide',
        type: 'editorial',
        priority: 'medium',
        status: 'in_progress',
        assignedTo: 'Sarah Chen',
        dueDate: '2025-08-20',
        description: 'Comprehensive guide for Q3 earnings season with key dates, expectations, and trading strategies.',
        targetAudience: 'Active traders, Earnings-focused subscribers',
        estimatedReach: 12300,
        createdAt: '2025-08-14'
      },
      {
        id: '4',
        title: 'New Subscriber Welcome Series - Part 3',
        type: 'campaign',
        priority: 'low',
        status: 'draft',
        dueDate: '2025-08-22',
        description: 'Third email in welcome series focusing on portfolio diversification strategies.',
        targetAudience: 'New subscribers (0-30 days)',
        estimatedReach: 890,
        createdAt: '2025-08-16'
      }
    ];

    const demoCohorts: CohortPreview[] = [
      {
        id: 'conservative_investors',
        name: 'Conservative Investors',
        size: 8420,
        characteristics: ['Low risk tolerance', 'Income focused', 'Age 45+', 'Dividend preference'],
        personalizedSubject: '🛡️ Defensive Strategies for Market Uncertainty',
        personalizedContent: 'Focus on dividend aristocrats and defensive positioning...',
        engagementPrediction: 78
      },
      {
        id: 'growth_seekers',
        name: 'Growth Seekers',
        size: 12300,
        characteristics: ['High risk tolerance', 'Growth focused', 'Age 25-40', 'Tech heavy'],
        personalizedSubject: '🚀 High-Growth Opportunities in AI Revolution',
        personalizedContent: 'Emerging AI companies showing exceptional growth potential...',
        engagementPrediction: 85
      },
      {
        id: 'day_traders',
        name: 'Active Traders',
        size: 4850,
        characteristics: ['Very active', 'Short-term focus', 'High volume', 'Options trading'],
        personalizedSubject: '⚡ Today\'s High-Probability Setups',
        personalizedContent: 'Technical analysis reveals these immediate opportunities...',
        engagementPrediction: 92
      },
      {
        id: 'crypto_enthusiasts',
        name: 'Crypto Enthusiasts',
        size: 6200,
        characteristics: ['Crypto focused', 'High risk', 'Tech savvy', 'DeFi interest'],
        personalizedSubject: '₿ Bitcoin ETF Impact on Alt Season',
        personalizedContent: 'How institutional adoption is reshaping crypto markets...',
        engagementPrediction: 88
      }
    ];

    setContentRequests(demoRequests);
    setCohortPreviews(demoCohorts);
  };

  const createContentRequest = () => {
    const request: ContentRequest = {
      id: Date.now().toString(),
      ...newRequest,
      status: 'draft',
      estimatedReach: Math.floor(Math.random() * 20000) + 5000,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setContentRequests([request, ...contentRequests]);
    setIsCreateDialogOpen(false);
    setNewRequest({
      title: '',
      type: 'newsletter',
      priority: 'medium',
      description: '',
      targetAudience: '',
      dueDate: '',
      marketTriggers: []
    });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      assigned: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      review: 'bg-purple-100 text-purple-800',
      approved: 'bg-green-100 text-green-800',
      scheduled: 'bg-indigo-100 text-indigo-800',
      sent: 'bg-emerald-100 text-emerald-800'
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

  const processWithAI = async (requestId: string) => {
    // Simulate AI processing
    setContentRequests(prev => prev.map(req => 
      req.id === requestId 
        ? { ...req, status: 'approved' as const }
        : req
    ));
    
    // Show success message or update UI
    alert('Content processed with AI personalization and approved for sending!');
  };

  return (
    <MainLayout currentPage="editorial">
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Editorial Dashboard</h1>
          <p className="text-gray-600">Manage content requests, review AI-personalized content, and track campaign performance</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Requests</p>
                  <p className="text-2xl font-bold text-gray-900">12</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Review</p>
                  <p className="text-2xl font-bold text-gray-900">3</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Reach</p>
                  <p className="text-2xl font-bold text-gray-900">57.3K</p>
                </div>
                <Users className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Engagement</p>
                  <p className="text-2xl font-bold text-gray-900">84%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="requests" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="requests">Content Requests</TabsTrigger>
            <TabsTrigger value="review">Review & Approve</TabsTrigger>
            <TabsTrigger value="cohorts">Cohort Previews</TabsTrigger>
            <TabsTrigger value="analytics">Performance</TabsTrigger>
          </TabsList>

          {/* Content Requests Tab */}
          <TabsContent value="requests" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Content Requests</h2>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    New Request
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create Content Request</DialogTitle>
                    <DialogDescription>
                      Create a new content request for your copywriting team
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="title">Title</Label>
                        <Input
                          id="title"
                          value={newRequest.title}
                          onChange={(e) => setNewRequest({...newRequest, title: e.target.value})}
                          placeholder="Content title"
                        />
                      </div>
                      <div>
                        <Label htmlFor="type">Type</Label>
                        <Select value={newRequest.type} onValueChange={(value: any) => setNewRequest({...newRequest, type: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="newsletter">Newsletter</SelectItem>
                            <SelectItem value="campaign">Campaign</SelectItem>
                            <SelectItem value="editorial">Editorial</SelectItem>
                            <SelectItem value="market_alert">Market Alert</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="priority">Priority</Label>
                        <Select value={newRequest.priority} onValueChange={(value: any) => setNewRequest({...newRequest, priority: value})}>
                          <SelectTrigger>
                            <SelectValue />
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
                          value={newRequest.dueDate}
                          onChange={(e) => setNewRequest({...newRequest, dueDate: e.target.value})}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newRequest.description}
                        onChange={(e) => setNewRequest({...newRequest, description: e.target.value})}
                        placeholder="Detailed description of the content request"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="targetAudience">Target Audience</Label>
                      <Input
                        id="targetAudience"
                        value={newRequest.targetAudience}
                        onChange={(e) => setNewRequest({...newRequest, targetAudience: e.target.value})}
                        placeholder="e.g., Growth investors, Day traders, New subscribers"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={createContentRequest}>
                      Create Request
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {contentRequests.map((request) => (
                <Card key={request.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{request.title}</h3>
                          <Badge className={getStatusColor(request.status)}>
                            {request.status.replace('_', ' ')}
                          </Badge>
                          <Badge className={getPriorityColor(request.priority)}>
                            {request.priority}
                          </Badge>
                        </div>
                        <p className="text-gray-600 mb-3">{request.description}</p>
                        <div className="flex items-center gap-6 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Due: {request.dueDate}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            Reach: {request.estimatedReach.toLocaleString()}
                          </span>
                          {request.assignedTo && (
                            <span className="flex items-center gap-1">
                              <Target className="h-4 w-4" />
                              Assigned: {request.assignedTo}
                            </span>
                          )}
                        </div>
                        {request.marketTriggers && request.marketTriggers.length > 0 && (
                          <div className="mt-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm text-gray-500">Market Triggers:</span>
                              {request.marketTriggers.map((trigger, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {trigger}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {request.status === 'review' && (
                          <Button size="sm" onClick={() => processWithAI(request.id)}>
                            <Brain className="h-4 w-4 mr-1" />
                            Process with AI
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Review & Approve Tab */}
          <TabsContent value="review" className="space-y-6">
            <h2 className="text-xl font-semibold">Content Review & Approval</h2>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI-Processed Content Ready for Review
                </CardTitle>
                <CardDescription>
                  Content has been processed with GPT-4 personalization and is ready for final approval
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg bg-blue-50">
                    <h4 className="font-semibold mb-2">Fed Rate Decision Impact Analysis</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      AI has generated 4 personalized versions for different subscriber cohorts with optimized subject lines and content.
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        Preview Versions
                      </Button>
                      <Button size="sm">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve & Schedule
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cohort Previews Tab */}
          <TabsContent value="cohorts" className="space-y-6">
            <h2 className="text-xl font-semibold">Personalized Cohort Previews</h2>
            
            <div className="grid gap-6">
              {cohortPreviews.map((cohort) => (
                <Card key={cohort.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          {cohort.name}
                        </CardTitle>
                        <CardDescription>
                          {cohort.size.toLocaleString()} subscribers
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Engagement Prediction</div>
                        <div className="text-2xl font-bold text-green-600">{cohort.engagementPrediction}%</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Cohort Characteristics</h4>
                        <div className="flex gap-2 flex-wrap">
                          {cohort.characteristics.map((char, index) => (
                            <Badge key={index} variant="outline">
                              {char}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-2">Personalized Subject Line</h4>
                        <div className="p-3 bg-gray-50 rounded border">
                          {cohort.personalizedSubject}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-2">Content Preview</h4>
                        <div className="p-3 bg-gray-50 rounded border">
                          {cohort.personalizedContent}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Full Preview
                        </Button>
                        <Button size="sm">
                          <Send className="h-4 w-4 mr-1" />
                          Send to Cohort
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <h2 className="text-xl font-semibold">Performance Analytics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Open Rates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600 mb-2">84.2%</div>
                  <div className="text-sm text-gray-500">+12% vs last month</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Click Rates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600 mb-2">23.7%</div>
                  <div className="text-sm text-gray-500">+8% vs last month</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Conversion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600 mb-2">5.8%</div>
                  <div className="text-sm text-gray-500">+15% vs last month</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  AI Insights & Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg bg-green-50">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-green-800">High-Performing Subject Line Pattern</h4>
                        <p className="text-sm text-green-700">
                          Subject lines with emojis and urgency indicators show 23% higher open rates for your audience.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg bg-blue-50">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-blue-800">Optimal Send Time Discovery</h4>
                        <p className="text-sm text-blue-700">
                          Tuesday 9:15 AM shows highest engagement for growth-focused subscribers.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg bg-purple-50">
                    <div className="flex items-start gap-3">
                      <Brain className="h-5 w-5 text-purple-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-purple-800">Content Personalization Impact</h4>
                        <p className="text-sm text-purple-700">
                          Personalized content based on risk tolerance increased click rates by 31%.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </MainLayout>
  );
}


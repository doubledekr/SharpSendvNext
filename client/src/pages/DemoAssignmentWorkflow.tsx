import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  FileText, 
  Send,
  Brain,
  Users,
  Eye,
  CheckCircle,
  ArrowRight,
  Loader2,
  Copy,
  ExternalLink,
  Calendar,
  Target,
  BarChart3,
  Mail
} from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';

export default function DemoAssignmentWorkflow() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createdAssignment, setCreatedAssignment] = useState<any>(null);
  const [copywriterLink, setCopywriterLink] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);

  // Create demo assignment
  const createAssignment = useMutation({
    mutationFn: async () => {
      setIsCreating(true);
      
      const assignmentData = {
        title: "Q4 Market Outlook: AI & Tech Sector Focus",
        description: "Create a comprehensive newsletter covering Q4 market outlook with focus on AI and tech sectors. Include analysis of recent earnings, Fed impact, and investment opportunities.",
        priority: "high",
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Due tomorrow
        marketContext: {
          vixLevel: 18.5,
          marketSentiment: "bullish",
          topSectors: ["Technology", "AI", "Healthcare"],
          recentEvents: [
            "NVIDIA earnings beat expectations by 15%",
            "Fed signals potential rate cuts in Q4",
            "AI sector shows 20% growth YTD"
          ]
        }
      };

      const response = await apiRequest('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignmentData)
      });

      return response;
    },
    onSuccess: (data) => {
      setCreatedAssignment(data.assignment);
      setCopywriterLink(data.copywriterLink);
      toast({
        title: "Assignment Created",
        description: "Assignment has been created with unique copywriter link",
      });
      setIsCreating(false);
    },
    onError: () => {
      toast({
        title: "Creation Failed",
        description: "Failed to create assignment",
        variant: "destructive"
      });
      setIsCreating(false);
    }
  });

  // Fetch existing assignments
  const { data: assignments } = useQuery({
    queryKey: ['/api/assignments'],
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Link copied to clipboard",
    });
  };

  const workflowSteps = [
    {
      number: 1,
      title: "Create Assignment",
      description: "Publisher creates assignment with market context",
      icon: FileText,
      status: createdAssignment ? 'completed' : 'active'
    },
    {
      number: 2,
      title: "Copywriter Interface",
      description: "Copywriter opens unique link to write content",
      icon: Brain,
      status: createdAssignment ? 'active' : 'pending'
    },
    {
      number: 3,
      title: "AI Segment Tools",
      description: "Generate personalized variations for cohorts",
      icon: Users,
      status: 'pending'
    },
    {
      number: 4,
      title: "Send Queue",
      description: "Push to queue with unique pixel tracking",
      icon: Send,
      status: 'pending'
    },
    {
      number: 5,
      title: "Email Platform",
      description: "Send via connected platform (Mailchimp, etc)",
      icon: Mail,
      status: 'pending'
    },
    {
      number: 6,
      title: "Track Metrics",
      description: "Monitor with unique pixel per email",
      icon: BarChart3,
      status: 'pending'
    }
  ];

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Assignment Workflow Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Complete end-to-end workflow from assignment creation to email tracking
          </p>
        </div>

        {/* Workflow Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Workflow Steps</CardTitle>
            <CardDescription>
              Each step in the assignment to email delivery process
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
              <div className="space-y-6">
                {workflowSteps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.number} className="relative flex items-start">
                      <div className={`
                        flex items-center justify-center w-16 h-16 rounded-full border-2
                        ${step.status === 'completed' ? 'bg-green-500 border-green-500' : 
                          step.status === 'active' ? 'bg-blue-500 border-blue-500 animate-pulse' : 
                          'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600'}
                      `}>
                        {step.status === 'completed' ? (
                          <CheckCircle className="w-8 h-8 text-white" />
                        ) : (
                          <Icon className={`w-8 h-8 ${
                            step.status === 'active' ? 'text-white' : 'text-gray-500'
                          }`} />
                        )}
                      </div>
                      <div className="ml-6 flex-1">
                        <h3 className={`text-lg font-semibold ${
                          step.status === 'pending' ? 'text-gray-500' : 'text-gray-900 dark:text-white'
                        }`}>
                          Step {step.number}: {step.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                          {step.description}
                        </p>
                        {step.number === 1 && !createdAssignment && (
                          <Button 
                            onClick={() => createAssignment.mutate()}
                            disabled={isCreating}
                            className="mt-3"
                            data-testid="button-create-assignment"
                          >
                            {isCreating ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <FileText className="w-4 h-4 mr-2" />
                            )}
                            Create Demo Assignment
                          </Button>
                        )}
                        {step.number === 2 && copywriterLink && (
                          <div className="mt-3 space-y-2">
                            <div className="flex items-center gap-2">
                              <Button 
                                onClick={() => setLocation(copywriterLink.replace(window.location.origin, ''))}
                                className="bg-blue-600 hover:bg-blue-700"
                                data-testid="button-open-copywriter"
                              >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Open Copywriter Interface
                              </Button>
                              <Button 
                                variant="outline"
                                onClick={() => copyToClipboard(copywriterLink)}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                            <p className="text-xs text-gray-500">
                              {copywriterLink}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Created Assignment Details */}
        {createdAssignment && (
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Created Assignment</CardTitle>
                <Badge className="bg-green-500 text-white">
                  Active
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Title</p>
                <p className="text-lg font-semibold">{createdAssignment.title}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Description</p>
                <p className="text-gray-700 dark:text-gray-300">{createdAssignment.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Priority</p>
                  <Badge variant={createdAssignment.priority === 'high' ? 'destructive' : 'default'}>
                    {createdAssignment.priority}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Due Date</p>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span>{new Date(createdAssignment.dueDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              
              {/* Market Context */}
              {createdAssignment.marketContext && (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Market Context</p>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">VIX Level</span>
                      <Badge variant="outline">{createdAssignment.marketContext.vixLevel}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Sentiment</span>
                      <Badge className="bg-green-500 text-white">
                        {createdAssignment.marketContext.marketSentiment}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-sm">Top Sectors</span>
                      <div className="flex gap-1 mt-1">
                        {createdAssignment.marketContext.topSectors.map((sector: string) => (
                          <Badge key={sector} variant="secondary" className="text-xs">
                            {sector}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <Alert className="bg-blue-50 border-blue-200">
                <Eye className="w-4 h-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Unique Tracking:</strong> Each email sent will have a distinct pixel ID for precise metrics tracking and optimization
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* Recent Assignments */}
        {assignments?.assignments && assignments.assignments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Assignments</CardTitle>
              <CardDescription>
                Previously created assignments in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {assignments.assignments.slice(0, 5).map((assignment: any) => (
                  <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{assignment.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {assignment.status}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          Due: {new Date(assignment.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setLocation(`/assignment-copywriter/${assignment.id}`)}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Key Features */}
        <Card>
          <CardHeader>
            <CardTitle>Key Features</CardTitle>
            <CardDescription>
              What makes this workflow powerful
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Target className="w-5 h-5 text-blue-500 mt-1" />
                <div>
                  <p className="font-medium">Segment-Specific Variations</p>
                  <p className="text-sm text-gray-600">AI generates personalized content for each cohort</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Eye className="w-5 h-5 text-green-500 mt-1" />
                <div>
                  <p className="font-medium">Unique Pixel Tracking</p>
                  <p className="text-sm text-gray-600">Each email has distinct pixel for precise metrics</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Brain className="w-5 h-5 text-purple-500 mt-1" />
                <div>
                  <p className="font-medium">AI-Powered Tools</p>
                  <p className="text-sm text-gray-600">Intelligent assistance for content creation</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <BarChart3 className="w-5 h-5 text-orange-500 mt-1" />
                <div>
                  <p className="font-medium">Real-Time Metrics</p>
                  <p className="text-sm text-gray-600">Track opens, clicks, conversions per segment</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
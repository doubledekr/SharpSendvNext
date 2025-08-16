import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import NavigationHeader from "@/components/dashboard/navigation-header";
import Sidebar from "@/components/dashboard/sidebar";
import {
  BookOpen,
  Code,
  HelpCircle,
  Mail,
  Settings,
  Zap,
  Users,
  ChevronRight,
  Copy,
  Check,
  AlertTriangle,
  Info
} from "lucide-react";

export default function Documentation() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [sidebarTab, setSidebarTab] = useState("overview");

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const apiEndpoints = [
    {
      method: 'POST',
      endpoint: '/api/email-platforms/send',
      description: 'Send email through multi-platform routing',
      body: `{
  "platform": "auto", // or "sendgrid", "mailchimp", "mailgun", "exacttarget"
  "to": ["user@example.com"],
  "subject": "Your Subject",
  "content": "Email content",
  "segment": "day-traders"
}`
    },
    {
      method: 'GET',
      endpoint: '/api/email-platforms/health',
      description: 'Get real-time platform health status',
      response: `[
  {
    "platform": "SendGrid",
    "status": "healthy",
    "uptime": 99.98,
    "latency": 120
  }
]`
    },
    {
      method: 'POST',
      endpoint: '/api/cohorts/analyze',
      description: 'Analyze subscriber cohorts with AI',
      body: `{
  "subscriberId": "user-123",
  "behaviorData": {
    "opens": 45,
    "clicks": 12,
    "topics": ["options", "volatility"]
  }
}`
    }
  ];

  const platformCapabilities = [
    {
      platform: 'SendGrid',
      strengths: ['Reliable confirmation', 'High volume', 'Webhooks'],
      bestFor: 'Transactional emails and high-volume campaigns',
      limits: '100k emails/day'
    },
    {
      platform: 'Mailchimp',
      strengths: ['Groups & Tags', 'Automation', 'Templates'],
      bestFor: 'Segmented campaigns and newsletter automation',
      limits: '10M subscribers'
    },
    {
      platform: 'Mailgun',
      strengths: ['Fastest delivery', 'EU compliance', 'Logs'],
      bestFor: 'Time-sensitive alerts and EU subscribers',
      limits: '1M emails/month'
    },
    {
      platform: 'ExactTarget',
      strengths: ['Complex journeys', 'Enterprise', 'CRM'],
      bestFor: 'Multi-step campaigns and enterprise workflows',
      limits: 'Unlimited'
    }
  ];

  const faqs = [
    {
      question: 'How does multi-platform redundancy work?',
      answer: 'SharpSend automatically routes emails through backup platforms if the primary fails. With 4 platforms configured, we achieve 99.95% uptime guarantee.',
      category: 'Platform'
    },
    {
      question: 'What happens if an email fails to send?',
      answer: 'Failed sends automatically retry through backup platforms. You receive instant notifications and can view detailed logs in the Internal Dashboard.',
      category: 'Reliability'
    },
    {
      question: 'How are segments automatically detected?',
      answer: 'Our AI analyzes subscriber behavior, engagement patterns, and content preferences to automatically categorize users into segments like Day Traders, Long-term Investors, etc.',
      category: 'AI'
    },
    {
      question: 'Can I customize email variations for each segment?',
      answer: 'Yes! Use the AI generator to create variations, or write your own. Each variation can have different subject lines, content, and tone optimized for the segment.',
      category: 'Personalization'
    },
    {
      question: 'How do market triggers work?',
      answer: 'Market triggers monitor real-time financial data (VIX, volume spikes, etc.) and automatically generate email alerts or assignments for your team.',
      category: 'Automation'
    },
    {
      question: 'What is the assignment system?',
      answer: 'When a market event occurs, SharpSend can generate an assignment link for copywriters or use AI to create email variations if staff is unavailable.',
      category: 'Workflow'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-900">
      <NavigationHeader currentPage="documentation" />
      
      <div className="flex">
        <Sidebar activeTab={sidebarTab} onTabChange={setSidebarTab} />
        
        <div className="flex-1 ml-64 px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Documentation & Resources</h1>
          <p className="text-slate-400">Everything you need to master SharpSend's capabilities</p>
        </div>

        <Tabs defaultValue="quickstart" className="space-y-6">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="quickstart">
              <BookOpen className="mr-2 h-4 w-4" />
              Quick Start
            </TabsTrigger>
            <TabsTrigger value="api">
              <Code className="mr-2 h-4 w-4" />
              API Reference
            </TabsTrigger>
            <TabsTrigger value="platforms">
              <Mail className="mr-2 h-4 w-4" />
              Platform Guide
            </TabsTrigger>
            <TabsTrigger value="faq">
              <HelpCircle className="mr-2 h-4 w-4" />
              FAQ
            </TabsTrigger>
          </TabsList>

          {/* Quick Start Guide */}
          <TabsContent value="quickstart">
            <div className="space-y-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Getting Started with SharpSend</CardTitle>
                  <CardDescription>Set up your platform in 5 minutes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">1</div>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold mb-2">Configure Email Platforms</h3>
                        <p className="text-slate-400 text-sm mb-2">Navigate to Email Integration → Platform Status and add your API keys for each platform.</p>
                        <Alert className="bg-slate-700 border-slate-600">
                          <Info className="h-4 w-4" />
                          <AlertDescription className="text-slate-300">
                            We recommend configuring at least 2 platforms for redundancy
                          </AlertDescription>
                        </Alert>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">2</div>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold mb-2">Import Subscribers</h3>
                        <p className="text-slate-400 text-sm mb-2">Go to Subscribers tab and import your list. Our AI will automatically detect segments.</p>
                        <div className="bg-slate-700 rounded p-3">
                          <p className="text-xs text-slate-400 mb-1">Supported formats:</p>
                          <div className="flex gap-2">
                            <Badge variant="secondary">CSV</Badge>
                            <Badge variant="secondary">Excel</Badge>
                            <Badge variant="secondary">API Import</Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">3</div>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold mb-2">Set Up Triggers</h3>
                        <p className="text-slate-400 text-sm mb-2">Configure market triggers in Internal System → Event Triggers to automate campaigns.</p>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div className="bg-slate-700 rounded p-2">
                            <Zap className="h-4 w-4 text-yellow-400 mb-1" />
                            <p className="text-xs text-slate-300">Market Events</p>
                          </div>
                          <div className="bg-slate-700 rounded p-2">
                            <Users className="h-4 w-4 text-blue-400 mb-1" />
                            <p className="text-xs text-slate-300">Behavior Triggers</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">4</div>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold mb-2">Create Your First Campaign</h3>
                        <p className="text-slate-400 text-sm mb-2">Use AI to generate personalized variations for each segment.</p>
                        <Button className="bg-blue-600 hover:bg-blue-700 mt-2">
                          <ChevronRight className="mr-2 h-4 w-4" />
                          Start Campaign
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* API Reference */}
          <TabsContent value="api">
            <div className="space-y-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">API Endpoints</CardTitle>
                  <CardDescription>Integrate SharpSend with your systems</CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert className="mb-6 bg-slate-700 border-slate-600">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-slate-300">
                      Base URL: <code className="bg-slate-900 px-2 py-1 rounded">https://api.sharpsend.io/v1</code>
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-6">
                    {apiEndpoints.map((endpoint, index) => (
                      <div key={index} className="border border-slate-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Badge className={endpoint.method === 'POST' ? 'bg-green-600' : 'bg-blue-600'}>
                              {endpoint.method}
                            </Badge>
                            <code className="text-white font-mono">{endpoint.endpoint}</code>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(endpoint.body || endpoint.response || '', `api-${index}`)}
                          >
                            {copiedCode === `api-${index}` ? 
                              <Check className="h-4 w-4 text-green-400" /> : 
                              <Copy className="h-4 w-4" />
                            }
                          </Button>
                        </div>
                        <p className="text-slate-400 text-sm mb-3">{endpoint.description}</p>
                        {endpoint.body && (
                          <div>
                            <p className="text-xs text-slate-500 mb-2">Request Body:</p>
                            <pre className="bg-slate-900 p-3 rounded text-xs text-slate-300 overflow-x-auto">
                              {endpoint.body}
                            </pre>
                          </div>
                        )}
                        {endpoint.response && (
                          <div>
                            <p className="text-xs text-slate-500 mb-2">Response:</p>
                            <pre className="bg-slate-900 p-3 rounded text-xs text-slate-300 overflow-x-auto">
                              {endpoint.response}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Platform Guide */}
          <TabsContent value="platforms">
            <div className="space-y-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Email Platform Capabilities</CardTitle>
                  <CardDescription>Choose the right platform for your needs</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {platformCapabilities.map((platform, index) => (
                      <div key={index} className="border border-slate-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-white font-semibold">{platform.platform}</h3>
                          <Badge variant="outline" className="text-xs">
                            {platform.limits}
                          </Badge>
                        </div>
                        <p className="text-slate-400 text-sm mb-3">{platform.bestFor}</p>
                        <div className="space-y-2">
                          <p className="text-xs text-slate-500">Key Strengths:</p>
                          <div className="flex flex-wrap gap-2">
                            {platform.strengths.map((strength, i) => (
                              <Badge key={i} className="bg-slate-700 text-slate-300">
                                {strength}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Alert className="mt-6 bg-blue-900/20 border-blue-700">
                    <Info className="h-4 w-4 text-blue-400" />
                    <AlertDescription className="text-blue-300">
                      <strong>Pro Tip:</strong> Enable multi-platform redundancy to automatically failover between platforms for 99.95% uptime guarantee.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* FAQ */}
          <TabsContent value="faq">
            <div className="space-y-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Frequently Asked Questions</CardTitle>
                  <CardDescription>Quick answers to common questions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {faqs.map((faq, index) => (
                      <div key={index} className="border-b border-slate-700 pb-4 last:border-0">
                        <div className="flex items-start gap-3">
                          <HelpCircle className="h-5 w-5 text-blue-400 mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-white font-medium">{faq.question}</h3>
                              <Badge variant="outline" className="text-xs">
                                {faq.category}
                              </Badge>
                            </div>
                            <p className="text-slate-400 text-sm">{faq.answer}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 p-4 bg-slate-700 rounded-lg">
                    <h4 className="text-white font-medium mb-2">Need more help?</h4>
                    <p className="text-slate-400 text-sm mb-3">
                      Contact our support team for personalized assistance
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Mail className="mr-2 h-4 w-4" />
                        Email Support
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="mr-2 h-4 w-4" />
                        Schedule Demo
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </div>
  );
}
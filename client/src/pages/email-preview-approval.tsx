import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Eye, 
  Send, 
  Clock, 
  Users, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Calendar,
  Target,
  BarChart3,
  Mail,
  Zap,
  Globe
} from 'lucide-react';

interface EmailVariation {
  cohortId: string;
  cohortName: string;
  subscriberCount: number;
  subject: string;
  content: string;
  cta: string;
  predictedOpenRate: number;
  predictedClickRate: number;
  sendTime: string;
  reasoning: string;
}

interface MarketTrigger {
  id: string;
  type: 'news' | 'price_movement' | 'volatility' | 'earnings';
  title: string;
  description: string;
  urgency: 'low' | 'medium' | 'high';
  suggestedCohorts: string[];
  suggestedContent: string;
  timestamp: string;
}

const EmailPreviewApproval: React.FC = () => {
  const [emailVariations, setEmailVariations] = useState<EmailVariation[]>([]);
  const [marketTriggers, setMarketTriggers] = useState<MarketTrigger[]>([]);
  const [selectedVariation, setSelectedVariation] = useState<EmailVariation | null>(null);
  const [approvedVariations, setApprovedVariations] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Sample data for demo
  useEffect(() => {
    // Simulate loading email variations
    setTimeout(() => {
      setEmailVariations([
        {
          cohortId: 'conservative_investors',
          cohortName: 'Conservative Investors',
          subscriberCount: 1250,
          subject: 'Stable Growth: Weekly Market Outlook - Dividend Opportunities',
          content: `Dear Conservative Investor,

This week's market analysis focuses on stability and income generation opportunities that align with your investment approach.

**Key Highlights:**
• Blue-chip dividend stocks showing consistent performance
• Bond market stability despite recent volatility
• Defensive sectors maintaining strong fundamentals

**Conservative Recommendations:**
1. Consider increasing allocation to dividend aristocrats
2. Review bond ladder strategy for income optimization
3. Evaluate utility sector opportunities for steady returns

Our research indicates these positions offer the stability and income focus that matches your investment profile.

Best regards,
The Investment Team`,
          cta: 'View Conservative Portfolio',
          predictedOpenRate: 0.72,
          predictedClickRate: 0.14,
          sendTime: '2024-01-16T09:00:00Z',
          reasoning: 'Formal tone, stability focus, dividend emphasis matches conservative profile'
        },
        {
          cohortId: 'aggressive_investors',
          cohortName: 'Growth Seekers',
          subscriberCount: 890,
          subject: '🚀 High Growth Alert: AI Sector Breakout - Act Fast!',
          content: `Growth Investor,

URGENT OPPORTUNITY: The AI sector is experiencing a significant breakout with multiple catalysts converging.

**Breaking Developments:**
🔥 NVIDIA earnings beat expectations by 25%
⚡ New AI infrastructure deals worth $50B announced
🚀 Semiconductor demand surge continues

**High-Growth Plays:**
→ AI infrastructure leaders showing 40%+ upside potential
→ Emerging AI software companies with explosive growth
→ Semiconductor supply chain recovery accelerating

Time-sensitive opportunities require immediate attention. The momentum is building fast.

Ready to capitalize?
Growth Team`,
          cta: 'Explore Growth Opportunities',
          predictedOpenRate: 0.85,
          predictedClickRate: 0.22,
          sendTime: '2024-01-16T08:00:00Z',
          reasoning: 'Urgent tone, growth focus, momentum emphasis matches aggressive profile'
        },
        {
          cohortId: 'tech_focused',
          cohortName: 'Tech Sector Specialists',
          subscriberCount: 650,
          subject: 'Tech Deep Dive: AI Infrastructure Revolution Analysis',
          content: `Tech Specialist,

Our technical analysis team has completed an in-depth review of the AI infrastructure landscape following this week's earnings reports.

**Technical Analysis:**
• Semiconductor cycle indicators showing strong momentum
• Cloud infrastructure capex increasing 45% YoY
• AI chip demand outpacing supply by 3:1 ratio

**Sector Breakdown:**
- Hardware: NVDA, AMD showing technical breakouts
- Software: Cloud AI platforms gaining market share
- Infrastructure: Data center REITs benefiting from demand

**Technical Indicators:**
RSI levels suggest continued upward momentum across the sector with key resistance levels being broken.

Detailed charts and analysis attached.

Tech Analysis Team`,
          cta: 'Access Technical Reports',
          predictedOpenRate: 0.78,
          predictedClickRate: 0.18,
          sendTime: '2024-01-16T09:30:00Z',
          reasoning: 'Technical depth, sector expertise, analytical approach matches tech specialist profile'
        }
      ]);

      setMarketTriggers([
        {
          id: 'nvidia_earnings',
          type: 'earnings',
          title: 'NVIDIA Beats Earnings by 25%',
          description: 'NVIDIA reported Q4 earnings significantly above expectations, driving AI sector momentum',
          urgency: 'high',
          suggestedCohorts: ['aggressive_investors', 'tech_focused'],
          suggestedContent: 'AI sector analysis with NVIDIA earnings impact and growth opportunities',
          timestamp: '2024-01-16T06:30:00Z'
        },
        {
          id: 'fed_minutes',
          type: 'news',
          title: 'Fed Minutes Signal Rate Stability',
          description: 'Federal Reserve minutes indicate potential pause in rate hikes, supporting market stability',
          urgency: 'medium',
          suggestedCohorts: ['conservative_investors', 'moderate_investors'],
          suggestedContent: 'Interest rate impact analysis and bond market opportunities',
          timestamp: '2024-01-16T14:00:00Z'
        },
        {
          id: 'vix_spike',
          type: 'volatility',
          title: 'VIX Volatility Spike to 28',
          description: 'Market volatility increased significantly, creating opportunities for active traders',
          urgency: 'high',
          suggestedCohorts: ['aggressive_investors', 'volatility_responsive'],
          suggestedContent: 'Volatility trading strategies and risk management techniques',
          timestamp: '2024-01-16T10:15:00Z'
        }
      ]);

      setLoading(false);
    }, 1000);
  }, []);

  const handleApprove = (cohortId: string) => {
    setApprovedVariations(prev => new Set([...prev, cohortId]));
  };

  const handleScheduleSend = (variation: EmailVariation) => {
    console.log('Scheduling send for:', variation.cohortName);
    // In real implementation, this would call the API to schedule the email
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading email previews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Preview & Approval</h1>
          <p className="text-gray-600">Review personalized email variations and approve sends for different subscriber cohorts</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Market Triggers Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Market Triggers
                </CardTitle>
                <CardDescription>
                  Real-time market events suggesting email opportunities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {marketTriggers.map((trigger) => (
                  <div key={trigger.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-sm">{trigger.title}</h4>
                      <Badge className={`text-xs ${getUrgencyColor(trigger.urgency)}`}>
                        {trigger.urgency}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mb-3">{trigger.description}</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Target className="h-3 w-3" />
                        Suggested: {trigger.suggestedCohorts.join(', ')}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        {new Date(trigger.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="w-full mt-3 text-xs">
                      Create Email
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                  Send Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Subscribers</span>
                    <span className="font-semibold">2,790</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Approved Variations</span>
                    <span className="font-semibold">{approvedVariations.size}/3</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Avg. Open Rate</span>
                    <span className="font-semibold text-green-600">78.3%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Avg. Click Rate</span>
                    <span className="font-semibold text-blue-600">18.1%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="variations" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="variations">Email Variations</TabsTrigger>
                <TabsTrigger value="preview">Preview & Approve</TabsTrigger>
              </TabsList>

              <TabsContent value="variations" className="space-y-4">
                {emailVariations.map((variation) => (
                  <Card key={variation.cohortId} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{variation.cohortName}</CardTitle>
                          <CardDescription className="flex items-center gap-4 mt-1">
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {variation.subscriberCount.toLocaleString()} subscribers
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {new Date(variation.sendTime).toLocaleString()}
                            </span>
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          {approvedVariations.has(variation.cohortId) ? (
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Approved
                            </Badge>
                          ) : (
                            <Badge variant="outline">Pending Review</Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Subject Line */}
                        <div>
                          <label className="text-sm font-medium text-gray-700">Subject Line</label>
                          <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                            <p className="text-sm font-medium">{variation.subject}</p>
                          </div>
                        </div>

                        {/* Performance Predictions */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 bg-blue-50 rounded-lg border">
                            <div className="text-2xl font-bold text-blue-600">
                              {(variation.predictedOpenRate * 100).toFixed(1)}%
                            </div>
                            <div className="text-xs text-gray-600">Predicted Open Rate</div>
                          </div>
                          <div className="text-center p-3 bg-green-50 rounded-lg border">
                            <div className="text-2xl font-bold text-green-600">
                              {(variation.predictedClickRate * 100).toFixed(1)}%
                            </div>
                            <div className="text-xs text-gray-600">Predicted Click Rate</div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedVariation(variation)}
                            className="flex items-center gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            Preview
                          </Button>
                          
                          {!approvedVariations.has(variation.cohortId) ? (
                            <Button
                              size="sm"
                              onClick={() => handleApprove(variation.cohortId)}
                              className="flex items-center gap-2"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Approve
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleScheduleSend(variation)}
                              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                            >
                              <Send className="h-4 w-4" />
                              Schedule Send
                            </Button>
                          )}
                        </div>

                        {/* AI Reasoning */}
                        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded border-l-4 border-blue-200">
                          <strong>AI Personalization:</strong> {variation.reasoning}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="preview">
                {selectedVariation ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        Email Preview: {selectedVariation.cohortName}
                      </CardTitle>
                      <CardDescription>
                        Preview how this email will appear to subscribers in this cohort
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="max-w-2xl mx-auto">
                        {/* Email Header */}
                        <div className="bg-white border rounded-lg shadow-sm">
                          <div className="border-b p-4 bg-gray-50">
                            <div className="flex items-center justify-between text-sm text-gray-600">
                              <span>From: investment-team@sharpsend.com</span>
                              <span>{new Date(selectedVariation.sendTime).toLocaleDateString()}</span>
                            </div>
                            <h2 className="text-lg font-semibold mt-2 text-gray-900">
                              {selectedVariation.subject}
                            </h2>
                          </div>
                          
                          {/* Email Body */}
                          <div className="p-6">
                            <div className="prose prose-sm max-w-none">
                              {selectedVariation.content.split('\n').map((paragraph, index) => (
                                <p key={index} className="mb-4 text-gray-700 leading-relaxed">
                                  {paragraph}
                                </p>
                              ))}
                            </div>
                            
                            {/* CTA Button */}
                            <div className="mt-6 text-center">
                              <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                                {selectedVariation.cta}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Preview Actions */}
                        <div className="mt-6 flex items-center justify-center gap-4">
                          <Button variant="outline" onClick={() => setSelectedVariation(null)}>
                            Close Preview
                          </Button>
                          {!approvedVariations.has(selectedVariation.cohortId) && (
                            <Button onClick={() => handleApprove(selectedVariation.cohortId)}>
                              Approve This Version
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Email Selected</h3>
                      <p className="text-gray-600">Select an email variation to preview how it will appear to subscribers</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailPreviewApproval;


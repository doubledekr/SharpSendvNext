import React, { useState, useEffect } from 'react';
import NavigationHeader from "@/components/dashboard/navigation-header";
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
  Globe,
  Smartphone,
  Monitor
} from 'lucide-react';
import "../styles/dashboard-improvements.css";

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

const EmailPreviewApprovalEnhanced: React.FC = () => {
  const [emailVariations, setEmailVariations] = useState<EmailVariation[]>([]);
  const [marketTriggers, setMarketTriggers] = useState<MarketTrigger[]>([]);
  const [selectedVariation, setSelectedVariation] = useState<EmailVariation | null>(null);
  const [approvedVariations, setApprovedVariations] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<string>('variations');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setMarketTriggers([
        {
          id: 'nvidia_earnings',
          type: 'earnings',
          title: 'NVIDIA Beats Earnings by 25%',
          description: 'Q4 results show massive AI revenue growth, stock up 8% in after-hours trading',
          urgency: 'high',
          suggestedCohorts: ['aggressive_investors', 'tech_focused'],
          suggestedContent: 'Focus on AI infrastructure growth and semiconductor momentum',
          timestamp: '2024-01-16T16:30:00Z'
        },
        {
          id: 'fed_minutes',
          type: 'news',
          title: 'Fed Minutes Signal Rate Stability',
          description: 'FOMC meeting minutes suggest pause in rate hikes, dovish tone emerging',
          urgency: 'medium',
          suggestedCohorts: ['conservative_investors', 'moderate_investors'],
          suggestedContent: 'Emphasize bond market opportunities and dividend plays',
          timestamp: '2024-01-16T14:00:00Z'
        },
        {
          id: 'vix_spike',
          type: 'volatility',
          title: 'VIX Volatility Spike to 28',
          description: 'Market uncertainty increases, defensive positioning recommended',
          urgency: 'high',
          suggestedCohorts: ['aggressive_investors', 'volatility_responsive'],
          suggestedContent: 'Highlight hedging strategies and volatility trading opportunities',
          timestamp: '2024-01-16T15:45:00Z'
        }
      ]);

      setEmailVariations([
        {
          cohortId: 'conservative_investors',
          cohortName: 'Conservative Investors',
          subscriberCount: 1250,
          subject: 'Stable Growth: Weekly Market Outlook - Dividend Opportunities',
          content: `Dear Conservative Investor,

This week's market analysis focuses on stability and income generation opportunities that align with your investment philosophy.

**Key Highlights:**
• Dividend aristocrats showing resilience in current market conditions
• Bond yields stabilizing after Fed signals
• Blue-chip stocks offering attractive entry points

**Featured Opportunities:**
1. Johnson & Johnson (JNJ) - 3.2% dividend yield, healthcare stability
2. Procter & Gamble (PG) - Consumer staples defensive play
3. Treasury bonds - Locking in current rates before potential cuts

**Risk Assessment:** Low to moderate market volatility expected. Focus on quality over growth.

Best regards,
The Investment Team`,
          cta: 'View Full Analysis →',
          predictedOpenRate: 0.72,
          predictedClickRate: 0.14,
          sendTime: '2024-01-17T09:00:00Z',
          reasoning: 'Conservative tone, dividend focus, risk-aware messaging appeals to this cohort\'s stability preference'
        },
        {
          cohortId: 'aggressive_investors',
          cohortName: 'Growth Seekers',
          subscriberCount: 890,
          subject: '🚀 High Growth Alert: AI Sector Breakout - Act Fast!',
          content: `Growth Seeker,

MASSIVE opportunity unfolding in AI sector - NVIDIA's 25% earnings beat is just the beginning!

**URGENT PLAYS:**
🔥 Semiconductor momentum building - TSM, AMD next in line
🚀 AI infrastructure explosion - PLTR, SNOW riding the wave  
⚡ Cloud computing surge - MSFT, GOOGL benefiting from AI demand

**Why NOW:**
• Earnings season confirming AI revenue acceleration
• Institutional money flowing into growth names
• Technical breakouts across multiple AI stocks

**Action Items:**
1. Scale into semiconductor leaders on any dips
2. Consider AI ETFs for diversified exposure
3. Watch for momentum continuation patterns

Time-sensitive opportunity - market moving fast!

Trade smart,
Growth Strategy Team`,
          cta: 'Get Trade Alerts →',
          predictedOpenRate: 0.85,
          predictedClickRate: 0.22,
          sendTime: '2024-01-17T07:30:00Z',
          reasoning: 'Urgent tone, emoji usage, momentum focus, and action-oriented language resonates with growth-seeking investors'
        },
        {
          cohortId: 'tech_focused',
          cohortName: 'Tech Sector Specialists',
          subscriberCount: 650,
          subject: 'Tech Deep Dive: AI Infrastructure Revolution Analysis',
          content: `Tech Specialist,

In-depth analysis of NVIDIA's earnings reveals fundamental shift in AI infrastructure demand.

**Technical Analysis:**
• Revenue guidance of $20B+ for Q1 indicates sustained growth trajectory
• Data center revenue up 409% YoY - unprecedented in semiconductor history
• Gross margins expanding to 73% despite supply chain pressures

**Sector Implications:**
1. **Memory Suppliers** (MU, WDC): AI workloads driving DRAM/NAND demand
2. **Networking** (CSCO, ANET): Data center interconnect critical for AI clusters  
3. **Software** (NVDA, AMD): CUDA ecosystem creating competitive moats

**Investment Thesis Update:**
The AI infrastructure build-out is in early innings. Conservative estimates suggest 3-5 year supercycle with $500B+ in cumulative capex.

**Technical Levels:**
• NVDA: Support at $875, resistance at $925
• Sector rotation favoring infrastructure over applications
• Options flow showing institutional accumulation

Detailed models and projections in full report.

Technical Analysis Team`,
          cta: 'Access Full Report →',
          predictedOpenRate: 0.78,
          predictedClickRate: 0.18,
          sendTime: '2024-01-17T08:00:00Z',
          reasoning: 'Technical depth, sector expertise, detailed analysis, and specific data points appeal to tech specialists'
        }
      ]);

      setLoading(false);
    }, 1000);
  }, []);

  const handleApproveVariation = (cohortId: string) => {
    setApprovedVariations(prev => new Set([...prev, cohortId]));
  };

  const handlePreviewVariation = (variation: EmailVariation) => {
    setSelectedVariation(variation);
  };

  const totalSubscribers = emailVariations.reduce((sum, variation) => sum + variation.subscriberCount, 0);
  const avgOpenRate = emailVariations.reduce((sum, variation) => sum + variation.predictedOpenRate, 0) / emailVariations.length;
  const avgClickRate = emailVariations.reduce((sum, variation) => sum + variation.predictedClickRate, 0) / emailVariations.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900">
        <NavigationHeader currentPage="email-preview" />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-300">Loading email preview...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <NavigationHeader currentPage="email-preview" />
      
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Email Preview & Approval</h1>
            <p className="text-slate-400">Review AI-generated email variations and approve for sending</p>
          </div>

          {/* Key Metrics */}
          <div className="metrics-grid mb-8">
            <div className="metric-card-enhanced interactive-element">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="metric-label-enhanced">Total Subscribers</p>
                  <p className="metric-value-animated">{totalSubscribers.toLocaleString()}</p>
                  <div className="flex items-center mt-2">
                    <Users className="h-4 w-4 text-blue-400 mr-1" />
                    <span className="text-sm text-slate-400">Across all cohorts</span>
                  </div>
                </div>
                <div className="metric-icon-container">
                  <Users className="metric-icon" style={{ color: '#3b82f6' }} />
                </div>
              </div>
            </div>

            <div className="metric-card-enhanced interactive-element">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="metric-label-enhanced">Approved Variations</p>
                  <p className="metric-value-animated">{approvedVariations.size}/{emailVariations.length}</p>
                  <div className="flex items-center mt-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mr-1" />
                    <span className="text-sm text-slate-400">Ready to send</span>
                  </div>
                </div>
                <div className="metric-icon-container">
                  <CheckCircle className="metric-icon" style={{ color: '#10b981' }} />
                </div>
              </div>
            </div>

            <div className="metric-card-enhanced interactive-element">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="metric-label-enhanced">Avg Open Rate</p>
                  <p className="metric-value-animated">{(avgOpenRate * 100).toFixed(1)}%</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-green-400 mr-1" />
                    <span className="text-sm text-slate-400">Predicted performance</span>
                  </div>
                </div>
                <div className="metric-icon-container">
                  <Mail className="metric-icon" style={{ color: '#8b5cf6' }} />
                </div>
              </div>
            </div>

            <div className="metric-card-enhanced interactive-element">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="metric-label-enhanced">Avg Click Rate</p>
                  <p className="metric-value-animated">{(avgClickRate * 100).toFixed(1)}%</p>
                  <div className="flex items-center mt-2">
                    <Target className="h-4 w-4 text-purple-400 mr-1" />
                    <span className="text-sm text-slate-400">AI optimized</span>
                  </div>
                </div>
                <div className="metric-icon-container">
                  <Target className="metric-icon" style={{ color: '#f59e0b' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6">
            <div className="flex space-x-1 bg-slate-800 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('triggers')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'triggers'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                Market Triggers
              </button>
              <button
                onClick={() => setActiveTab('variations')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'variations'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                Email Variations
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'preview'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                Preview & Approve
              </button>
            </div>
          </div>

          {/* Market Triggers Tab */}
          {activeTab === 'triggers' && (
            <div className="chart-card-enhanced">
              <h3 className="text-xl font-semibold text-white mb-2">Real-Time Market Triggers</h3>
              <p className="text-slate-400 mb-6">AI-detected market events with email opportunities</p>
              
              <div className="space-y-4">
                {marketTriggers.map((trigger) => (
                  <div key={trigger.id} className="market-trigger-card">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`px-2 py-1 rounded text-xs font-medium ${
                            trigger.urgency === 'high' ? 'bg-red-900 text-red-300' :
                            trigger.urgency === 'medium' ? 'bg-yellow-900 text-yellow-300' :
                            'bg-green-900 text-green-300'
                          }`}>
                            {trigger.urgency.toUpperCase()}
                          </div>
                          <span className="text-xs text-slate-500">
                            {new Date(trigger.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <h4 className="text-lg font-semibold text-white mb-1">{trigger.title}</h4>
                        <p className="text-slate-300 mb-3">{trigger.description}</p>
                        <div className="text-sm text-slate-400">
                          <strong>Suggested Cohorts:</strong> {trigger.suggestedCohorts.join(', ')}
                        </div>
                      </div>
                      <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                        Create Email
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Email Variations Tab */}
          {activeTab === 'variations' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {emailVariations.map((variation) => (
                <div key={variation.cohortId} className="email-variation-card">
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-white">{variation.cohortName}</h3>
                      <span className="text-sm text-slate-400">{variation.subscriberCount.toLocaleString()} subscribers</span>
                    </div>
                    <div className="text-sm font-medium text-blue-400 mb-3">{variation.subject}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-xl font-bold text-green-400">{(variation.predictedOpenRate * 100).toFixed(1)}%</div>
                      <div className="text-xs text-slate-500">Open Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-purple-400">{(variation.predictedClickRate * 100).toFixed(1)}%</div>
                      <div className="text-xs text-slate-500">Click Rate</div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-sm text-slate-400 mb-2">AI Reasoning:</div>
                    <div className="text-sm text-slate-300">{variation.reasoning}</div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePreviewVariation(variation)}
                      className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm font-medium transition-colors"
                    >
                      <Eye className="h-4 w-4 inline mr-1" />
                      Preview
                    </button>
                    <button
                      onClick={() => handleApproveVariation(variation.cohortId)}
                      disabled={approvedVariations.has(variation.cohortId)}
                      className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                        approvedVariations.has(variation.cohortId)
                          ? 'bg-green-900 text-green-300 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {approvedVariations.has(variation.cohortId) ? (
                        <>
                          <CheckCircle className="h-4 w-4 inline mr-1" />
                          Approved
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 inline mr-1" />
                          Approve
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Preview & Approve Tab */}
          {activeTab === 'preview' && selectedVariation && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Email Preview */}
              <div className="chart-card-enhanced">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-white">Email Preview</h3>
                  <div className="flex gap-2">
                    <button className="p-2 bg-slate-700 hover:bg-slate-600 rounded text-slate-300">
                      <Monitor className="h-4 w-4" />
                    </button>
                    <button className="p-2 bg-slate-700 hover:bg-slate-600 rounded text-slate-300">
                      <Smartphone className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-6 text-gray-900">
                  <div className="border-b pb-4 mb-4">
                    <div className="text-sm text-gray-600 mb-1">Subject:</div>
                    <div className="font-semibold">{selectedVariation.subject}</div>
                  </div>
                  
                  <div className="whitespace-pre-line text-sm leading-relaxed">
                    {selectedVariation.content}
                  </div>
                  
                  <div className="mt-6 text-center">
                    <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                      {selectedVariation.cta}
                    </button>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="space-y-6">
                <div className="chart-card-enhanced">
                  <h3 className="text-lg font-semibold text-white mb-4">Performance Prediction</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Cohort</span>
                      <span className="text-white font-medium">{selectedVariation.cohortName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Subscribers</span>
                      <span className="text-white font-medium">{selectedVariation.subscriberCount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Predicted Opens</span>
                      <span className="text-green-400 font-medium">
                        {Math.round(selectedVariation.subscriberCount * selectedVariation.predictedOpenRate).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Predicted Clicks</span>
                      <span className="text-purple-400 font-medium">
                        {Math.round(selectedVariation.subscriberCount * selectedVariation.predictedClickRate).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="chart-card-enhanced">
                  <h3 className="text-lg font-semibold text-white mb-4">Send Schedule</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-blue-400" />
                      <div>
                        <div className="text-white font-medium">Optimal Send Time</div>
                        <div className="text-slate-400 text-sm">
                          {new Date(selectedVariation.sendTime).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Target className="h-5 w-5 text-green-400" />
                      <div>
                        <div className="text-white font-medium">AI Optimization</div>
                        <div className="text-slate-400 text-sm">Subject line and timing optimized</div>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleApproveVariation(selectedVariation.cohortId)}
                  disabled={approvedVariations.has(selectedVariation.cohortId)}
                  className={`w-full px-6 py-3 rounded-lg font-medium transition-colors ${
                    approvedVariations.has(selectedVariation.cohortId)
                      ? 'bg-green-900 text-green-300 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {approvedVariations.has(selectedVariation.cohortId) ? (
                    <>
                      <CheckCircle className="h-5 w-5 inline mr-2" />
                      Approved for Sending
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5 inline mr-2" />
                      Approve & Schedule Send
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailPreviewApprovalEnhanced;


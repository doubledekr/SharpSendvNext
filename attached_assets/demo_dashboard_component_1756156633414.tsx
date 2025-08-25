import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, Users, DollarSign, Mail } from 'lucide-react';

interface DemoStats {
  totalSubscribers: number;
  engagementRate: number;
  monthlyRevenue: number;
  openRate: number;
  clickRate: number;
  churnRate: number;
}

interface EmailVariation {
  id: string;
  segmentName: string;
  subject: string;
  previewText: string;
  estimatedOpenRate: number;
  estimatedClickRate: number;
  predictedLift: number;
}

export default function DemoDashboard() {
  const [stats, setStats] = useState<DemoStats | null>(null);
  const [variations, setVariations] = useState<EmailVariation[]>([]);
  const [generating, setGenerating] = useState(false);
  const [baseEmail, setBaseEmail] = useState({
    subject: 'Fed Decision: Market Volatility Creates Trading Opportunities',
    content: 'The Federal Reserve has held rates steady at 5.25-5.50%, creating a 15% increase in market volatility. This presents unique opportunities across different asset classes for strategic investors.'
  });

  useEffect(() => {
    // Initialize demo environment and fetch stats
    initializeDemo();
  }, []);

  const initializeDemo = async () => {
    try {
      // Initialize demo data
      await fetch('/api/demo/initialize', { method: 'POST' });
      
      // Fetch demo analytics
      const response = await fetch('/api/demo/analytics');
      if (response.ok) {
        const data = await response.json();
        setStats({
          totalSubscribers: 12847,
          engagementRate: 74.20,
          monthlyRevenue: 89450.00,
          openRate: 31.50,
          clickRate: 6.20,
          churnRate: 2.80
        });
      }
    } catch (error) {
      console.error('Error initializing demo:', error);
      // Set fallback demo stats
      setStats({
        totalSubscribers: 12847,
        engagementRate: 74.20,
        monthlyRevenue: 89450.00,
        openRate: 31.50,
        clickRate: 6.20,
        churnRate: 2.80
      });
    }
  };

  const generateVariations = async () => {
    setGenerating(true);
    setVariations([]);
    
    try {
      // Create demo campaign
      const campaignResponse = await fetch('/api/campaigns/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Demo Campaign - Fed Decision Impact',
          baseSubject: baseEmail.subject,
          baseContent: baseEmail.content,
          targetCohorts: ['day-traders', 'long-term-investors', 'options-traders', 'crypto-enthusiasts']
        })
      });
      
      const campaign = await campaignResponse.json();
      
      if (!campaign.success) {
        throw new Error('Failed to create campaign');
      }
      
      // Generate variations for each segment
      const segments = [
        { 
          id: 'day-traders', 
          name: 'Day Traders', 
          characteristics: 'Active traders focused on intraday opportunities, high risk tolerance, technical analysis focused',
          subscriberCount: 4250
        },
        { 
          id: 'long-term-investors', 
          name: 'Long-term Investors', 
          characteristics: 'Value-focused investors with 5+ year horizons, risk-averse, fundamental analysis focused',
          subscriberCount: 8500
        },
        { 
          id: 'options-traders', 
          name: 'Options Traders', 
          characteristics: 'Derivatives specialists who understand Greeks, moderate to high risk tolerance',
          subscriberCount: 3200
        },
        { 
          id: 'crypto-enthusiasts', 
          name: 'Crypto Enthusiasts', 
          characteristics: 'Digital asset investors and DeFi participants, high risk tolerance, tech-savvy',
          subscriberCount: 5700
        }
      ];
      
      const generatedVariations: EmailVariation[] = [];
      
      for (const segment of segments) {
        try {
          const response = await fetch(`/api/campaigns/${campaign.campaign.id}/generate-version`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              segmentId: segment.id,
              segmentName: segment.name,
              characteristics: segment.characteristics,
              baseContent: baseEmail.content,
              baseSubject: baseEmail.subject
            })
          });
          
          const variation = await response.json();
          if (variation.success) {
            generatedVariations.push({
              ...variation.variation,
              subscriberCount: segment.subscriberCount
            });
          }
        } catch (error) {
          console.error(`Error generating variation for ${segment.name}:`, error);
        }
      }
      
      setVariations(generatedVariations);
    } catch (error) {
      console.error('Error generating variations:', error);
      // Fallback to demo variations if API fails
      setVariations([
        {
          id: '1',
          segmentName: 'Day Traders',
          subject: 'Fed Holds Rates: 15% Vol Spike Sparks Intraday Breakouts Now',
          previewText: 'VIX jumps to 28.4 as rate decision creates immediate trading opportunities',
          estimatedOpenRate: 32.8,
          estimatedClickRate: 7.2,
          predictedLift: 28,
          subscriberCount: 4250
        },
        {
          id: '2',
          segmentName: 'Long-term Investors',
          subject: 'Fed Holds Rates: Strategic Dividend Plays for Long-Term Growth',
          previewText: 'Rate stability creates opportunities in dividend aristocrats and value plays',
          estimatedOpenRate: 29.1,
          estimatedClickRate: 5.8,
          predictedLift: 18,
          subscriberCount: 8500
        },
        {
          id: '3',
          segmentName: 'Options Traders',
          subject: 'Fed Holds Rates: Strategic Premium Plays Amid Rising Volatility',
          previewText: 'IV expansion creates opportunities for premium collection strategies',
          estimatedOpenRate: 31.5,
          estimatedClickRate: 6.9,
          predictedLift: 28,
          subscriberCount: 3200
        },
        {
          id: '4',
          segmentName: 'Crypto Enthusiasts',
          subject: 'Fed Holds Rates: Unlock DeFi Alpha Amid Volatility Surge',
          previewText: 'Rate decision impacts crypto markets - new yield farming opportunities emerge',
          estimatedOpenRate: 35.2,
          estimatedClickRate: 8.1,
          predictedLift: 35,
          subscriberCount: 5700
        }
      ]);
    } finally {
      setGenerating(false);
    }
  };

  const totalReach = variations.reduce((sum, v) => sum + (v.subscriberCount || 0), 0);
  const avgLift = variations.length > 0 ? Math.round(variations.reduce((sum, v) => sum + v.predictedLift, 0) / variations.length) : 0;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">SharpSend Demo Dashboard</h1>
          <p className="text-gray-600 mt-1">AI-Powered Email Variations Engine</p>
        </div>
        <Badge variant="outline" className="bg-green-50 text-green-700 px-3 py-1">
          Demo Mode Active
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalSubscribers.toLocaleString() || '12,847'}
            </div>
            <p className="text-xs text-muted-foreground">
              Across 4 investor segments
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.engagementRate || '74.2'}%
            </div>
            <p className="text-xs text-muted-foreground">
              +12% vs industry avg
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${stats?.monthlyRevenue.toLocaleString() || '89,450'}
            </div>
            <p className="text-xs text-muted-foreground">
              +23% month over month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats?.openRate || '31.5'}%
            </div>
            <p className="text-xs text-muted-foreground">
              Industry avg: 21.3%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Email Variations Engine Demo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Variations Engine Demo
          </CardTitle>
          <p className="text-sm text-gray-600">
            Generate personalized email variations for different investor segments using AI
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Base Email Subject</label>
              <input
                type="text"
                value={baseEmail.subject}
                onChange={(e) => setBaseEmail({...baseEmail, subject: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email subject line..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Base Email Content</label>
              <textarea
                value={baseEmail.content}
                onChange={(e) => setBaseEmail({...baseEmail, content: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg h-24 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email content..."
              />
            </div>
            
            <Button 
              onClick={generateVariations} 
              disabled={generating}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating AI Variations...
                </>
              ) : (
                'Generate AI-Powered Email Variations'
              )}
            </Button>
            
            {variations.length > 0 && (
              <div className="mt-6">
                {/* Results Summary */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-green-800">
                        ✅ {variations.length} Variations Generated Successfully
                      </h3>
                      <p className="text-green-700">
                        Total reach: {totalReach.toLocaleString()} subscribers • Average predicted lift: +{avgLift}%
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-green-100 text-green-800 text-lg px-3 py-1">
                      +{avgLift}% Avg Lift
                    </Badge>
                  </div>
                </div>

                {/* Variations Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {variations.map((variation, index) => (
                    <Card key={variation.id || index} className="border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg text-blue-900">{variation.segmentName}</CardTitle>
                            <p className="text-sm text-gray-600">
                              {(variation.subscriberCount || 0).toLocaleString()} subscribers
                            </p>
                          </div>
                          <Badge variant="outline" className="bg-green-50 text-green-700 font-semibold">
                            +{variation.predictedLift}% lift
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">Subject Line</p>
                            <p className="text-sm bg-blue-50 p-3 rounded border-l-2 border-blue-200 font-medium">
                              {variation.subject}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">Preview Text</p>
                            <p className="text-sm bg-gray-50 p-3 rounded border-l-2 border-gray-200">
                              {variation.previewText}
                            </p>
                          </div>
                          <div className="flex justify-between text-xs text-gray-600 bg-gray-50 p-2 rounded">
                            <span>📧 Open Rate: {variation.estimatedOpenRate.toFixed(1)}%</span>
                            <span>🖱️ Click Rate: {variation.estimatedClickRate.toFixed(1)}%</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


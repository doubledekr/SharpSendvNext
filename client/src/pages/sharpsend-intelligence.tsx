import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Zap, 
  Target, 
  Brain, 
  TrendingUp, 
  Users, 
  Mail, 
  BarChart3,
  Activity,
  DollarSign,
  AlertTriangle,
  Eye,
  MessageSquare,
  Lightbulb
} from "lucide-react";
import CohortAnalysisDashboard from "@/components/cohort-analysis-dashboard";

export default function SharpSendIntelligence() {
  const [activeTab, setActiveTab] = useState('overview');

  const intelligenceMetrics = [
    {
      title: "Cohorts Detected",
      value: "5",
      subtitle: "Active behavioral segments",
      icon: Target,
      color: "text-blue-400",
      trend: "+2 this month"
    },
    {
      title: "Avg. Open Rate",
      value: "47.3%",
      subtitle: "After AI sharpening",
      icon: Eye,
      color: "text-green-400",
      trend: "+12.5% vs baseline"
    },
    {
      title: "Churn Prevented",
      value: "23",
      subtitle: "High-risk subscribers",
      icon: AlertTriangle,
      color: "text-yellow-400",
      trend: "Last 30 days"
    },
    {
      title: "Revenue Impact",
      value: "$8,440",
      subtitle: "From personalization",
      icon: DollarSign,
      color: "text-purple-400",
      trend: "+18% MoM"
    }
  ];

  const sharpeningExamples = [
    {
      cohort: "Professional Investors",
      baseSubject: "Weekly Market Update",
      sharpenedSubject: "Fed Policy Impact: Technical Analysis for Q1 Positioning",
      improvement: "+34% open rate",
      reasoning: "Added specific technical focus and regulatory context for professionals"
    },
    {
      cohort: "Growth Investors", 
      baseSubject: "Weekly Market Update",
      sharpenedSubject: "AI Sector Breakout: 3 High-Growth Opportunities This Week",
      improvement: "+28% click rate",
      reasoning: "Emphasized growth opportunities and emerging sector focus"
    },
    {
      cohort: "Learning Investors",
      baseSubject: "Weekly Market Update", 
      sharpenedSubject: "Market Basics: Understanding This Week's Key Moves",
      improvement: "+19% engagement",
      reasoning: "Simplified language with educational context for beginners"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">SharpSend Intelligence</h1>
              <p className="text-slate-400">AI-powered email intelligence for financial publishers</p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                <Brain className="w-3 h-3 mr-1" />
                AI Powered
              </Badge>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                Live Analysis
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {intelligenceMetrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <Card key={index} className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Icon className={`w-5 h-5 ${metric.color}`} />
                    <span className="text-xs text-slate-500">{metric.trend}</span>
                  </div>
                  <CardTitle className="text-sm font-medium text-slate-400">{metric.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white mb-1">{metric.value}</div>
                  <p className="text-xs text-slate-500">{metric.subtitle}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800/50">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="cohorts" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Cohort Analysis</span>
            </TabsTrigger>
            <TabsTrigger value="sharpening" className="flex items-center space-x-2">
              <Zap className="w-4 h-4" />
              <span>Email Sharpening</span>
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center space-x-2">
              <Lightbulb className="w-4 h-4" />
              <span>Intelligence</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Zap className="w-5 h-5 mr-2 text-yellow-400" />
                    Email Sharpening Performance
                  </CardTitle>
                  <p className="text-slate-400 text-sm">Recent AI personalization results</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {sharpeningExamples.map((example, index) => (
                    <div key={index} className="border border-slate-700 rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                          {example.cohort}
                        </Badge>
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                          {example.improvement}
                        </Badge>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 mb-1">Original:</div>
                        <div className="text-sm text-slate-300">{example.baseSubject}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 mb-1">Sharpened:</div>
                        <div className="text-sm text-white font-medium">{example.sharpenedSubject}</div>
                      </div>
                      <div className="text-xs text-slate-400 italic">{example.reasoning}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
                    Platform Intelligence Summary
                  </CardTitle>
                  <p className="text-slate-400 text-sm">Key insights and recommendations</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <div className="text-sm font-medium text-white">Professional Investors</div>
                        <div className="text-xs text-slate-400">Highest engagement with technical analysis content. Prefer early morning sends (7:30 AM EST).</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <div className="text-sm font-medium text-white">Growth Investors</div>
                        <div className="text-xs text-slate-400">Strong response to sector-specific opportunities. 28% higher CTR with momentum indicators.</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                      <div>
                        <div className="text-sm font-medium text-white">Learning Investors</div>
                        <div className="text-xs text-slate-400">Need educational context. Simplified language increases engagement by 19%.</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                      <div>
                        <div className="text-sm font-medium text-white">Churn Prevention</div>
                        <div className="text-xs text-slate-400">23 high-risk subscribers identified. Recommend immediate re-engagement campaigns.</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Cohort Analysis Tab */}
          <TabsContent value="cohorts" className="space-y-6">
            <CohortAnalysisDashboard />
          </TabsContent>

          {/* Email Sharpening Tab */}
          <TabsContent value="sharpening" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-yellow-400" />
                  AI Email Sharpening Studio
                </CardTitle>
                <p className="text-slate-400">Transform generic content into precision-targeted communications</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center py-12 border-2 border-dashed border-slate-600 rounded-lg">
                  <Mail className="w-16 h-16 mx-auto mb-4 text-slate-500" />
                  <h3 className="text-xl font-semibold text-white mb-2">Email Sharpening Studio</h3>
                  <p className="text-slate-400 mb-6">Upload or paste your email content to see AI personalization in action</p>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Zap className="w-4 h-4 mr-2" />
                    Start Sharpening
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Intelligence Tab */}
          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Brain className="w-5 h-5 mr-2 text-purple-400" />
                    Behavioral Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm text-slate-300">
                    <span className="text-purple-400 font-semibold">73%</span> of subscribers show consistent sector preferences
                  </div>
                  <div className="text-sm text-slate-300">
                    <span className="text-green-400 font-semibold">Market timing</span> affects engagement by up to 45%
                  </div>
                  <div className="text-sm text-slate-300">
                    <span className="text-blue-400 font-semibold">Technical analysis</span> content drives highest click-through
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Target className="w-5 h-5 mr-2 text-blue-400" />
                    Personalization Impact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm text-slate-300">
                    <span className="text-green-400 font-semibold">+31%</span> average open rate improvement
                  </div>
                  <div className="text-sm text-slate-300">
                    <span className="text-blue-400 font-semibold">+22%</span> average click rate improvement  
                  </div>
                  <div className="text-sm text-slate-300">
                    <span className="text-purple-400 font-semibold">-18%</span> churn rate reduction
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Lightbulb className="w-5 h-5 mr-2 text-yellow-400" />
                    Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-xs text-slate-400">
                    • Increase technical content for professional cohort
                  </div>
                  <div className="text-xs text-slate-400">
                    • Add educational context for learning investors
                  </div>
                  <div className="text-xs text-slate-400">
                    • Implement market-responsive send timing
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
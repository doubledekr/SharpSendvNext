import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  Target, 
  Brain, 
  Zap,
  BarChart3,
  PieChart,
  Activity,
  DollarSign,
  Mail,
  Eye
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface CohortData {
  id: string;
  name: string;
  description: string;
  subscriberCount: number;
  characteristics: string[];
  engagementProfile: {
    avgOpenRate: number;
    avgClickRate: number;
    avgEngagementScore: number;
    preferredContentTypes: string[];
  };
  recommendedStrategies: string[];
}

interface ChurnPrediction {
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
  recommendations: string[];
}

export default function CohortAnalysisDashboard() {
  const [selectedCohort, setSelectedCohort] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const queryClient = useQueryClient();

  // Fetch cohort analysis data
  const { data: cohortData, isLoading: isLoadingCohorts } = useQuery({
    queryKey: ['/api/content/cohorts/analysis'],
    queryFn: async () => {
      const response = await fetch('/api/content/cohorts/analysis');
      if (!response.ok) throw new Error('Failed to fetch cohort analysis');
      return response.json();
    },
  });

  // Fetch churn prediction data
  const { data: churnData, isLoading: isLoadingChurn } = useQuery({
    queryKey: ['/api/content/churn-prediction'],
    queryFn: async () => {
      const response = await fetch('/api/content/churn-prediction');
      if (!response.ok) throw new Error('Failed to fetch churn prediction');
      return response.json();
    },
  });

  const cohorts: CohortData[] = cohortData?.data?.cohorts || [];
  const churnPrediction: ChurnPrediction = churnData?.data || { highRisk: 0, mediumRisk: 0, lowRisk: 0, recommendations: [] };
  const totalAnalyzed = cohortData?.data?.totalAnalyzed || 0;

  // Email sharpening mutation
  const sharpenEmailMutation = useMutation({
    mutationFn: async (data: { baseSubject: string; baseContent: string; targetCohorts?: any[] }) => {
      const response = await fetch('/api/content/email/sharpen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to sharpen email');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/content/cohorts/analysis'] });
    },
  });

  const handleEmailSharpening = () => {
    setIsAnalyzing(true);
    sharpenEmailMutation.mutate({
      baseSubject: "Weekly Market Outlook - AI Sector Analysis",
      baseContent: `# Weekly Market Analysis

## Market Overview
The technology sector showed strong performance this week, with AI companies leading the charge. Here are the key developments:

### Key Highlights:
- AI sector up 12% for the week
- Strong earnings from major tech companies
- Federal Reserve maintaining current interest rates
- Economic indicators showing stable growth

### Investment Implications:
- Growth opportunities in AI and technology
- Potential for continued market expansion
- Risk factors to monitor

### Recommended Actions:
- Review portfolio allocations
- Consider technology sector exposure
- Monitor market volatility

*This analysis is for educational purposes and not personalized investment advice.*`
    });
    setTimeout(() => setIsAnalyzing(false), 3000);
  };

  const getCohortIcon = (cohortId: string) => {
    switch (cohortId) {
      case 'professional-investors': return Brain;
      case 'growth-investors': return TrendingUp;
      case 'income-investors': return DollarSign;
      case 'learning-investors': return Users;
      case 'active-traders': return Activity;
      default: return Target;
    }
  };

  const getCohortColor = (cohortId: string) => {
    switch (cohortId) {
      case 'professional-investors': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'growth-investors': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'income-investors': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'learning-investors': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'active-traders': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (isLoadingCohorts || isLoadingChurn) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center py-12">
          <Brain className="w-16 h-16 mx-auto mb-4 text-blue-500 animate-pulse" />
          <h3 className="text-xl font-semibold text-white mb-2">Analyzing Subscriber Cohorts</h3>
          <p className="text-slate-400">Processing behavioral data and engagement patterns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Advanced Cohort Intelligence</h1>
          <p className="text-slate-400">AI-powered subscriber analysis and email personalization for financial publishers</p>
        </div>
        <Button 
          onClick={handleEmailSharpening}
          disabled={isAnalyzing || sharpenEmailMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700 flex items-center space-x-2"
          data-testid="button-sharpen-email"
        >
          <Zap className="w-4 h-4" />
          <span>{isAnalyzing ? 'Sharpening...' : 'Demo Email Sharpening'}</span>
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-400 flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Total Subscribers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalAnalyzed.toLocaleString()}</div>
            <p className="text-xs text-slate-500 mt-1">Analyzed for cohorts</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-400 flex items-center">
              <Target className="w-4 h-4 mr-2" />
              Cohorts Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{cohorts.length}</div>
            <p className="text-xs text-slate-500 mt-1">Distinct segments</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-400 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2 text-red-400" />
              Churn Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{churnPrediction.highRisk}</div>
            <p className="text-xs text-slate-500 mt-1">High risk subscribers</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-400 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2 text-green-400" />
              Engagement Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              {cohorts.length > 0 ? 
                (cohorts.reduce((sum, c) => sum + c.engagementProfile.avgEngagementScore, 0) / cohorts.length).toFixed(1) 
                : '0.0'}
            </div>
            <p className="text-xs text-slate-500 mt-1">Average across cohorts</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="cohorts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-slate-800/50">
          <TabsTrigger value="cohorts" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Subscriber Cohorts</span>
          </TabsTrigger>
          <TabsTrigger value="churn" className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Churn Analysis</span>
          </TabsTrigger>
          <TabsTrigger value="sharpening" className="flex items-center space-x-2">
            <Zap className="w-4 h-4" />
            <span>Email Sharpening</span>
          </TabsTrigger>
        </TabsList>

        {/* Cohorts Tab */}
        <TabsContent value="cohorts" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {cohorts.map((cohort) => {
              const Icon = getCohortIcon(cohort.id);
              const colorClass = getCohortColor(cohort.id);
              
              return (
                <Card 
                  key={cohort.id} 
                  className={`bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50 transition-colors cursor-pointer ${
                    selectedCohort === cohort.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setSelectedCohort(selectedCohort === cohort.id ? null : cohort.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Icon className="w-5 h-5 text-blue-400" />
                        <CardTitle className="text-lg text-white">{cohort.name}</CardTitle>
                      </div>
                      <Badge className={colorClass}>
                        {cohort.subscriberCount} subscribers
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-400">{cohort.description}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Engagement Metrics */}
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-sm font-semibold text-white">
                          {cohort.engagementProfile.avgOpenRate.toFixed(1)}%
                        </div>
                        <div className="text-xs text-slate-500">Open Rate</div>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">
                          {cohort.engagementProfile.avgClickRate.toFixed(1)}%
                        </div>
                        <div className="text-xs text-slate-500">Click Rate</div>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">
                          {cohort.engagementProfile.avgEngagementScore.toFixed(1)}
                        </div>
                        <div className="text-xs text-slate-500">Engagement</div>
                      </div>
                    </div>

                    {/* Characteristics */}
                    <div>
                      <div className="text-sm font-medium text-white mb-2">Key Characteristics:</div>
                      <div className="flex flex-wrap gap-1">
                        {cohort.characteristics.slice(0, 3).map((char, index) => (
                          <Badge key={index} variant="outline" className="text-xs border-slate-600 text-slate-300">
                            {char}
                          </Badge>
                        ))}
                        {cohort.characteristics.length > 3 && (
                          <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">
                            +{cohort.characteristics.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Content Preferences */}
                    <div>
                      <div className="text-sm font-medium text-white mb-2">Preferred Content:</div>
                      <div className="flex flex-wrap gap-1">
                        {cohort.engagementProfile.preferredContentTypes.slice(0, 2).map((type, index) => (
                          <Badge key={index} className="text-xs bg-blue-500/20 text-blue-400 border-blue-500/30">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {selectedCohort === cohort.id && (
                      <div className="border-t border-slate-700 pt-4 space-y-3">
                        <div>
                          <div className="text-sm font-medium text-white mb-2">Recommended Strategies:</div>
                          <div className="space-y-1">
                            {cohort.recommendedStrategies.slice(0, 2).map((strategy, index) => (
                              <div key={index} className="text-xs text-slate-400 flex items-start">
                                <span className="text-blue-400 mr-2">•</span>
                                {strategy}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Churn Analysis Tab */}
        <TabsContent value="churn" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 text-red-400" />
                  Churn Risk Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">High Risk</span>
                    <span className="text-sm font-semibold text-red-400">{churnPrediction.highRisk} subscribers</span>
                  </div>
                  <Progress value={(churnPrediction.highRisk / totalAnalyzed) * 100} className="h-2" />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Medium Risk</span>
                    <span className="text-sm font-semibold text-yellow-400">{churnPrediction.mediumRisk} subscribers</span>
                  </div>
                  <Progress value={(churnPrediction.mediumRisk / totalAnalyzed) * 100} className="h-2" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Low Risk</span>
                    <span className="text-sm font-semibold text-green-400">{churnPrediction.lowRisk} subscribers</span>
                  </div>
                  <Progress value={(churnPrediction.lowRisk / totalAnalyzed) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Target className="w-5 h-5 mr-2 text-blue-400" />
                  Retention Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {churnPrediction.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start space-x-2 text-sm text-slate-300">
                      <span className="text-blue-400 mt-1">•</span>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Email Sharpening Tab */}
        <TabsContent value="sharpening" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Zap className="w-5 h-5 mr-2 text-yellow-400" />
                AI-Powered Email Sharpening Results
              </CardTitle>
              <p className="text-slate-400">Precision-targeted content for each subscriber cohort</p>
            </CardHeader>
            <CardContent>
              {sharpenEmailMutation.data?.data?.sharpenedEmails ? (
                <div className="space-y-4">
                  {sharpenEmailMutation.data.data.sharpenedEmails.map((email: any, index: number) => (
                    <Card key={index} className="bg-slate-900/50 border-slate-600/50">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg text-white">{email.cohortName}</CardTitle>
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            {email.sharpening.predictedOpenRate.toFixed(1)}% predicted open rate
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <div className="text-sm font-medium text-white mb-1">Personalized Subject:</div>
                          <div className="text-sm text-blue-400 bg-blue-500/10 p-2 rounded">
                            {email.sharpening.personalizedSubject}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm font-medium text-white mb-1">Optimal Send Time:</div>
                          <div className="text-sm text-green-400">{email.sharpening.optimalSendTime}</div>
                        </div>
                        
                        <div>
                          <div className="text-sm font-medium text-white mb-1">Personalization Strategy:</div>
                          <div className="text-xs text-slate-400">{email.sharpening.reasoning}</div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <div className="text-center">
                            <div className="text-lg font-semibold text-white">
                              {email.sharpening.predictedClickRate.toFixed(1)}%
                            </div>
                            <div className="text-xs text-slate-500">Predicted Click Rate</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-blue-400">
                              {email.sharpening.personalizedCTA}
                            </div>
                            <div className="text-xs text-slate-500">Call to Action</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Mail className="w-16 h-16 mx-auto mb-4 text-slate-500" />
                  <h3 className="text-lg font-semibold text-white mb-2">Email Sharpening Ready</h3>
                  <p className="text-slate-400 mb-4">Click "Demo Email Sharpening" to see AI personalization in action</p>
                  <Button onClick={handleEmailSharpening} disabled={isAnalyzing} className="bg-blue-600 hover:bg-blue-700">
                    <Zap className="w-4 h-4 mr-2" />
                    {isAnalyzing ? 'Processing...' : 'Try Email Sharpening'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
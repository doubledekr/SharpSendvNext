import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown, 
  Newspaper, 
  FileText, 
  Plus, 
  Eye, 
  Send, 
  BarChart3,
  Clock,
  Users,
  Target,
  Globe,
  Lightbulb,
  CheckCircle,
  AlertTriangle
} from "lucide-react";

interface Publication {
  id: string;
  title: string;
  url: string;
  cadence: string;
  topicTags: string[];
  isActive: boolean;
}

interface MasterEmail {
  id: string;
  title: string;
  status: string;
  emailType: string;
  createdAt: string;
  publicationId?: string;
}

interface NewsBundle {
  sentimentScore: number;
  topNarratives: string[];
  watchlistDeltas: Record<string, number>;
  suggestedTopics: Array<{
    topic: string;
    relevance: number;
    publicationId?: string;
    segmentIds?: string[];
  }>;
}

interface Segment {
  id: string;
  name: string;
  subscriberCount: number;
  isDetected: boolean;
}

export default function VNextDashboard() {
  const [selectedPublication, setSelectedPublication] = useState<string | null>(null);

  // Fetch publications
  const { data: publications = [] } = useQuery<Publication[]>({
    queryKey: ["/api/vnext/publications", "demo-publisher"],
  });

  // Fetch master emails
  const { data: masterEmails = [] } = useQuery<MasterEmail[]>({
    queryKey: ["/api/vnext/emails/master", "demo-publisher"],
  });

  // Fetch NA news bundle
  const { data: newsBundle } = useQuery<NewsBundle>({
    queryKey: ["/api/vnext/news/na/bundle", "demo-publisher"],
  });

  // Fetch segments
  const { data: segments = [] } = useQuery<Segment[]>({
    queryKey: ["/api/vnext/segments", "demo-publisher"],
  });

  const getSentimentColor = (score: number) => {
    if (score > 0.1) return "text-green-600";
    if (score < -0.1) return "text-red-600";
    return "text-yellow-600";
  };

  const getSentimentIcon = (score: number) => {
    if (score > 0.1) return <TrendingUp className="w-4 h-4" />;
    if (score < -0.1) return <TrendingDown className="w-4 h-4" />;
    return <BarChart3 className="w-4 h-4" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "bg-gray-100 text-gray-800";
      case "variants_generated": return "bg-blue-100 text-blue-800";
      case "ready_to_send": return "bg-green-100 text-green-800";
      case "sent": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getEmailTypeIcon = (type: string) => {
    switch (type) {
      case "marketing": return <Target className="w-4 h-4" />;
      case "editorial": return <Newspaper className="w-4 h-4" />;
      case "fulfillment": return <Users className="w-4 h-4" />;
      case "paid_fulfillment": return <AlertTriangle className="w-4 h-4" />;
      case "engagement": return <Globe className="w-4 h-4" />;
      case "operational": return <CheckCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6" data-testid="page-vnext-dashboard">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center" data-testid="header-dashboard">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" data-testid="title-dashboard">
              SharpSend vNext
            </h1>
            <p className="text-gray-600" data-testid="desc-dashboard">
              AI-powered newsletter platform for micro-publishers
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" data-testid="button-view-analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </Button>
            <Button data-testid="button-new-master">
              <Plus className="w-4 h-4 mr-2" />
              New Master Email
            </Button>
          </div>
        </div>

        {/* Market Pulse Section */}
        {newsBundle && (
          <Card data-testid="card-market-pulse">
            <CardHeader>
              <CardTitle className="flex items-center" data-testid="title-market-pulse">
                <TrendingUp className="w-5 h-5 mr-2" />
                North American Market Pulse
              </CardTitle>
              <CardDescription data-testid="desc-market-pulse">
                Today's sentiment and trending topics for your content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Sentiment Score */}
                <div className="space-y-2" data-testid="card-sentiment">
                  <div className="flex items-center space-x-2">
                    {getSentimentIcon(newsBundle.sentimentScore)}
                    <span className="text-sm font-medium" data-testid="label-sentiment">Market Sentiment</span>
                  </div>
                  <p className={`text-2xl font-bold ${getSentimentColor(newsBundle.sentimentScore)}`} data-testid="text-sentiment-score">
                    {(newsBundle.sentimentScore * 100).toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-600" data-testid="text-sentiment-desc">
                    {newsBundle.sentimentScore > 0.1 ? "Bullish" : newsBundle.sentimentScore < -0.1 ? "Bearish" : "Neutral"}
                  </p>
                </div>

                {/* Watchlist Changes */}
                <div className="space-y-2" data-testid="card-watchlist">
                  <span className="text-sm font-medium" data-testid="label-watchlist">Watchlist Deltas</span>
                  <div className="space-y-1">
                    {Object.entries(newsBundle.watchlistDeltas || {}).slice(0, 4).map(([symbol, delta]) => (
                      <div key={symbol} className="flex justify-between items-center" data-testid={`watchlist-item-${symbol}`}>
                        <span className="text-sm font-mono" data-testid={`text-symbol-${symbol}`}>{symbol}</span>
                        <span className={`text-sm font-medium ${delta > 0 ? 'text-green-600' : 'text-red-600'}`} data-testid={`text-delta-${symbol}`}>
                          {delta > 0 ? '+' : ''}{delta.toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Narratives */}
                <div className="space-y-2" data-testid="card-narratives">
                  <span className="text-sm font-medium" data-testid="label-narratives">Top Narratives</span>
                  <div className="space-y-1">
                    {newsBundle.topNarratives?.slice(0, 3).map((narrative, index) => (
                      <p key={index} className="text-sm text-gray-700" data-testid={`text-narrative-${index}`}>
                        • {narrative}
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              {/* Suggested Topics */}
              <div className="mt-6" data-testid="card-suggested-topics">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium" data-testid="label-suggested-topics">Suggested Topics</span>
                  <Button size="sm" variant="ghost" data-testid="button-refresh-topics">
                    <Clock className="w-4 h-4 mr-1" />
                    Refresh
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {newsBundle.suggestedTopics?.map((topic, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="h-auto p-2 text-left"
                      data-testid={`button-topic-${index}`}
                    >
                      <div className="flex items-center space-x-2">
                        <Lightbulb className="w-3 h-3" />
                        <span>{topic.topic}</span>
                        <Badge variant="secondary" className="text-xs" data-testid={`badge-relevance-${index}`}>
                          {Math.round(topic.relevance * 100)}%
                        </Badge>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="drafts" className="space-y-4" data-testid="tabs-main">
          <TabsList className="grid w-full grid-cols-3" data-testid="tabs-list">
            <TabsTrigger value="drafts" data-testid="tab-drafts">
              <FileText className="w-4 h-4 mr-2" />
              Drafts ({masterEmails.length})
            </TabsTrigger>
            <TabsTrigger value="publications" data-testid="tab-publications">
              <Newspaper className="w-4 h-4 mr-2" />
              Publications ({publications.length})
            </TabsTrigger>
            <TabsTrigger value="segments" data-testid="tab-segments">
              <Users className="w-4 h-4 mr-2" />
              Segments ({segments.length})
            </TabsTrigger>
          </TabsList>

          {/* Drafts Tab */}
          <TabsContent value="drafts" className="space-y-4" data-testid="content-drafts">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold" data-testid="title-drafts">Master Emails & Drafts</h2>
              <Button data-testid="button-new-draft">
                <Plus className="w-4 h-4 mr-2" />
                Create Master Email
              </Button>
            </div>
            
            {masterEmails.length === 0 ? (
              <Card data-testid="card-empty-drafts">
                <CardContent className="p-8 text-center">
                  <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2" data-testid="title-empty-drafts">
                    No drafts yet
                  </h3>
                  <p className="text-gray-600 mb-4" data-testid="desc-empty-drafts">
                    Create your first master email to generate personalized variants for your segments
                  </p>
                  <Button data-testid="button-create-first">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Master Email
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4" data-testid="grid-drafts">
                {masterEmails.map((email) => (
                  <Card key={email.id} className="hover:shadow-md transition-shadow" data-testid={`card-draft-${email.id}`}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            {getEmailTypeIcon(email.emailType)}
                            <h3 className="text-lg font-medium" data-testid={`text-draft-title-${email.id}`}>
                              {email.title}
                            </h3>
                            <Badge className={getStatusColor(email.status)} data-testid={`badge-status-${email.id}`}>
                              {email.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span data-testid={`text-type-${email.id}`}>
                              Type: {email.emailType.replace('_', ' ')}
                            </span>
                            <span data-testid={`text-created-${email.id}`}>
                              Created: {new Date(email.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          {email.status === "draft" && (
                            <Button size="sm" variant="outline" data-testid={`button-generate-${email.id}`}>
                              Generate Variants
                            </Button>
                          )}
                          {email.status === "variants_generated" && (
                            <Button size="sm" data-testid={`button-review-${email.id}`}>
                              <Eye className="w-4 h-4 mr-1" />
                              Review
                            </Button>
                          )}
                          {email.status === "ready_to_send" && (
                            <Button size="sm" data-testid={`button-send-${email.id}`}>
                              <Send className="w-4 h-4 mr-1" />
                              Send
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Publications Tab */}
          <TabsContent value="publications" className="space-y-4" data-testid="content-publications">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold" data-testid="title-publications">Publications</h2>
              <Button variant="outline" data-testid="button-detect-more">
                <Globe className="w-4 h-4 mr-2" />
                Detect More
              </Button>
            </div>

            {publications.length === 0 ? (
              <Card data-testid="card-empty-publications">
                <CardContent className="p-8 text-center">
                  <Newspaper className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2" data-testid="title-empty-publications">
                    No publications detected
                  </h3>
                  <p className="text-gray-600 mb-4" data-testid="desc-empty-publications">
                    Run publication detection on your domain to discover newsletters and content series
                  </p>
                  <Button data-testid="button-run-detection">
                    <Globe className="w-4 h-4 mr-2" />
                    Run Publication Detection
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4" data-testid="grid-publications">
                {publications.map((pub) => (
                  <Card key={pub.id} className="hover:shadow-md transition-shadow" data-testid={`card-publication-${pub.id}`}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium mb-2" data-testid={`text-pub-title-${pub.id}`}>
                            {pub.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-3" data-testid={`text-pub-url-${pub.id}`}>
                            {pub.url}
                          </p>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" data-testid={`badge-cadence-${pub.id}`}>
                              {pub.cadence}
                            </Badge>
                            {pub.topicTags.map((tag, index) => (
                              <Badge key={index} variant="secondary" data-testid={`badge-tag-${pub.id}-${index}`}>
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" data-testid={`button-create-for-${pub.id}`}>
                            Create Master Email
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Segments Tab */}
          <TabsContent value="segments" className="space-y-4" data-testid="content-segments">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold" data-testid="title-segments">Email Segments</h2>
              <Button data-testid="button-new-segment">
                <Plus className="w-4 h-4 mr-2" />
                Create Segment
              </Button>
            </div>

            {segments.length === 0 ? (
              <Card data-testid="card-empty-segments">
                <CardContent className="p-8 text-center">
                  <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2" data-testid="title-empty-segments">
                    No segments configured
                  </h3>
                  <p className="text-gray-600 mb-4" data-testid="desc-empty-segments">
                    Connect your ESP to detect existing segments or create custom ones
                  </p>
                  <Button data-testid="button-setup-segments">
                    <Users className="w-4 h-4 mr-2" />
                    Setup Segments
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4" data-testid="grid-segments">
                {segments.map((segment) => (
                  <Card key={segment.id} className="hover:shadow-md transition-shadow" data-testid={`card-segment-${segment.id}`}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-medium" data-testid={`text-segment-name-${segment.id}`}>
                              {segment.name}
                            </h3>
                            <Badge variant={segment.isDetected ? "secondary" : "outline"} data-testid={`badge-type-${segment.id}`}>
                              {segment.isDetected ? "Detected" : "Custom"}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600" data-testid={`text-segment-count-${segment.id}`}>
                            {segment.subscriberCount.toLocaleString()} subscribers
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" data-testid={`button-edit-segment-${segment.id}`}>
                            Edit
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Quick Stats Footer */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4" data-testid="grid-stats">
          <Card data-testid="card-stat-publications">
            <CardContent className="p-4 text-center">
              <Newspaper className="w-8 h-8 mx-auto text-blue-600 mb-2" />
              <p className="text-2xl font-bold" data-testid="text-stat-publications">{publications.length}</p>
              <p className="text-sm text-gray-600" data-testid="label-stat-publications">Publications</p>
            </CardContent>
          </Card>
          
          <Card data-testid="card-stat-drafts">
            <CardContent className="p-4 text-center">
              <FileText className="w-8 h-8 mx-auto text-green-600 mb-2" />
              <p className="text-2xl font-bold" data-testid="text-stat-drafts">{masterEmails.length}</p>
              <p className="text-sm text-gray-600" data-testid="label-stat-drafts">Master Emails</p>
            </CardContent>
          </Card>
          
          <Card data-testid="card-stat-segments">
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 mx-auto text-purple-600 mb-2" />
              <p className="text-2xl font-bold" data-testid="text-stat-segments">{segments.length}</p>
              <p className="text-sm text-gray-600" data-testid="label-stat-segments">Segments</p>
            </CardContent>
          </Card>
          
          <Card data-testid="card-stat-reach">
            <CardContent className="p-4 text-center">
              <Target className="w-8 h-8 mx-auto text-orange-600 mb-2" />
              <p className="text-2xl font-bold" data-testid="text-stat-reach">
                {segments.reduce((sum, s) => sum + s.subscriberCount, 0).toLocaleString()}
              </p>
              <p className="text-sm text-gray-600" data-testid="label-stat-reach">Total Reach</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
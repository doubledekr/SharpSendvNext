import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, Users, Sparkles, TrendingUp, MousePointer, 
  DollarSign, Clock, Target, ChevronRight, Plus
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";

interface SuggestedSegment {
  id: string;
  name: string;
  type: "behavior" | "engagement" | "value" | "sentiment";
  size: number;
  confidence: number;
  description: string;
  criteria: string[];
  potentialRevenue?: number;
}

export default function VNextAutoSegmentation() {
  const [adoptedSegments, setAdoptedSegments] = useState<string[]>([]);
  
  // Check if this is a demo account
  const isDemoAccount = () => {
    const user = localStorage.getItem('user');
    if (!user) return false;
    try {
      const userData = JSON.parse(user);
      return userData.id === 'demo-user' || userData.id === 'demo-user-id';
    } catch {
      return false;
    }
  };
  
  // Fetch real segments from API for non-demo accounts
  const { data: realSegments = [] } = useQuery<SuggestedSegment[]>({
    queryKey: ["/api/segments/suggested"],
    retry: false,
    enabled: !isDemoAccount(),
  });
  
  // Mock data only for demo accounts
  const demoSegments: SuggestedSegment[] = [
    {
      id: "seg_001",
      name: "High CTR Low Conversion",
      type: "behavior",
      size: 3200,
      confidence: 92,
      description: "Engaged readers who browse but rarely purchase",
      criteria: [
        "CTR > 25% on promotional emails",
        "Conversion rate < 2%",
        "Opens 80%+ of emails"
      ],
      potentialRevenue: 45000
    },
    {
      id: "seg_002",
      name: "Premium Offer Browsers",
      type: "value",
      size: 1850,
      confidence: 88,
      description: "Clicked premium offers 3x+ but never converted",
      criteria: [
        "Clicked premium CTAs 3+ times",
        "No premium purchases",
        "Account age > 6 months"
      ],
      potentialRevenue: 125000
    },
    {
      id: "seg_003",
      name: "Bullish Headline Lovers",
      type: "sentiment",
      size: 5400,
      confidence: 85,
      description: "Always opens bullish market sentiment headlines",
      criteria: [
        "Opens 90%+ bullish subject lines",
        "Opens <30% bearish headlines",
        "Active during market rallies"
      ]
    },
    {
      id: "seg_004",
      name: "Morning Power Users",
      type: "engagement",
      size: 2100,
      confidence: 94,
      description: "Highly engaged pre-market readers",
      criteria: [
        "Opens emails 6-9 AM EST",
        "Engagement rate > 75%",
        "Clicks within 5 min of open"
      ]
    }
  ];
  
  // Use demo data for demo accounts, real data for real accounts
  const suggestedSegments = isDemoAccount() ? demoSegments : realSegments;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "behavior": return <MousePointer className="h-4 w-4" />;
      case "engagement": return <Clock className="h-4 w-4" />;
      case "value": return <DollarSign className="h-4 w-4" />;
      case "sentiment": return <TrendingUp className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "behavior": return "bg-blue-500";
      case "engagement": return "bg-green-500";
      case "value": return "bg-purple-500";
      case "sentiment": return "bg-orange-500";
      default: return "bg-gray-500";
    }
  };

  const adoptSegment = (segmentId: string) => {
    setAdoptedSegments([...adoptedSegments, segmentId]);
  };

  return (
    <div className="space-y-6">
      {/* AI Detection Status */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Auto-Segmentation Engine
              </CardTitle>
              <CardDescription>
                AI continuously analyzes pixel + ESP data to suggest micro-segments
              </CardDescription>
            </div>
            {suggestedSegments.length > 0 && (
              <Badge variant="default" className="gap-1">
                <Sparkles className="h-3 w-3" />
                {suggestedSegments.length} New Segments Found
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Suggested Segments */}
      {suggestedSegments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No AI-detected segments yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Start sending campaigns to discover segments
            </p>
          </CardContent>
        </Card>
      ) : (
      <div className="grid gap-4">
        {suggestedSegments.map((segment) => (
          <Card key={segment.id} className={adoptedSegments.includes(segment.id) ? "opacity-50" : ""}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getTypeColor(segment.type)} text-white`}>
                    {getTypeIcon(segment.type)}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{segment.name}</CardTitle>
                    <CardDescription>{segment.description}</CardDescription>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{segment.size.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">subscribers</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>AI Confidence</span>
                  <span className="font-semibold">{segment.confidence}%</span>
                </div>
                <Progress value={segment.confidence} className="h-2" />
              </div>
              
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Segment Criteria:</p>
                <ul className="space-y-1">
                  {segment.criteria.map((criterion, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-1">
                      <span className="text-green-600 mt-0.5">•</span>
                      {criterion}
                    </li>
                  ))}
                </ul>
              </div>
              
              {segment.potentialRevenue && (
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-lg">
                  <span className="text-sm font-medium">Potential Revenue</span>
                  <span className="text-lg font-bold text-purple-600">
                    ${segment.potentialRevenue.toLocaleString()}
                  </span>
                </div>
              )}
              
              <div className="flex gap-2">
                {adoptedSegments.includes(segment.id) ? (
                  <Button className="flex-1" disabled>
                    <Plus className="h-4 w-4 mr-2" />
                    Segment Adopted
                  </Button>
                ) : (
                  <>
                    <Button 
                      className="flex-1"
                      onClick={() => adoptSegment(segment.id)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adopt Segment
                    </Button>
                    <Button variant="outline">
                      <Target className="h-4 w-4 mr-2" />
                      Generate Campaign
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2">
          <Button variant="outline" className="justify-start">
            <Brain className="h-4 w-4 mr-2" />
            Run Deep Analysis
          </Button>
          <Button variant="outline" className="justify-start">
            <Users className="h-4 w-4 mr-2" />
            Merge Similar Segments
          </Button>
          <Button variant="outline" className="justify-start">
            <Target className="h-4 w-4 mr-2" />
            Test Segment Overlap
          </Button>
          <Button variant="outline" className="justify-start">
            <Sparkles className="h-4 w-4 mr-2" />
            Generate All Campaigns
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
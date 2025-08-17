import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Wand2, 
  Brain, 
  Target, 
  Zap, 
  Settings, 
  Send, 
  Eye, 
  RefreshCw,
  Edit,
  Loader2
} from "lucide-react";

export default function PersonalizationTab() {
  const [topic, setTopic] = useState("");
  const [segment, setSegment] = useState("High-Value Investors");
  const [brief, setBrief] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingSubjects, setIsGeneratingSubjects] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [generatedSubjects, setGeneratedSubjects] = useState<any[]>([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const { toast } = useToast();

  const handleGenerateContent = async () => {
    if (!topic || !brief) {
      toast({
        title: "Missing Information",
        description: "Please enter a topic and content brief",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Simulate API call with timeout
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Set generated content
      setGeneratedContent({
        subject: "🚨 Fed Decision: Your Portfolio Impact Analysis",
        content: `Dear ${segment},\n\nToday's Federal Reserve decision will directly impact your portfolio strategy. Based on your investment profile and current holdings, here's your personalized analysis:\n\nKey Insights for Your Portfolio:\n• Your tech holdings may see 12-15% volatility\n• Consider rebalancing your bond allocation\n• Dividend stocks in your watchlist show opportunity`,
        segment: segment,
        topic: topic
      });

      toast({
        title: "Success!",
        description: "Personalized content has been generated",
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateSubjects = async () => {
    if (!topic) {
      toast({
        title: "Missing Topic",
        description: "Please enter a newsletter topic first",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingSubjects(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setGeneratedSubjects([
        { text: `🚨 ${topic}: Your Portfolio Impact Analysis`, score: 94 },
        { text: `Breaking: How Today's ${topic} Affects Your Investments`, score: 89 },
        { text: `Exclusive: ${topic} Insider Analysis for Premium Investors`, score: 87 },
        { text: `Market Alert: Position Your Portfolio for ${topic}`, score: 82 }
      ]);

      toast({
        title: "Subject Lines Generated",
        description: "4 optimized subject lines created",
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate subject lines",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingSubjects(false);
    }
  };
  return (
    <div className="space-y-8">
      {/* AI Content Generator */}
      <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-card-foreground flex items-center space-x-3">
            <Brain className="h-6 w-6" />
            <span>AI Content Personalization Engine</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-2">Newsletter Topic</label>
              <Input 
                placeholder="e.g., Federal Reserve Interest Rate Decision" 
                className="bg-input border-border text-foreground"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                data-testid="input-newsletter-topic"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-2">Target Segment</label>
              <select 
                className="w-full p-3 bg-input border border-border rounded-md text-foreground" 
                value={segment}
                onChange={(e) => setSegment(e.target.value)}
                data-testid="select-target-segment"
              >
                <option>High-Value Investors</option>
                <option>Medium-Engagement</option>
                <option>New Subscribers</option>
                <option>At-Risk</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-2">Content Brief</label>
            <Textarea 
              placeholder="Describe the key points you want to cover..." 
              className="bg-input border-border text-foreground min-h-[100px]"
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              data-testid="textarea-content-brief"
            />
          </div>

          <div className="flex space-x-4">
            <Button 
              className="bg-brand-blue hover:bg-brand-blue/90" 
              onClick={handleGenerateContent}
              disabled={isGenerating}
              data-testid="button-generate-content"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generate Personalized Content
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleGenerateSubjects}
              disabled={isGeneratingSubjects}
              data-testid="button-generate-subjects"
            >
              {isGeneratingSubjects ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Target className="h-4 w-4 mr-2" />
                  Generate Subject Lines
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Generated Content Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-card-foreground">Generated Subject Lines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(generatedSubjects.length > 0 ? generatedSubjects : [
                { text: "🚨 Fed Decision: Your Portfolio Impact Analysis", score: 94 },
                { text: "Breaking: How Today's Rate Cut Affects Your Investments", score: 89 },
                { text: "Exclusive: Fed Meeting Insider Analysis for Premium Investors", score: 87 },
                { text: "Market Alert: Position Your Portfolio Before Tomorrow", score: 82 }
              ]).map((subject, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg hover:border-primary/50 transition-colors" data-testid={`card-subject-line-${index}`}>
                  <span className="text-card-foreground text-sm">{subject.text}</span>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                      {subject.score}%
                    </Badge>
                    <Button size="sm" variant="ghost" data-testid={`button-use-subject-${index}`}>
                      <Send className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-card-foreground">Content Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-muted border border-border rounded-lg">
                <div className="text-muted-foreground text-sm space-y-2">
                  {generatedContent ? (
                    <>
                      <p><strong className="text-foreground">Subject: {generatedContent.subject}</strong></p>
                      <div className="whitespace-pre-wrap">{generatedContent.content}</div>
                    </>
                  ) : (
                    <>
                      <p><strong className="text-foreground">Dear High-Value Investor,</strong></p>
                      <p>Today's Federal Reserve decision will directly impact your portfolio strategy. Based on your investment profile and current holdings, here's your personalized analysis:</p>
                      <p><strong className="text-primary">Key Insights for Your Portfolio:</strong></p>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>Your tech holdings may see 12-15% volatility</li>
                        <li>Consider rebalancing your bond allocation</li>
                        <li>Dividend stocks in your watchlist show opportunity</li>
                      </ul>
                    </>
                  )}
                </div>
              </div>
              <div className="flex space-x-3">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setShowPreviewModal(true)}
                  data-testid="button-preview-content"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Full Preview
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleGenerateContent}
                  disabled={isGenerating}
                  data-testid="button-regenerate-content"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerate
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Personalization Settings */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-card-foreground flex items-center space-x-3">
            <Settings className="h-6 w-6" />
            <span>AI Personalization Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div>
              <h4 className="text-lg font-semibold text-card-foreground mb-4">Tone & Style</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Professional Level</span>
                  <Badge variant="secondary">Expert</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Urgency Factor</span>
                  <Badge variant="secondary">Medium</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Personalization Depth</span>
                  <Badge variant="secondary">High</Badge>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-card-foreground mb-4">Content Focus</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Market Analysis</span>
                  <Badge variant="secondary" className="bg-green-500/20 text-green-400">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Portfolio Recommendations</span>
                  <Badge variant="secondary" className="bg-green-500/20 text-green-400">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Risk Assessments</span>
                  <Badge variant="secondary" className="bg-green-500/20 text-green-400">Enabled</Badge>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-card-foreground mb-4">Performance Metrics</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">AI Engagement Boost</span>
                  <span className="text-green-400">+34.7%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Click-through Rate</span>
                  <span className="text-green-400">+28.3%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Revenue Impact</span>
                  <span className="text-green-400">+$47K/month</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
              <Zap className="text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-card-foreground mb-2">Smart Personalization Insights</h3>
              <div className="space-y-2 text-muted-foreground">
                <p>• High-value investors respond 47% better to exclusive market analysis content</p>
                <p>• Tuesday morning sends show 23% higher engagement for financial newsletters</p>
                <p>• Personalized stock mentions increase click-through rates by 34%</p>
                <p>• Risk-focused content performs best with subscribers over 45 years old</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Full Preview Modal */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Content Preview</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold text-lg mb-2">
                {generatedContent?.subject || "🚨 Fed Decision: Your Portfolio Impact Analysis"}
              </h3>
              <div className="whitespace-pre-wrap text-sm">
                {generatedContent?.content || `Dear High-Value Investor,

Today's Federal Reserve decision will directly impact your portfolio strategy. Based on your investment profile and current holdings, here's your personalized analysis:

Key Insights for Your Portfolio:
• Your tech holdings may see 12-15% volatility
• Consider rebalancing your bond allocation
• Dividend stocks in your watchlist show opportunity

Market Analysis:
The Fed's decision to maintain current rates signals continued uncertainty in the market. Our AI analysis suggests portfolio adjustments for your specific risk profile.

Recommended Actions:
1. Review your tech sector exposure
2. Consider defensive positions in consumer staples
3. Evaluate bond duration risk

Best regards,
Your SharpSend Team`}
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowPreviewModal(false)}>
                Close
              </Button>
              <Button className="bg-brand-blue hover:bg-brand-blue/90">
                Send Email
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
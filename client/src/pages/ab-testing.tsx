import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  FlaskConical, 
  Plus, 
  Play, 
  Pause, 
  BarChart3,
  Users,
  Target,
  Mail,
  TrendingUp,
  Award,
  AlertCircle,
  Copy,
  Edit,
  Trash2
} from "lucide-react";

export function ABTestingDashboard() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [newTest, setNewTest] = useState({
    name: "",
    description: "",
    testType: "email_content",
    targetSegment: "all",
    variants: [
      { name: "Control", weight: 20, content: "" },
      { name: "Variant A", weight: 20, content: "" },
      { name: "Variant B", weight: 20, content: "" },
      { name: "Variant C", weight: 20, content: "" },
      { name: "Variant D", weight: 20, content: "" }
    ],
    successMetric: "open_rate",
    minimumSampleSize: 1000,
    confidenceLevel: 95
  });

  // Fetch active tests
  const { data: activeTests = [], isLoading } = useQuery({
    queryKey: ["/api/ab-tests"],
  });

  // Fetch segments for targeting
  const { data: segments = [] } = useQuery({
    queryKey: ["/api/segments"],
  });

  // Create new test
  const createTestMutation = useMutation({
    mutationFn: async (testData: any) => {
      const response = await fetch("/api/ab-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testData)
      });
      if (!response.ok) throw new Error("Failed to create test");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ab-tests"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Test Created",
        description: "Your A/B test has been created and is ready to run.",
      });
      resetNewTest();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create test. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Start/stop test
  const toggleTestMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "start" | "stop" }) => {
      const response = await fetch(`/api/ab-tests/${id}/${action}`, {
        method: "POST"
      });
      if (!response.ok) throw new Error(`Failed to ${action} test`);
      return response.json();
    },
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/ab-tests"] });
      toast({
        title: action === "start" ? "Test Started" : "Test Stopped",
        description: `The A/B test has been ${action}ed successfully.`,
      });
    }
  });

  const resetNewTest = () => {
    setNewTest({
      name: "",
      description: "",
      testType: "email_content",
      targetSegment: "all",
      variants: [
        { name: "Control", weight: 20, content: "" },
        { name: "Variant A", weight: 20, content: "" },
        { name: "Variant B", weight: 20, content: "" },
        { name: "Variant C", weight: 20, content: "" },
        { name: "Variant D", weight: 20, content: "" }
      ],
      successMetric: "open_rate",
      minimumSampleSize: 1000,
      confidenceLevel: 95
    });
  };

  const addVariant = () => {
    if (newTest.variants.length < 10) {
      const variantLetter = String.fromCharCode(65 + newTest.variants.length - 1);
      setNewTest({
        ...newTest,
        variants: [
          ...newTest.variants,
          { name: `Variant ${variantLetter}`, weight: 0, content: "" }
        ]
      });
      rebalanceWeights();
    }
  };

  const removeVariant = (index: number) => {
    if (newTest.variants.length > 2) {
      const updatedVariants = newTest.variants.filter((_, i) => i !== index);
      setNewTest({ ...newTest, variants: updatedVariants });
      rebalanceWeights();
    }
  };

  const rebalanceWeights = () => {
    const equalWeight = Math.floor(100 / newTest.variants.length);
    const remainder = 100 - (equalWeight * newTest.variants.length);
    
    const updatedVariants = newTest.variants.map((v, i) => ({
      ...v,
      weight: equalWeight + (i === 0 ? remainder : 0)
    }));
    
    setNewTest({ ...newTest, variants: updatedVariants });
  };

  const updateVariantWeight = (index: number, weight: number) => {
    const updatedVariants = [...newTest.variants];
    updatedVariants[index].weight = weight;
    setNewTest({ ...newTest, variants: updatedVariants });
  };

  const getTotalWeight = () => {
    return newTest.variants.reduce((sum, v) => sum + v.weight, 0);
  };

  // Mock data for demonstration
  const mockTests = [
    {
      id: "1",
      name: "Subject Line Optimization - Q1 Market Report",
      status: "running",
      testType: "email_subject",
      variants: [
        { name: "Control", sent: 2500, opens: 625, clicks: 125, conversions: 25, revenue: 5000 },
        { name: "Variant A", sent: 2500, opens: 750, clicks: 180, conversions: 36, revenue: 7200 },
        { name: "Variant B", sent: 2500, opens: 700, clicks: 160, conversions: 32, revenue: 6400 },
        { name: "Variant C", sent: 2500, opens: 800, clicks: 200, conversions: 45, revenue: 9000, isWinner: true },
        { name: "Variant D", sent: 2500, opens: 650, clicks: 140, conversions: 28, revenue: 5600 },
      ],
      startDate: "2025-01-15",
      totalSent: 12500,
      confidence: 98.5,
      targetSegment: "High-Value Tech Investors"
    },
    {
      id: "2",
      name: "CTA Button Color Test",
      status: "completed",
      testType: "email_content",
      variants: [
        { name: "Control (Blue)", sent: 1000, opens: 250, clicks: 50, conversions: 10, revenue: 2000 },
        { name: "Green", sent: 1000, opens: 260, clicks: 65, conversions: 13, revenue: 2600 },
        { name: "Red", sent: 1000, opens: 255, clicks: 70, conversions: 15, revenue: 3000, isWinner: true },
        { name: "Orange", sent: 1000, opens: 245, clicks: 55, conversions: 11, revenue: 2200 },
        { name: "Purple", sent: 1000, opens: 250, clicks: 52, conversions: 10, revenue: 2000 },
      ],
      startDate: "2025-01-10",
      endDate: "2025-01-14",
      totalSent: 5000,
      confidence: 95.2,
      targetSegment: "All Subscribers"
    }
  ];

  const testsToDisplay = activeTests.length > 0 ? activeTests : mockTests;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FlaskConical className="w-8 h-8 text-purple-600" />
            A/B Testing Center
          </h1>
          <p className="text-muted-foreground mt-1">
            Run multi-variant tests across your entire subscriber population
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create New Test
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create A/B/C/D/E Test</DialogTitle>
              <DialogDescription>
                Set up a multi-variant test to optimize your email performance
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Test Name</Label>
                  <Input
                    value={newTest.name}
                    onChange={(e) => setNewTest({ ...newTest, name: e.target.value })}
                    placeholder="e.g., Q1 Subject Line Test"
                  />
                </div>
                <div>
                  <Label>Test Type</Label>
                  <Select value={newTest.testType} onValueChange={(v) => setNewTest({ ...newTest, testType: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email_subject">Subject Line</SelectItem>
                      <SelectItem value="email_content">Email Content</SelectItem>
                      <SelectItem value="send_time">Send Time</SelectItem>
                      <SelectItem value="sender_name">Sender Name</SelectItem>
                      <SelectItem value="cta_button">CTA Button</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={newTest.description}
                  onChange={(e) => setNewTest({ ...newTest, description: e.target.value })}
                  placeholder="Describe what you're testing and why"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Target Segment</Label>
                  <Select value={newTest.targetSegment} onValueChange={(v) => setNewTest({ ...newTest, targetSegment: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Subscribers</SelectItem>
                      {segments.map((segment: any) => (
                        <SelectItem key={segment.id} value={segment.id}>
                          {segment.name} ({segment.subscriberCount} subscribers)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Success Metric</Label>
                  <Select value={newTest.successMetric} onValueChange={(v) => setNewTest({ ...newTest, successMetric: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open_rate">Open Rate</SelectItem>
                      <SelectItem value="click_rate">Click Rate</SelectItem>
                      <SelectItem value="conversion_rate">Conversion Rate</SelectItem>
                      <SelectItem value="revenue">Revenue</SelectItem>
                      <SelectItem value="engagement_score">Engagement Score</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Test Variants ({newTest.variants.length})</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addVariant}
                    disabled={newTest.variants.length >= 10}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Variant
                  </Button>
                </div>
                <div className="space-y-2">
                  {newTest.variants.map((variant, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 border rounded">
                      <Input
                        value={variant.name}
                        onChange={(e) => {
                          const updated = [...newTest.variants];
                          updated[index].name = e.target.value;
                          setNewTest({ ...newTest, variants: updated });
                        }}
                        className="w-32"
                        placeholder="Variant name"
                      />
                      <div className="flex items-center gap-1 flex-1">
                        <Input
                          type="number"
                          value={variant.weight}
                          onChange={(e) => updateVariantWeight(index, parseInt(e.target.value) || 0)}
                          className="w-20"
                          min="0"
                          max="100"
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>
                      <Input
                        value={variant.content}
                        onChange={(e) => {
                          const updated = [...newTest.variants];
                          updated[index].content = e.target.value;
                          setNewTest({ ...newTest, variants: updated });
                        }}
                        className="flex-1"
                        placeholder={newTest.testType === "email_subject" ? "Subject line..." : "Brief description..."}
                      />
                      {newTest.variants.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeVariant(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {getTotalWeight() !== 100 && (
                    <div className="flex items-center gap-2 text-sm">
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                      <span className="text-yellow-600">
                        Total weight: {getTotalWeight()}% (must equal 100%)
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={rebalanceWeights}
                      >
                        Auto-balance
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Minimum Sample Size</Label>
                  <Input
                    type="number"
                    value={newTest.minimumSampleSize}
                    onChange={(e) => setNewTest({ ...newTest, minimumSampleSize: parseInt(e.target.value) || 0 })}
                    min="100"
                  />
                </div>
                <div>
                  <Label>Confidence Level (%)</Label>
                  <Select 
                    value={newTest.confidenceLevel.toString()} 
                    onValueChange={(v) => setNewTest({ ...newTest, confidenceLevel: parseInt(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="90">90%</SelectItem>
                      <SelectItem value="95">95%</SelectItem>
                      <SelectItem value="99">99%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => createTestMutation.mutate(newTest)}
                  disabled={!newTest.name || getTotalWeight() !== 100}
                >
                  Create Test
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {testsToDisplay.filter((t: any) => t.status === "running").length}
            </div>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Variants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {testsToDisplay.reduce((sum: number, t: any) => sum + (t.variants?.length || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">Across all tests</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg. Lift</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+24.5%</div>
            <p className="text-xs text-muted-foreground">Winner vs control</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Revenue Impact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+$45,200</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Tests */}
      <div className="space-y-4">
        {testsToDisplay.map((test: any) => (
          <Card key={test.id} className="overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle>{test.name}</CardTitle>
                  <Badge variant={test.status === "running" ? "default" : "secondary"}>
                    {test.status === "running" ? "Running" : "Completed"}
                  </Badge>
                  <Badge variant="outline">{test.testType}</Badge>
                  <Badge variant="outline">
                    <Target className="w-3 h-3 mr-1" />
                    {test.targetSegment}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  {test.status === "running" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleTestMutation.mutate({ id: test.id, action: "stop" })}
                    >
                      <Pause className="w-4 h-4 mr-1" />
                      Stop Test
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleTestMutation.mutate({ id: test.id, action: "start" })}
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Restart
                    </Button>
                  )}
                </div>
              </div>
              <CardDescription>
                Started {test.startDate} • {test.totalSent.toLocaleString()} emails sent • {test.confidence}% confidence
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {test.variants.map((variant: any, index: number) => (
                  <div key={index} className={`p-3 rounded-lg border ${variant.isWinner ? 'border-green-500 bg-green-50 dark:bg-green-950' : ''}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{variant.name}</span>
                        {variant.isWinner && (
                          <Badge className="bg-green-600">
                            <Award className="w-3 h-3 mr-1" />
                            Winner
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span>Sent: {variant.sent.toLocaleString()}</span>
                        <span>Opens: {((variant.opens / variant.sent) * 100).toFixed(1)}%</span>
                        <span>Clicks: {((variant.clicks / variant.opens) * 100).toFixed(1)}%</span>
                        <span>Conv: {((variant.conversions / variant.clicks) * 100).toFixed(1)}%</span>
                        <span className="font-medium">${variant.revenue.toLocaleString()}</span>
                      </div>
                    </div>
                    <Progress 
                      value={(variant.opens / variant.sent) * 100} 
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {testsToDisplay.length === 0 && !isLoading && (
        <Card className="p-12">
          <div className="text-center space-y-3">
            <FlaskConical className="w-12 h-12 mx-auto text-muted-foreground" />
            <h3 className="text-lg font-medium">No A/B Tests Yet</h3>
            <p className="text-muted-foreground">
              Create your first multi-variant test to start optimizing your email performance
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Test
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
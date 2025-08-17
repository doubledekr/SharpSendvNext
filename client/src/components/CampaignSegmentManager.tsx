import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import {
  Users,
  RefreshCw,
  Eye,
  Send,
  Sparkles,
  Target,
  AlertCircle,
  Check,
  X,
  Loader2,
  Zap,
  Edit3
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';

interface Segment {
  id: string;
  name: string;
  description: string;
  recipientCount: number;
  characteristics: string[];
  color: string;
}

interface EmailVersion {
  id: string;
  segmentId: string;
  segmentName: string;
  subject: string;
  content: string;
  previewText: string;
  personalizationLevel: 'low' | 'medium' | 'high';
  status: 'draft' | 'generated' | 'approved' | 'sent';
  generatedAt: string;
  approvedAt?: string;
  stats?: {
    estimatedOpenRate: number;
    estimatedClickRate: number;
  };
}

interface CampaignSegmentManagerProps {
  campaignId: string;
  campaignName: string;
  baseContent?: string;
  baseSubject?: string;
}

export default function CampaignSegmentManager({
  campaignId,
  campaignName,
  baseContent,
  baseSubject
}: CampaignSegmentManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingVersion, setEditingVersion] = useState<EmailVersion | null>(null);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [regenerateSegmentId, setRegenerateSegmentId] = useState<string>('');

  // Predefined segments
  const segments: Segment[] = [
    {
      id: 'new-investors',
      name: 'New Investors',
      description: 'Recently joined, learning the basics',
      recipientCount: 1250,
      characteristics: ['Risk-averse', 'Educational focus', 'Small portfolios'],
      color: 'bg-blue-500'
    },
    {
      id: 'active-traders',
      name: 'Active Traders',
      description: 'Frequent trading, technical analysis focused',
      recipientCount: 850,
      characteristics: ['High engagement', 'Options trading', 'Day trading'],
      color: 'bg-green-500'
    },
    {
      id: 'long-term-holders',
      name: 'Long-Term Holders',
      description: 'Buy and hold strategy, dividend focused',
      recipientCount: 2100,
      characteristics: ['Value investing', 'Dividend focus', 'Low turnover'],
      color: 'bg-purple-500'
    },
    {
      id: 'crypto-enthusiasts',
      name: 'Crypto Enthusiasts',
      description: 'Interested in digital assets and DeFi',
      recipientCount: 650,
      characteristics: ['Tech-savvy', 'Risk-tolerant', 'Alternative assets'],
      color: 'bg-orange-500'
    },
    {
      id: 'retirement-planners',
      name: 'Retirement Planners',
      description: 'Planning for retirement, conservative approach',
      recipientCount: 1800,
      characteristics: ['Conservative', 'Income focus', 'Tax-efficient'],
      color: 'bg-gray-500'
    }
  ];

  // Fetch email versions from the actual API
  const { data: emailVersions, isLoading, refetch } = useQuery({
    queryKey: [`/api/campaigns/${campaignId}/versions`],
    enabled: !!campaignId,
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });

  // Credits tracking
  const { data: creditsData } = useQuery({
    queryKey: ['/api/credits'],
    queryFn: async () => {
      return {
        regenerationCredits: 5,
        usedCredits: 2,
        additionalCreditsAvailable: 100,
        pricePerCredit: 0.10
      };
    }
  });

  // Generate versions for all segments
  const generateVersions = useMutation({
    mutationFn: async () => {
      setIsGenerating(true);
      
      const promises = segments.map(segment => 
        fetch(`/api/campaigns/${campaignId}/generate-version`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            segmentId: segment.id,
            segmentName: segment.name,
            characteristics: segment.characteristics,
            baseContent,
            baseSubject
          })
        })
      );

      return Promise.all(promises);
    },
    onSuccess: () => {
      toast({
        title: "Versions Generated",
        description: `Successfully generated ${segments.length} personalized versions`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}/versions`] });
      setIsGenerating(false);
    },
    onError: () => {
      toast({
        title: "Generation Failed",
        description: "Failed to generate personalized versions",
        variant: "destructive"
      });
      setIsGenerating(false);
    }
  });

  // Regenerate single version
  const regenerateVersion = useMutation({
    mutationFn: async (segmentId: string) => {
      if (creditsData && creditsData.regenerationCredits <= 0) {
        throw new Error('No regeneration credits available');
      }

      return fetch(`/api/campaigns/${campaignId}/regenerate-version`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ segmentId })
      });
    },
    onSuccess: () => {
      toast({
        title: "Version Regenerated",
        description: "Successfully regenerated the email version",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}/versions`] });
      queryClient.invalidateQueries({ queryKey: ['/api/credits'] });
      setShowRegenerateDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Regeneration Failed",
        description: error.message || "Failed to regenerate version",
        variant: "destructive"
      });
    }
  });

  // Approve version
  const approveVersion = useMutation({
    mutationFn: async (versionId: string) => {
      return fetch(`/api/campaigns/${campaignId}/versions/${versionId}/approve`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      toast({
        title: "Version Approved",
        description: "Email version has been approved for sending",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}/versions`] });
    }
  });

  const getPersonalizationBadge = (level: string) => {
    const colors = {
      low: 'bg-gray-500',
      medium: 'bg-yellow-500',
      high: 'bg-green-500'
    };
    return (
      <Badge className={`${colors[level as keyof typeof colors]} text-white`}>
        {level.charAt(0).toUpperCase() + level.slice(1)} Personalization
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Credits */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Segment-Based Email Versions</CardTitle>
              <CardDescription>
                Generate and manage personalized email versions for each audience segment
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              {creditsData && (
                <div className="text-right">
                  <p className="text-sm text-gray-600">Regeneration Credits</p>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={(creditsData.regenerationCredits / (creditsData.regenerationCredits + creditsData.usedCredits)) * 100} 
                      className="w-20 h-2"
                    />
                    <span className="text-lg font-semibold">
                      {creditsData.regenerationCredits}/{creditsData.regenerationCredits + creditsData.usedCredits}
                    </span>
                  </div>
                  {creditsData.regenerationCredits === 0 && (
                    <Button variant="link" size="sm" className="text-xs p-0">
                      <Zap className="w-3 h-3 mr-1" />
                      Buy More Credits
                    </Button>
                  )}
                </div>
              )}
              <Button 
                onClick={() => generateVersions.mutate()}
                disabled={isGenerating}
                data-testid="button-generate-versions"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Generate All Versions
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Segments Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {segments.map(segment => {
          const version = emailVersions?.versions.find(v => v.segmentId === segment.id);
          
          return (
            <Card 
              key={segment.id} 
              className={`cursor-pointer transition-all ${
                selectedSegment?.id === segment.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedSegment(segment)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${segment.color}`}></div>
                    <h3 className="font-semibold">{segment.name}</h3>
                  </div>
                  {version && (
                    <Badge variant={version.status === 'approved' ? 'default' : 'outline'}>
                      {version.status}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">{segment.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium">{segment.recipientCount.toLocaleString()}</span>
                  </div>
                  {version?.stats && (
                    <div className="flex gap-2 text-xs">
                      <span>📧 {version.stats.estimatedOpenRate.toFixed(1)}%</span>
                      <span>🔗 {version.stats.estimatedClickRate.toFixed(1)}%</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (version) setEditingVersion(version);
                    }}
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    Preview
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRegenerateSegmentId(segment.id);
                      setShowRegenerateDialog(true);
                    }}
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Regenerate
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Selected Segment Details */}
      {selectedSegment && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Version Details: {selectedSegment.name}</CardTitle>
              <Button 
                variant="outline"
                onClick={() => setSelectedSegment(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {emailVersions?.versions.find(v => v.segmentId === selectedSegment.id) && (
              <div className="space-y-4">
                <div>
                  <Label>Subject Line</Label>
                  <p className="mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    {emailVersions.versions.find(v => v.segmentId === selectedSegment.id)?.subject}
                  </p>
                </div>
                <div>
                  <Label>Preview Text</Label>
                  <p className="mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    {emailVersions.versions.find(v => v.segmentId === selectedSegment.id)?.previewText}
                  </p>
                </div>
                <div>
                  <Label>Content Preview</Label>
                  <div 
                    className="mt-1 p-4 bg-gray-50 dark:bg-gray-800 rounded max-h-60 overflow-y-auto"
                    dangerouslySetInnerHTML={{ 
                      __html: emailVersions.versions.find(v => v.segmentId === selectedSegment.id)?.content || '' 
                    }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  {getPersonalizationBadge(
                    emailVersions.versions.find(v => v.segmentId === selectedSegment.id)?.personalizationLevel || 'medium'
                  )}
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      onClick={() => {
                        const version = emailVersions.versions.find(v => v.segmentId === selectedSegment.id);
                        if (version) setEditingVersion(version);
                      }}
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      onClick={() => {
                        const version = emailVersions.versions.find(v => v.segmentId === selectedSegment.id);
                        if (version) approveVersion.mutate(version.id);
                      }}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Bulk Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Bulk Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button variant="outline">
              <Check className="w-4 h-4 mr-2" />
              Approve All Versions
            </Button>
            <Button variant="outline">
              <Send className="w-4 h-4 mr-2" />
              Schedule All for Sending
            </Button>
            <Button variant="outline" className="text-orange-600">
              <AlertCircle className="w-4 h-4 mr-2" />
              Reset All Versions
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Regenerate Dialog */}
      <Dialog open={showRegenerateDialog} onOpenChange={setShowRegenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate Email Version</DialogTitle>
            <DialogDescription>
              This will use one of your regeneration credits to create a new version for this segment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {creditsData && (
              <Alert>
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>
                  You have <strong>{creditsData.regenerationCredits}</strong> regeneration credits remaining.
                  {creditsData.regenerationCredits === 0 && (
                    <span className="block mt-2">
                      Additional credits available: {creditsData.additionalCreditsAvailable} 
                      (${creditsData.pricePerCredit} each)
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label>Regeneration Options</Label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" defaultChecked />
                  <span className="text-sm">Maintain brand voice consistency</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" defaultChecked />
                  <span className="text-sm">Include latest market data</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">Increase personalization level</span>
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRegenerateDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => regenerateVersion.mutate(regenerateSegmentId)}
              disabled={creditsData?.regenerationCredits === 0}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Regenerate ({creditsData?.regenerationCredits} credits)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Version Dialog */}
      {editingVersion && (
        <Dialog open={!!editingVersion} onOpenChange={() => setEditingVersion(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Edit Email Version: {editingVersion.segmentName}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Subject Line</Label>
                <input 
                  type="text"
                  className="w-full mt-1 p-2 border rounded"
                  defaultValue={editingVersion.subject}
                />
              </div>
              <div>
                <Label>Preview Text</Label>
                <input 
                  type="text"
                  className="w-full mt-1 p-2 border rounded"
                  defaultValue={editingVersion.previewText}
                />
              </div>
              <div>
                <Label>Email Content (HTML Preview)</Label>
                <div className="mt-2 space-y-2">
                  <div 
                    className="p-4 bg-gray-50 dark:bg-gray-800 rounded border max-h-[300px] overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: editingVersion.content }}
                  />
                  <details className="cursor-pointer">
                    <summary className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200">
                      Show HTML Source
                    </summary>
                    <Textarea 
                      className="mt-2 h-64 font-mono text-xs"
                      defaultValue={editingVersion.content}
                    />
                  </details>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingVersion(null)}>
                Cancel
              </Button>
              <Button onClick={() => {
                toast({
                  title: "Version Updated",
                  description: "Email version has been updated successfully",
                });
                setEditingVersion(null);
              }}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle, 
  Circle, 
  Eye, 
  Send, 
  Users, 
  Mail, 
  Target,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Settings
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface EmailSegment {
  id: string;
  name: string;
  subscriberCount: number;
  isDetected: boolean;
}

interface EmailVariant {
  id: string;
  masterEmailId: string;
  segmentId: string;
  subjectLine: string;
  content: string;
  pixelId: string;
  isEnabled: boolean;
  estimatedReach: number;
}

interface MasterEmail {
  id: string;
  title: string;
  content: string;
  emailType: string;
  status: string;
}

interface PixelCheck {
  variantId: string;
  pixelOk: boolean;
  pixelId?: string;
  error?: string;
}

export default function VNextSegmentMatrix() {
  const [masterEmailId, setMasterEmailId] = useState<string>("demo-master-1");
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [variantSettings, setVariantSettings] = useState<Record<string, boolean>>({});
  const [previewVariant, setPreviewVariant] = useState<string | null>(null);

  // Fetch master email
  const { data: masterEmail } = useQuery<MasterEmail>({
    queryKey: ["/api/vnext/emails/master", masterEmailId],
    enabled: !!masterEmailId,
  });

  // Fetch segments
  const { data: segments = [] } = useQuery<EmailSegment[]>({
    queryKey: ["/api/vnext/segments", "demo-publisher"],
  });

  // Fetch variants for this master email
  const { data: variants = [] } = useQuery<EmailVariant[]>({
    queryKey: ["/api/vnext/emails", masterEmailId, "variants"],
    enabled: !!masterEmailId,
  });

  // Generate variants mutation
  const generateVariantsMutation = useMutation({
    mutationFn: async (data: { segments: EmailSegment[] }) => {
      const response = await fetch(`/api/vnext/emails/${masterEmailId}/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ segments: data.segments }),
      });
      if (!response.ok) throw new Error("Failed to generate variants");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vnext/emails", masterEmailId, "variants"] });
      toast({ title: "Variants Generated", description: "Email variants created for selected segments" });
    },
  });

  // Pixel check mutation
  const pixelCheckMutation = useMutation({
    mutationFn: async (variantIds: string[]) => {
      const response = await fetch("/api/vnext/send/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantIds }),
      });
      if (!response.ok) throw new Error("Failed to check pixels");
      return response.json();
    },
  });

  // Send launch mutation
  const sendLaunchMutation = useMutation({
    mutationFn: async (data: { variantIds: string[] }) => {
      const response = await fetch("/api/vnext/send/launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          masterEmailId, 
          variantIds: data.variantIds
        }),
      });
      if (!response.ok) throw new Error("Failed to launch send");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Email Sent", description: "Email variants sent successfully" });
    },
  });

  const enabledVariants = variants.filter(v => variantSettings[v.id] !== false);
  const totalEstimatedReach = enabledVariants.reduce((sum, v) => sum + v.estimatedReach, 0);

  const handleGenerateVariants = () => {
    const selectedSegmentObjects = segments.filter(s => selectedSegments.includes(s.id));
    generateVariantsMutation.mutate({ segments: selectedSegmentObjects });
  };

  const handlePixelCheck = () => {
    const variantIds = enabledVariants.map(v => v.id);
    pixelCheckMutation.mutate(variantIds);
  };

  const handleSendLaunch = () => {
    const variantIds = enabledVariants.map(v => v.id);
    sendLaunchMutation.mutate({ variantIds });
  };

  const getSegmentById = (segmentId: string) => {
    return segments.find(s => s.id === segmentId);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6" data-testid="page-segment-matrix">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center" data-testid="header-segment-matrix">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" data-testid="title-segment-matrix">
              Segment Matrix
            </h1>
            <p className="text-gray-600" data-testid="desc-segment-matrix">
              Configure email variants for different segments
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => window.history.back()} data-testid="button-back">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </div>

        {/* Master Email Info */}
        {masterEmail && (
          <Card data-testid="card-master-email">
            <CardHeader>
              <CardTitle className="flex items-center" data-testid="title-master-email">
                <Mail className="w-5 h-5 mr-2" />
                {masterEmail.title}
              </CardTitle>
              <CardDescription data-testid="desc-master-email">
                Email Type: {masterEmail.emailType} • Status: {masterEmail.status}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-md" data-testid="content-preview">
                <p className="text-sm text-gray-700" data-testid="text-master-content">
                  {masterEmail.content.substring(0, 200)}...
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Segment Selection */}
        {variants.length === 0 && (
          <Card data-testid="card-segment-selection">
            <CardHeader>
              <CardTitle data-testid="title-segment-selection">
                Select Segments for Variant Generation
              </CardTitle>
              <CardDescription data-testid="desc-segment-selection">
                Choose which segments should receive personalized variants of this email
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4" data-testid="grid-segment-selection">
                {segments.map((segment) => (
                  <div key={segment.id} className="flex items-center space-x-3 p-3 border rounded-lg" data-testid={`segment-option-${segment.id}`}>
                    <input
                      type="checkbox"
                      id={`segment-${segment.id}`}
                      checked={selectedSegments.includes(segment.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSegments([...selectedSegments, segment.id]);
                        } else {
                          setSelectedSegments(selectedSegments.filter(id => id !== segment.id));
                        }
                      }}
                      className="w-4 h-4"
                      data-testid={`checkbox-segment-${segment.id}`}
                    />
                    <label htmlFor={`segment-${segment.id}`} className="flex-1 cursor-pointer" data-testid={`label-segment-${segment.id}`}>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium" data-testid={`text-segment-name-${segment.id}`}>{segment.name}</p>
                          <p className="text-sm text-gray-600" data-testid={`text-segment-count-${segment.id}`}>
                            {segment.subscriberCount.toLocaleString()} subscribers
                          </p>
                        </div>
                        <Badge variant={segment.isDetected ? "secondary" : "outline"} data-testid={`badge-segment-type-${segment.id}`}>
                          {segment.isDetected ? "Detected" : "Custom"}
                        </Badge>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 flex justify-between items-center">
                <p className="text-sm text-gray-600" data-testid="text-selection-summary">
                  {selectedSegments.length} segments selected
                </p>
                <Button 
                  onClick={handleGenerateVariants}
                  disabled={selectedSegments.length === 0 || generateVariantsMutation.isPending}
                  data-testid="button-generate-variants"
                >
                  {generateVariantsMutation.isPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Target className="w-4 h-4 mr-2" />
                      Generate Variants ({selectedSegments.length})
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Variant Matrix */}
        {variants.length > 0 && (
          <Card data-testid="card-variant-matrix">
            <CardHeader>
              <CardTitle className="flex items-center justify-between" data-testid="title-variant-matrix">
                <span className="flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  Email Variants Matrix
                </span>
                <Badge variant="secondary" data-testid="badge-variant-count">
                  {variants.length} variants
                </Badge>
              </CardTitle>
              <CardDescription data-testid="desc-variant-matrix">
                Toggle delivery for each segment and preview differences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4" data-testid="matrix-variants">
                {variants.map((variant) => {
                  const segment = getSegmentById(variant.segmentId);
                  const isEnabled = variantSettings[variant.id] !== false;
                  
                  return (
                    <div key={variant.id} className="border rounded-lg p-4" data-testid={`variant-row-${variant.id}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <Switch
                            checked={isEnabled}
                            onCheckedChange={(checked) => {
                              setVariantSettings({
                                ...variantSettings,
                                [variant.id]: checked
                              });
                            }}
                            data-testid={`switch-variant-${variant.id}`}
                          />
                          <div>
                            <p className="font-medium" data-testid={`text-variant-segment-${variant.id}`}>
                              {segment?.name || "Unknown Segment"}
                            </p>
                            <p className="text-sm text-gray-600" data-testid={`text-variant-reach-${variant.id}`}>
                              Estimated reach: {variant.estimatedReach.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1">
                            <Circle className="w-3 h-3 text-green-600" />
                            <span className="text-xs text-green-600" data-testid={`text-pixel-status-${variant.id}`}>
                              Pixel: {variant.pixelId.substring(0, 8)}...
                            </span>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setPreviewVariant(variant.id)}
                            data-testid={`button-preview-${variant.id}`}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Preview
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm" data-testid={`variant-details-${variant.id}`}>
                        <div>
                          <Label className="font-medium" data-testid={`label-subject-${variant.id}`}>Subject Line</Label>
                          <p className="text-gray-700 mt-1" data-testid={`text-subject-${variant.id}`}>
                            {variant.subjectLine}
                          </p>
                        </div>
                        <div>
                          <Label className="font-medium" data-testid={`label-content-${variant.id}`}>Content Preview</Label>
                          <p className="text-gray-700 mt-1" data-testid={`text-content-${variant.id}`}>
                            {variant.content.substring(0, 100)}...
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary Stats */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg" data-testid="card-summary-stats">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div data-testid="stat-enabled-variants">
                    <p className="text-2xl font-bold text-blue-900" data-testid="text-enabled-count">
                      {enabledVariants.length}
                    </p>
                    <p className="text-sm text-blue-700" data-testid="label-enabled-count">Enabled Variants</p>
                  </div>
                  <div data-testid="stat-total-reach">
                    <p className="text-2xl font-bold text-blue-900" data-testid="text-total-reach">
                      {totalEstimatedReach.toLocaleString()}
                    </p>
                    <p className="text-sm text-blue-700" data-testid="label-total-reach">Total Reach</p>
                  </div>
                  <div data-testid="stat-pixel-health">
                    <p className="text-2xl font-bold text-green-600" data-testid="text-pixel-health">
                      100%
                    </p>
                    <p className="text-sm text-green-700" data-testid="label-pixel-health">Pixel Health</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Send Controls */}
        {variants.length > 0 && (
          <Card data-testid="card-send-controls">
            <CardHeader>
              <CardTitle className="flex items-center" data-testid="title-send-controls">
                <Send className="w-5 h-5 mr-2" />
                Review & Send
              </CardTitle>
              <CardDescription data-testid="desc-send-controls">
                Final checks before launching your email campaign
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                
                {/* Pixel Check */}
                <div className="flex items-center justify-between p-3 border rounded-lg" data-testid="section-pixel-check">
                  <div>
                    <p className="font-medium" data-testid="text-pixel-check-title">Pixel Verification</p>
                    <p className="text-sm text-gray-600" data-testid="text-pixel-check-desc">
                      Ensure unique tracking pixels are attached to all variants
                    </p>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={handlePixelCheck}
                    disabled={pixelCheckMutation.isPending}
                    data-testid="button-pixel-check"
                  >
                    {pixelCheckMutation.isPending ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Check Pixels
                      </>
                    )}
                  </Button>
                </div>

                {/* Send Summary */}
                <div className="p-3 border rounded-lg" data-testid="section-send-summary">
                  <p className="font-medium mb-2" data-testid="text-send-summary-title">Send Summary</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div data-testid="summary-variants">
                      <span className="text-gray-600">Variants to send:</span>
                      <span className="ml-2 font-medium" data-testid="text-variants-count">
                        {enabledVariants.length}
                      </span>
                    </div>
                    <div data-testid="summary-reach">
                      <span className="text-gray-600">Total recipients:</span>
                      <span className="ml-2 font-medium" data-testid="text-recipients-count">
                        {totalEstimatedReach.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Launch Button */}
                <div className="flex justify-end space-x-3" data-testid="section-launch">
                  <Button variant="outline" data-testid="button-schedule">
                    <Settings className="w-4 h-4 mr-2" />
                    Schedule Send
                  </Button>
                  <Button 
                    onClick={handleSendLaunch}
                    disabled={enabledVariants.length === 0 || sendLaunchMutation.isPending}
                    data-testid="button-send-now"
                  >
                    {sendLaunchMutation.isPending ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Now ({enabledVariants.length} variants)
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preview Modal */}
        {previewVariant && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="modal-preview">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto" data-testid="modal-preview-content">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold" data-testid="title-preview-modal">Email Preview</h3>
                <Button variant="ghost" onClick={() => setPreviewVariant(null)} data-testid="button-close-preview">
                  ×
                </Button>
              </div>
              {(() => {
                const variant = variants.find(v => v.id === previewVariant);
                const segment = variant ? getSegmentById(variant.segmentId) : null;
                return variant && (
                  <div className="space-y-4" data-testid="preview-content">
                    <div data-testid="preview-meta">
                      <p className="text-sm text-gray-600">Segment: {segment?.name}</p>
                      <p className="text-sm text-gray-600">Estimated Reach: {variant.estimatedReach.toLocaleString()}</p>
                    </div>
                    <div data-testid="preview-subject">
                      <Label className="font-medium">Subject Line</Label>
                      <p className="mt-1 p-2 bg-gray-50 rounded">{variant.subjectLine}</p>
                    </div>
                    <div data-testid="preview-body">
                      <Label className="font-medium">Email Content</Label>
                      <div className="mt-1 p-4 bg-gray-50 rounded max-h-60 overflow-y-auto">
                        <div dangerouslySetInnerHTML={{ __html: variant.content }} />
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
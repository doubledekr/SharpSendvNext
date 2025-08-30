import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Copy, Eye, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TrackingPixelInstructionsProps {
  broadcastId: string;
  campaignId?: string;
  trackingUrl?: string;
  pixelHtml?: string;
}

export function TrackingPixelInstructions({ 
  broadcastId, 
  campaignId = `broadcast_${broadcastId}`,
  trackingUrl = `https://localhost:5000/api/tracking/pixel/email_${broadcastId}.gif`,
  pixelHtml = `<img src="https://localhost:5000/api/tracking/pixel/email_${broadcastId}.gif" width="1" height="1" style="display:none;" alt="" />`
}: TrackingPixelInstructionsProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-blue-200 text-blue-600 hover:bg-blue-50"
          data-testid={`button-tracking-${broadcastId}`}
        >
          <BarChart3 className="h-4 w-4 mr-1" />
          Tracking Setup
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Eye className="h-5 w-5 text-blue-600" />
            <span>SharpSend Email Tracking Setup</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">How SharpSend Tracking Works</h3>
            <p className="text-blue-800 text-sm">
              Add the tracking pixel below to your Customer.io email template. When subscribers open the email, 
              SharpSend will automatically track opens, engagement, and behavioral data for advanced analytics.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="font-medium text-sm">Campaign ID</label>
                <Badge variant="secondary">{campaignId}</Badge>
              </div>
              <div className="flex items-center space-x-2">
                <code className="flex-1 bg-gray-100 p-2 rounded text-sm">
                  {campaignId}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(campaignId, "Campaign ID")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="font-medium text-sm">Tracking Pixel HTML</label>
                <Badge variant="outline" className="text-green-600">Ready to use</Badge>
              </div>
              <div className="flex items-center space-x-2">
                <code className="flex-1 bg-gray-100 p-3 rounded text-xs font-mono break-all">
                  {pixelHtml}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(pixelHtml, "Tracking pixel HTML")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="font-medium text-sm">Direct Tracking URL</label>
                <Badge variant="outline">For manual use</Badge>
              </div>
              <div className="flex items-center space-x-2">
                <code className="flex-1 bg-gray-100 p-2 rounded text-sm break-all">
                  {trackingUrl}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(trackingUrl, "Tracking URL")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 p-4 rounded-lg">
            <h4 className="font-semibold text-amber-900 mb-2">Customer.io Integration Steps</h4>
            <ol className="text-amber-800 text-sm space-y-1 list-decimal list-inside">
              <li>Copy the tracking pixel HTML above</li>
              <li>Open your Customer.io email template</li>
              <li>Paste the pixel HTML at the bottom of your email body</li>
              <li>Send your campaign - SharpSend will automatically track opens!</li>
            </ol>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold text-green-900 mb-2">What You'll Track</h4>
            <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
              <li>Email open rates and timestamps</li>
              <li>Subscriber engagement patterns</li>
              <li>Device and location data</li>
              <li>Real-time performance analytics</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
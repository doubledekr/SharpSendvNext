import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { 
  FileText, 
  Save, 
  Image, 
  Upload, 
  Send,
  Loader2,
  CheckCircle,
  AlertCircle,
  Link,
  User,
  Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface EmailDraft {
  id: string;
  subject: string;
  content: string;
  images: string[];
  urgency: string;
  sentiment: string;
  marketContext?: any;
  lastSaved?: string;
  copywriterName?: string;
}

export default function CopywriterPortal() {
  const { id } = useParams();
  const [draft, setDraft] = useState<EmailDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [copywriterName, setCopywriterName] = useState("");
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    loadDraft();
  }, [id]);

  const loadDraft = async () => {
    // Simulate loading draft data
    setLoading(true);
    setTimeout(() => {
      const mockDraft: EmailDraft = {
        id: id || "",
        subject: "🚨 Market NEUTRAL Alert: Balanced market analysis",
        content: `Dear Valued Investor,

Markets are showing mixed signals with balanced risk-reward opportunities.

Key Market Indicators:
• VIX Level: 18.5 - Moderate volatility environment
• Market Sentiment: NEUTRAL
• Investment Focus: Balanced market analysis

Consider maintaining current positions while monitoring for clearer directional signals.

Top Performing Sectors:
• Technology: +2.3%
• Healthcare: +1.8%
• Financials: -0.5%

Action Required: Review within 24 hours

Best regards,
Your SharpSend Team`,
        images: [],
        urgency: "standard",
        sentiment: "neutral",
        marketContext: {
          vixLevel: 18.5,
          sentiment: "neutral"
        }
      };
      
      setDraft(mockDraft);
      setSubject(mockDraft.subject);
      setContent(mockDraft.content);
      setImages(mockDraft.images);
      setCopywriterName(mockDraft.copywriterName || "");
      setLoading(false);
    }, 1000);
  };

  const handleSave = async () => {
    setSaving(true);
    
    // Simulate saving
    setTimeout(() => {
      const updatedDraft = {
        ...draft,
        subject,
        content,
        images,
        copywriterName,
        lastSaved: new Date().toISOString()
      };
      
      setDraft(updatedDraft as EmailDraft);
      setSaving(false);
      
      toast({
        title: "Draft Saved",
        description: "Your changes have been saved successfully",
      });
    }, 1000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    setShowImageUpload(true);
    setUploadProgress(0);
    
    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 20;
      });
    }, 200);
    
    // Simulate adding images
    setTimeout(() => {
      const newImages = Array.from(files).map(file => URL.createObjectURL(file));
      setImages(prev => [...prev, ...newImages]);
      setShowImageUpload(false);
      
      toast({
        title: "Images Uploaded",
        description: `${files.length} image(s) added successfully`,
      });
    }, 1500);
  };

  const handleSubmit = () => {
    handleSave();
    toast({
      title: "Email Submitted",
      description: "Your email has been submitted for review",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-muted-foreground">Loading assignment...</p>
        </div>
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-center text-muted-foreground">Assignment not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">Email Assignment Portal</h1>
              <p className="text-muted-foreground mt-1">Collaborate on email content creation</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={draft.urgency === 'urgent' ? 'destructive' : 'secondary'}>
                {draft.urgency}
              </Badge>
              <Badge variant="outline">{draft.sentiment}</Badge>
            </div>
          </div>
          
          {/* Copywriter Info */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="copywriter-name">Your Name</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="copywriter-name"
                      placeholder="Enter your name"
                      value={copywriterName}
                      onChange={(e) => setCopywriterName(e.target.value)}
                      className="flex-1"
                    />
                    <Button size="sm" variant="outline">
                      <User className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Assignment ID</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input value={id} readOnly className="flex-1 bg-muted" />
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        toast({
                          title: "Link Copied",
                          description: "Assignment link copied to clipboard",
                        });
                      }}
                    >
                      <Link className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              {draft.lastSaved && (
                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Last saved: {new Date(draft.lastSaved).toLocaleString()}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="compose" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="compose">Compose</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="compose" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Email Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="subject">Subject Line</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="mt-1"
                    placeholder="Enter email subject..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="content">Email Body</Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="mt-1 min-h-[400px] font-mono text-sm"
                    placeholder="Write your email content here..."
                  />
                </div>

                {draft.marketContext && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Market Context:</strong> VIX at {draft.marketContext.vixLevel}, 
                      {" "}{draft.marketContext.sentiment} sentiment. 
                      Consider incorporating current market conditions in your content.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="images" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Image Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="image-upload">Upload Images</Label>
                    <div className="mt-2">
                      <Input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <Button
                        onClick={() => document.getElementById('image-upload')?.click()}
                        variant="outline"
                        className="w-full"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Choose Images
                      </Button>
                    </div>
                  </div>

                  {images.length > 0 && (
                    <div>
                      <Label>Uploaded Images ({images.length})</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                        {images.map((img, index) => (
                          <div key={index} className="relative group">
                            <img 
                              src={img} 
                              alt={`Upload ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border"
                            />
                            <Button
                              size="sm"
                              variant="destructive"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => setImages(prev => prev.filter((_, i) => i !== index))}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {images.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg">
                      <Image className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">No images uploaded yet</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Click "Choose Images" to add visual content
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Email Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-6 bg-white">
                  <h2 className="text-xl font-semibold mb-4">{subject}</h2>
                  <div className="prose max-w-none">
                    <pre className="whitespace-pre-wrap font-sans">{content}</pre>
                  </div>
                  {images.length > 0 && (
                    <div className="mt-6 pt-6 border-t">
                      <p className="text-sm text-muted-foreground mb-3">Attached Images:</p>
                      <div className="grid grid-cols-3 gap-2">
                        {images.map((img, index) => (
                          <img 
                            key={index}
                            src={img} 
                            alt={`Attachment ${index + 1}`}
                            className="w-full h-20 object-cover rounded border"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex justify-between items-center mt-6">
          <Button 
            variant="outline" 
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </>
            )}
          </Button>
          
          <div className="flex gap-3">
            <Button variant="outline">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="h-4 w-4 mr-2" />
              Submit for Review
            </Button>
          </div>
        </div>
      </div>

      {/* Image Upload Progress Modal */}
      <Dialog open={showImageUpload} onOpenChange={setShowImageUpload}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Uploading Images</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
              <span className="text-sm font-medium">{uploadProgress}%</span>
            </div>
            {uploadProgress === 100 && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Upload complete!</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
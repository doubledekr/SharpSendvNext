import { useState, useRef } from "react";
import { 
  Send, 
  Save, 
  Eye, 
  Bold, 
  Italic, 
  Link,
  List,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  Code,
  Sparkles,
  Image
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import EmailImageUploader from "./EmailImageUploader";
import { useToast } from "@/hooks/use-toast";

interface EmailComposerProps {
  initialContent?: string;
  onSave?: (content: EmailContent) => void;
  onSend?: (content: EmailContent) => void;
}

interface EmailContent {
  subject: string;
  preheader: string;
  htmlContent: string;
  plainContent: string;
  images: string[];
  personalizationTokens: string[];
}

export default function EmailComposer({ 
  initialContent = "", 
  onSave, 
  onSend 
}: EmailComposerProps) {
  const [subject, setSubject] = useState("");
  const [preheader, setPreheader] = useState("");
  const [htmlContent, setHtmlContent] = useState(initialContent);
  const [selectedSegment, setSelectedSegment] = useState("all");
  const [images, setImages] = useState<string[]>([]);
  const editorRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Handle image insertion
  const handleImageInsert = (imageUrl: string, altText?: string) => {
    const imgTag = `<img src="${imageUrl}" alt="${altText || ''}" style="max-width: 100%; height: auto;" />`;
    
    // Insert at cursor position or append to content
    if (editorRef.current) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = altText || '';
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        range.insertNode(img);
      } else {
        editorRef.current.innerHTML += imgTag;
      }
      setHtmlContent(editorRef.current.innerHTML);
    } else {
      setHtmlContent(prev => prev + imgTag);
    }
    
    // Track image for later reference
    setImages(prev => [...prev, imageUrl]);
    
    toast({
      title: "Image inserted",
      description: "Image has been added to your email"
    });
  };

  // Format text commands
  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setHtmlContent(editorRef.current.innerHTML);
    }
  };

  // Insert personalization token
  const insertToken = (token: string) => {
    const tokenHtml = `<span class="personalization-token" contenteditable="false" style="background: #e3f2fd; color: #1976d2; padding: 2px 6px; border-radius: 3px; font-family: monospace;">{{${token}}}</span>`;
    
    if (editorRef.current) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const span = document.createElement('span');
        span.className = 'personalization-token';
        span.contentEditable = 'false';
        span.style.cssText = 'background: #e3f2fd; color: #1976d2; padding: 2px 6px; border-radius: 3px; font-family: monospace;';
        span.textContent = `{{${token}}}`;
        range.insertNode(span);
      } else {
        editorRef.current.innerHTML += tokenHtml;
      }
      setHtmlContent(editorRef.current.innerHTML);
    }
  };

  // Generate AI content
  const generateAIContent = async () => {
    try {
      const response = await fetch('/api/generate-email-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          subject,
          segment: selectedSegment,
          tone: 'professional',
          includeImages: true
        })
      });

      if (!response.ok) throw new Error('Failed to generate content');

      const data = await response.json();
      setHtmlContent(data.content);
      if (editorRef.current) {
        editorRef.current.innerHTML = data.content;
      }

      toast({
        title: "Content generated",
        description: "AI has generated email content based on your inputs"
      });
    } catch (error) {
      console.error('Error generating content:', error);
      toast({
        title: "Generation failed",
        description: "Failed to generate AI content",
        variant: "destructive"
      });
    }
  };

  // Save draft
  const handleSave = () => {
    const content: EmailContent = {
      subject,
      preheader,
      htmlContent,
      plainContent: editorRef.current?.innerText || "",
      images,
      personalizationTokens: extractTokens(htmlContent)
    };

    if (onSave) {
      onSave(content);
    }

    toast({
      title: "Draft saved",
      description: "Your email draft has been saved"
    });
  };

  // Send email
  const handleSend = () => {
    if (!subject) {
      toast({
        title: "Subject required",
        description: "Please add a subject line",
        variant: "destructive"
      });
      return;
    }

    const content: EmailContent = {
      subject,
      preheader,
      htmlContent,
      plainContent: editorRef.current?.innerText || "",
      images,
      personalizationTokens: extractTokens(htmlContent)
    };

    if (onSend) {
      onSend(content);
    }

    toast({
      title: "Email sent",
      description: "Your email has been queued for sending"
    });
  };

  // Extract personalization tokens from content
  const extractTokens = (content: string): string[] => {
    const regex = /\{\{([^}]+)\}\}/g;
    const tokens: string[] = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
      tokens.push(match[1]);
    }
    return [...new Set(tokens)];
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Email Composer</span>
          <div className="flex gap-2">
            <Badge variant="outline">
              {images.length} image{images.length !== 1 ? 's' : ''}
            </Badge>
            <Badge variant="outline">
              {extractTokens(htmlContent).length} token{extractTokens(htmlContent).length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Subject and Preheader */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="subject">Subject Line</Label>
            <Input
              id="subject"
              placeholder="Enter compelling subject..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="preheader">Preheader Text</Label>
            <Input
              id="preheader"
              placeholder="Preview text..."
              value={preheader}
              onChange={(e) => setPreheader(e.target.value)}
            />
          </div>
        </div>

        {/* Segment Selection */}
        <div>
          <Label htmlFor="segment">Target Segment</Label>
          <Select value={selectedSegment} onValueChange={setSelectedSegment}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subscribers</SelectItem>
              <SelectItem value="high-value">High-Value Investors</SelectItem>
              <SelectItem value="new">New Subscribers</SelectItem>
              <SelectItem value="engaged">Highly Engaged</SelectItem>
              <SelectItem value="at-risk">At Risk</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Toolbar */}
        <div className="border rounded-lg p-2 bg-gray-50 dark:bg-gray-800">
          <div className="flex flex-wrap gap-1 items-center">
            {/* Text Formatting */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => formatText('bold')}
              title="Bold"
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => formatText('italic')}
              title="Italic"
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => formatText('insertUnorderedList')}
              title="Bullet List"
            >
              <List className="h-4 w-4" />
            </Button>
            
            <Separator orientation="vertical" className="h-6 mx-1" />
            
            {/* Alignment */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => formatText('justifyLeft')}
              title="Align Left"
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => formatText('justifyCenter')}
              title="Align Center"
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => formatText('justifyRight')}
              title="Align Right"
            >
              <AlignRight className="h-4 w-4" />
            </Button>
            
            <Separator orientation="vertical" className="h-6 mx-1" />
            
            {/* Special Functions */}
            <EmailImageUploader onImageInsert={handleImageInsert} />
            
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                const url = prompt('Enter URL:');
                if (url) formatText('createLink', url);
              }}
              title="Insert Link"
            >
              <Link className="h-4 w-4" />
            </Button>
            
            <Separator orientation="vertical" className="h-6 mx-1" />
            
            {/* Personalization Tokens */}
            <Select onValueChange={insertToken}>
              <SelectTrigger className="w-40 h-8">
                <SelectValue placeholder="Insert token..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="first_name">First Name</SelectItem>
                <SelectItem value="last_name">Last Name</SelectItem>
                <SelectItem value="company">Company</SelectItem>
                <SelectItem value="portfolio_value">Portfolio Value</SelectItem>
                <SelectItem value="last_trade">Last Trade</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              size="sm"
              variant="outline"
              onClick={generateAIContent}
              className="ml-auto"
            >
              <Sparkles className="h-4 w-4 mr-1" />
              AI Generate
            </Button>
          </div>
        </div>

        {/* Editor */}
        <div className="border rounded-lg p-4 min-h-[400px] bg-white dark:bg-gray-900">
          <div
            ref={editorRef}
            contentEditable
            className="outline-none min-h-[350px]"
            onInput={(e) => setHtmlContent(e.currentTarget.innerHTML)}
            dangerouslySetInnerHTML={{ __html: htmlContent }}
            style={{
              fontFamily: 'Arial, sans-serif',
              fontSize: '14px',
              lineHeight: '1.6'
            }}
          />
        </div>

        {/* Image Preview Strip */}
        {images.length > 0 && (
          <div className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
            <p className="text-sm font-medium mb-2">Embedded Images</p>
            <div className="flex gap-2 overflow-x-auto">
              {images.map((img, idx) => (
                <div key={idx} className="flex-shrink-0">
                  <img
                    src={img}
                    alt={`Email image ${idx + 1}`}
                    className="h-16 w-auto rounded border"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => window.open('/email-preview', '_blank')}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
            <Button onClick={handleSend} className="bg-blue-600 hover:bg-blue-700">
              <Send className="h-4 w-4 mr-2" />
              Send Campaign
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
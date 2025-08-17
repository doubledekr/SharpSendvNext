import { useState } from "react";
import { 
  Upload, 
  Image, 
  Link, 
  X, 
  CheckCircle,
  AlertCircle,
  Loader2,
  Grid,
  ExternalLink
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface EmailImage {
  id: string;
  url: string;
  name: string;
  size?: number;
  type?: string;
  width?: number;
  height?: number;
}

interface EmailImageUploaderProps {
  onImageInsert: (imageUrl: string, altText?: string) => void;
}

export default function EmailImageUploader({ onImageInsert }: EmailImageUploaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<EmailImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [altText, setAltText] = useState("");
  const { toast } = useToast();

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 10MB",
        variant: "destructive"
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/email-images/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      
      const newImage: EmailImage = {
        id: Date.now().toString(),
        url: data.imageUrl,
        name: file.name,
        size: file.size,
        type: file.type
      };

      setUploadedImages(prev => [...prev, newImage]);
      setSelectedImage(data.imageUrl);
      
      toast({
        title: "Image uploaded",
        description: "Your image has been uploaded successfully"
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  // Handle URL input
  const handleUrlInsert = () => {
    if (!imageUrl) {
      toast({
        title: "URL required",
        description: "Please enter an image URL",
        variant: "destructive"
      });
      return;
    }

    // Validate URL format
    try {
      new URL(imageUrl);
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid image URL",
        variant: "destructive"
      });
      return;
    }

    onImageInsert(imageUrl, altText);
    setIsOpen(false);
    resetForm();
  };

  // Handle image selection and insertion
  const handleImageInsert = () => {
    if (!selectedImage) {
      toast({
        title: "No image selected",
        description: "Please select or upload an image",
        variant: "destructive"
      });
      return;
    }

    onImageInsert(selectedImage, altText);
    setIsOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setSelectedImage(null);
    setImageUrl("");
    setAltText("");
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Image className="h-4 w-4 mr-2" />
          Insert Image
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Insert Email Image</DialogTitle>
          <DialogDescription>
            Upload an image or provide a URL to insert into your email
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="upload" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="library">Library</TabsTrigger>
            <TabsTrigger value="url">URL</TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                type="file"
                id="image-upload"
                className="hidden"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
              />
              <label
                htmlFor="image-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                {uploading ? (
                  <Loader2 className="h-12 w-12 text-gray-400 animate-spin mb-3" />
                ) : (
                  <Upload className="h-12 w-12 text-gray-400 mb-3" />
                )}
                <span className="text-sm font-medium text-gray-700">
                  {uploading ? "Uploading..." : "Click to upload or drag and drop"}
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  PNG, JPG, GIF up to 10MB
                </span>
              </label>
            </div>

            {/* Recently Uploaded */}
            {uploadedImages.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Recently Uploaded</h4>
                <div className="grid grid-cols-3 gap-3">
                  {uploadedImages.map((img) => (
                    <div
                      key={img.id}
                      className={`border rounded-lg p-2 cursor-pointer ${
                        selectedImage === img.url ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                      onClick={() => setSelectedImage(img.url)}
                    >
                      <img
                        src={img.url}
                        alt={img.name}
                        className="w-full h-24 object-cover rounded mb-1"
                      />
                      <p className="text-xs truncate">{img.name}</p>
                      {img.size && (
                        <p className="text-xs text-gray-500">{formatFileSize(img.size)}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Library Tab */}
          <TabsContent value="library" className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card 
                className="cursor-pointer hover:border-blue-500"
                onClick={() => setSelectedImage("/api/email-images/header-default.png")}
              >
                <CardContent className="p-3">
                  <div className="bg-gray-100 rounded h-24 mb-2 flex items-center justify-center">
                    <Image className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium">Newsletter Header</p>
                  <p className="text-xs text-gray-500">600x200</p>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:border-blue-500"
                onClick={() => setSelectedImage("/api/email-images/divider-default.png")}
              >
                <CardContent className="p-3">
                  <div className="bg-gray-100 rounded h-24 mb-2 flex items-center justify-center">
                    <div className="w-full h-0.5 bg-gray-400"></div>
                  </div>
                  <p className="text-sm font-medium">Section Divider</p>
                  <p className="text-xs text-gray-500">600x2</p>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:border-blue-500"
                onClick={() => setSelectedImage("/api/email-images/logo-default.png")}
              >
                <CardContent className="p-3">
                  <div className="bg-gray-100 rounded h-24 mb-2 flex items-center justify-center">
                    <span className="text-lg font-bold text-gray-600">LOGO</span>
                  </div>
                  <p className="text-sm font-medium">SharpSend Logo</p>
                  <p className="text-xs text-gray-500">200x50</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* URL Tab */}
          <TabsContent value="url" className="space-y-4">
            <div>
              <Label htmlFor="image-url">Image URL</Label>
              <Input
                id="image-url"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the full URL of the image you want to insert
              </p>
            </div>

            {imageUrl && (
              <div className="border rounded-lg p-3">
                <p className="text-sm font-medium mb-2">Preview</p>
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="max-w-full h-auto rounded"
                  onError={(e) => {
                    e.currentTarget.src = '/api/placeholder/400/200';
                    toast({
                      title: "Invalid image",
                      description: "Could not load image from URL",
                      variant: "destructive"
                    });
                  }}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Alt Text Input */}
        <div className="mt-4">
          <Label htmlFor="alt-text">Alt Text (Recommended for accessibility)</Label>
          <Input
            id="alt-text"
            placeholder="Describe the image..."
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={imageUrl ? handleUrlInsert : handleImageInsert}
            disabled={!selectedImage && !imageUrl}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Insert Image
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
import React, { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Search, 
  Grid, 
  List, 
  Upload, 
  Image as ImageIcon,
  Folder,
  File,
  Download,
  ExternalLink,
  Plus,
  X,
  Copy,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ObjectUploader } from "@/components/ObjectUploader";

interface CDNAsset {
  id: string;
  name: string;
  url: string;
  thumbnailUrl?: string;
  type: 'image' | 'folder';
  size?: number;
  mimeType?: string;
  width?: number;
  height?: number;
  createdAt: string;
}

interface CDNImageBrowserProps {
  onImageSelect?: (image: CDNAsset) => void;
  onImageInsert?: (image: CDNAsset) => void;
  allowMultiSelect?: boolean;
  showUpload?: boolean;
  className?: string;
}

export function CDNImageBrowser({
  onImageSelect,
  onImageInsert,
  allowMultiSelect = false,
  showUpload = true,
  className = ""
}: CDNImageBrowserProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch CDN assets
  const { data: assets = [], isLoading, refetch } = useQuery<CDNAsset[]>({
    queryKey: ["/api/cdn/assets"],
    queryFn: async () => {
      const response = await fetch("/api/cdn/assets");
      if (!response.ok) {
        throw new Error("Failed to fetch CDN assets");
      }
      return response.json();
    },
  });

  const filteredAssets = assets.filter(asset => 
    asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset.type === 'folder'
  );

  const handleImageSelect = (asset: CDNAsset) => {
    if (asset.type === 'folder') return;
    
    if (allowMultiSelect) {
      const newSelected = new Set(selectedImages);
      if (newSelected.has(asset.id)) {
        newSelected.delete(asset.id);
      } else {
        newSelected.add(asset.id);
      }
      setSelectedImages(newSelected);
    } else {
      setSelectedImages(new Set([asset.id]));
    }
    
    onImageSelect?.(asset);
  };

  const handleImageInsert = (asset: CDNAsset) => {
    if (asset.type === 'folder') return;
    onImageInsert?.(asset);
    toast({
      title: "Image Inserted",
      description: `${asset.name} has been added to your content.`,
    });
  };

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
      toast({
        title: "URL Copied",
        description: "Image URL copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy URL to clipboard.",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown size";
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const renderGridView = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {filteredAssets.map((asset) => (
        <Card 
          key={asset.id} 
          className={`cursor-pointer transition-all hover:shadow-md ${
            selectedImages.has(asset.id) ? 'ring-2 ring-blue-500' : ''
          }`}
          onClick={() => handleImageSelect(asset)}
        >
          <CardContent className="p-2">
            {asset.type === 'folder' ? (
              <div className="aspect-square flex items-center justify-center bg-muted rounded">
                <Folder className="h-8 w-8 text-muted-foreground" />
              </div>
            ) : (
              <div className="aspect-square relative rounded overflow-hidden bg-muted">
                <img 
                  src={asset.thumbnailUrl || asset.url} 
                  alt={asset.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {selectedImages.has(asset.id) && (
                  <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                    <Check className="h-6 w-6 text-blue-600" />
                  </div>
                )}
              </div>
            )}
            <div className="mt-2">
              <p className="text-xs font-medium truncate">{asset.name}</p>
              {asset.type === 'image' && (
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-muted-foreground">
                    {asset.width && asset.height ? `${asset.width}×${asset.height}` : ''}
                  </p>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyUrl(asset.url);
                      }}
                    >
                      {copiedUrl === asset.url ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleImageInsert(asset);
                      }}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="space-y-2">
      {filteredAssets.map((asset) => (
        <Card 
          key={asset.id}
          className={`cursor-pointer transition-all hover:shadow-sm ${
            selectedImages.has(asset.id) ? 'ring-2 ring-blue-500' : ''
          }`}
          onClick={() => handleImageSelect(asset)}
        >
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              {asset.type === 'folder' ? (
                <Folder className="h-8 w-8 text-muted-foreground flex-shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded overflow-hidden bg-muted flex-shrink-0">
                  <img 
                    src={asset.thumbnailUrl || asset.url} 
                    alt={asset.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <h4 className="font-medium truncate">{asset.name}</h4>
                <div className="flex items-center gap-4 mt-1">
                  {asset.type === 'image' && (
                    <>
                      <span className="text-sm text-muted-foreground">
                        {asset.width && asset.height ? `${asset.width}×${asset.height}` : ''}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {formatFileSize(asset.size)}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {asset.mimeType?.split('/')[1]?.toUpperCase() || 'IMAGE'}
                      </Badge>
                    </>
                  )}
                </div>
              </div>
              
              {asset.type === 'image' && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyUrl(asset.url);
                    }}
                  >
                    {copiedUrl === asset.url ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleImageInsert(asset);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Insert
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 w-full sm:max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search images..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex border rounded-lg">
            <Button
              size="sm"
              variant={viewMode === "grid" ? "default" : "ghost"}
              onClick={() => setViewMode("grid")}
              className="rounded-r-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={viewMode === "list" ? "default" : "ghost"}
              onClick={() => setViewMode("list")}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          
          {showUpload && (
            <ObjectUploader
              maxNumberOfFiles={10}
              onGetUploadParameters={async () => {
                const response = await fetch("/api/objects/upload", {
                  method: "POST"
                });
                const data = await response.json();
                return {
                  method: "PUT" as const,
                  url: data.uploadURL
                };
              }}
              onComplete={(result) => {
                toast({
                  title: "Upload Complete",
                  description: `${result.successful?.length || 0} images uploaded successfully.`,
                });
                refetch();
              }}
            >
              <Button size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </ObjectUploader>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="min-h-[400px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Loading images...</p>
            </div>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                {searchQuery ? "No images found matching your search." : "No images available."}
              </p>
              {showUpload && !searchQuery && (
                <ObjectUploader
                  maxNumberOfFiles={10}
                  onGetUploadParameters={async () => {
                    const response = await fetch("/api/objects/upload", {
                      method: "POST"
                    });
                    const data = await response.json();
                    return {
                      method: "PUT" as const,
                      url: data.uploadURL
                    };
                  }}
                  onComplete={(result) => {
                    toast({
                      title: "Upload Complete",
                      description: `${result.successful?.length || 0} images uploaded successfully.`,
                    });
                    refetch();
                  }}
                >
                  <Button className="mt-4">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Your First Images
                  </Button>
                </ObjectUploader>
              )}
            </div>
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            {viewMode === "grid" ? renderGridView() : renderListView()}
          </ScrollArea>
        )}
      </div>

      {/* Selection Summary */}
      {selectedImages.size > 0 && (
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <span className="text-sm text-muted-foreground">
            {selectedImages.size} image{selectedImages.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setSelectedImages(new Set())}
            >
              Clear Selection
            </Button>
            {allowMultiSelect && (
              <Button 
                size="sm"
                onClick={() => {
                  selectedImages.forEach(id => {
                    const asset = assets.find(a => a.id === id);
                    if (asset) handleImageInsert(asset);
                  });
                  setSelectedImages(new Set());
                }}
              >
                Insert Selected
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
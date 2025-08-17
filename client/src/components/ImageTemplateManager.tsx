import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Upload, Image as ImageIcon, FileText, Trash2, Eye, Edit, Download, Save, Plus, Copy } from "lucide-react";
import type { ImageAsset, EmailTemplate, TemplateSection } from "@shared/schema";

interface ImageTemplateManagerProps {
  publisherId?: string;
}

export function ImageTemplateManager({ publisherId = "default-publisher" }: ImageTemplateManagerProps) {
  const [selectedTab, setSelectedTab] = useState("images");
  const [selectedImage, setSelectedImage] = useState<ImageAsset | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [templateForm, setTemplateForm] = useState({
    name: "",
    description: "",
    category: "newsletter",
    platform: "universal",
    htmlTemplate: "",
  });
  const [imageCategory, setImageCategory] = useState("content");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch images
  const { data: images = [], isLoading: imagesLoading } = useQuery({
    queryKey: ["/api/images", publisherId],
    queryFn: async () => {
      const response = await fetch(`/api/images?publisherId=${publisherId}`);
      if (!response.ok) throw new Error("Failed to fetch images");
      return response.json();
    },
  });

  // Fetch templates
  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ["/api/templates", publisherId],
    queryFn: async () => {
      const response = await fetch(`/api/templates?publisherId=${publisherId}`);
      if (!response.ok) throw new Error("Failed to fetch templates");
      return response.json();
    },
  });

  // Upload image mutation
  const uploadImageMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/images/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Failed to upload image");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/images"] });
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
      setUploadFile(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (templateData: any) => {
      return apiRequest("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...templateData, publisherId }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({
        title: "Success",
        description: "Template created successfully",
      });
      setTemplateForm({
        name: "",
        description: "",
        category: "newsletter",
        platform: "universal",
        htmlTemplate: "",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete image mutation
  const deleteImageMutation = useMutation({
    mutationFn: async (imageId: string) => {
      return apiRequest(`/api/images/${imageId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/images"] });
      toast({
        title: "Success",
        description: "Image deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      return apiRequest(`/api/templates/${templateId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({
        title: "Success",
        description: "Template deactivated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = () => {
    if (!uploadFile) return;

    const formData = new FormData();
    formData.append("image", uploadFile);
    formData.append("publisherId", publisherId);
    formData.append("category", imageCategory);
    formData.append("altText", uploadFile.name);

    uploadImageMutation.mutate(formData);
  };

  const handleTemplateCreate = () => {
    if (!templateForm.name || !templateForm.htmlTemplate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createTemplateMutation.mutate(templateForm);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "URL copied to clipboard",
    });
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Image & Template Management</h2>
          <p className="text-muted-foreground">
            Manage images and email templates for your campaigns
          </p>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="images" className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Images
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="images" className="space-y-4">
          {/* Image Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Image</CardTitle>
              <CardDescription>
                Upload images to use in your email campaigns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="image-file">Select Image</Label>
                  <Input
                    id="image-file"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  />
                </div>
                <div>
                  <Label htmlFor="image-category">Category</Label>
                  <Select value={imageCategory} onValueChange={setImageCategory}>
                    <SelectTrigger id="image-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="logo">Logo</SelectItem>
                      <SelectItem value="header">Header</SelectItem>
                      <SelectItem value="content">Content</SelectItem>
                      <SelectItem value="footer">Footer</SelectItem>
                      <SelectItem value="signature">Signature</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button 
                onClick={handleImageUpload} 
                disabled={!uploadFile || uploadImageMutation.isPending}
                className="w-full"
              >
                <Upload className="mr-2 h-4 w-4" />
                {uploadImageMutation.isPending ? "Uploading..." : "Upload Image"}
              </Button>
            </CardContent>
          </Card>

          {/* Images Gallery */}
          <Card>
            <CardHeader>
              <CardTitle>Image Library</CardTitle>
              <CardDescription>
                {images.length} images in your library
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="grid grid-cols-3 gap-4">
                  {imagesLoading ? (
                    <div className="col-span-3 text-center py-8">Loading images...</div>
                  ) : images.length === 0 ? (
                    <div className="col-span-3 text-center py-8 text-muted-foreground">
                      No images uploaded yet
                    </div>
                  ) : (
                    images.map((image: ImageAsset) => (
                      <div
                        key={image.id}
                        className="relative group border rounded-lg overflow-hidden cursor-pointer"
                        onClick={() => setSelectedImage(image)}
                      >
                        <img
                          src={image.cdnUrl || image.originalUrl || ""}
                          alt={image.altText || image.fileName}
                          className="w-full h-32 object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(image.cdnUrl || "");
                              }}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteImageMutation.mutate(image.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="p-2">
                          <p className="text-xs truncate">{image.fileName}</p>
                          <Badge variant="secondary" className="text-xs">
                            {image.category}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          {/* Template Creation Section */}
          <Card>
            <CardHeader>
              <CardTitle>Create Template</CardTitle>
              <CardDescription>
                Create reusable email templates with your brand assets
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="template-name">Template Name</Label>
                  <Input
                    id="template-name"
                    placeholder="e.g., Weekly Newsletter"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="template-category">Category</Label>
                  <Select 
                    value={templateForm.category} 
                    onValueChange={(value) => setTemplateForm({ ...templateForm, category: value })}
                  >
                    <SelectTrigger id="template-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newsletter">Newsletter</SelectItem>
                      <SelectItem value="announcement">Announcement</SelectItem>
                      <SelectItem value="promotion">Promotion</SelectItem>
                      <SelectItem value="alert">Alert</SelectItem>
                      <SelectItem value="digest">Digest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="template-description">Description</Label>
                <Input
                  id="template-description"
                  placeholder="Brief description of the template"
                  value={templateForm.description}
                  onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="template-platform">Platform</Label>
                <Select 
                  value={templateForm.platform} 
                  onValueChange={(value) => setTemplateForm({ ...templateForm, platform: value })}
                >
                  <SelectTrigger id="template-platform">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="universal">Universal</SelectItem>
                    <SelectItem value="sendgrid">SendGrid</SelectItem>
                    <SelectItem value="mailchimp">Mailchimp</SelectItem>
                    <SelectItem value="exacttarget">ExactTarget</SelectItem>
                    <SelectItem value="brevo">Brevo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="template-html">HTML Template</Label>
                <Textarea
                  id="template-html"
                  placeholder="Enter HTML template with {{sharpsend_content}} placeholder"
                  value={templateForm.htmlTemplate}
                  onChange={(e) => setTemplateForm({ ...templateForm, htmlTemplate: e.target.value })}
                  className="font-mono h-32"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use {"{{sharpsend_content}}"} to mark where SharpSend content will be inserted
                </p>
              </div>
              <Button 
                onClick={handleTemplateCreate}
                disabled={createTemplateMutation.isPending}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                {createTemplateMutation.isPending ? "Creating..." : "Create Template"}
              </Button>
            </CardContent>
          </Card>

          {/* Templates List */}
          <Card>
            <CardHeader>
              <CardTitle>Template Library</CardTitle>
              <CardDescription>
                {templates.length} templates available
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {templatesLoading ? (
                    <div className="text-center py-8">Loading templates...</div>
                  ) : templates.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No templates created yet
                    </div>
                  ) : (
                    templates.map((template: EmailTemplate) => (
                      <div
                        key={template.id}
                        className="border rounded-lg p-4 hover:bg-accent cursor-pointer"
                        onClick={() => setSelectedTemplate(template)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <h4 className="font-semibold">{template.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {template.description || "No description"}
                            </p>
                            <div className="flex gap-2 mt-2">
                              <Badge>{template.category}</Badge>
                              <Badge variant="secondary">{template.platform}</Badge>
                              {template.isActive ? (
                                <Badge variant="outline">Active</Badge>
                              ) : (
                                <Badge variant="destructive">Inactive</Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Preview template
                                window.open(`/api/templates/${template.id}/preview`, "_blank");
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteTemplateMutation.mutate(template.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Selected Image Details Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Image Details</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedImage(null)}
              >
                ✕
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <img
                src={selectedImage.cdnUrl || selectedImage.originalUrl || ""}
                alt={selectedImage.altText || selectedImage.fileName}
                className="w-full max-h-64 object-contain rounded-lg"
              />
              <div className="space-y-2">
                <div>
                  <Label>File Name</Label>
                  <p className="text-sm">{selectedImage.fileName}</p>
                </div>
                <div>
                  <Label>CDN URL</Label>
                  <div className="flex gap-2">
                    <Input value={selectedImage.cdnUrl || ""} readOnly />
                    <Button
                      size="sm"
                      onClick={() => copyToClipboard(selectedImage.cdnUrl || "")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Category</Label>
                  <Badge>{selectedImage.category}</Badge>
                </div>
                {selectedImage.dimensions && (
                  <div>
                    <Label>Dimensions</Label>
                    <p className="text-sm">
                      {selectedImage.dimensions.width} × {selectedImage.dimensions.height}px
                    </p>
                  </div>
                )}
                {selectedImage.fileSize && (
                  <div>
                    <Label>File Size</Label>
                    <p className="text-sm">
                      {(selectedImage.fileSize / 1024).toFixed(2)} KB
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Selected Template Details Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-4xl w-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Template Details</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedTemplate(null)}
              >
                ✕
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <p className="text-sm font-medium">{selectedTemplate.name}</p>
                </div>
                <div>
                  <Label>Platform</Label>
                  <Badge>{selectedTemplate.platform}</Badge>
                </div>
                <div>
                  <Label>Category</Label>
                  <Badge variant="secondary">{selectedTemplate.category}</Badge>
                </div>
                <div>
                  <Label>Status</Label>
                  {selectedTemplate.isActive ? (
                    <Badge variant="outline">Active</Badge>
                  ) : (
                    <Badge variant="destructive">Inactive</Badge>
                  )}
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <p className="text-sm">{selectedTemplate.description || "No description"}</p>
              </div>
              <div>
                <Label>HTML Preview</Label>
                <ScrollArea className="h-64 border rounded-md p-2">
                  <pre className="text-xs font-mono">
                    {selectedTemplate.htmlTemplate}
                  </pre>
                </ScrollArea>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    // Copy template HTML
                    copyToClipboard(selectedTemplate.htmlTemplate);
                  }}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy HTML
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    // Preview template in new window
                    const win = window.open("", "_blank");
                    if (win) {
                      win.document.write(selectedTemplate.htmlTemplate);
                    }
                  }}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
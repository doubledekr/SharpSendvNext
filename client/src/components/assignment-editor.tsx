import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Image,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Trash2,
  Upload,
  FileText,
  Check,
  X,
  Bold,
  Italic,
  List,
  Link,
  Type,
} from "lucide-react";

interface ContentBlock {
  type: "paragraph" | "image" | "heading";
  md?: string;
  assetId?: string;
  alt?: string;
  caption?: string;
  align?: "left" | "center" | "right";
  size?: "full" | "half" | "thumb";
  level?: number;
}

interface AssignmentEditorProps {
  assignmentId: string;
  initialData?: any;
  onSave?: () => void;
}

export function AssignmentEditor({ assignmentId, initialData, onSave }: AssignmentEditorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [brief, setBrief] = useState(initialData?.brief || {
    objective: "",
    angle: "",
    keyPoints: [],
    offer: { label: "", url: "" },
    references: [],
  });
  
  const [blocks, setBlocks] = useState<ContentBlock[]>(
    initialData?.masterDraft?.blocks || [
      { type: "paragraph", md: "" }
    ]
  );
  
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number | null>(null);
  const [imageUploadIndex, setImageUploadIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);

  // Fetch assets for this assignment
  const { data: assets = [] } = useQuery<any[]>({
    queryKey: [`/api/assignments/${assignmentId}/assets`],
    enabled: !!assignmentId,
  });

  // Save assignment mutation
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest(`/api/assignments/${assignmentId}`, "PATCH", data);
    },
    onSuccess: () => {
      toast({ title: "Assignment saved successfully" });
      queryClient.invalidateQueries({ queryKey: [`/api/assignments`] });
      onSave?.();
    },
    onError: () => {
      toast({ title: "Failed to save assignment", variant: "destructive" });
    },
  });

  // Upload image mutation
  const uploadImageMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch(`/api/assignments/${assignmentId}/assets`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Upload failed");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/assignments/${assignmentId}/assets`] });
      
      // Add image block where requested
      if (imageUploadIndex !== null) {
        const newBlocks = [...blocks];
        newBlocks[imageUploadIndex] = {
          type: "image",
          assetId: data.id,
          alt: data.altText || "",
          caption: data.credit ? `Source: ${data.credit}` : "",
          align: "center",
          size: "full",
        };
        setBlocks(newBlocks);
        setImageUploadIndex(null);
      }
      
      toast({ title: "Image uploaded successfully" });
    },
    onError: () => {
      toast({ title: "Failed to upload image", variant: "destructive" });
    },
    onSettled: () => {
      setUploading(false);
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("image", file);
    formData.append("altText", "");
    formData.append("credit", "");
    formData.append("license", "");
    
    uploadImageMutation.mutate(formData);
  };

  const addBlock = (type: ContentBlock["type"], index: number) => {
    const newBlock: ContentBlock = 
      type === "paragraph" ? { type: "paragraph", md: "" } :
      type === "heading" ? { type: "heading", md: "", level: 2 } :
      { type: "image", align: "center", size: "full" };
    
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, newBlock);
    setBlocks(newBlocks);
    
    if (type === "image") {
      setImageUploadIndex(index + 1);
      fileInputRef.current?.click();
    }
  };

  const removeBlock = (index: number) => {
    const newBlocks = blocks.filter((_, i) => i !== index);
    setBlocks(newBlocks);
  };

  const updateBlock = (index: number, updates: Partial<ContentBlock>) => {
    const newBlocks = [...blocks];
    newBlocks[index] = { ...newBlocks[index], ...updates };
    setBlocks(newBlocks);
  };

  const handleSave = () => {
    const masterDraft = { blocks };
    saveMutation.mutate({ brief, masterDraft });
  };

  const validateAssignment = () => {
    const errors = [];
    
    // Check for at least one key point
    if (!brief.keyPoints?.length) {
      errors.push("At least 1 key point required");
    }
    
    // Check for alt text on all images
    const imagesWithoutAlt = blocks.filter(
      b => b.type === "image" && !b.alt
    );
    if (imagesWithoutAlt.length > 0) {
      errors.push("All images must have alt text");
    }
    
    // Check image count
    const imageCount = blocks.filter(b => b.type === "image").length;
    if (imageCount > 6) {
      errors.push("Maximum 6 images allowed");
    }
    
    return errors;
  };

  const renderEmailPreview = () => {
    return blocks.map((block, index) => {
      if (block.type === "paragraph") {
        return (
          <div key={index} style={{ marginBottom: "16px" }}>
            <p style={{ margin: 0, fontFamily: "Arial, sans-serif", fontSize: "14px", lineHeight: "1.5" }}>
              {block.md}
            </p>
          </div>
        );
      }
      
      if (block.type === "heading") {
        const fontSize = block.level === 1 ? "24px" : block.level === 2 ? "20px" : "16px";
        return (
          <div key={index} style={{ marginBottom: "16px" }}>
            <h2 style={{ margin: 0, fontFamily: "Arial, sans-serif", fontSize, fontWeight: "bold" }}>
              {block.md}
            </h2>
          </div>
        );
      }
      
      if (block.type === "image" && block.assetId) {
        const asset = assets.find((a: any) => a.id === block.assetId);
        if (!asset) return null;
        
        const width = block.size === "full" ? 600 : block.size === "half" ? 288 : 150;
        
        return (
          <table key={index} role="presentation" width="100%" cellPadding="0" cellSpacing="0">
            <tbody>
              <tr>
                <td align={block.align || "center"} style={{ padding: "16px 0" }}>
                  <img
                    src={asset.url}
                    alt={block.alt}
                    width={width}
                    style={{
                      display: "block",
                      width: "100%",
                      maxWidth: `${width}px`,
                      height: "auto",
                      border: 0,
                      outline: "none",
                      textDecoration: "none"
                    }}
                  />
                  {block.caption && (
                    <p style={{ margin: "8px 0 0 0", font: "12px/1.4 Arial, sans-serif", color: "#666" }}>
                      {block.caption}
                    </p>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        );
      }
      
      return null;
    });
  };

  const errors = validateAssignment();

  return (
    <div className="space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />
      
      {/* Brief Section */}
      <Card>
        <CardHeader>
          <CardTitle>Assignment Brief</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Objective</Label>
            <Input
              value={brief.objective}
              onChange={(e) => setBrief({ ...brief, objective: e.target.value })}
              placeholder="What's the main goal of this content?"
            />
          </div>
          
          <div>
            <Label>Angle</Label>
            <Input
              value={brief.angle}
              onChange={(e) => setBrief({ ...brief, angle: e.target.value })}
              placeholder="What's the unique perspective or hook?"
            />
          </div>
          
          <div>
            <Label>Key Points</Label>
            <Textarea
              value={brief.keyPoints?.join("\n") || ""}
              onChange={(e) => setBrief({ ...brief, keyPoints: e.target.value.split("\n").filter(Boolean) })}
              placeholder="One key point per line"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>CTA Label</Label>
              <Input
                value={brief.offer?.label || ""}
                onChange={(e) => setBrief({ ...brief, offer: { ...brief.offer, label: e.target.value } })}
                placeholder="e.g., Learn More"
              />
            </div>
            <div>
              <Label>CTA URL</Label>
              <Input
                value={brief.offer?.url || ""}
                onChange={(e) => setBrief({ ...brief, offer: { ...brief.offer, url: e.target.value } })}
                placeholder="https://..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Editor */}
      <Card>
        <CardHeader>
          <CardTitle>Content Editor</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="edit" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="edit">Edit</TabsTrigger>
              <TabsTrigger value="preview">Email Preview</TabsTrigger>
            </TabsList>
            
            <TabsContent value="edit" className="space-y-4">
              {blocks.map((block, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {block.type === "paragraph" && <FileText className="h-4 w-4" />}
                      {block.type === "heading" && <Type className="h-4 w-4" />}
                      {block.type === "image" && <Image className="h-4 w-4" />}
                      <span className="text-sm font-medium capitalize">{block.type}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => addBlock("paragraph", index)}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => addBlock("heading", index)}
                      >
                        <Type className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => addBlock("image", index)}
                      >
                        <Image className="h-4 w-4" />
                      </Button>
                      {blocks.length > 1 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeBlock(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {block.type === "paragraph" && (
                    <Textarea
                      value={block.md || ""}
                      onChange={(e) => updateBlock(index, { md: e.target.value })}
                      placeholder="Enter paragraph text..."
                      rows={3}
                    />
                  )}
                  
                  {block.type === "heading" && (
                    <div className="space-y-2">
                      <Select
                        value={String(block.level || 2)}
                        onValueChange={(value) => updateBlock(index, { level: parseInt(value) })}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Heading 1</SelectItem>
                          <SelectItem value="2">Heading 2</SelectItem>
                          <SelectItem value="3">Heading 3</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        value={block.md || ""}
                        onChange={(e) => updateBlock(index, { md: e.target.value })}
                        placeholder="Enter heading text..."
                      />
                    </div>
                  )}
                  
                  {block.type === "image" && (
                    <div className="space-y-2">
                      {block.assetId ? (
                        <>
                          <img
                            src={assets.find((a: any) => a.id === block.assetId)?.thumbnailUrl || ""}
                            alt={block.alt}
                            className="max-w-xs rounded"
                          />
                          <Input
                            value={block.alt || ""}
                            onChange={(e) => updateBlock(index, { alt: e.target.value })}
                            placeholder="Alt text (required)"
                          />
                          <Input
                            value={block.caption || ""}
                            onChange={(e) => updateBlock(index, { caption: e.target.value })}
                            placeholder="Caption (optional)"
                          />
                          <div className="flex gap-2">
                            <Select
                              value={block.align || "center"}
                              onValueChange={(value: "left" | "center" | "right") => 
                                updateBlock(index, { align: value })
                              }
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="left">Left</SelectItem>
                                <SelectItem value="center">Center</SelectItem>
                                <SelectItem value="right">Right</SelectItem>
                              </SelectContent>
                            </Select>
                            <Select
                              value={block.size || "full"}
                              onValueChange={(value: "full" | "half" | "thumb") => 
                                updateBlock(index, { size: value })
                              }
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="full">Full (600px)</SelectItem>
                                <SelectItem value="half">Half (288px)</SelectItem>
                                <SelectItem value="thumb">Thumb (150px)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      ) : (
                        <Button
                          onClick={() => {
                            setImageUploadIndex(index);
                            fileInputRef.current?.click();
                          }}
                          disabled={uploading}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {uploading ? "Uploading..." : "Choose Image"}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </TabsContent>
            
            <TabsContent value="preview">
              <div className="bg-white border rounded-lg p-6">
                <div style={{ maxWidth: "600px", margin: "0 auto", fontFamily: "Arial, sans-serif" }}>
                  {renderEmailPreview()}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Validation Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {brief.keyPoints?.length > 0 ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <X className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm">At least 1 key point</span>
            </div>
            <div className="flex items-center gap-2">
              {brief.offer?.url || !brief.offer?.label ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <X className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm">CTA URL present (or none)</span>
            </div>
            <div className="flex items-center gap-2">
              {blocks.filter(b => b.type === "image").length <= 6 ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <X className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm">No more than 6 images</span>
            </div>
            <div className="flex items-center gap-2">
              {blocks.filter(b => b.type === "image" && !b.alt).length === 0 ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <X className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm">All images have alt text</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={handleSave} disabled={saveMutation.isPending}>
          Save Draft
        </Button>
        <Button 
          onClick={handleSave} 
          disabled={errors.length > 0 || saveMutation.isPending}
        >
          Ready for Review
        </Button>
      </div>
    </div>
  );
}
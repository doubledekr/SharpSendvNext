import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { EmailBuilder } from "@/components/EmailBuilder";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Send, Copy, Download, Plus, Mail, Eye, Settings } from "lucide-react";

interface EmailTemplate {
  id: string;
  name: string;
  description?: string;
  type: "newsletter" | "campaign" | "transactional";
  content: {
    html: string;
    css: string;
    json: any;
  };
  assignmentId?: string;
  createdAt: string;
  updatedAt: string;
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  status: string;
  type: string;
}

export function EmailBuilderPage() {
  const [location, setLocation] = useLocation();
  const [match, params] = useRoute("/email-builder/:templateId?");
  const { toast } = useToast();
  
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [templateType, setTemplateType] = useState<"newsletter" | "campaign" | "transactional">("newsletter");
  const [selectedAssignment, setSelectedAssignment] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<EmailTemplate | null>(null);

  const templateId = params?.templateId;
  const isNewTemplate = !templateId;

  // Fetch existing template if editing
  const { data: template, isLoading: isLoadingTemplate } = useQuery<EmailTemplate>({
    queryKey: ["/api/email-templates", templateId],
    enabled: !!templateId,
  });

  // Fetch assignments for template creation
  const { data: assignments = [] } = useQuery<Assignment[]>({
    queryKey: ["/api/assignments"],
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      type: string;
      assignmentId?: string;
      content: { html: string; css: string; json: any };
    }) => {
      const response = await apiRequest("POST", "/api/email-templates", data);
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-templates"] });
      setCurrentTemplate(data);
      setIsCreateDialogOpen(false);
      toast({
        title: "Template Created",
        description: "Your email template has been created successfully.",
      });
      // Navigate to the new template
      setLocation(`/email-builder/${data.id}`);
    },
    onError: () => {
      toast({
        title: "Creation Failed",
        description: "Failed to create template. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Save template mutation
  const saveTemplateMutation = useMutation({
    mutationFn: async (data: {
      html: string;
      css: string;
      json: any;
    }) => {
      if (!templateId) throw new Error("No template ID");
      
      const response = await apiRequest("PATCH", `/api/email-templates/${templateId}`, {
        content: data,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-templates", templateId] });
      toast({
        title: "Template Saved",
        description: "Your changes have been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Save Failed",
        description: "Failed to save template. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Export template mutation
  const exportTemplateMutation = useMutation({
    mutationFn: async () => {
      if (!templateId) throw new Error("No template ID");
      
      const response = await apiRequest("POST", `/api/email-templates/${templateId}/export`, {});
      return await response.json();
    },
    onSuccess: (data) => {
      // Create download link
      const blob = new Blob([data.html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${template?.name || "email-template"}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Template Exported",
        description: "Your template has been downloaded as HTML.",
      });
    },
  });

  useEffect(() => {
    if (template) {
      setCurrentTemplate(template);
    }
  }, [template]);

  const handleCreateTemplate = () => {
    if (!templateName.trim()) {
      toast({
        title: "Name Required",
        description: "Please provide a name for your template.",
        variant: "destructive",
      });
      return;
    }

    createTemplateMutation.mutate({
      name: templateName,
      description: templateDescription,
      type: templateType,
      assignmentId: selectedAssignment || undefined,
      content: {
        html: "",
        css: "",
        json: {},
      },
    });
  };

  const handleSaveTemplate = async (html: string, css: string, json: any) => {
    if (isNewTemplate) {
      // For new templates, we need to create first
      if (!templateName.trim()) {
        setIsCreateDialogOpen(true);
        return;
      }
      
      createTemplateMutation.mutate({
        name: templateName,
        description: templateDescription,
        type: templateType,
        assignmentId: selectedAssignment || undefined,
        content: { html, css, json },
      });
    } else {
      // Save existing template
      saveTemplateMutation.mutate({ html, css, json });
    }
  };

  const handlePreview = (html: string) => {
    const previewWindow = window.open("", "_blank");
    if (previewWindow) {
      previewWindow.document.write(html);
      previewWindow.document.close();
    }
  };

  if (isLoadingTemplate && templateId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading template...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/assignments")}
              data-testid="button-back-to-assignments"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Assignments
            </Button>
            
            <div>
              <h1 className="text-xl font-semibold">
                {isNewTemplate ? "Create Email Template" : template?.name || "Email Template"}
              </h1>
              {template?.description && (
                <p className="text-sm text-muted-foreground">{template.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {template && (
              <>
                <Badge variant="secondary">{template.type}</Badge>
                {template.assignmentId && (
                  <Badge variant="outline">
                    Assignment: {assignments.find(a => a.id === template.assignmentId)?.title || template.assignmentId}
                  </Badge>
                )}
              </>
            )}
            
            {templateId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportTemplateMutation.mutate()}
                disabled={exportTemplateMutation.isPending}
                data-testid="button-export-template"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            )}

            {isNewTemplate && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCreateDialogOpen(true)}
                data-testid="button-template-settings"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Email Builder */}
      <div className="flex-1">
        <EmailBuilder
          assignmentId={template?.assignmentId}
          initialContent={template?.content ? JSON.stringify(template.content.json) : undefined}
          templateType={template?.type || templateType}
          onSave={handleSaveTemplate}
          onPreview={handlePreview}
          readonly={false}
        />
      </div>

      {/* Create Template Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Template Settings</DialogTitle>
            <DialogDescription>
              Configure your email template settings before building.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="templateName">Template Name*</Label>
              <Input
                id="templateName"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g., Weekly Market Update"
                data-testid="input-template-name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="templateDescription">Description</Label>
              <Textarea
                id="templateDescription"
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                placeholder="Brief description of this template"
                rows={3}
                data-testid="textarea-template-description"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="templateType">Template Type</Label>
              <Select value={templateType} onValueChange={(value: any) => setTemplateType(value)}>
                <SelectTrigger id="templateType" data-testid="select-template-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newsletter">Newsletter</SelectItem>
                  <SelectItem value="campaign">Campaign</SelectItem>
                  <SelectItem value="transactional">Transactional</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="assignment">Link to Assignment (Optional)</Label>
              <Select value={selectedAssignment} onValueChange={setSelectedAssignment}>
                <SelectTrigger id="assignment" data-testid="select-assignment">
                  <SelectValue placeholder="Select an assignment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {assignments.map((assignment) => (
                    <SelectItem key={assignment.id} value={assignment.id}>
                      {assignment.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              data-testid="button-cancel-template"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateTemplate}
              disabled={createTemplateMutation.isPending}
              data-testid="button-create-template"
            >
              {createTemplateMutation.isPending ? "Creating..." : "Create Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Save, Eye, Send, Download, Upload, Undo, Redo, Smartphone, Monitor, Settings } from "lucide-react";

// Import GrapesJS and plugins
import grapesjs from "grapesjs";
import "grapesjs/dist/css/grapes.min.css";

// GrapesJS Plugins
import gjsPresetNewsletter from "grapesjs-preset-newsletter";
import gjsPresetWebpage from "grapesjs-preset-webpage";
import gjsBlocksBasic from "grapesjs-blocks-basic";
import gjsPluginForms from "grapesjs-plugin-forms";
import gjsComponentCountdown from "grapesjs-component-countdown";
import gjsPluginExport from "grapesjs-plugin-export";
import gjsStyleGradient from "grapesjs-style-gradient";

interface EmailBuilderProps {
  assignmentId?: string;
  initialContent?: string;
  templateType?: "newsletter" | "campaign" | "transactional";
  onSave?: (html: string, css: string, json: any) => void;
  onPreview?: (html: string) => void;
  readonly?: boolean;
}

export function EmailBuilder({
  assignmentId,
  initialContent,
  templateType = "newsletter",
  onSave,
  onPreview,
  readonly = false
}: EmailBuilderProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [editor, setEditor] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deviceMode, setDeviceMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const { toast } = useToast();

  useEffect(() => {
    if (!editorRef.current) return;

    // Initialize GrapesJS
    const grapesEditor = grapesjs.init({
      container: editorRef.current,
      width: "100%",
      height: "100vh",
      storageManager: false, // We'll handle storage manually
      blockManager: {
        appendTo: ".blocks-container",
      },
      layerManager: {
        appendTo: ".layers-container",
      },
      styleManager: {
        appendTo: ".styles-container",
        sectors: [
          {
            name: "Typography",
            open: false,
            buildProps: ["font-family", "font-size", "font-weight", "letter-spacing", "color", "line-height"],
          },
          {
            name: "Decorations",
            open: false,
            buildProps: ["text-decoration", "text-shadow"],
          },
          {
            name: "Layout",
            open: false,
            buildProps: ["width", "height", "max-width", "min-height", "margin", "padding"],
          },
          {
            name: "Background",
            open: false,
            buildProps: ["background-color", "background-image", "background-repeat", "background-position"],
          },
          {
            name: "Border",
            open: false,
            buildProps: ["border", "border-radius"],
          },
        ],
      },
      traitManager: {
        appendTo: ".traits-container",
      },
      deviceManager: {
        devices: [
          {
            name: "Desktop",
            width: "",
          },
          {
            name: "Tablet",
            width: "768px",
            widthMedia: "992px",
          },
          {
            name: "Mobile",
            width: "320px",
            widthMedia: "768px",
          },
        ],
      },
      plugins: [
        gjsPresetNewsletter,
        gjsPresetWebpage,
        gjsBlocksBasic,
        gjsPluginForms,
        gjsComponentCountdown,
        gjsPluginExport,
        gjsStyleGradient,
      ],
      pluginsOpts: {
        "gjs-preset-newsletter": {
          modalTitleImport: "Import Newsletter Template",
          modalTitleExport: "Export Newsletter",
          codeViewerTheme: "material",
          confirmClearAll: true,
          showStylesOnChange: true,
          useCustomTheme: true,
        },
        "gjs-preset-webpage": {
          blocksBasicOpts: {
            blocks: ["column1", "column2", "column3", "text", "link", "image", "video"],
            flexGrid: 1,
          },
          blocks: ["wp-text", "wp-link", "wp-button", "wp-image", "wp-quote", "wp-video"],
          modalImportTitle: "Import Template",
          modalImportLabel: '<div style="margin-bottom: 10px; font-size: 13px;">Paste here your HTML/CSS and click Import</div>',
          modalImportContent: function(editor: any) {
            return editor.getHtml() + "<style>" + editor.getCss() + "</style>";
          },
        },
        "gjs-blocks-basic": {},
        "gjs-plugin-forms": {},
        "gjs-component-countdown": {},
        "gjs-plugin-export": {
          addExportBtn: true,
          btnLabel: "Export",
          filenamePfx: "grapesjs_template",
          filename: (editor: any) => `${assignmentId || "email"}_template`,
          root: {
            css: {
              "style.css": (editor: any) => editor.getCss(),
            },
            "index.html": (editor: any) =>
              `<!doctype html>
              <html>
                <head>
                  <meta charset="utf-8">
                  <title>Email Template</title>
                  <style>${editor.getCss()}</style>
                </head>
                <body>${editor.getHtml()}</body>
              </html>`,
          },
        },
        "gjs-style-gradient": {},
      },
      canvas: {
        styles: [
          "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap",
        ],
      },
    });

    // Load initial content if provided
    if (initialContent) {
      try {
        const content = JSON.parse(initialContent);
        grapesEditor.loadProjectData(content);
      } catch (error) {
        // If it's not JSON, treat as HTML
        grapesEditor.setComponents(initialContent);
      }
    }

    // Add email-specific components
    grapesEditor.BlockManager.add("email-header", {
      label: "Email Header",
      category: "Email Components",
      content: `
        <div style="background-color: #1a365d; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; font-weight: bold;">Your Newsletter Title</h1>
          <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Subtitle or tagline here</p>
        </div>
      `,
    });

    grapesEditor.BlockManager.add("email-footer", {
      label: "Email Footer",
      category: "Email Components", 
      content: `
        <div style="background-color: #f7fafc; padding: 20px; text-align: center; font-size: 12px; color: #718096; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0 0 10px 0;">&copy; 2025 Your Company. All rights reserved.</p>
          <p style="margin: 0;">
            <a href="#" style="color: #3182ce; text-decoration: none;">Unsubscribe</a> | 
            <a href="#" style="color: #3182ce; text-decoration: none;">View in Browser</a>
          </p>
        </div>
      `,
    });

    grapesEditor.BlockManager.add("cta-button", {
      label: "Call to Action",
      category: "Email Components",
      content: `
        <div style="text-align: center; padding: 20px;">
          <a href="#" style="display: inline-block; background-color: #3182ce; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 16px;">
            Get Started Today
          </a>
        </div>
      `,
    });

    grapesEditor.BlockManager.add("market-data", {
      label: "Market Data",
      category: "Financial Components",
      content: `
        <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; background-color: #f7fafc;">
          <h3 style="margin: 0 0 15px 0; color: #2d3748; font-size: 18px;">Market Snapshot</h3>
          <div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 15px;">
            <div style="text-align: center; min-width: 120px;">
              <div style="font-size: 24px; font-weight: bold; color: #38a169;">+2.4%</div>
              <div style="font-size: 12px; color: #718096;">S&P 500</div>
            </div>
            <div style="text-align: center; min-width: 120px;">
              <div style="font-size: 24px; font-weight: bold; color: #e53e3e;">-1.2%</div>
              <div style="font-size: 12px; color: #718096;">NASDAQ</div>
            </div>
            <div style="text-align: center; min-width: 120px;">
              <div style="font-size: 24px; font-weight: bold; color: #38a169;">+0.8%</div>
              <div style="font-size: 12px; color: #718096;">DOW</div>
            </div>
          </div>
        </div>
      `,
    });

    // Device management
    grapesEditor.on("change:device", () => {
      const device = grapesEditor.getDevice();
      setDeviceMode(device.toLowerCase() as "desktop" | "tablet" | "mobile");
    });

    setEditor(grapesEditor);
    setIsLoading(false);

    // Cleanup
    return () => {
      if (grapesEditor) {
        grapesEditor.destroy();
      }
    };
  }, [assignmentId, initialContent]);

  const handleSave = async () => {
    if (!editor) return;
    
    setIsSaving(true);
    try {
      const html = editor.getHtml();
      const css = editor.getCss();
      const json = editor.getProjectData();
      
      if (onSave) {
        await onSave(html, css, json);
      }
      
      toast({
        title: "Template Saved",
        description: "Your email template has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save template. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = () => {
    if (!editor) return;
    
    const html = editor.getHtml();
    const css = editor.getCss();
    const fullHtml = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Email Preview</title>
          <style>${css}</style>
        </head>
        <body>${html}</body>
      </html>
    `;
    
    if (onPreview) {
      onPreview(fullHtml);
    } else {
      // Open in new window
      const previewWindow = window.open("", "_blank");
      if (previewWindow) {
        previewWindow.document.write(fullHtml);
        previewWindow.document.close();
      }
    }
  };

  const handleUndo = () => {
    if (editor) editor.UndoManager.undo();
  };

  const handleRedo = () => {
    if (editor) editor.UndoManager.redo();
  };

  const setDevice = (device: "desktop" | "tablet" | "mobile") => {
    if (editor) {
      const deviceName = device.charAt(0).toUpperCase() + device.slice(1);
      editor.setDevice(deviceName);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Email Builder...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Toolbar */}
      <div className="border-b bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {templateType.charAt(0).toUpperCase() + templateType.slice(1)} Template
            </Badge>
            {assignmentId && (
              <Badge variant="outline">Assignment: {assignmentId}</Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Device Controls */}
            <div className="flex items-center gap-1 border rounded-md p-1">
              <Button
                size="sm"
                variant={deviceMode === "desktop" ? "default" : "ghost"}
                onClick={() => setDevice("desktop")}
                className="h-8 w-8 p-0"
                data-testid="button-device-desktop"
              >
                <Monitor className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={deviceMode === "tablet" ? "default" : "ghost"}
                onClick={() => setDevice("tablet")}
                className="h-8 w-8 p-0"
                data-testid="button-device-tablet"
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={deviceMode === "mobile" ? "default" : "ghost"}
                onClick={() => setDevice("mobile")}
                className="h-8 w-8 p-0"
                data-testid="button-device-mobile"
              >
                <Smartphone className="h-4 w-4" />
              </Button>
            </div>

            {/* Action Controls */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleUndo}
              className="h-8 w-8 p-0"
              data-testid="button-undo"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRedo}
              className="h-8 w-8 p-0"
              data-testid="button-redo"
            >
              <Redo className="h-4 w-4" />
            </Button>
            
            {!readonly && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSave}
                  disabled={isSaving}
                  data-testid="button-save-template"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </>
            )}
            
            <Button
              size="sm"
              variant="outline"
              onClick={handlePreview}
              data-testid="button-preview-email"
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
          </div>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar with panels */}
        <div className="w-80 border-r bg-muted/30 overflow-y-auto">
          <Tabs defaultValue="blocks" className="h-full">
            <TabsList className="grid w-full grid-cols-3 m-2">
              <TabsTrigger value="blocks" className="text-xs">Blocks</TabsTrigger>
              <TabsTrigger value="layers" className="text-xs">Layers</TabsTrigger>
              <TabsTrigger value="styles" className="text-xs">Styles</TabsTrigger>
            </TabsList>
            
            <TabsContent value="blocks" className="p-2">
              <div className="blocks-container"></div>
            </TabsContent>
            
            <TabsContent value="layers" className="p-2">
              <div className="layers-container"></div>
            </TabsContent>
            
            <TabsContent value="styles" className="p-2">
              <div className="styles-container"></div>
              <div className="traits-container mt-4"></div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Editor Canvas */}
        <div className="flex-1">
          <div 
            ref={editorRef} 
            className="h-full"
            data-testid="email-builder-canvas"
          />
        </div>
      </div>
    </div>
  );
}
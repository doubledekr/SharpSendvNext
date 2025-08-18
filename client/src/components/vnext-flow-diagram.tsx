import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Mail, 
  Users, 
  Target, 
  Zap,
  ArrowRight,
  Sparkles,
  Send
} from "lucide-react";

interface FlowNode {
  id: string;
  type: "master" | "segment" | "variant" | "send";
  label: string;
  count?: number;
  status?: string;
  x: number;
  y: number;
  color: string;
}

interface FlowConnection {
  from: string;
  to: string;
  animated: boolean;
}

interface VNextFlowDiagramProps {
  masterEmail?: {
    id: string;
    title: string;
    status: string;
  };
  segments?: Array<{
    id: string;
    name: string;
    subscriberCount: number;
  }>;
  variants?: Array<{
    id: string;
    segmentId: string;
    status: string;
  }>;
}

export default function VNextFlowDiagram({ 
  masterEmail, 
  segments = [], 
  variants = [] 
}: VNextFlowDiagramProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [animationFrame, setAnimationFrame] = useState(0);
  
  // Generate flow nodes
  const generateNodes = (): FlowNode[] => {
    const nodes: FlowNode[] = [];
    
    // Master email node
    if (masterEmail) {
      nodes.push({
        id: "master",
        type: "master",
        label: masterEmail.title || "Master Email",
        status: masterEmail.status,
        x: 100,
        y: 200,
        color: "#3b82f6"
      });
    }
    
    // Segment nodes
    segments.forEach((segment, index) => {
      nodes.push({
        id: `segment-${segment.id}`,
        type: "segment",
        label: segment.name,
        count: segment.subscriberCount,
        x: 350,
        y: 100 + (index * 120),
        color: "#8b5cf6"
      });
    });
    
    // Variant nodes
    segments.forEach((segment, index) => {
      const segmentVariants = variants.filter(v => v.segmentId === segment.id);
      if (segmentVariants.length > 0) {
        nodes.push({
          id: `variant-${segment.id}`,
          type: "variant",
          label: `Variant`,
          status: segmentVariants[0].status,
          x: 600,
          y: 100 + (index * 120),
          color: "#10b981"
        });
      }
    });
    
    // Send node
    if (variants.length > 0) {
      nodes.push({
        id: "send",
        type: "send",
        label: "Send Campaign",
        count: segments.reduce((sum, s) => sum + s.subscriberCount, 0),
        x: 850,
        y: 200,
        color: "#f59e0b"
      });
    }
    
    return nodes;
  };
  
  // Generate connections
  const generateConnections = (): FlowConnection[] => {
    const connections: FlowConnection[] = [];
    
    if (masterEmail) {
      // Connect master to segments
      segments.forEach(segment => {
        connections.push({
          from: "master",
          to: `segment-${segment.id}`,
          animated: true
        });
      });
      
      // Connect segments to variants
      segments.forEach(segment => {
        if (variants.some(v => v.segmentId === segment.id)) {
          connections.push({
            from: `segment-${segment.id}`,
            to: `variant-${segment.id}`,
            animated: true
          });
        }
      });
      
      // Connect variants to send
      segments.forEach(segment => {
        if (variants.some(v => v.segmentId === segment.id)) {
          connections.push({
            from: `variant-${segment.id}`,
            to: "send",
            animated: true
          });
        }
      });
    }
    
    return connections;
  };
  
  const nodes = generateNodes();
  const connections = generateConnections();
  
  // Canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw connections
      connections.forEach(conn => {
        const fromNode = nodes.find(n => n.id === conn.from);
        const toNode = nodes.find(n => n.id === conn.to);
        
        if (fromNode && toNode) {
          ctx.beginPath();
          ctx.moveTo(fromNode.x + 60, fromNode.y);
          ctx.lineTo(toNode.x - 60, toNode.y);
          
          if (conn.animated) {
            // Animated gradient line
            const gradient = ctx.createLinearGradient(
              fromNode.x + 60, fromNode.y,
              toNode.x - 60, toNode.y
            );
            
            const offset = (animationFrame % 100) / 100;
            gradient.addColorStop(0, "rgba(59, 130, 246, 0.2)");
            gradient.addColorStop(offset, "rgba(59, 130, 246, 0.8)");
            gradient.addColorStop(Math.min(offset + 0.1, 1), "rgba(59, 130, 246, 0.2)");
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 2;
          } else {
            ctx.strokeStyle = "rgba(156, 163, 175, 0.3)";
            ctx.lineWidth = 1;
          }
          
          ctx.stroke();
          
          // Draw arrow
          const angle = Math.atan2(toNode.y - fromNode.y, toNode.x - fromNode.x);
          const arrowX = toNode.x - 65;
          const arrowY = toNode.y;
          
          ctx.beginPath();
          ctx.moveTo(arrowX, arrowY);
          ctx.lineTo(
            arrowX - 10 * Math.cos(angle - Math.PI / 6),
            arrowY - 10 * Math.sin(angle - Math.PI / 6)
          );
          ctx.moveTo(arrowX, arrowY);
          ctx.lineTo(
            arrowX - 10 * Math.cos(angle + Math.PI / 6),
            arrowY - 10 * Math.sin(angle + Math.PI / 6)
          );
          ctx.stroke();
        }
      });
      
      setAnimationFrame(prev => prev + 1);
    };
    
    const interval = setInterval(animate, 50);
    return () => clearInterval(interval);
  }, [nodes, connections, animationFrame]);
  
  const getNodeIcon = (type: string) => {
    switch (type) {
      case "master": return <Mail className="w-5 h-5" />;
      case "segment": return <Users className="w-5 h-5" />;
      case "variant": return <Target className="w-5 h-5" />;
      case "send": return <Send className="w-5 h-5" />;
      default: return <Zap className="w-5 h-5" />;
    }
  };
  
  return (
    <Card className="relative p-6 overflow-hidden" data-testid="vnext-flow-diagram">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 opacity-50" />
      
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center" data-testid="flow-title">
            <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
            Email Generation Flow
          </h3>
          <Badge variant="secondary" data-testid="flow-status">
            {nodes.length} nodes
          </Badge>
        </div>
        
        <div className="relative h-[400px]" data-testid="flow-container">
          <canvas
            ref={canvasRef}
            width={1000}
            height={400}
            className="absolute inset-0 w-full h-full"
            style={{ width: "100%", height: "100%" }}
            data-testid="flow-canvas"
          />
          
          {/* Render nodes */}
          {nodes.map(node => (
            <div
              key={node.id}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
                hoveredNode === node.id ? "scale-110 z-10" : ""
              }`}
              style={{
                left: `${(node.x / 1000) * 100}%`,
                top: `${(node.y / 400) * 100}%`
              }}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              data-testid={`flow-node-${node.id}`}
            >
              <div
                className="bg-white rounded-lg shadow-lg p-3 border-2 cursor-pointer"
                style={{ borderColor: node.color }}
              >
                <div className="flex items-center space-x-2">
                  <div
                    className="p-2 rounded-full"
                    style={{ backgroundColor: `${node.color}20` }}
                  >
                    <div style={{ color: node.color }}>
                      {getNodeIcon(node.type)}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium" data-testid={`node-label-${node.id}`}>
                      {node.label}
                    </p>
                    {node.count && (
                      <p className="text-xs text-gray-600" data-testid={`node-count-${node.id}`}>
                        {node.count.toLocaleString()}
                      </p>
                    )}
                    {node.status && (
                      <Badge 
                        variant="outline" 
                        className="text-xs mt-1"
                        data-testid={`node-status-${node.id}`}
                      >
                        {node.status}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Pulse animation for active nodes */}
              {node.type === "master" && (
                <div
                  className="absolute inset-0 rounded-lg animate-ping"
                  style={{ backgroundColor: `${node.color}20` }}
                />
              )}
            </div>
          ))}
          
          {/* Flow indicators */}
          <div className="absolute bottom-4 left-4 flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-2" data-testid="flow-legend-master">
              <div className="w-3 h-3 bg-blue-500 rounded-full" />
              <span>Master Email</span>
            </div>
            <div className="flex items-center space-x-2" data-testid="flow-legend-segments">
              <div className="w-3 h-3 bg-purple-500 rounded-full" />
              <span>Segments</span>
            </div>
            <div className="flex items-center space-x-2" data-testid="flow-legend-variants">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span>Variants</span>
            </div>
            <div className="flex items-center space-x-2" data-testid="flow-legend-send">
              <div className="w-3 h-3 bg-amber-500 rounded-full" />
              <span>Send</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
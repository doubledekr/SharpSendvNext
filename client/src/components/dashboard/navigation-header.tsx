import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, 
  Users, 
  Brain, 
  BarChart3, 
  TestTube, 
  DollarSign, 
  Mail, 
  Settings,
  Edit3,
  FileText,
  Eye,
  TrendingUp,
  Zap,
  LogOut,
  PlusCircle,
  Sparkles,
  Send
} from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface NavigationHeaderProps {
  currentPage?: string;
}

const NavigationHeader: React.FC<NavigationHeaderProps> = ({ currentPage }) => {
  const [, setLocation] = useLocation();
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const [assignmentType, setAssignmentType] = useState<'copywriter' | 'ai' | 'email'>('ai');
  const [assignmentData, setAssignmentData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    targetAudience: ''
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('publisher');
    localStorage.removeItem('user');
    setLocation('/login');
  };

  const handleCreateAssignment = () => {
    // Navigate to unified assignment form
    setLocation('/assignments?autoOpen=true');
  };

  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      description: 'Main overview and analytics'
    },
    {
      id: 'editorial',
      label: 'Editorial',
      path: '/editorial',
      icon: Edit3,
      description: 'Content creation and management',
      badge: 'New'
    },
    {
      id: 'copywriter',
      label: 'Copywriter',
      path: '/copywriter',
      icon: FileText,
      description: 'Writing tasks and AI assistance'
    },
    {
      id: 'email-preview',
      label: 'Email Preview',
      path: '/email-preview',
      icon: Eye,
      description: 'Preview and approve campaigns',
      badge: 'AI'
    },

  ];

  return (
    <div className="bg-slate-800 border-b border-slate-700 px-6 py-3 shadow-lg">
      <div className="flex items-center justify-between">
        {/* Logo and Title */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">SharpSend.io</h1>
              <p className="text-xs text-slate-400">Financial Publishers Platform</p>
            </div>
          </div>
          
          <div className="h-8 w-px bg-slate-600 mx-2"></div>
          
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-400 font-medium">AI Engine: Active</span>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex items-center gap-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id || 
                           (currentPage === 'dashboard' && item.id === 'dashboard');
            
            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                onClick={() => setLocation(item.path)}
                className={`
                  relative flex items-center gap-2 px-3 py-2 text-sm
                  ${isActive 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                  }
                `}
                title={item.description}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden md:inline">{item.label}</span>
                {item.badge && (
                  <Badge 
                    variant="secondary" 
                    className="ml-1 text-xs bg-blue-500 text-white"
                  >
                    {item.badge}
                  </Badge>
                )}
              </Button>
            );
          })}
          
          {/* Quick Create Assignment Button */}
          <Dialog open={isAssignmentDialogOpen} onOpenChange={setIsAssignmentDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-brand-blue to-purple-600 hover:from-brand-blue/90 hover:to-purple-600/90 text-white font-semibold shadow-lg">
                <PlusCircle className="h-4 w-4 mr-2" />
                Quick Create
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create AI Assignment</DialogTitle>
                <DialogDescription>
                  Create a task for copywriters, generate with AI, or create an email draft
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {/* Assignment Type Selection */}
                <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                  <Button
                    type="button"
                    variant={assignmentType === 'copywriter' ? 'default' : 'ghost'}
                    className="flex-1"
                    onClick={() => setAssignmentType('copywriter')}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Send to Copywriter
                  </Button>
                  <Button
                    type="button"
                    variant={assignmentType === 'ai' ? 'default' : 'ghost'}
                    className="flex-1"
                    onClick={() => setAssignmentType('ai')}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate with AI
                  </Button>
                  <Button
                    type="button"
                    variant={assignmentType === 'email' ? 'default' : 'ghost'}
                    className="flex-1"
                    onClick={() => setAssignmentType('email')}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Create Email
                  </Button>
                </div>

                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={assignmentData.title}
                    onChange={(e) => setAssignmentData({...assignmentData, title: e.target.value})}
                    placeholder="Enter assignment title"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={assignmentData.description}
                    onChange={(e) => setAssignmentData({...assignmentData, description: e.target.value})}
                    placeholder="Describe what content is needed..."
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={assignmentData.priority} onValueChange={(value) => setAssignmentData({...assignmentData, priority: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={assignmentData.dueDate}
                      onChange={(e) => setAssignmentData({...assignmentData, dueDate: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="targetAudience">Target Audience</Label>
                  <Input
                    id="targetAudience"
                    value={assignmentData.targetAudience}
                    onChange={(e) => setAssignmentData({...assignmentData, targetAudience: e.target.value})}
                    placeholder="e.g., Growth investors, Risk-averse retirees"
                  />
                </div>

                {assignmentType === 'ai' && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <Sparkles className="h-4 w-4 inline mr-1" />
                      AI will generate personalized content based on your requirements and market conditions
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAssignmentDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateAssignment}>
                  {assignmentType === 'copywriter' ? 'Send to Copywriter' :
                   assignmentType === 'ai' ? 'Generate with AI' : 'Create Email Draft'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Logout Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-slate-400 hover:text-red-400 hover:bg-slate-700 ml-2"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden md:inline ml-2">Logout</span>
          </Button>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="flex items-center gap-6 mt-3 pt-3 border-t border-slate-700">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span className="text-slate-400">Publisher:</span>
          <span className="text-white font-medium">SharpSend Demo</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-slate-400">Active Subscribers:</span>
          <span className="text-green-400 font-medium">12,847</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
          <span className="text-slate-400">Engagement Rate:</span>
          <span className="text-purple-400 font-medium">74.2%</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
          <span className="text-slate-400">Monthly Revenue:</span>
          <span className="text-yellow-400 font-medium">$89,450</span>
        </div>
      </div>
    </div>
  );
};

export default NavigationHeader;


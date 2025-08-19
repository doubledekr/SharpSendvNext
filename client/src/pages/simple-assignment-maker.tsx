import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Send, Calendar, Target, FileText, CheckCircle } from "lucide-react";

interface SimpleAssignment {
  title: string;
  description: string;
  type: string;
  priority: string;
  dueDate: string;
  notes: string;
  tags: string[];
}

export function SimpleAssignmentMaker() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [assignment, setAssignment] = useState<SimpleAssignment>({
    title: "",
    description: "",
    type: "newsletter",
    priority: "medium",
    dueDate: "",
    notes: "",
    tags: []
  });

  const createMutation = useMutation({
    mutationFn: async (data: SimpleAssignment) => {
      return await apiRequest("/api/assignments", "POST", data);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      toast({
        title: "Assignment Created",
        description: "Your assignment has been created successfully.",
      });
      setIsOpen(false);
      resetForm();
      
      // Show shareable link if available
      if (result.shareableUrl) {
        setTimeout(() => {
          toast({
            title: "Shareable Link Created",
            description: `Assignment link: ${result.shareableUrl}`,
          });
        }, 500);
      }
    },
    onError: (error) => {
      console.error("Assignment creation error:", error);
      toast({
        title: "Error",
        description: "Failed to create assignment. Please try again.",
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setAssignment({
      title: "",
      description: "",
      type: "newsletter",
      priority: "medium",
      dueDate: "",
      notes: "",
      tags: []
    });
    setTagInput("");
  };

  const addTag = () => {
    if (tagInput.trim() && !assignment.tags.includes(tagInput.trim())) {
      setAssignment(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setAssignment(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!assignment.title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title for the assignment.",
        variant: "destructive",
      });
      return;
    }

    if (!assignment.description.trim()) {
      toast({
        title: "Description Required", 
        description: "Please enter a description for the assignment.",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate(assignment);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-create-assignment" className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Create Assignment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Create New Assignment</span>
          </DialogTitle>
          <DialogDescription>
            Create a simple assignment for your team. Keep it focused and actionable.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              data-testid="input-assignment-title"
              placeholder="e.g., Market Update Newsletter for Tech Stocks"
              value={assignment.title}
              onChange={(e) => setAssignment(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              data-testid="textarea-assignment-description"
              placeholder="Describe what needs to be done, key requirements, and expected outcome..."
              value={assignment.description}
              onChange={(e) => setAssignment(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={assignment.type} onValueChange={(value) => setAssignment(prev => ({ ...prev, type: value }))}>
                <SelectTrigger data-testid="select-assignment-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newsletter">Newsletter</SelectItem>
                  <SelectItem value="article">Article</SelectItem>
                  <SelectItem value="research">Research</SelectItem>
                  <SelectItem value="analysis">Analysis</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={assignment.priority} onValueChange={(value) => setAssignment(prev => ({ ...prev, priority: value }))}>
                <SelectTrigger data-testid="select-assignment-priority">
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              data-testid="input-assignment-due-date"
              type="date"
              value={assignment.dueDate}
              onChange={(e) => setAssignment(prev => ({ ...prev, dueDate: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex space-x-2">
              <Input
                id="tags"
                data-testid="input-assignment-tags"
                placeholder="Add a tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <Button type="button" onClick={addTag} variant="outline" size="sm">
                Add
              </Button>
            </div>
            {assignment.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {assignment.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                    {tag} ×
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              data-testid="textarea-assignment-notes"
              placeholder="Any additional context, resources, or special instructions..."
              value={assignment.notes}
              onChange={(e) => setAssignment(prev => ({ ...prev, notes: e.target.value }))}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              data-testid="button-submit-assignment"
              disabled={createMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {createMutation.isPending ? (
                <>Creating...</>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Create Assignment
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
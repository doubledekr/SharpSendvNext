import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Calendar, Target, Zap } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface NewContentRequestFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export default function NewContentRequestForm({ onClose, onSuccess }: NewContentRequestFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    contentType: "",
    priority: "medium",
    dueDate: "",
    estimatedReach: "",
    targetCohorts: [] as string[],
    marketTriggers: [] as string[],
  });

  const [newCohort, setNewCohort] = useState("");
  const [newTrigger, setNewTrigger] = useState("");

  const queryClient = useQueryClient();

  const createRequestMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/content/content-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create content request');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/content/content-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/content/dashboard/stats'] });
      onSuccess?.();
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const requestData = {
      ...formData,
      estimatedReach: formData.estimatedReach ? parseInt(formData.estimatedReach) : 0,
      dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
    };

    createRequestMutation.mutate(requestData);
  };

  const addCohort = () => {
    if (newCohort.trim() && !formData.targetCohorts.includes(newCohort.trim())) {
      setFormData(prev => ({
        ...prev,
        targetCohorts: [...prev.targetCohorts, newCohort.trim()]
      }));
      setNewCohort("");
    }
  };

  const removeCohort = (cohort: string) => {
    setFormData(prev => ({
      ...prev,
      targetCohorts: prev.targetCohorts.filter(c => c !== cohort)
    }));
  };

  const addTrigger = () => {
    if (newTrigger.trim() && !formData.marketTriggers.includes(newTrigger.trim())) {
      setFormData(prev => ({
        ...prev,
        marketTriggers: [...prev.marketTriggers, newTrigger.trim()]
      }));
      setNewTrigger("");
    }
  };

  const removeTrigger = (trigger: string) => {
    setFormData(prev => ({
      ...prev,
      marketTriggers: prev.marketTriggers.filter(t => t !== trigger)
    }));
  };

  const availableCohorts = [
    "High Net Worth Investors",
    "Conservative Savers",
    "Growth Seekers",
    "Income Focused",
    "Tech Enthusiasts",
    "ESG Investors",
    "Day Traders",
    "Long-term Holders"
  ];

  const availableTriggers = [
    "Fed Rate Decision",
    "Earnings Season",
    "Market Volatility",
    "Sector Rotation",
    "Economic Data Release",
    "Geopolitical Events",
    "Crypto Movement",
    "Commodity Price Changes"
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-dark-surface border-dark-border">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-white flex items-center space-x-2">
              <Plus className="h-5 w-5" />
              <span>New Content Request</span>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
              data-testid="button-close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-white">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Weekly Market Outlook - Tech Sector Focus"
                  className="bg-dark-bg border-dark-border text-white"
                  required
                  data-testid="input-title"
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-white">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the content requirements, tone, key points to cover..."
                  rows={4}
                  className="bg-dark-bg border-dark-border text-white"
                  data-testid="input-description"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="contentType" className="text-white">Content Type *</Label>
                  <Select 
                    value={formData.contentType} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, contentType: value }))}
                    required
                  >
                    <SelectTrigger className="bg-dark-bg border-dark-border text-white" data-testid="select-content-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="bg-dark-surface border-dark-border">
                      <SelectItem value="newsletter">Newsletter</SelectItem>
                      <SelectItem value="email">Email Campaign</SelectItem>
                      <SelectItem value="article">Article</SelectItem>
                      <SelectItem value="campaign">Marketing Campaign</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority" className="text-white">Priority</Label>
                  <Select 
                    value={formData.priority} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger className="bg-dark-bg border-dark-border text-white" data-testid="select-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-dark-surface border-dark-border">
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="dueDate" className="text-white flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>Due Date</span>
                  </Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="bg-dark-bg border-dark-border text-white"
                    data-testid="input-due-date"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="estimatedReach" className="text-white flex items-center space-x-1">
                  <Target className="h-4 w-4" />
                  <span>Estimated Reach</span>
                </Label>
                <Input
                  id="estimatedReach"
                  type="number"
                  value={formData.estimatedReach}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimatedReach: e.target.value }))}
                  placeholder="e.g., 15000"
                  className="bg-dark-bg border-dark-border text-white"
                  data-testid="input-estimated-reach"
                />
              </div>
            </div>

            {/* Target Cohorts */}
            <div className="space-y-3">
              <Label className="text-white">Target Cohorts</Label>
              <div className="flex space-x-2">
                <Select value={newCohort} onValueChange={setNewCohort}>
                  <SelectTrigger className="bg-dark-bg border-dark-border text-white" data-testid="select-cohort">
                    <SelectValue placeholder="Select cohort" />
                  </SelectTrigger>
                  <SelectContent className="bg-dark-surface border-dark-border">
                    {availableCohorts.map((cohort) => (
                      <SelectItem key={cohort} value={cohort}>{cohort}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  onClick={addCohort}
                  disabled={!newCohort}
                  className="bg-blue-600 hover:bg-blue-700"
                  data-testid="button-add-cohort"
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.targetCohorts.map((cohort) => (
                  <Badge
                    key={cohort}
                    className="bg-blue-500/20 text-blue-400 border-blue-500/30 flex items-center space-x-1"
                  >
                    <span>{cohort}</span>
                    <button
                      type="button"
                      onClick={() => removeCohort(cohort)}
                      className="ml-1 hover:text-blue-300"
                      data-testid={`button-remove-cohort-${cohort}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Market Triggers */}
            <div className="space-y-3">
              <Label className="text-white flex items-center space-x-1">
                <Zap className="h-4 w-4" />
                <span>Market Triggers</span>
              </Label>
              <div className="flex space-x-2">
                <Select value={newTrigger} onValueChange={setNewTrigger}>
                  <SelectTrigger className="bg-dark-bg border-dark-border text-white" data-testid="select-trigger">
                    <SelectValue placeholder="Select trigger" />
                  </SelectTrigger>
                  <SelectContent className="bg-dark-surface border-dark-border">
                    {availableTriggers.map((trigger) => (
                      <SelectItem key={trigger} value={trigger}>{trigger}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  onClick={addTrigger}
                  disabled={!newTrigger}
                  className="bg-orange-600 hover:bg-orange-700"
                  data-testid="button-add-trigger"
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.marketTriggers.map((trigger) => (
                  <Badge
                    key={trigger}
                    className="bg-orange-500/20 text-orange-400 border-orange-500/30 flex items-center space-x-1"
                  >
                    <span>{trigger}</span>
                    <button
                      type="button"
                      onClick={() => removeTrigger(trigger)}
                      className="ml-1 hover:text-orange-300"
                      data-testid={`button-remove-trigger-${trigger}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createRequestMutation.isPending || !formData.title || !formData.contentType}
                className="bg-brand-blue hover:bg-blue-600"
                data-testid="button-submit"
              >
                {createRequestMutation.isPending ? "Creating..." : "Create Request"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
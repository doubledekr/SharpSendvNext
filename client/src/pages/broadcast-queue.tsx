import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  Clock, 
  Send, 
  Pause, 
  Play, 
  X, 
  BarChart3, 
  Users, 
  Mail,
  CheckCircle,
  AlertCircle,
  Timer
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface BroadcastQueueItem {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  publisherId: string;
  priority: "high" | "medium" | "low";
  status: "queued" | "scheduled" | "sending" | "sent" | "failed" | "cancelled";
  scheduledAt?: string;
  sentAt?: string;
  audienceCount?: number;
  emailPlatform?: string;
  emailSubject?: string;
  createdAt: string;
  updatedAt: string;
}

interface BroadcastSendLog {
  id: string;
  broadcastId: string;
  status: "pending" | "sending" | "completed" | "failed";
  message: string;
  details?: any;
  createdAt: string;
}

export default function BroadcastQueue() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState<"all" | "scheduled" | "sent">("all");
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedBroadcast, setSelectedBroadcast] = useState<BroadcastQueueItem | null>(null);
  const [scheduleDateTime, setScheduleDateTime] = useState("");

  // Fetch broadcast queue items
  const { data: queueData, isLoading: queueLoading } = useQuery({
    queryKey: ["/api/broadcast-queue"],
  });

  // Schedule broadcast mutation
  const scheduleMutation = useMutation({
    mutationFn: async ({ id, scheduledAt }: { id: string; scheduledAt: string }) => {
      return apiRequest("POST", `/api/broadcast-queue/${id}/schedule`, { scheduledAt });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/broadcast-queue"] });
      toast({ title: "Success", description: "Broadcast scheduled successfully" });
      setScheduleDialogOpen(false);
      setSelectedBroadcast(null);
      setScheduleDateTime("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to schedule broadcast", variant: "destructive" });
    }
  });

  // Send broadcast mutation
  const sendMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/broadcast-queue/${id}/send`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/broadcast-queue"] });
      toast({ title: "Success", description: "Broadcast sent successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to send broadcast", variant: "destructive" });
    }
  });

  // Cancel broadcast mutation
  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/broadcast-queue/${id}/cancel`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/broadcast-queue"] });
      toast({ title: "Success", description: "Broadcast cancelled successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to cancel broadcast", variant: "destructive" });
    }
  });

  // Remove from queue mutation
  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/broadcast-queue/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/broadcast-queue"] });
      toast({ title: "Success", description: "Item removed from queue" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove item", variant: "destructive" });
    }
  });

  const items = queueData || [];

  // Filter items based on selected tab
  const filteredItems = items.filter(item => {
    if (selectedTab === "scheduled") return item.status === "scheduled";
    if (selectedTab === "sent") return item.status === "sent";
    return true;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "queued": return <Timer className="h-4 w-4" />;
      case "scheduled": return <Calendar className="h-4 w-4" />;
      case "sending": return <Send className="h-4 w-4 animate-pulse" />;
      case "sent": return <CheckCircle className="h-4 w-4" />;
      case "failed": return <AlertCircle className="h-4 w-4" />;
      case "cancelled": return <X className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "queued": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "scheduled": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "sending": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "sent": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "failed": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "cancelled": return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "medium": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case "low": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const handleScheduleSubmit = () => {
    if (!selectedBroadcast || !scheduleDateTime) return;
    
    scheduleMutation.mutate({
      id: selectedBroadcast.id,
      scheduledAt: scheduleDateTime
    });
  };

  const stats = {
    total: items.length,
    queued: items.filter(item => item.status === "queued").length,
    scheduled: items.filter(item => item.status === "scheduled").length,
    sent: items.filter(item => item.status === "sent").length,
    failed: items.filter(item => item.status === "failed").length
  };

  if (queueLoading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading broadcast queue...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="broadcast-queue-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Broadcast Queue
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage and schedule your email broadcasts
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Mail className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-2xl font-bold" data-testid="stats-total">{stats.total}</p>
                <p className="text-sm text-gray-600">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Timer className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-600" data-testid="stats-queued">{stats.queued}</p>
                <p className="text-sm text-gray-600">Queued</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-purple-600" data-testid="stats-scheduled">{stats.scheduled}</p>
                <p className="text-sm text-gray-600">Scheduled</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-600" data-testid="stats-sent">{stats.sent}</p>
                <p className="text-sm text-gray-600">Sent</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold text-red-600" data-testid="stats-failed">{stats.failed}</p>
                <p className="text-sm text-gray-600">Failed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs and Queue Items */}
      <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as any)}>
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all">All ({stats.total})</TabsTrigger>
          <TabsTrigger value="scheduled" data-testid="tab-scheduled">Scheduled ({stats.scheduled})</TabsTrigger>
          <TabsTrigger value="sent" data-testid="tab-sent">Sent ({stats.sent})</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-6">
          {filteredItems.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No broadcasts {selectedTab === "all" ? "in queue" : selectedTab}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {selectedTab === "all" 
                    ? "Approved assignments will appear here ready to be broadcast"
                    : `No ${selectedTab} broadcasts found`
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredItems.map((item) => (
                <Card key={item.id} data-testid={`broadcast-item-${item.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {item.assignmentTitle}
                          </h3>
                          <Badge className={getStatusColor(item.status)}>
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(item.status)}
                              <span className="capitalize">{item.status}</span>
                            </div>
                          </Badge>
                          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                            Customer.io
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4" />
                            <span>{item.emailSubject || "Subject not set"}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4" />
                            <span>{item.audienceCount?.toLocaleString() || "0"} recipients</span>
                          </div>

                          {item.emailPlatform && (
                            <div className="flex items-center space-x-2">
                              <BarChart3 className="h-4 w-4" />
                              <span>{item.emailPlatform}</span>
                            </div>
                          )}

                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4" />
                            <span>
                              {item.scheduledAt 
                                ? `Scheduled: ${formatDateTime(item.scheduledAt)}`
                                : `Created: ${formatDateTime(item.createdAt)}`
                              }
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        {(item.status === "queued" || item.status === "ready") && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedBroadcast(item);
                                setScheduleDialogOpen(true);
                              }}
                              data-testid={`button-schedule-${item.id}`}
                              className="border-blue-200 text-blue-600 hover:bg-blue-50"
                            >
                              <Calendar className="h-4 w-4 mr-1" />
                              Schedule Send
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => sendMutation.mutate(item.id)}
                              disabled={sendMutation.isPending}
                              data-testid={`button-send-${item.id}`}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Send className="h-4 w-4 mr-1" />
                              Send Now to {item.audienceCount} subscribers
                            </Button>
                          </>
                        )}

                        {item.status === "scheduled" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => cancelMutation.mutate(item.id)}
                            disabled={cancelMutation.isPending}
                            data-testid={`button-cancel-${item.id}`}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                        )}

                        {(item.status === "queued" || item.status === "failed") && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removeMutation.mutate(item.id)}
                            disabled={removeMutation.isPending}
                            data-testid={`button-remove-${item.id}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Schedule Dialog */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Broadcast</DialogTitle>
            <DialogDescription>
              Choose when to send "{selectedBroadcast?.assignmentTitle}"
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="schedule-datetime">Schedule Date & Time</Label>
              <Input
                id="schedule-datetime"
                type="datetime-local"
                value={scheduleDateTime}
                onChange={(e) => setScheduleDateTime(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                data-testid="input-schedule-datetime"
              />
              <p className="text-sm text-gray-500 mt-1">
                Email will be sent to {selectedBroadcast?.audienceCount || 0} Customer.io subscribers
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Time Zone Optimization</Label>
                <select className="w-full mt-1 p-2 border rounded">
                  <option value="UTC">Send at exact time (UTC)</option>
                  <option value="recipient">Optimize for recipient time zones</option>
                </select>
              </div>
              <div>
                <Label>Send Optimization</Label>
                <select className="w-full mt-1 p-2 border rounded">
                  <option value="standard">Standard delivery</option>
                  <option value="optimized">AI-optimized timing</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setScheduleDialogOpen(false)}
                data-testid="button-cancel-schedule"
              >
                Cancel
              </Button>
              <Button
                onClick={handleScheduleSubmit}
                disabled={!scheduleDateTime || scheduleMutation.isPending}
                data-testid="button-confirm-schedule"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Schedule for Customer.io
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
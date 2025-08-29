import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Mail, 
  TrendingUp, 
  Filter, 
  Plus,
  Search,
  User,
  Target,
  Eye,
  Calendar
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface Subscriber {
  id: string;
  email: string;
  name: string;
  segment: string;
  engagementScore: string;
  revenue: string;
  joinedAt: string;
  isActive: boolean;
  metadata?: Record<string, any>;
  source: string;
}

interface Segment {
  id: string;
  name: string;
  description?: string;
  type: string;
  source: string;
  subscriberCount: number;
  metadata?: Record<string, any>;
  createdAt: string;
}

export default function SubscribersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSegment, setSelectedSegment] = useState<string>("all");
  const [isCreateSegmentOpen, setIsCreateSegmentOpen] = useState(false);
  const [segmentName, setSegmentName] = useState("");
  const [segmentDescription, setSegmentDescription] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Test with simple API first to make sure backend connection works
  const { data: integrations = [] } = useQuery({
    queryKey: ["/api/integrations/connected"],
    retry: 1,
  });

  // Get the Customer.io integration ID - handle both array and object response formats
  const customerIoIntegration = Array.isArray(integrations) 
    ? integrations.find((int: any) => int.platformId === "customer_io")
    : integrations?.integrations?.find((int: any) => int.platformId === "customer_io");

  // Fetch subscribers from Customer.io integration - use a simpler direct approach first
  const { data: subscribersResponse, isLoading: isLoadingSubscribers, error: subscribersError } = useQuery({
    queryKey: ["/api/integrations/customers", customerIoIntegration?.id],
    queryFn: async () => {
      if (!customerIoIntegration?.id) {
        throw new Error("Customer.io integration not found");
      }

      console.log("Fetching subscribers for integration:", customerIoIntegration.id);
      const response = await fetch(`/api/integrations/${customerIoIntegration.id}/customers`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-publisher-id": "b1953bbb-178c-41ed-ac31-21fd2ab16c3d"
        }
      });
      
      console.log("Subscribers response status:", response.status);
      const text = await response.text();
      console.log("Raw response:", text.substring(0, 200));
      
      if (!response.ok) {
        throw new Error(`Failed to fetch subscribers: ${response.status}`);
      }
      
      try {
        return JSON.parse(text);
      } catch (e) {
        console.error("Failed to parse JSON:", e);
        throw new Error("Invalid JSON response from server");
      }
    },
    enabled: !!customerIoIntegration?.id,
    retry: 1,
  });

  // Fetch segments from Customer.io integration
  const { data: segmentsResponse, isLoading: isLoadingSegments, error: segmentsError } = useQuery({
    queryKey: ["/api/integrations/segments", customerIoIntegration?.id],
    queryFn: async () => {
      if (!customerIoIntegration?.id) {
        throw new Error("Customer.io integration not found");
      }

      console.log("Fetching segments for integration:", customerIoIntegration.id);
      const response = await fetch(`/api/integrations/${customerIoIntegration.id}/segments`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-publisher-id": "b1953bbb-178c-41ed-ac31-21fd2ab16c3d"
        }
      });
      
      console.log("Segments response status:", response.status);
      const text = await response.text();
      console.log("Raw response:", text.substring(0, 200));
      
      if (!response.ok) {
        throw new Error(`Failed to fetch segments: ${response.status}`);
      }
      
      try {
        return JSON.parse(text);
      } catch (e) {
        console.error("Failed to parse JSON:", e);
        throw new Error("Invalid JSON response from server");
      }
    },
    enabled: !!customerIoIntegration?.id,
    retry: 1,
  });

  // Extract the actual data
  const subscribers = subscribersResponse || [];
  const segments = segmentsResponse || [];

  // Debug information
  console.log("Integration data:", customerIoIntegration);
  console.log("Subscribers error:", subscribersError);
  console.log("Segments error:", segmentsError);
  console.log("Loaded subscribers:", subscribers?.length);
  console.log("Loaded segments:", segments?.length);

  // Create segment mutation
  const createSegmentMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const response = await fetch("/api/segments", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error("Failed to create segment");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/segments"] });
      setIsCreateSegmentOpen(false);
      setSegmentName("");
      setSegmentDescription("");
      toast({
        title: "Success",
        description: "Segment created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create segment",
        variant: "destructive",
      });
    },
  });

  // Filter subscribers
  const filteredSubscribers = subscribers.filter((subscriber: Subscriber) => {
    const matchesSearch = subscriber.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         subscriber.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSegment = selectedSegment === "all" || subscriber.segment === selectedSegment;
    return matchesSearch && matchesSegment;
  });

  const handleCreateSegment = () => {
    if (!segmentName.trim()) return;
    createSegmentMutation.mutate({
      name: segmentName,
      description: segmentDescription,
    });
  };

  return (
    <div className="space-y-6 p-6" data-testid="subscribers-page">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" data-testid="page-title">Customer.io Subscribers</h1>
          <p className="text-muted-foreground">
            Manage subscribers and segments from your Customer.io integration
          </p>
        </div>
        <Dialog open={isCreateSegmentOpen} onOpenChange={setIsCreateSegmentOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-segment">
              <Plus className="w-4 h-4 mr-2" />
              Create Segment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Segment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="segment-name">Segment Name</Label>
                <Input
                  id="segment-name"
                  value={segmentName}
                  onChange={(e) => setSegmentName(e.target.value)}
                  placeholder="Enter segment name"
                  data-testid="input-segment-name"
                />
              </div>
              <div>
                <Label htmlFor="segment-description">Description</Label>
                <Textarea
                  id="segment-description"
                  value={segmentDescription}
                  onChange={(e) => setSegmentDescription(e.target.value)}
                  placeholder="Enter segment description"
                  data-testid="textarea-segment-description"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateSegmentOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateSegment}
                  disabled={createSegmentMutation.isPending || !segmentName.trim()}
                  data-testid="button-save-segment"
                >
                  {createSegmentMutation.isPending ? "Creating..." : "Create"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="subscribers" className="space-y-4">
        <TabsList data-testid="tabs-list">
          <TabsTrigger value="subscribers" data-testid="tab-subscribers">
            <Users className="w-4 h-4 mr-2" />
            Subscribers
          </TabsTrigger>
          <TabsTrigger value="segments" data-testid="tab-segments">
            <Target className="w-4 h-4 mr-2" />
            Segments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="subscribers" className="space-y-4">
          {/* Subscriber Filters */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search subscribers by email or name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-subscribers"
              />
            </div>
            <select
              value={selectedSegment}
              onChange={(e) => setSelectedSegment(e.target.value)}
              className="px-3 py-2 border rounded-md"
              data-testid="select-segment-filter"
            >
              <option value="all">All Segments</option>
              {segments.map((segment: Segment) => (
                <option key={segment.id} value={segment.name}>
                  {segment.name} ({segment.subscriberCount})
                </option>
              ))}
            </select>
          </div>

          {/* Subscriber Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="stat-total-subscribers">
                  {subscribers.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  From Customer.io
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Subscribers</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="stat-active-subscribers">
                  {subscribers.filter((s: Subscriber) => s.isActive).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Currently subscribed
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available Segments</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="stat-total-segments">
                  {segments.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Ready for targeting
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Filtered Results</CardTitle>
                <Filter className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="stat-filtered-subscribers">
                  {filteredSubscribers.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Matching current filter
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Subscriber List */}
          <Card>
            <CardHeader>
              <CardTitle>Subscribers</CardTitle>
              <CardDescription>
                Real subscriber data from your Customer.io integration
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSubscribers ? (
                <div className="text-center py-8" data-testid="loading-subscribers">
                  Loading subscribers...
                </div>
              ) : subscribersError ? (
                <div className="text-center py-8 text-red-500" data-testid="error-subscribers">
                  <h3 className="font-semibold mb-2">Customer.io API Error</h3>
                  <p className="mb-2">Unable to fetch real subscriber data from Customer.io</p>
                  <p className="text-sm text-gray-600">
                    The Customer.io integration shows {customerIoIntegration?.stats?.subscribers || 0} subscribers, 
                    but the API is currently unavailable.
                  </p>
                  <details className="mt-4 text-xs">
                    <summary>Technical Details</summary>
                    <p>Error: {subscribersError.message}</p>
                    <p>Integration ID: {customerIoIntegration?.id}</p>
                  </details>
                </div>
              ) : filteredSubscribers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground" data-testid="no-subscribers">
                  <h3 className="font-semibold mb-2">No Subscriber Data Available</h3>
                  <p className="mb-4">
                    {customerIoIntegration?.stats?.subscribers 
                      ? `Customer.io shows ${customerIoIntegration.stats.subscribers} subscribers, but API access is limited.`
                      : "No subscriber data found in Customer.io integration."
                    }
                  </p>
                  <p className="text-sm text-gray-500">
                    This system only displays authentic Customer.io data - no synthetic or mock data is used.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredSubscribers.map((subscriber: Subscriber) => (
                    <div
                      key={subscriber.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                      data-testid={`subscriber-${subscriber.id}`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium" data-testid={`subscriber-name-${subscriber.id}`}>
                            {subscriber.name}
                          </p>
                          <p className="text-sm text-muted-foreground" data-testid={`subscriber-email-${subscriber.id}`}>
                            {subscriber.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge
                          variant={subscriber.isActive ? "default" : "secondary"}
                          data-testid={`subscriber-status-${subscriber.id}`}
                        >
                          {subscriber.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="outline" data-testid={`subscriber-source-${subscriber.id}`}>
                          {subscriber.source}
                        </Badge>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {subscriber.segment}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Joined {new Date(subscriber.joinedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="segments" className="space-y-4">
          {/* Segments List */}
          <Card>
            <CardHeader>
              <CardTitle>Customer.io Segments</CardTitle>
              <CardDescription>
                Manage audience segments from your Customer.io integration
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSegments ? (
                <div className="text-center py-8" data-testid="loading-segments">
                  Loading segments...
                </div>
              ) : segmentsError ? (
                <div className="text-center py-8 text-red-500" data-testid="error-segments">
                  Error: {segmentsError.message}
                  <br />
                  <small>Integration ID: {customerIoIntegration?.id}</small>
                </div>
              ) : segments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground" data-testid="no-segments">
                  No segments found. Create your first segment to get started.
                </div>
              ) : (
                <div className="grid gap-4">
                  {segments.map((segment: Segment) => (
                    <div
                      key={segment.id}
                      className="border rounded-lg p-4"
                      data-testid={`segment-${segment.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium" data-testid={`segment-name-${segment.id}`}>
                            {segment.name}
                          </h3>
                          {segment.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {segment.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="font-medium" data-testid={`segment-count-${segment.id}`}>
                              {segment.subscriberCount} subscribers
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Badge variant="outline" size="sm">
                                {segment.type}
                              </Badge>
                              <Badge variant="outline" size="sm">
                                {segment.source}
                              </Badge>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            data-testid={`button-view-segment-${segment.id}`}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
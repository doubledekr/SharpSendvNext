import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Users, Search, Filter, Download, UserPlus, TrendingUp, Loader2 } from "lucide-react";
import type { Subscriber } from "@shared/schema";

export default function SubscribersTab() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSubscriber, setNewSubscriber] = useState({
    name: '',
    email: '',
    segment: 'new-subscribers'
  });
  const { toast } = useToast();
  
  const { data: subscribers, isLoading } = useQuery<Subscriber[]>({
    queryKey: ['/api/subscribers'],
  });

  const addSubscriberMutation = useMutation({
    mutationFn: async (data: typeof newSubscriber) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { ...data, id: Date.now(), engagementScore: 0, revenue: 0 };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscribers'] });
      setShowAddModal(false);
      setNewSubscriber({ name: '', email: '', segment: 'new-subscribers' });
      toast({
        title: "Subscriber Added",
        description: "New subscriber has been successfully added",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add subscriber. Please try again.",
        variant: "destructive"
      });
    }
  });

  if (isLoading) {
    return <div className="text-slate-300">Loading subscribers...</div>;
  }

  const segments = {
    'high-value': { count: 12540, color: 'brand-green' },
    'medium-engagement': { count: 23850, color: 'blue-500' },
    'new-subscribers': { count: 8670, color: 'yellow-500' },
    'at-risk': { count: 2340, color: 'brand-red' }
  };

  return (
    <div className="space-y-8">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {Object.entries(segments).map(([key, data]) => (
          <Card key={key} className="bg-dark-surface border-dark-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm capitalize">{key.replace('-', ' ')}</p>
                  <p className="text-2xl font-bold text-white mt-1">{data.count.toLocaleString()}</p>
                </div>
                <Users className={`text-${data.color} h-8 w-8`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Subscriber Management */}
      <Card className="bg-dark-surface border-dark-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-white">Subscriber Management</CardTitle>
            <div className="flex space-x-3">
              <Button variant="outline" size="sm" data-testid="button-export-subscribers">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button 
                size="sm" 
                onClick={() => setShowAddModal(true)}
                data-testid="button-add-subscriber"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Subscriber
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex space-x-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search subscribers..." 
                className="pl-10 bg-dark-bg border-dark-border text-white"
                data-testid="input-search-subscribers"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>

          {/* Subscriber List */}
          <div className="space-y-4">
            {subscribers?.slice(0, 10).map((subscriber, index) => (
              <div key={subscriber.id} className="flex items-center justify-between p-4 border border-dark-border rounded-lg hover:border-brand-blue/50 transition-colors" data-testid={`card-subscriber-${index}`}>
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-brand-blue rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {subscriber.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <p className="text-white font-medium">{subscriber.name}</p>
                    <p className="text-slate-400 text-sm">{subscriber.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge variant="secondary" className={`bg-${subscriber.segment === 'high-value' ? 'brand-green' : subscriber.segment === 'medium-engagement' ? 'blue-500' : subscriber.segment === 'new-subscribers' ? 'yellow-500' : 'brand-red'}/20`}>
                    {subscriber.segment.replace('-', ' ')}
                  </Badge>
                  <div className="text-right">
                    <p className="text-white text-sm">{subscriber.engagementScore}%</p>
                    <p className="text-slate-400 text-xs">Engagement</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white text-sm">${subscriber.revenue}</p>
                    <p className="text-slate-400 text-xs">LTV</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Segment Analysis */}
      <Card className="bg-dark-surface border-dark-border">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-white">Segment Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">High-Value Investors</h4>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Average Revenue</span>
                  <span className="text-brand-green">$2,340/year</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Engagement Rate</span>
                  <span className="text-white">78.5%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Retention Rate</span>
                  <span className="text-brand-green">94.2%</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Growth Opportunities</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="text-yellow-500 h-4 w-4" />
                  <span className="text-slate-300 text-sm">2,340 subscribers ready for premium upgrade</span>
                </div>
                <div className="flex items-center space-x-3">
                  <TrendingUp className="text-blue-500 h-4 w-4" />
                  <span className="text-slate-300 text-sm">8,670 new subscribers in onboarding sequence</span>
                </div>
                <div className="flex items-center space-x-3">
                  <TrendingUp className="text-brand-red h-4 w-4" />
                  <span className="text-slate-300 text-sm">1,245 at-risk subscribers need re-engagement</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Subscriber Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Subscriber</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newSubscriber.name}
                onChange={(e) => setNewSubscriber({...newSubscriber, name: e.target.value})}
                placeholder="John Doe"
                data-testid="input-new-subscriber-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newSubscriber.email}
                onChange={(e) => setNewSubscriber({...newSubscriber, email: e.target.value})}
                placeholder="john@example.com"
                data-testid="input-new-subscriber-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="segment">Segment</Label>
              <Select
                value={newSubscriber.segment}
                onValueChange={(value) => setNewSubscriber({...newSubscriber, segment: value})}
              >
                <SelectTrigger id="segment" data-testid="select-new-subscriber-segment">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high-value">High Value</SelectItem>
                  <SelectItem value="medium-engagement">Medium Engagement</SelectItem>
                  <SelectItem value="new-subscribers">New Subscribers</SelectItem>
                  <SelectItem value="at-risk">At Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddModal(false)}
              disabled={addSubscriberMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => addSubscriberMutation.mutate(newSubscriber)}
              disabled={addSubscriberMutation.isPending || !newSubscriber.name || !newSubscriber.email}
              data-testid="button-confirm-add-subscriber"
            >
              {addSubscriberMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Subscriber'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
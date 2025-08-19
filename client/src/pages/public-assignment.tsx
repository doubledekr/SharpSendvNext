import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Tag, FileText, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface Assignment {
  id: string;
  title: string;
  description: string;
  type: string;
  priority: string;
  status: string;
  dueDate: string | null;
  content: string | null;
  tags: string[] | null;
  createdAt: string;
  updatedAt: string;
  publisherName: string;
}

export default function PublicAssignment() {
  const params = useParams<{ slug: string }>();
  
  const { data: assignment, isLoading, error } = useQuery<Assignment>({
    queryKey: [`/api/public/assignment/${params.slug}`],
    enabled: !!params.slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="animate-pulse text-white">Loading assignment...</div>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <Card className="bg-slate-800 border-slate-700 max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle className="h-5 w-5" />
              <p>Assignment not found or no longer available.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-600";
      case "high": return "bg-orange-600";
      case "medium": return "bg-yellow-600";
      case "low": return "bg-green-600";
      default: return "bg-gray-600";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published": return "bg-green-600";
      case "approved": return "bg-blue-600";
      case "review": return "bg-purple-600";
      case "in_progress": return "bg-yellow-600";
      case "assigned": return "bg-orange-600";
      case "unassigned": return "bg-gray-600";
      default: return "bg-gray-600";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "newsletter": return "📰";
      case "article": return "📝";
      case "research": return "🔬";
      case "analysis": return "📊";
      default: return "📄";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">SharpSend Assignment</h1>
          <p className="text-slate-300">Published by {assignment.publisherName}</p>
        </div>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl text-white flex items-center gap-2">
                  <span>{getTypeIcon(assignment.type)}</span>
                  {assignment.title}
                </CardTitle>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Badge className={`${getPriorityColor(assignment.priority)} text-white`}>
                    {assignment.priority} priority
                  </Badge>
                  <Badge className={`${getStatusColor(assignment.status)} text-white`}>
                    {assignment.status}
                  </Badge>
                  <Badge variant="outline" className="text-slate-300 border-slate-600">
                    {assignment.type}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {assignment.description && (
              <div>
                <h3 className="text-sm font-semibold text-slate-400 mb-2">Description</h3>
                <p className="text-slate-200 whitespace-pre-wrap">{assignment.description}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assignment.dueDate && (
                <div className="flex items-center gap-2 text-slate-300">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span className="text-sm">
                    Due: {format(new Date(assignment.dueDate), "PPP")}
                  </span>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-slate-300">
                <Clock className="h-4 w-4 text-slate-400" />
                <span className="text-sm">
                  Created: {format(new Date(assignment.createdAt), "PPp")}
                </span>
              </div>
            </div>

            {assignment.tags && assignment.tags.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="h-4 w-4 text-slate-400" />
                  <h3 className="text-sm font-semibold text-slate-400">Tags</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {assignment.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-slate-300 border-slate-600">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {assignment.content && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-slate-400" />
                  <h3 className="text-sm font-semibold text-slate-400">Content</h3>
                </div>
                <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                  <div className="prose prose-invert max-w-none">
                    <p className="text-slate-200 whitespace-pre-wrap">{assignment.content}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-700">
              <p className="text-xs text-slate-400 text-center">
                Last updated: {format(new Date(assignment.updatedAt), "PPp")}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-slate-400 text-sm">
            This assignment was shared via SharpSend's Assignment Desk
          </p>
        </div>
      </div>
    </div>
  );
}
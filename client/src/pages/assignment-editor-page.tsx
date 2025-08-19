import { useParams } from "wouter";
import { AssignmentEditor } from "@/components/assignment-editor";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function AssignmentEditorPage() {
  const { id } = useParams();
  
  // Fetch assignment data
  const { data: assignment, isLoading } = useQuery({
    queryKey: [`/api/assignments/${id}`],
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading assignment...</div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Assignment not found</p>
            <Link href="/assignments">
              <Button className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Assignments
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/assignments">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{assignment.title}</h1>
            <p className="text-muted-foreground">Edit Assignment</p>
          </div>
        </div>
      </div>

      <AssignmentEditor 
        assignmentId={id || ""} 
        initialData={assignment}
        onSave={() => {
          // Could navigate back or show success message
        }}
      />
    </div>
  );
}
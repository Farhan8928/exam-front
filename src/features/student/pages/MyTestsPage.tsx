import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { createApi } from "@/api/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardList, Clock, FileCheck, Play, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";

export default function MyTestsPage() {
  const { token } = useAuth();
  const api = createApi(token);

  const { data: assignments, isLoading } = useQuery({
    queryKey: ["/api/student/assignments"],
    queryFn: () => api.get("/api/student/assignments"),
  });

  const pending = assignments?.filter((a: any) => a.status === "ASSIGNED") || [];
  const inProgress = assignments?.filter((a: any) => a.status === "IN_PROGRESS") || [];
  const completed = assignments?.filter((a: any) => a.status === "COMPLETED") || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-3">{[...Array(3)].map((_, i) => <Card key={i}><CardContent className="p-5"><Skeleton className="h-16 w-full" /></CardContent></Card>)}</div>
      </div>
    );
  }

  const renderTestCard = (assignment: any, showAction: boolean) => (
    <Card key={assignment.id}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-foreground truncate" data-testid={`text-test-name-${assignment.id}`}>
              {assignment.test?.title || "Unknown Test"}
            </h3>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {assignment.test?.duration} min
              </span>
              <span className="flex items-center gap-1">
                <FileCheck className="w-3 h-3" />
                {assignment.test?.maxAttempts} attempt(s)
              </span>
              <Badge variant="secondary" className="text-[10px]">
                {assignment.test?.status}
              </Badge>
            </div>
          </div>
          {showAction && assignment.test?.status === "ACTIVE" && (
            <Link href={`/take-test/${assignment.test?.id}`}>
              <Button size="sm" data-testid={`button-take-test-${assignment.test?.id}`}>
                <Play className="w-3 h-3 mr-1" />
                Take Test
              </Button>
            </Link>
          )}
          {assignment.status === "COMPLETED" && (
            <Badge variant="default" className="bg-chart-2/10 text-chart-2">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Completed
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Tests</h1>
        <p className="text-muted-foreground text-sm mt-1">{assignments?.length || 0} assigned tests</p>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending" data-testid="tab-pending">
            Pending ({pending.length})
          </TabsTrigger>
          <TabsTrigger value="completed" data-testid="tab-completed">
            Completed ({completed.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-3 mt-4">
          {pending.length > 0 ? (
            pending.map((a: any) => renderTestCard(a, true))
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <ClipboardList className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No pending tests</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-3 mt-4">
          {completed.length > 0 ? (
            completed.map((a: any) => renderTestCard(a, false))
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <CheckCircle2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No completed tests yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

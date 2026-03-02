import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { createApi } from "@/api/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Clock } from "lucide-react";

export default function ActivityLogsPage() {
  const { token } = useAuth();
  const api = createApi(token);

  const { data, isLoading } = useQuery({
    queryKey: ["/api/activity-logs"],
    queryFn: () => api.get("/api/activity-logs?limit=50"),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-3">{[...Array(5)].map((_, i) => <Card key={i}><CardContent className="p-4"><Skeleton className="h-12 w-full" /></CardContent></Card>)}</div>
      </div>
    );
  }

  const actionColor = (type: string) => {
    if (type.includes("CREATED")) return "bg-chart-2/10 text-chart-2";
    if (type.includes("DELETED")) return "bg-destructive/10 text-destructive";
    if (type.includes("UPDATED")) return "bg-chart-4/10 text-chart-4";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Activity Logs</h1>
        <p className="text-muted-foreground text-sm mt-1">{data?.total || 0} total events</p>
      </div>

      {data?.logs?.length > 0 ? (
        <div className="space-y-2">
          {data.logs.map((log: any) => (
            <Card key={log.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${actionColor(log.actionType)}`}>
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className={`text-[10px] ${actionColor(log.actionType)}`}>
                        {log.actionType.replace(/_/g, " ")}
                      </Badge>
                      {log.targetId && (
                        <span className="text-xs text-muted-foreground">ID: {log.targetId}</span>
                      )}
                    </div>
                    {log.details && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">{log.details}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground/70 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No activity logs</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

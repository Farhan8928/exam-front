import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { createApi } from "@/api/client";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Globe, Plus, Trash2, Loader2 } from "lucide-react";

export default function DomainsPage() {
  const { token } = useAuth();
  const api = createApi(token);
  const { toast } = useToast();
  const [newDomain, setNewDomain] = useState("");

  const { data: domains, isLoading } = useQuery({
    queryKey: ["/api/domains"],
    queryFn: () => api.get("/api/domains"),
  });

  const createMutation = useMutation({
    mutationFn: (domain: string) => api.post("/api/domains", { domain }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/domains"] });
      setNewDomain("");
      toast({ title: "Domain added successfully" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/domains/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/domains"] });
      toast({ title: "Domain deleted" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">School Domains</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage email domains for user creation</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <form
            className="flex items-center gap-3 flex-wrap"
            onSubmit={(e) => {
              e.preventDefault();
              if (newDomain.trim()) createMutation.mutate(newDomain.trim());
            }}
          >
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="e.g. school.edu"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                required
                data-testid="input-new-domain"
              />
            </div>
            <Button
              type="submit"
              disabled={createMutation.isPending || !newDomain.trim()}
              data-testid="button-add-domain"
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Add Domain
            </Button>
          </form>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-10 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : domains?.length > 0 ? (
        <div className="space-y-2">
          {domains.map((d: any) => (
            <Card key={d.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Globe className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground" data-testid={`text-domain-${d.id}`}>{d.domain}</p>
                      <p className="text-xs text-muted-foreground">
                        Added {new Date(d.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        data-testid={`button-delete-domain-${d.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Domain</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete the domain "{d.domain}"? This will not affect existing users with this domain.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel data-testid="button-cancel-delete-domain">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteMutation.mutate(d.id)}
                          data-testid="button-confirm-delete-domain"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Globe className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No domains added yet</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

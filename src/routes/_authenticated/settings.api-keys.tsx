import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { createApiKey, revokeApiKey } from "@/lib/api-keys.functions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Copy, Trash2, KeyRound } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings/api-keys")({
  head: () => ({ meta: [{ title: "API Keys — Mercor Eval" }] }),
  component: ApiKeysPage,
});

function ApiKeysPage() {
  const qc = useQueryClient();
  const create = useServerFn(createApiKey);
  const revoke = useServerFn(revokeApiKey);

  const [name, setName] = useState("");
  const [revealed, setRevealed] = useState<string | null>(null);

  const { data: keys = [] } = useQuery({
    queryKey: ["api-keys"],
    queryFn: async () => {
      const { data, error } = await supabase.from("api_keys").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const createMut = useMutation({
    mutationFn: (n: string) => create({ data: { name: n } }),
    onSuccess: (row: any) => {
      setRevealed(row.plaintext);
      setName("");
      qc.invalidateQueries({ queryKey: ["api-keys"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const revokeMut = useMutation({
    mutationFn: (id: string) => revoke({ data: { id } }),
    onSuccess: () => {
      toast.success("Key revoked");
      qc.invalidateQueries({ queryKey: ["api-keys"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const apiUrl = typeof window !== "undefined" ? `${window.location.origin}/api/public/evaluate` : "/api/public/evaluate";

  const pythonSnippet = `import requests

API_KEY = "YOUR_API_KEY"  # paste the key you just created
URL = "${apiUrl}"

resp = requests.post(
    URL,
    headers={"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"},
    json={
        "prompt": "Explain dependency injection in one paragraph.",
        "response": "Dependency injection is a design pattern where ...",
        "model_name": "gpt-5",
        "category": "explanation",
    },
    timeout=60,
)
print(resp.status_code, resp.json())`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">API Keys</h1>
        <p className="text-sm text-muted-foreground">Use these to call the public evaluation endpoint from Python or any HTTP client.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Create a new key</CardTitle>
          <CardDescription>You'll see the full key once — store it safely.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-wrap items-end gap-2"
            onSubmit={(e) => { e.preventDefault(); if (name.trim()) createMut.mutate(name.trim()); }}
          >
            <div className="flex-1 min-w-48 space-y-1.5">
              <Label htmlFor="key-name">Name</Label>
              <Input id="key-name" placeholder="e.g. Local Python script" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <Button type="submit" disabled={createMut.isPending || !name.trim()}>
              <KeyRound className="mr-2 h-4 w-4" /> Create key
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Your keys</CardTitle></CardHeader>
        <CardContent>
          {keys.length === 0 ? (
            <p className="text-sm text-muted-foreground">No keys yet.</p>
          ) : (
            <ul className="divide-y">
              {keys.map((k) => (
                <li key={k.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <div className="font-medium">{k.name}</div>
                    <div className="text-xs text-muted-foreground">
                      <code>{k.prefix}…</code> · created {new Date(k.created_at).toLocaleDateString()}
                      {k.last_used_at ? ` · last used ${new Date(k.last_used_at).toLocaleDateString()}` : " · never used"}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => revokeMut.mutate(k.id)}>
                    <Trash2 className="mr-1 h-4 w-4" /> Revoke
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Python example</CardTitle>
          <CardDescription>POST a response and get rubric scores back.</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="overflow-x-auto rounded-md bg-muted p-4 text-xs leading-relaxed">{pythonSnippet}</pre>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => {
              navigator.clipboard.writeText(pythonSnippet);
              toast.success("Copied");
            }}
          >
            <Copy className="mr-2 h-4 w-4" /> Copy snippet
          </Button>
        </CardContent>
      </Card>

      <Dialog open={!!revealed} onOpenChange={(o) => !o && setRevealed(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Your new API key</DialogTitle>
            <DialogDescription>
              This is shown once. Copy it now — you won't see it again.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <code className="block break-all rounded-md bg-muted p-3 text-sm">{revealed}</code>
            <Button
              variant="secondary"
              onClick={() => {
                if (revealed) navigator.clipboard.writeText(revealed);
                toast.success("Copied to clipboard");
              }}
            >
              <Copy className="mr-2 h-4 w-4" /> Copy
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setRevealed(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

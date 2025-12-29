import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

export function AppErrorFallback({
  title = "This page failed to load",
}: {
  title?: string;
}) {
  const navigate = useNavigate();

  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-background p-6">
      <Card className="max-w-lg w-full p-6 border-border/60">
        <div className="space-y-3">
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground">
            Please refresh. If it keeps happening, something on this page is throwing
            a runtime error.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={() => window.location.reload()}>
            Refresh
          </Button>
          <Button variant="outline" onClick={() => navigate("/", { replace: true })}>
            Go home
          </Button>
        </div>
      </Card>
    </div>
  );
}

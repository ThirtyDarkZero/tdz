import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const EventbriteOAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [message, setMessage] = useState("Connecting your Eventbrite account...");

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const error = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");

      if (error) {
        setStatus("error");
        setMessage(errorDescription || "Authorization was denied");
        toast.error("Eventbrite connection failed");
        return;
      }

      if (!code || !state) {
        setStatus("error");
        setMessage("Invalid callback — missing authorization code");
        return;
      }

      try {
        const response = await supabase.functions.invoke("eventbrite-oauth-callback", {
          body: { code, state },
        });

        if (response.error || !response.data?.success) {
          throw new Error(response.data?.error || "Failed to connect Eventbrite");
        }

        setStatus("success");
        setMessage(`Connected to ${response.data.organizationName || "Eventbrite"}!`);
        toast.success("Eventbrite connected successfully!");

        setTimeout(() => navigate("/studio"), 2000);
      } catch (err: any) {
        setStatus("error");
        setMessage(err.message || "Connection failed");
        toast.error("Eventbrite connection failed");
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#141414" }}>
      <Card className="w-full max-w-md bg-card/80 border-border/30">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {status === "processing" && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
            {status === "success" && <CheckCircle className="w-5 h-5 text-green-500" />}
            {status === "error" && <XCircle className="w-5 h-5 text-destructive" />}
            Eventbrite Connection
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">{message}</p>
          {status === "error" && (
            <Button onClick={() => navigate("/studio")} variant="outline">
              Back to Studio
            </Button>
          )}
          {status === "success" && (
            <p className="text-xs text-muted-foreground">Redirecting to Studio...</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EventbriteOAuthCallback;

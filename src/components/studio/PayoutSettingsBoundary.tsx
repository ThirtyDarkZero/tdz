import { useState } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ArtistPayoutSettings } from "@/components/ArtistPayoutSettings";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, ExternalLink } from "lucide-react";

const Fallback = ({ onRetry }: { onRetry: () => void }) => (
  <Card className="bg-destructive/5 border-destructive/20">
    <CardContent className="p-6 space-y-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
        <div>
          <p className="font-medium text-destructive">Payout settings couldn't load</p>
          <p className="text-sm text-muted-foreground mt-1">
            The rest of your Studio is fine — only this panel failed. Your earnings and
            Stripe connection are unaffected.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={onRetry} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Try again
        </Button>
        <Button asChild variant="ghost" size="sm" className="gap-2">
          <a href="mailto:support@thirtydarkzero.com?subject=Payout%20settings%20error">
            <ExternalLink className="h-4 w-4" />
            Contact support
          </a>
        </Button>
      </div>
    </CardContent>
  </Card>
);

/**
 * Isolates the payout panel so a throw inside it can never take down the Studio shell.
 * Remounting via `key` gives the user a real retry instead of a dead panel.
 */
export const PayoutSettingsBoundary = () => {
  const [attempt, setAttempt] = useState(0);

  return (
    <ErrorBoundary
      key={attempt}
      fallback={<Fallback onRetry={() => setAttempt((a) => a + 1)} />}
    >
      <ArtistPayoutSettings />
    </ErrorBoundary>
  );
};

export default PayoutSettingsBoundary;

import { useEffect, useRef } from "react";
import { toast } from "sonner";

/**
 * Global error trap for runtime crashes that would otherwise result in a blank screen.
 * Keeps behavior minimal: logs + one user-facing toast per session.
 */
export function GlobalErrorTrap() {
  const shownRef = useRef(false);

  useEffect(() => {
    const showOnce = (message: string) => {
      if (shownRef.current) return;
      shownRef.current = true;
      toast.error("Something went wrong", { description: message });
    };

    const onError = (event: ErrorEvent) => {
      console.error("Global error:", event.error ?? event.message);
      showOnce("A page error occurred. Please refresh and try again.");
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled rejection:", event.reason);
      showOnce("A network or script error occurred. Please refresh and try again.");
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return null;
}

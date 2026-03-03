import { useState } from "react";
import { Users, Radio, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ListenTogetherBanner() {
  const [sessionId] = useState(() => crypto.randomUUID().slice(0, 8));
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(`${window.location.origin}/discover?listen=${sessionId}`);
    setCopied(true);
    toast.success("Session link copied! Share with friends.");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="mx-4 sm:mx-6 lg:mx-8 my-6 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-4"
      style={{
        background: "linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(236,72,153,0.08) 100%)",
        border: "1px solid rgba(139,92,246,0.2)",
      }}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(139,92,246,0.2)" }}>
          <Radio className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <p className="font-bold text-white text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-400" />
            Listen Together
          </p>
          <p className="text-xs" style={{ color: "#888" }}>
            Invite friends to a shared queue — discover music together in real time
          </p>
        </div>
      </div>
      <Button
        onClick={handleCopy}
        variant="outline"
        size="sm"
        className="ml-auto border-purple-500/30 text-purple-300 hover:bg-purple-500/10 hover:text-purple-200 gap-2 rounded-full"
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        {copied ? "Copied!" : "Share Session"}
      </Button>
    </div>
  );
}

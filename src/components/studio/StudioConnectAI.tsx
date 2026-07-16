import { useState } from "react";
import { Copy, Check, ExternalLink, Plug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const MCP_URL = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/mcp`;

export const StudioConnectAI = () => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(MCP_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-4xl">
      <header className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
          <Plug className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs uppercase tracking-widest text-primary">Agent Integrations</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-heading tracking-wide text-white">
          Connect ChatGPT or Claude to your Studio
        </h1>
        <p className="text-white/60 max-w-2xl">
          Give an AI assistant secure access to your Studio so you can ask it about your
          tracks, earnings, liked songs, and more — signed in as you. Everything respects
          your TDZ permissions.
        </p>
      </header>

      <Card className="p-6 space-y-3 bg-white/[0.03] backdrop-blur-xl border-white/10">
        <div className="text-xs uppercase tracking-widest text-white/50">
          Your MCP server URL
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <code className="flex-1 px-4 py-3 rounded-md bg-black/40 border border-white/10 text-sm text-white/90 break-all">
            {MCP_URL}
          </code>
          <Button onClick={copy} variant="secondary" size="lg" className="shrink-0">
            {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
            {copied ? "Copied" : "Copy URL"}
          </Button>
        </div>
        <p className="text-xs text-white/50">
          You'll be asked to sign in to TDZ the first time the assistant connects.
        </p>
      </Card>

      <section className="space-y-4">
        <h2 className="text-2xl font-heading tracking-wide text-white">Connect ChatGPT</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm md:text-base text-white/85">
          <li>
            Open{" "}
            <a className="text-primary underline inline-flex items-center gap-1"
               href="https://chatgpt.com/#settings/Connectors/Advanced" target="_blank" rel="noreferrer">
              ChatGPT → Settings → Connectors → Advanced <ExternalLink className="w-3 h-3" />
            </a>{" "}
            and turn on <strong>Developer mode</strong> (read the risk notice shown there).
          </li>
          <li>In the chat composer's "+" menu, turn on Developer mode.</li>
          <li>Click <strong>Add sources</strong>, then <strong>Connect more</strong>.</li>
          <li>Name the connector "TDZ Studio" and paste the URL above.</li>
          <li>Sign in when prompted, then ask ChatGPT to use TDZ.</li>
        </ol>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-heading tracking-wide text-white">Connect Claude</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm md:text-base text-white/85">
          <li>
            Open{" "}
            <a className="text-primary underline inline-flex items-center gap-1"
               href="https://claude.ai/customize/connectors?modal=add-custom-connector" target="_blank" rel="noreferrer">
              Claude → Connectors → Add custom connector <ExternalLink className="w-3 h-3" />
            </a>.
          </li>
          <li>Name the connector "TDZ Studio" and paste the URL above.</li>
          <li>Sign in when prompted.</li>
          <li>Enable the connector from the chat composer, then ask Claude to use TDZ.</li>
        </ol>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-heading tracking-wide text-white">Refresh after TDZ updates</h2>
        <p className="text-sm text-white/60">
          Assistants cache the tool list. When TDZ ships new capabilities, refresh the
          connector so your assistant picks them up.
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-5 bg-white/[0.03] backdrop-blur-xl border-white/10 space-y-2">
            <h3 className="font-heading tracking-wide text-lg text-white">ChatGPT</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-white/80">
              <li>Open ChatGPT app preferences and pick TDZ under "Enabled apps".</li>
              <li>Next to "Information", click <strong>Refresh</strong>.</li>
              <li>If the URL changed, paste the latest URL from above.</li>
              <li>Start a new chat and ask ChatGPT to use TDZ.</li>
            </ol>
          </Card>
          <Card className="p-5 bg-white/[0.03] backdrop-blur-xl border-white/10 space-y-2">
            <h3 className="font-heading tracking-wide text-lg text-white">Claude</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-white/80">
              <li>Open the Connectors page and select TDZ.</li>
              <li>Refresh or update the connector's tools.</li>
              <li>If the URL changed, paste the latest URL from above.</li>
              <li>Ask Claude to use TDZ.</li>
            </ol>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default StudioConnectAI;

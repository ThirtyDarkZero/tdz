import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const MCP_URL = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/mcp`;

export default function ConnectMcp() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(MCP_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <main className="min-h-screen bg-background text-foreground py-16 px-4">
      <div className="max-w-3xl mx-auto space-y-10">
        <header className="space-y-3">
          <h1 className="text-4xl md:text-5xl font-heading tracking-wide">
            Connect TDZ to your AI assistant
          </h1>
          <p className="text-muted-foreground">
            Give ChatGPT or Claude access to your TDZ account so you can ask it to
            look up your tracks, earnings, liked songs, and more — signed in as you.
          </p>
        </header>

        <Card className="p-6 space-y-3 bg-card/60 backdrop-blur-xl border-border/60">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            MCP server URL
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-4 py-3 rounded-md bg-muted/40 border border-border/60 text-sm break-all">
              {MCP_URL}
            </code>
            <Button onClick={copy} variant="secondary" size="lg">
              {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            You'll be asked to sign in to TDZ the first time the assistant connects.
            The assistant only ever sees data your account can see.
          </p>
        </Card>

        <section className="space-y-4">
          <h2 className="text-2xl font-heading tracking-wide">Connect ChatGPT</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm md:text-base text-foreground/90">
            <li>
              Open{" "}
              <a
                className="text-primary underline inline-flex items-center gap-1"
                href="https://chatgpt.com/#settings/Connectors/Advanced"
                target="_blank" rel="noreferrer"
              >
                ChatGPT → Settings → Connectors → Advanced <ExternalLink className="w-3 h-3" />
              </a>{" "}
              and turn on <strong>Developer mode</strong> (read the risk notice shown there).
            </li>
            <li>In the chat composer's "+" menu, turn on Developer mode.</li>
            <li>Click <strong>Add sources</strong>, then <strong>Connect more</strong>.</li>
            <li>Name the connector "TDZ" and paste the MCP URL above.</li>
            <li>Sign in when prompted, then ask ChatGPT to use TDZ.</li>
          </ol>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-heading tracking-wide">Connect Claude</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm md:text-base text-foreground/90">
            <li>
              Open{" "}
              <a
                className="text-primary underline inline-flex items-center gap-1"
                href="https://claude.ai/customize/connectors?modal=add-custom-connector"
                target="_blank" rel="noreferrer"
              >
                Claude → Connectors → Add custom connector <ExternalLink className="w-3 h-3" />
              </a>.
            </li>
            <li>Name the connector "TDZ" and paste the MCP URL above.</li>
            <li>Sign in when prompted.</li>
            <li>Enable the connector from the chat composer, then ask Claude to use TDZ.</li>
          </ol>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-heading tracking-wide">
            Refresh after TDZ updates
          </h2>
          <p className="text-sm text-muted-foreground">
            Assistants cache the tool list. When we ship new capabilities, refresh
            the connector so your assistant picks them up.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-5 bg-card/60 backdrop-blur-xl border-border/60 space-y-2">
              <h3 className="font-heading tracking-wide text-lg">ChatGPT</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-foreground/90">
                <li>Open ChatGPT app preferences and pick TDZ under "Enabled apps".</li>
                <li>Next to "Information", click <strong>Refresh</strong>.</li>
                <li>If the URL changed, paste the latest URL from above.</li>
                <li>Start a new chat and ask ChatGPT to use TDZ.</li>
              </ol>
            </Card>
            <Card className="p-5 bg-card/60 backdrop-blur-xl border-border/60 space-y-2">
              <h3 className="font-heading tracking-wide text-lg">Claude</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-foreground/90">
                <li>Open the Connectors page and select TDZ.</li>
                <li>Refresh or update the connector's tools.</li>
                <li>If the URL changed, paste the latest URL from above.</li>
                <li>Ask Claude to use TDZ.</li>
              </ol>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}

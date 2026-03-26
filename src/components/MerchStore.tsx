import { useState, useEffect } from "react";
import { ExternalLink, ShoppingBag, Link2, Loader2, Store, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ShopifyProduct {
  id: string;
  title: string;
  description: string;
  handle: string;
  images: { edges: Array<{ node: { url: string; altText: string | null } }> };
  priceRange: { minVariantPrice: { amount: string; currencyCode: string } };
}

interface MerchStoreProps {
  variant?: "full" | "compact" | "hero";
  limit?: number;
  className?: string;
  artistId?: string; // for viewing another artist's merch
}

export function MerchStore({ variant = "full", limit, className = "", artistId }: MerchStoreProps) {
  const { user } = useAuth();
  const [config, setConfig] = useState<{ store_domain: string; storefront_token: string; is_active: boolean } | null>(null);
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [storeDomain, setStoreDomain] = useState("");
  const [storefrontToken, setStorefrontToken] = useState("");

  const targetId = artistId || user?.id;

  useEffect(() => {
    if (targetId) loadConfig();
  }, [targetId]);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("artist_shopify_config")
        .select("store_domain, storefront_token, is_active")
        .eq("artist_id", targetId!)
        .maybeSingle();

      if (data && data.is_active) {
        setConfig(data);
        await fetchProducts(data.store_domain, data.storefront_token);
      } else {
        setConfig(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async (domain: string, token: string) => {
    try {
      const res = await fetch(`https://${domain}/api/2025-01/graphql.json`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Storefront-Access-Token": token,
        },
        body: JSON.stringify({
          query: `{
            products(first: ${limit || 20}) {
              edges {
                node {
                  id title description handle
                  images(first: 1) { edges { node { url altText } } }
                  priceRange { minVariantPrice { amount currencyCode } }
                }
              }
            }
          }`,
        }),
      });
      const json = await res.json();
      const items = json?.data?.products?.edges?.map((e: any) => e.node) || [];
      setProducts(items);
    } catch (err) {
      console.error("Shopify fetch failed:", err);
      setProducts([]);
    }
  };

  const handleConnect = async () => {
    if (!storeDomain.trim() || !storefrontToken.trim()) {
      toast.error("Enter your store domain and storefront token");
      return;
    }
    setConnecting(true);
    try {
      const domain = storeDomain.replace(/^https?:\/\//, "").replace(/\/$/, "");

      // Test the connection
      const testRes = await fetch(`https://${domain}/api/2025-01/graphql.json`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Storefront-Access-Token": storefrontToken,
        },
        body: JSON.stringify({ query: `{ shop { name } }` }),
      });

      if (!testRes.ok) throw new Error("Could not connect. Check your domain and token.");

      const { error } = await supabase.from("artist_shopify_config").upsert({
        artist_id: user!.id,
        store_domain: domain,
        storefront_token: storefrontToken,
        is_active: true,
      } as any, { onConflict: "artist_id" });

      if (error) throw error;
      toast.success("Shopify store connected!");
      await loadConfig();
    } catch (err: any) {
      toast.error(err.message || "Connection failed");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    await supabase.from("artist_shopify_config").update({ is_active: false } as any).eq("artist_id", user!.id);
    setConfig(null);
    setProducts([]);
    toast.success("Store disconnected");
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // If no store connected and this is the artist's own view
  if (!config && !artistId) {
    return (
      <Card className={`bg-card/50 border-border/30 ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="w-5 h-5 text-primary" />
            Connect Your Merch Store
          </CardTitle>
          <CardDescription>
            Link your Shopify store so fans can buy your merch directly from your TDZ profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm">Shopify Store Domain</Label>
            <Input
              value={storeDomain}
              onChange={(e) => setStoreDomain(e.target.value)}
              placeholder="your-store.myshopify.com"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">Find this in your Shopify admin → Settings → Domains</p>
          </div>
          <div>
            <Label className="text-sm">Storefront Access Token</Label>
            <Input
              value={storefrontToken}
              onChange={(e) => setStorefrontToken(e.target.value)}
              placeholder="shpat_xxxxxxxxxxxxx"
              type="password"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Shopify Admin → Settings → Apps → Develop apps → Create app → Storefront API access
            </p>
          </div>
          <Button onClick={handleConnect} disabled={connecting} className="w-full gap-2">
            {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
            {connecting ? "Connecting..." : "Connect Store"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // No config and viewing someone else's profile — no merch
  if (!config) return null;

  // Products view
  const displayProducts = limit ? products.slice(0, limit) : products;

  if (products.length === 0) {
    return (
      <Card className={`bg-card/50 border-border/30 p-8 text-center ${className}`}>
        <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
        <p className="text-muted-foreground text-sm">No products found in your store</p>
        {!artistId && (
          <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={handleDisconnect}>
            <Unlink className="w-3 h-3" /> Disconnect Store
          </Button>
        )}
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-lg">Merch</h3>
          <Badge variant="outline" className="text-xs">{products.length} items</Badge>
        </div>
        {!artistId && (
          <Button variant="ghost" size="sm" onClick={handleDisconnect} className="text-xs gap-1 text-muted-foreground">
            <Unlink className="w-3 h-3" /> Disconnect
          </Button>
        )}
      </div>

      <div className={`grid gap-4 ${variant === "compact" ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"}`}>
        {displayProducts.map((product) => (
          <a
            key={product.id}
            href={`https://${config.store_domain}/products/${product.handle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative bg-card rounded-xl overflow-hidden border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
          >
            <div className="aspect-square relative overflow-hidden">
              {product.images.edges[0] ? (
                <img
                  src={product.images.edges[0].node.url}
                  alt={product.images.edges[0].node.altText || product.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full bg-muted/30 flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8 text-muted-foreground/30" />
                </div>
              )}
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-8 h-8 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center border border-border">
                  <ExternalLink className="w-4 h-4" />
                </div>
              </div>
            </div>
            <div className="p-3">
              <h4 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">{product.title}</h4>
              <p className="text-primary font-semibold text-sm mt-1">
                {product.priceRange.minVariantPrice.currencyCode} {parseFloat(product.priceRange.minVariantPrice.amount).toFixed(2)}
              </p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

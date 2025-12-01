import { ExternalLink, ShoppingBag, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const STORE_URL = "https://thirtydarkzerorecords.com/store";

interface MerchItem {
  id: string;
  name: string;
  price: string;
  image: string;
  url: string;
  featured?: boolean;
}

const merchItems: MerchItem[] = [
  {
    id: "golf-polo",
    name: "TDZ Golf Club Polo Set",
    price: "from $47.10",
    image: "https://images.squarespace-cdn.com/content/v1/62e32bbc00631b5950e675a8/1727210605959-DAFDQ8T7KDGWJWMWH1Q6/store-1727210601807-8211116344.png",
    url: `${STORE_URL}/p/tdz-golf-club-polo-set`,
    featured: true
  },
  {
    id: "rome-riches-luggage",
    name: "TDZ Rome & Riches Luggage Claim Set",
    price: "from $36.23",
    image: "https://images.squarespace-cdn.com/content/v1/62e32bbc00631b5950e675a8/1723150364748-DSNVWVJW6OG1FMW9KOBW/store-1723150346640-2755610250.png",
    url: `${STORE_URL}/p/tdz-rome-riches-luggage-claim-set-1`,
    featured: true
  },
  {
    id: "world-tour-hoodie",
    name: "World Tour Hoodie",
    price: "from $59.05",
    image: "https://images.squarespace-cdn.com/content/v1/62e32bbc00631b5950e675a8/1705383984391-R2WWEBFNGFK8PAM8C4SD/store-1705383982079-0215483569.png",
    url: `${STORE_URL}/p/thirty-dark-zero-world-tour-hoodie`,
    featured: true
  },
  {
    id: "must-have-sweatpants",
    name: "\"Must Have\" Sweatpants",
    price: "from $44.87",
    image: "https://images.squarespace-cdn.com/content/v1/62e32bbc00631b5950e675a8/1694044554986-HOEGUZ3CJVNDRI5U98HH/store-1694044550296-0585941200.png",
    url: `${STORE_URL}/p/thirty-dark-zero-must-have-sweatpants`,
    featured: true
  },
  {
    id: "must-have-hoodie",
    name: "\"Must Have\" Hoodie",
    price: "from $58.25",
    image: "https://images.squarespace-cdn.com/content/v1/62e32bbc00631b5950e675a8/1694044728714-KMPMSGSNELW9ZHXBMVYV/store-1694044725117-6118918243.png",
    url: `${STORE_URL}/p/thirty-dark-zero-must-have-hoodie`
  },
  {
    id: "must-have-sweatshirt",
    name: "\"Must Have\" Sweatshirt",
    price: "from $42.07",
    image: "https://images.squarespace-cdn.com/content/v1/62e32bbc00631b5950e675a8/1694045618205-OY3526IDO1P5WI8Q1FVW/store-1694045614344-1483750558.png",
    url: `${STORE_URL}/p/thirty-dark-zero-must-have-sweatshirt`
  },
  {
    id: "wanted-sweat-suit",
    name: "The Wanted Sweat Suit",
    price: "from $64.41",
    image: "https://images.squarespace-cdn.com/content/v1/62e32bbc00631b5950e675a8/1705431058724-ZI6QRA1VPZ9H2KRES9O2/store-1705431054375-3030311424.png",
    url: `${STORE_URL}/p/the-wanted-sweat-suit`
  },
  {
    id: "turtleneck-hoodie",
    name: "TDZ Authentic Turtleneck Hoodie",
    price: "$61.34",
    image: "https://images.squarespace-cdn.com/content/v1/62e32bbc00631b5950e675a8/1705382654268-G3KBSQWSHZXSKGHF3F27/store-1705382652111-2388305604.png",
    url: `${STORE_URL}/p/tdz-authentic-turtleneck-hoodie`
  },
  {
    id: "sleeveless-set",
    name: "TDZ Sleeveless Hoodie x Shorts Set",
    price: "from $37.73",
    image: "https://images.squarespace-cdn.com/content/v1/62e32bbc00631b5950e675a8/1718937184811-NH08KYNYI6HPPJ92L6O8/store-1718937182041-9088915399.png",
    url: `${STORE_URL}/p/tdz-sleeveless-hoodie-x-shorts-set`
  },
  {
    id: "rome-riches-pop-tags",
    name: "TDZ Rome & Riches Pop Tags Set",
    price: "from $34.97",
    image: "https://images.squarespace-cdn.com/content/v1/62e32bbc00631b5950e675a8/1719772956847-AJTPF1ZG5YNJSYP7KOY3/store-1719772952403-4104904227.png",
    url: `${STORE_URL}/p/tdz-rome-riches-pop-tags-set`
  },
  {
    id: "rome-riches-carry-on",
    name: "TDZ Rome & Riches Carry On Set",
    price: "from $34.97",
    image: "https://images.squarespace-cdn.com/content/v1/62e32bbc00631b5950e675a8/1719773587907-FBFGPFBB4M2NXHQEMS6D/store-1719773582622-6460272592.png",
    url: `${STORE_URL}/p/tdz-rome-riches-carry-on-set`
  },
  {
    id: "rome-riches-polo-set",
    name: "TDZ Rome & Riches Pop Tags Polo Set",
    price: "from $37.73",
    image: "https://images.squarespace-cdn.com/content/v1/62e32bbc00631b5950e675a8/1719774731378-LSPKEIFEMLNWT3P22ZKL/store-1719774727395-8795261251.png",
    url: `${STORE_URL}/p/tdz-rome-riches-pop-tags-polo-set`
  }
];

interface MerchStoreProps {
  variant?: "full" | "compact" | "hero";
  limit?: number;
  className?: string;
}

export function MerchStore({ variant = "full", limit, className = "" }: MerchStoreProps) {
  const displayItems = limit ? merchItems.slice(0, limit) : merchItems;
  const featuredItems = merchItems.filter(item => item.featured);

  if (variant === "hero") {
    return (
      <section className={`py-16 md:py-24 px-4 md:px-6 relative ${className}`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="bg-secondary/20 text-secondary border-secondary/30 mb-4 px-4 py-2">
              <ShoppingBag className="w-4 h-4 mr-2" />
              OFFICIAL MERCH
            </Badge>
            <h2 className="text-3xl md:text-5xl font-display font-black mb-4">
              <span className="bg-gradient-to-r from-secondary via-primary to-accent bg-clip-text text-transparent">
                TDZ STORE
              </span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Rep the movement. Premium streetwear from Thirty Dark Zero.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
            {featuredItems.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative aspect-square bg-card rounded-xl overflow-hidden border border-border/50 hover:border-primary/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/10"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <p className="font-bold text-sm line-clamp-1">{item.name}</p>
                  <p className="text-primary text-sm font-semibold">{item.price}</p>
                </div>
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-8 h-8 rounded-full bg-primary/90 flex items-center justify-center">
                    <ExternalLink className="w-4 h-4 text-background" />
                  </div>
                </div>
              </a>
            ))}
          </div>

          <div className="text-center">
            <Button
              size="lg"
              asChild
              className="bg-gradient-to-r from-secondary via-primary to-accent animated-gradient"
            >
              <a href={STORE_URL} target="_blank" rel="noopener noreferrer">
                <ShoppingBag className="w-5 h-5 mr-2" />
                Shop All Merch
                <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  if (variant === "compact") {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-lg">TDZ Merch</h3>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <a href={STORE_URL} target="_blank" rel="noopener noreferrer">
              View All
              <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {displayItems.slice(0, 4).map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative aspect-square bg-card rounded-lg overflow-hidden border border-border/50 hover:border-primary/50 transition-all"
            >
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
              <div className="absolute bottom-2 left-2 right-2">
                <p className="font-semibold text-xs line-clamp-1">{item.name}</p>
                <p className="text-primary text-xs">{item.price}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    );
  }

  // Full variant
  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-background" />
            </div>
            <div>
              <h2 className="text-2xl font-display font-bold">TDZ Store</h2>
              <p className="text-sm text-muted-foreground">Official Thirty Dark Zero Merchandise</p>
            </div>
          </div>
        </div>
        <Button asChild className="bg-gradient-to-r from-secondary to-primary">
          <a href={STORE_URL} target="_blank" rel="noopener noreferrer">
            <Sparkles className="w-4 h-4 mr-2" />
            Shop All
            <ExternalLink className="w-4 h-4 ml-2" />
          </a>
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {displayItems.map((item) => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative bg-card rounded-xl overflow-hidden border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
          >
            <div className="aspect-square relative overflow-hidden">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              {item.featured && (
                <Badge className="absolute top-2 left-2 bg-primary/90 text-primary-foreground text-xs">
                  Popular
                </Badge>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="p-4">
              <h3 className="font-bold text-sm line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                {item.name}
              </h3>
              <p className="text-primary font-semibold">{item.price}</p>
            </div>
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-8 h-8 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center border border-border">
                <ExternalLink className="w-4 h-4" />
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Flame, TrendingUp, Music, ListMusic, ShoppingBag } from "lucide-react";
import { ReactNode } from "react";

interface PremiumTabsProps {
  defaultValue: string;
  discoverContent: ReactNode;
  trendingContent: ReactNode;
  artistsContent: ReactNode;
  playlistsContent: ReactNode;
  merchContent: ReactNode;
}

export function PremiumTabs({
  defaultValue,
  discoverContent,
  trendingContent,
  artistsContent,
  playlistsContent,
  merchContent
}: PremiumTabsProps) {
  return (
    <Tabs defaultValue={defaultValue} className="space-y-8">
      {/* Premium Tab Navigation */}
      <div className="flex justify-center overflow-x-auto pb-2 -mx-4 px-4">
        <div className="relative">
          {/* Glow effect behind tabs */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 blur-2xl opacity-50" />
          
          <TabsList className="relative glass-ultra p-2 gap-1 md:gap-2 h-auto shadow-3d inline-flex min-w-max border border-white/10">
            <TabItem value="discover" icon={Flame} label="Discover" />
            <TabItem value="trending" icon={TrendingUp} label="Trending" />
            <TabItem value="artists" icon={Music} label="Artists" />
            <TabItem value="playlists" icon={ListMusic} label="Playlists" />
            <TabItem value="merch" icon={ShoppingBag} label="Merch" />
          </TabsList>
        </div>
      </div>

      <TabsContent value="discover" className="space-y-10 animate-fade-in">
        {discoverContent}
      </TabsContent>

      <TabsContent value="trending" className="space-y-10 animate-fade-in">
        {trendingContent}
      </TabsContent>

      <TabsContent value="artists" className="space-y-10 animate-fade-in">
        {artistsContent}
      </TabsContent>

      <TabsContent value="playlists" className="space-y-10 animate-fade-in">
        {playlistsContent}
      </TabsContent>

      <TabsContent value="merch" className="space-y-10 animate-fade-in">
        {merchContent}
      </TabsContent>
    </Tabs>
  );
}

function TabItem({ 
  value, 
  icon: Icon, 
  label 
}: { 
  value: string; 
  icon: React.ComponentType<{ className?: string }>; 
  label: string;
}) {
  return (
    <TabsTrigger 
      value={value} 
      className="
        relative gap-2 px-4 sm:px-5 md:px-6 py-2.5 md:py-3 text-sm md:text-base font-medium
        rounded-lg transition-all duration-300
        data-[state=inactive]:text-muted-foreground
        data-[state=inactive]:hover:text-foreground
        data-[state=inactive]:hover:bg-white/5
        data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary-glow
        data-[state=active]:text-primary-foreground
        data-[state=active]:shadow-glow
        whitespace-nowrap
        overflow-hidden
      "
    >
      {/* Active state shimmer */}
      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full data-[state=active]:animate-shimmer" />
      
      <Icon className="w-4 h-4 md:w-5 md:h-5" />
      <span className="hidden sm:inline">{label}</span>
    </TabsTrigger>
  );
}
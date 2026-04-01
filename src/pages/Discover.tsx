import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";
import { useDiscoveryData } from "@/hooks/useDiscoveryData";
import { usePlayer } from "@/contexts/PlayerContext";
import { useMood, MoodTheme } from "@/contexts/MoodContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ChevronRight, Play, Compass, TrendingUp, BarChart3, Music, ShoppingBag, Star, Shirt, Disc3, Package, Heart } from "lucide-react";

import { PersistentLayout } from "@/components/discovery/PersistentLayout";
import { CosmicTopBar } from "@/components/discovery/CosmicTopBar";
import { SongRow, SongListHeader } from "@/components/discovery/SongRow";
import { ArtistCard } from "@/components/discovery/ArtistCard";
import { AlbumCard } from "@/components/discovery/AlbumCard";
import { ArtistPortal } from "@/components/discovery/ArtistPortal";
import { UniversalSearchResults } from "@/components/discovery/UniversalSearchResults";
import { UnifiedLibrary } from "@/components/discovery/UnifiedLibrary";
import { UserPlaylistsSection } from "@/components/discovery/UserPlaylistsSection";
import { GenreTop50Section } from "@/components/discovery/GenreTop50Section";
import { PlaylistManager } from "@/components/PlaylistManager";
import { ProfileHub } from "@/components/discovery/ProfileHub";
import { GenrePlaylistDetail } from "@/components/discovery/GenrePlaylistDetail";
import { ImmersiveHeroSection } from "@/components/discovery/ImmersiveHeroSection";
import { ImmersiveTrackSection } from "@/components/discovery/ImmersiveTrackSection";
import { ImmersiveContentSection } from "@/components/discovery/ImmersiveContentSection";

type FeaturedItem = {
  id: string;
  title: string;
  artist: string;
  image: string;
  type: "album" | "track";
  trackData?: any;
};

/* ── Section Header ── */
function Section({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="py-6">
      <div className="flex items-end justify-between mb-3.5">
        <div>
          <h2 className="font-display" style={{ fontSize: 28, color: "var(--text-1)" }}>{title}</h2>
          {subtitle && <p className="font-body" style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function SeeAll({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-0.5 font-body transition-colors" style={{ fontSize: 11, fontWeight: 600, color: "#00CFFF" }}>
      See all <ChevronRight className="w-3.5 h-3.5" />
    </button>
  );
}

/* ── Mood Bubble ── */
const MOODS: Array<{ id: MoodTheme; label: string; emoji: string; color: string }> = [
  { id: "chill", label: "CHILL", emoji: "🌊", color: "#38BDF8" },
  { id: "hype", label: "HYPE", emoji: "🔥", color: "#F43F5E" },
  { id: "focus", label: "FOCUS", emoji: "🎯", color: "#34D399" },
  { id: "vibes", label: "VIBES", emoji: "💜", color: "#A78BFA" },
  { id: "late-night", label: "LATE NIGHT", emoji: "🌙", color: "#EF4444" },
  { id: "soul", label: "SOUL", emoji: "✨", color: "#FBB724" },
];

/* ── Genre Colors ── */
const GENRE_COLORS: Record<string, string> = {
  "Hip-Hop": "#8B5CF6", "R&B": "#EC4899", "Pop": "#22C55E", "Rock": "#EF4444",
  "Latin": "#EAB308", "Jazz": "#F59E0B", "Dance": "#06B6D4", "Afrobeats": "#F97316",
};

/* ── Filter Pill ── */
function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 whitespace-nowrap font-body transition-all duration-200"
      style={{
        borderRadius: "var(--radius-pill)",
        fontSize: 11,
        fontWeight: 600,
        background: active ? "var(--glass-2)" : "var(--glass-1)",
        color: active ? "#00CFFF" : "var(--text-3)",
        border: active ? "1px solid rgba(0,207,255,0.3)" : "1px solid var(--glass-border)",
      }}
    >
      {label}
    </button>
  );
}

/* ── Hex Cell for Library ── */
function LibraryCard({ image, label, onClick }: { image: string | null; label: string; onClick: () => void }) {
  return (
    <div
      className="relative cursor-pointer transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
      style={{ aspectRatio: "1", borderRadius: "var(--radius-md)", overflow: "hidden", background: "var(--glass-1)" }}
      onClick={onClick}
    >
      {image && <img src={image} alt="" className="w-full h-full object-cover" />}
      {!image && <div className="w-full h-full flex items-center justify-center"><Music className="w-6 h-6" style={{ color: "var(--text-4)" }} /></div>}
      <div className="absolute inset-x-0 bottom-0 p-2" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)" }}>
        <span className="font-body block truncate" style={{ fontSize: 10, fontWeight: 600, color: "white" }}>
          {label}
        </span>
      </div>
    </div>
  );
}

/* ── Explore Sub-Section ── */
function ExploreSection({ title, color, icon: Icon, tracks, onPlayTrack }: {
  title: string; color: string; icon: any;
  tracks: any[]; onPlayTrack: (track: any) => void;
}) {
  const { currentTrack } = usePlayer();
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2.5">
        <Icon className="h-5 w-5" style={{ color }} />
        <h3 className="font-display" style={{ fontSize: 22, color: "var(--text-1)" }}>{title}</h3>
      </div>
      <div className="rounded-[var(--radius-md)] overflow-hidden" style={{ background: "var(--glass-1)", border: "1px solid var(--glass-border)", borderTop: `2px solid ${color}` }}>
        {tracks.slice(0, 10).map((track, i) => (
          <div
            key={track.id}
            className="flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors"
            style={{ borderBottom: i < Math.min(tracks.length, 10) - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
            onClick={() => onPlayTrack(track)}
          >
            <span className="font-body w-6 text-center flex-shrink-0" style={{ fontSize: 12, fontWeight: 700, color: i < 3 ? color : "var(--text-4)" }}>{i + 1}</span>
            <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0" style={{ background: "var(--glass-2)" }}>
              {track.album_cover_path ? (
                <img src={supabase.storage.from(track.album_cover_bucket || "album-covers").getPublicUrl(track.album_cover_path).data.publicUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><Music className="w-3.5 h-3.5" style={{ color: "var(--text-4)" }} /></div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-body truncate" style={{ fontSize: 13, fontWeight: 600, color: currentTrack?.id === track.id ? "#00CFFF" : "var(--text-1)" }}>{track.title}</p>
              <p className="font-body truncate" style={{ fontSize: 11, color: "var(--text-3)" }}>{track.artist_name}</p>
            </div>
            <Play className="w-3.5 h-3.5 flex-shrink-0 opacity-40" style={{ color: "var(--text-2)" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── TDZ Merch Store ── */
const TDZ_MERCH = [
  { id: "tdz-hoodie-1", name: "TDZ Classic Hoodie", price: 65, image: "🧥", category: "Apparel" },
  { id: "tdz-tee-1", name: "TDZ Logo Tee", price: 35, image: "👕", category: "Apparel" },
  { id: "tdz-cap-1", name: "TDZ Snapback", price: 30, image: "🧢", category: "Accessories" },
  { id: "tdz-vinyl-1", name: "TDZ Compilation Vinyl", price: 45, image: "💿", category: "Music" },
  { id: "tdz-poster-1", name: "TDZ Limited Poster", price: 25, image: "🖼️", category: "Collectibles" },
  { id: "tdz-sticker-1", name: "TDZ Sticker Pack", price: 12, image: "✨", category: "Accessories" },
];

function TDZStorefront({ artists }: { artists: any[] }) {
  const [storeFilter, setStoreFilter] = useState("ALL");
  const filters = ["ALL", "APPAREL", "MUSIC", "ACCESSORIES", "COLLECTIBLES"];

  return (
    <div className="space-y-5">
      {/* Store hero */}
      <div className="relative overflow-hidden" style={{
        background: "linear-gradient(135deg, rgba(0,207,255,0.08), rgba(139,92,246,0.08))",
        border: "1px solid var(--glass-border)",
        borderRadius: "var(--radius-lg)",
        padding: "28px 20px",
      }}>
        <div className="relative z-10">
          <h2 className="font-display" style={{ fontSize: 36, color: "var(--text-1)" }}>TDZ STORE</h2>
          <p className="font-body" style={{ fontSize: 13, color: "var(--text-3)", marginTop: 4 }}>Official merchandise & artist exclusives</p>
        </div>
        <ShoppingBag className="absolute top-5 right-5 h-16 w-16 opacity-[0.06]" style={{ color: "#00CFFF" }} />
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {filters.map(f => (
          <FilterPill key={f} label={f.charAt(0) + f.slice(1).toLowerCase()} active={storeFilter === f} onClick={() => setStoreFilter(f)} />
        ))}
      </div>

      {/* TDZ Official Merch */}
      <Section title="TDZ OFFICIAL" subtitle="ThirtyDarkZero essentials">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {TDZ_MERCH
            .filter(item => storeFilter === "ALL" || item.category.toUpperCase() === storeFilter)
            .map(item => (
              <div
                key={item.id}
                className="cursor-pointer transition-all duration-200 active:scale-[0.97] hover:scale-[1.02]"
                style={{
                  background: "var(--glass-1)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "var(--radius-md)",
                  overflow: "hidden",
                }}
              >
                <div className="flex items-center justify-center" style={{ height: 120, background: "var(--glass-2)" }}>
                  <span style={{ fontSize: 48 }}>{item.image}</span>
                </div>
                <div className="p-3">
                  <p className="font-body truncate" style={{ fontSize: 12, fontWeight: 600, color: "var(--text-1)" }}>{item.name}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="font-body" style={{ fontSize: 14, fontWeight: 700, color: "#22C55E" }}>${item.price}</span>
                    <span className="font-body px-2 py-0.5" style={{ fontSize: 9, color: "var(--text-3)", background: "var(--glass-2)", borderRadius: "var(--radius-pill)" }}>{item.category}</span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </Section>

      {/* Artist Merch */}
      {artists.length > 0 && (
        <Section title="ARTIST MERCH" subtitle="Support your favorite artists">
          <div className="flex flex-col items-center justify-center py-10 gap-3" style={{ background: "var(--glass-1)", borderRadius: "var(--radius-md)", border: "1px solid var(--glass-border)" }}>
            <Shirt className="h-10 w-10" style={{ color: "var(--text-4)" }} />
            <p className="font-body text-center" style={{ fontSize: 13, color: "var(--text-3)", maxWidth: 240 }}>
              Artists can upload their merch to sell directly to fans. Coming soon!
            </p>
          </div>
        </Section>
      )}
    </div>
  );
}

export default function Discover() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("discover");
  const [selectedGenre, setSelectedGenre] = useState<string | undefined>(undefined);
  const [showSearch, setShowSearch] = useState(false);
  const [libraryFilter, setLibraryFilter] = useState("PLAYLISTS");
  const [userProfile, setUserProfile] = useState<any>(null);
  const [exploreView, setExploreView] = useState<"main" | "trending" | "new" | "charts" | "genre">("main");
  const [exploreGenre, setExploreGenre] = useState<string>("");
  const [carouselCenterIndex, setCarouselCenterIndex] = useState(0);
  const { mood, setMood } = useMood();

  const { currentTrack, playTrack, addToQueue } = usePlayer();
  const { tracks, singles, artists, albums, playlists, likedTracks, followedArtists, loading, user, toggleLike, toggleFollow } = useDiscoveryData();
  const { role } = useUserRole(user);
  const { hasFeature } = useSubscription(user);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: a } = await supabase.from("artist_profiles").select("artist_name, profile_image_path").eq("user_id", user.id).maybeSingle();
      if (a?.profile_image_path) { setUserProfile(a); return; }
      const { data: l } = await supabase.from("listener_profiles").select("display_name, profile_image_path").eq("user_id", user.id).maybeSingle();
      if (l) setUserProfile(l);
    };
    load();
  }, [user]);

  const genreFilteredSingles = useMemo(() => {
    let filtered = singles;
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      filtered = filtered.filter(t => (t.title ?? "").toLowerCase().includes(q) || (t.artist_name ?? "").toLowerCase().includes(q));
    }
    if (selectedGenre) {
      const sel = selectedGenre.toLowerCase();
      filtered = filtered.filter(t => (t.genre ?? "").toLowerCase().includes(sel) || (t.mood ?? "").toLowerCase().includes(sel));
    }
    return filtered;
  }, [singles, searchQuery, selectedGenre]);

  // Sort for trending (by play_count desc), new (by created_at desc)
  const trendingSingles = useMemo(() => [...singles].sort((a, b) => (b.play_count || 0) - (a.play_count || 0)), [singles]);
  const newReleaseSingles = useMemo(() => [...singles].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()), [singles]);

  const handlePlayTrack = (track: any) => {
    const nt = { ...track, duration: track.duration || 0, file_path: track.file_path || "", play_count: track.play_count || 0 };
    playTrack(nt, genreFilteredSingles.map(t => ({ ...t, duration: t.duration || 0, file_path: t.file_path || "", play_count: t.play_count || 0 })));
  };

  const handlePlayFromList = (track: any, list: any[]) => {
    const nt = { ...track, duration: track.duration || 0, file_path: track.file_path || "", play_count: track.play_count || 0 };
    playTrack(nt, list.map(t => ({ ...t, duration: t.duration || 0, file_path: t.file_path || "", play_count: t.play_count || 0 })));
  };

  const handleAddToQueue = (track: any) => {
    addToQueue({ ...track, duration: track.duration || 0, file_path: track.file_path || "", play_count: track.play_count || 0 });
    toast.success(`Added "${track.title}" to queue`);
  };

  const resolveArtworkUrl = useCallback((item: any) => {
    if (!item) return null;

    const directUrl = item.image || item.thumbnail;
    if (typeof directUrl === "string" && directUrl.startsWith("http")) return directUrl;

    const paths: Array<{ path: string | null | undefined; bucket: string }> = [
      { path: item.album_cover_path, bucket: item.album_cover_bucket || "album-covers" },
      { path: item.cover_art_path, bucket: "album-covers" },
      { path: item?.albums?.cover_art_path, bucket: "album-covers" },
    ];

    for (const candidate of paths) {
      if (candidate.path) {
        return supabase.storage.from(candidate.bucket).getPublicUrl(candidate.path).data.publicUrl;
      }
    }

    if (typeof directUrl === "string" && directUrl.length > 0) return directUrl;
    return null;
  }, []);

  const forYouItems = useMemo(() => {
    const items: FeaturedItem[] = [];

    for (const album of albums) {
      const image = resolveArtworkUrl(album);
      if (!image) continue;

      items.push({
        id: `album-${album.id}`,
        title: album.title,
        artist: album.artist_name,
        image,
        type: "album",
      });
    }

    for (const track of tracks) {
      const image = resolveArtworkUrl(track);
      if (!image) continue;

      items.push({
        id: `track-${track.id}`,
        title: track.title,
        artist: track.artist_name,
        image,
        type: "track",
        trackData: track,
      });
    }

    const uniqueItems = Array.from(new Map(items.map(item => [item.id, item])).values());
    const featured = uniqueItems.slice(0, 7);

    if (featured.length > 0 && featured.length < 7) {
      const seed = [...featured];
      while (featured.length < 7) {
        const source = seed[featured.length % seed.length];
        featured.push({ ...source, id: `${source.id}-clone-${featured.length}` });
      }
    }

    return featured;
  }, [albums, tracks, resolveArtworkUrl]);

  const topChartRows = useMemo(() => {
    const ranked = [...tracks].sort((a, b) => (b.play_count || 0) - (a.play_count || 0));

    if (ranked.length === 0) return [] as Array<{ rowId: string; track: any }>;

    const rows = ranked.slice(0, 50).map((track, i) => ({ rowId: `rank-${i + 1}-${track.id}`, track }));

    while (rows.length < 50) {
      const source = ranked[rows.length % ranked.length];
      rows.push({ rowId: `fill-${rows.length + 1}-${source.id}`, track: source });
    }

    return rows;
  }, [tracks]);

  const visibleCarouselItems = useMemo(() => {
    if (forYouItems.length === 0) return [];

    return Array.from({ length: 7 }, (_, slot) => {
      const offset = slot - 3;
      const index = (carouselCenterIndex + offset + forYouItems.length) % forYouItems.length;
      return {
        offset,
        index,
        item: forYouItems[index],
      };
    });
  }, [forYouItems, carouselCenterIndex]);

  const activeCarouselItem = forYouItems[carouselCenterIndex] || forYouItems[0];

  useEffect(() => {
    if (forYouItems.length === 0) return;
    setCarouselCenterIndex(0);
  }, [forYouItems.length]);

  useEffect(() => {
    if (forYouItems.length <= 1) return;

    const interval = setInterval(() => {
      setCarouselCenterIndex(prev => (prev + 1) % forYouItems.length);
    }, 3500);

    return () => clearInterval(interval);
  }, [forYouItems.length]);

  const GENRES = ["Hip-Hop", "R&B", "Pop", "Rock", "Latin", "Jazz", "Dance", "Afrobeats"];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#03030F" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#00CFFF", borderTopColor: "transparent" }} />
          <p className="font-body" style={{ fontSize: 12, color: "var(--text-3)" }}>Loading...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    try {
      switch (activeTab) {
        case "discover":
          return (
            <div>
              <CosmicTopBar activeTab={activeTab} onTabChange={setActiveTab} searchQuery={searchQuery} onSearchChange={setSearchQuery} userProfile={userProfile} />

              {searchQuery.trim() && (
                <div className="px-5 relative">
                  <UniversalSearchResults query={searchQuery} tracks={singles} artists={artists} albums={albums} currentTrackId={currentTrack?.id} likedTracks={Array.from(likedTracks)} followedArtists={followedArtists} onPlayTrack={handlePlayTrack} onToggleLike={toggleLike} onToggleFollow={toggleFollow} onArtistClick={a => navigate(`/artist/${a.user_id}`)} onAlbumClick={a => navigate(`/album/${a.id}`)} onClose={() => setSearchQuery("")} />
                </div>
              )}

              <div className="px-3 sm:px-5 md:px-6 lg:px-8">
                {/* ── Featured Coverflow Carousel ── */}
                {forYouItems.length > 0 && (
                  <div className="pt-4 pb-2">
                    {/* Mobile carousel: 3 covers */}
                    <div className="grid grid-cols-3 gap-2 items-center sm:hidden" style={{ minHeight: 100 }}>
                      {visibleCarouselItems.slice(2, 5).map(({ item, offset, index }, slotIndex) => {
                        const distance = Math.abs(offset);
                        const isCenter = offset === 0;
                        const scaleByDistance = [1, 0.88, 0.76][distance] ?? 0.76;
                        const opacityByDistance = [1, 0.85, 0.65][distance] ?? 0.65;
                        return (
                          <button key={`m-${item.id}-${slotIndex}`} type="button" className="relative w-full aspect-square cursor-pointer transition-all duration-500"
                            style={{ transform: `scale(${scaleByDistance})`, opacity: opacityByDistance, filter: isCenter ? "none" : "saturate(0.8)" }}
                            onClick={() => { if (!isCenter) { setCarouselCenterIndex(index); return; } if (item.trackData) { handlePlayTrack(item.trackData); return; } const targetId = item.id.replace(/^(album|track)-/, ""); navigate(item.type === "album" ? `/album/${targetId}` : `/track/${targetId}`); }}
                            aria-label={`${item.title} by ${item.artist}`}
                          >
                            <img src={item.image} alt={`${item.title} cover artwork`} className="w-full h-full object-cover" style={{ borderRadius: 10 }} />
                            {isCenter && (
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity" style={{ background: "hsl(var(--foreground) / 0.28)", borderRadius: 10 }}>
                                <Play className="h-8 w-8" style={{ color: "hsl(var(--background))" }} fill="currentColor" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {/* Tablet/Desktop carousel: 7 covers */}
                    <div className="hidden sm:grid grid-cols-7 items-center" style={{ minHeight: 182, gap: 0 }}>
                      {visibleCarouselItems.map(({ item, offset, index }, slotIndex) => {
                        const distance = Math.abs(offset);
                        const isCenter = offset === 0;
                        const scaleByDistance = [1, 0.93, 0.86, 0.78][distance] ?? 0.78;
                        const opacityByDistance = [1, 0.92, 0.82, 0.7][distance] ?? 0.7;
                        return (
                          <button key={`${item.id}-${slotIndex}-${carouselCenterIndex}`} type="button" className="relative w-full aspect-square cursor-pointer transition-all duration-500"
                            style={{ transform: `scale(${scaleByDistance})`, opacity: opacityByDistance, filter: isCenter ? "none" : "saturate(0.8)" }}
                            onClick={() => { if (!isCenter) { setCarouselCenterIndex(index); return; } if (item.trackData) { handlePlayTrack(item.trackData); return; } const targetId = item.id.replace(/^(album|track)-/, ""); navigate(item.type === "album" ? `/album/${targetId}` : `/track/${targetId}`); }}
                            aria-label={`${item.title} by ${item.artist}`}
                          >
                            <img src={item.image} alt={`${item.title} cover artwork`} className="w-full h-full object-cover" style={{ borderRadius: 14 }} />
                            {isCenter && (
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity" style={{ background: "hsl(var(--foreground) / 0.28)", borderRadius: 14 }}>
                                <Play className="h-10 w-10" style={{ color: "hsl(var(--background))" }} fill="currentColor" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {/* Featured info below carousel */}
                    {activeCarouselItem && (
                      <div className="text-center mt-2 px-4 sm:px-6">
                        <h3 className="font-display truncate" style={{ fontSize: "clamp(24px, 6vw, 38px)", color: "var(--text-1)", lineHeight: 1 }}>{activeCarouselItem.title}</h3>
                        <p className="font-body truncate" style={{ fontSize: "clamp(12px, 3vw, 15px)", color: "var(--text-2)", marginTop: 4 }}>{activeCarouselItem.artist}</p>
                        <div className="flex items-center justify-center gap-4 mt-3 sm:mt-4">
                          <button
                            onClick={() => { if (activeCarouselItem.trackData) { handlePlayTrack(activeCarouselItem.trackData); return; } const targetId = activeCarouselItem.id.replace(/^(album|track)-/, ""); navigate(activeCarouselItem.type === "album" ? `/album/${targetId}` : `/track/${targetId}`); }}
                            className="flex items-center justify-center"
                            style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--text-1)", color: "#000", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}
                          >
                            <Play className="h-5 w-5 ml-0.5" fill="currentColor" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Moodscapes ── */}
                <div className="py-4">
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {MOODS.map(m => {
                      const isActive = mood === m.id;
                      return (
                        <button
                          key={m.id}
                          onClick={() => { setMood(m.id); toast.success(`${m.label} mode activated`); }}
                          className="flex-shrink-0 transition-all duration-300 active:scale-95"
                          style={{
                            padding: "10px 18px",
                            borderRadius: "var(--radius-pill)",
                            background: isActive
                              ? `linear-gradient(135deg, ${m.color}30, ${m.color}12)`
                              : "var(--glass-1)",
                            border: isActive
                              ? `1.5px solid ${m.color}60`
                              : "1px solid var(--glass-border)",
                            boxShadow: isActive ? `0 0 16px ${m.color}20` : "none",
                          }}
                        >
                          <span className="font-body" style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: isActive ? m.color : "var(--text-3)",
                            letterSpacing: "0.08em",
                          }}>
                            {m.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ── New This Week ── */}
                {forYouItems.length > 1 && (
                  <Section title="NEW THIS WEEK" action={<SeeAll onClick={() => setActiveTab("library")} />}>
                    <div className="flex gap-3.5 overflow-x-auto pb-2 scrollbar-hide">
                      {forYouItems.slice(0, 10).map(item => {
                        const realId = item.id.replace(/^(album|track)-/, "");
                        return (
                          <AlbumCard key={item.id} size="md" album={{ id: realId, title: item.title, artist_name: item.artist, image: item.image }} onClick={() => navigate(item.type === "album" ? `/album/${realId}` : `/track/${realId}`)} />
                        );
                      })}
                    </div>
                  </Section>
                )}

                {/* ── Artist Portals ── */}
                {artists.length > 0 && (
                  <Section title="FEATURED ARTISTS">
                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                      {artists.slice(0, 8).map(a => (
                        <ArtistPortal key={a.user_id} artist={a} onClick={ar => navigate(`/artist/${ar.user_id}`)} />
                      ))}
                    </div>
                  </Section>
                )}

                {/* ── Popular Tracks (Top 10) ── */}
                <Section title={selectedGenre ? selectedGenre.toUpperCase() : "POPULAR TRACKS"} subtitle="Top 10">
                  <div className="rounded-[var(--radius-md)] overflow-hidden" style={{ background: "var(--glass-1)", border: "1px solid var(--glass-border)" }}>
                    <SongListHeader />
                    {trendingSingles.slice(0, 10).map((track, i) => (
                      <SongRow key={track.id} track={track} index={i + 1} isPlaying={currentTrack?.id === track.id} isLiked={likedTracks.has(track.id)} onPlay={handlePlayTrack} onToggleLike={toggleLike} onAddToQueue={handleAddToQueue} />
                    ))}
                  </div>
                </Section>

                {/* ── Albums ── */}
                {albums.length > 0 && (
                  <Section title="ALBUMS">
                    <div className="flex gap-3.5 overflow-x-auto pb-2 scrollbar-hide">
                      {albums.map(album => (
                        <AlbumCard key={album.id} album={{ ...album, image: album.cover_art_path ? supabase.storage.from("album-covers").getPublicUrl(album.cover_art_path).data.publicUrl : null }} onClick={() => navigate(`/album/${album.id}`)} />
                      ))}
                    </div>
                  </Section>
                )}

                <ErrorBoundary fallback={null}>
                  <div className="py-3"><UserPlaylistsSection onPlaylistClick={id => navigate(`/playlist/${id}`)} onViewAll={() => setActiveTab("library")} /></div>
                </ErrorBoundary>
              </div>
            </div>
          );

        case "explore":
          return (
            <div>
              <CosmicTopBar activeTab={activeTab} onTabChange={setActiveTab} searchQuery={searchQuery} onSearchChange={setSearchQuery} userProfile={userProfile} />
              <div className="px-3 sm:px-5 md:px-6 lg:px-8 py-5 space-y-5">
                {/* Search */}
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-3)" }}>
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                  </div>
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="What do you want to listen to?"
                    className="w-full h-12 pl-11 pr-4 text-sm outline-none font-body"
                    style={{
                      background: "var(--glass-1)",
                      border: "1px solid var(--glass-border)",
                      borderRadius: "var(--radius-pill)",
                      color: "var(--text-1)",
                    }}
                  />
                </div>

                {searchQuery.trim() && (
                  <div className="relative">
                    <UniversalSearchResults query={searchQuery} tracks={singles} artists={artists} albums={albums} currentTrackId={currentTrack?.id} likedTracks={Array.from(likedTracks)} followedArtists={followedArtists} onPlayTrack={handlePlayTrack} onToggleLike={toggleLike} onToggleFollow={toggleFollow} onArtistClick={a => navigate(`/artist/${a.user_id}`)} onAlbumClick={a => navigate(`/album/${a.id}`)} onClose={() => setSearchQuery("")} />
                  </div>
                )}

                {!searchQuery.trim() && exploreView === "main" && (
                  <>
                    {/* 3 Glassmorphic playlist launchers — now navigate to real sections */}
                    <div className="space-y-3">
                      {[
                        { label: "TRENDING NOW", icon: TrendingUp, color: "#F43F5E", view: "trending" as const },
                        { label: "NEW RELEASES", icon: Music, color: "#00CFFF", view: "new" as const },
                        { label: "TOP CHARTS", icon: BarChart3, color: "#22C55E", view: "charts" as const },
                      ].map(item => (
                        <button
                          key={item.label}
                          className="w-full flex items-center justify-between px-5 py-6 transition-all duration-200 active:scale-[0.98]"
                          style={{
                            background: "var(--glass-1)",
                            border: "1px solid var(--glass-border)",
                            borderTop: `2px solid ${item.color}`,
                            borderRadius: "var(--radius-md)",
                            backdropFilter: "blur(24px)",
                          }}
                          onClick={() => setExploreView(item.view)}
                        >
                          <div className="flex items-center gap-3">
                            <item.icon className="h-6 w-6" style={{ color: item.color }} />
                            <span className="font-display" style={{ fontSize: 22, color: "var(--text-1)" }}>{item.label}</span>
                          </div>
                          <ChevronRight className="h-5 w-5" style={{ color: "var(--text-3)" }} />
                        </button>
                      ))}
                    </div>

                    {/* Genre grid */}
                    <Section title="BROWSE GENRES">
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                        {GENRES.map(g => {
                          const color = GENRE_COLORS[g] || "#06B6D4";
                          return (
                            <button
                              key={g}
                              onClick={() => { setExploreGenre(g.toLowerCase()); setExploreView("genre"); }}
                              className="relative overflow-hidden transition-transform duration-200 hover:scale-[1.02] active:scale-[0.97]"
                              style={{ background: color, height: 88, borderRadius: "var(--radius-md)" }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
                              <Music className="absolute top-3 right-3 h-7 w-7" style={{ color: "rgba(255,255,255,0.15)" }} />
                              <div className="absolute bottom-3 left-3.5">
                                <span className="font-body" style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{g}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </Section>

                    <ErrorBoundary fallback={null}><GenreTop50Section onViewAll={() => setActiveTab("library")} /></ErrorBoundary>
                  </>
                )}

                {/* ── TRENDING NOW sub-view ── */}
                {!searchQuery.trim() && exploreView === "trending" && (
                  <div className="space-y-4">
                    <button onClick={() => setExploreView("main")} className="flex items-center gap-1 font-body" style={{ fontSize: 12, color: "#00CFFF" }}>
                      ← Back to Explore
                    </button>
                    <h2 className="font-display" style={{ fontSize: 40, color: "var(--text-1)" }}>TRENDING NOW</h2>
                    <p className="font-body" style={{ fontSize: 13, color: "var(--text-3)" }}>The hottest tracks on TDZ right now</p>
                    <div className="rounded-[var(--radius-md)] overflow-hidden" style={{ background: "var(--glass-1)", border: "1px solid var(--glass-border)", borderTop: "2px solid #F43F5E" }}>
                      <SongListHeader />
                      {trendingSingles.slice(0, 20).map((track, i) => (
                        <SongRow key={track.id} track={track} index={i + 1} isPlaying={currentTrack?.id === track.id} isLiked={likedTracks.has(track.id)} onPlay={(t) => handlePlayFromList(t, trendingSingles)} onToggleLike={toggleLike} onAddToQueue={handleAddToQueue} />
                      ))}
                    </div>
                  </div>
                )}

                {/* ── NEW RELEASES sub-view ── */}
                {!searchQuery.trim() && exploreView === "new" && (
                  <div className="space-y-4">
                    <button onClick={() => setExploreView("main")} className="flex items-center gap-1 font-body" style={{ fontSize: 12, color: "#00CFFF" }}>
                      ← Back to Explore
                    </button>
                    <h2 className="font-display" style={{ fontSize: 40, color: "var(--text-1)" }}>NEW RELEASES</h2>
                    <p className="font-body" style={{ fontSize: 13, color: "var(--text-3)" }}>Fresh drops from TDZ artists</p>
                    {/* Album cards */}
                    {albums.length > 0 && (
                      <div className="flex gap-3.5 overflow-x-auto pb-3 scrollbar-hide">
                        {albums.map(album => (
                          <AlbumCard key={album.id} album={{ ...album, image: album.cover_art_path ? supabase.storage.from("album-covers").getPublicUrl(album.cover_art_path).data.publicUrl : null }} onClick={() => navigate(`/album/${album.id}`)} />
                        ))}
                      </div>
                    )}
                    <div className="rounded-[var(--radius-md)] overflow-hidden" style={{ background: "var(--glass-1)", border: "1px solid var(--glass-border)", borderTop: "2px solid #00CFFF" }}>
                      <SongListHeader />
                      {newReleaseSingles.slice(0, 20).map((track, i) => (
                        <SongRow key={track.id} track={track} index={i + 1} isPlaying={currentTrack?.id === track.id} isLiked={likedTracks.has(track.id)} onPlay={(t) => handlePlayFromList(t, newReleaseSingles)} onToggleLike={toggleLike} onAddToQueue={handleAddToQueue} />
                      ))}
                    </div>
                  </div>
                )}

                {/* ── TOP CHARTS sub-view (Billboard-style 50 songs) ── */}
                {!searchQuery.trim() && exploreView === "charts" && (
                  <div className="space-y-4">
                    <button onClick={() => setExploreView("main")} className="flex items-center gap-1 font-body" style={{ fontSize: 12, color: "#00CFFF" }}>
                      ← Back to Explore
                    </button>
                    <h2 className="font-display" style={{ fontSize: 40, color: "var(--text-1)" }}>TDZ TOP 50</h2>
                    <p className="font-body" style={{ fontSize: 13, color: "var(--text-3)" }}>The official TDZ charts — updated weekly</p>
                    <div className="rounded-[var(--radius-md)] overflow-hidden" style={{ background: "var(--glass-1)", border: "1px solid var(--glass-border)", borderTop: "2px solid #22C55E" }}>
                      {/* Chart header */}
                      <div className="flex items-center px-4 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                        <span className="font-body w-10 text-center" style={{ fontSize: 9, fontWeight: 700, color: "var(--text-4)", letterSpacing: "0.1em" }}>#</span>
                        <span className="font-body flex-1" style={{ fontSize: 9, fontWeight: 700, color: "var(--text-4)", letterSpacing: "0.1em" }}>TITLE</span>
                        <span className="font-body w-20 text-right" style={{ fontSize: 9, fontWeight: 700, color: "var(--text-4)", letterSpacing: "0.1em" }}>PLAYS</span>
                      </div>
                      {topChartRows.map(({ rowId, track }, i) => {
                        const isTop3 = i < 3;
                        const coverUrl = resolveArtworkUrl(track);
                        return (
                          <div
                            key={rowId}
                            className="flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors hover:bg-white/[0.03] active:bg-white/[0.06]"
                            style={{ borderBottom: i < 49 ? "1px solid rgba(255,255,255,0.03)" : "none" }}
                            onClick={() => handlePlayFromList(track, topChartRows.map(row => row.track))}
                          >
                            {/* Chart position */}
                            <span className="font-display w-10 text-center flex-shrink-0" style={{
                              fontSize: isTop3 ? 28 : 18,
                              color: isTop3 ? "#22C55E" : "var(--text-4)",
                            }}>
                              {i + 1}
                            </span>
                            {/* Artwork */}
                            <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0" style={{ background: "var(--glass-2)" }}>
                              {coverUrl ? (
                                <img src={coverUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center"><Music className="w-4 h-4" style={{ color: "var(--text-4)" }} /></div>
                              )}
                            </div>
                            {/* Info */}
                            <div className="min-w-0 flex-1">
                              <p className="font-body truncate" style={{ fontSize: 13, fontWeight: 600, color: currentTrack?.id === track.id ? "#00CFFF" : "var(--text-1)" }}>{track.title}</p>
                              <p className="font-body truncate" style={{ fontSize: 11, color: "var(--text-3)" }}>{track.artist_name}</p>
                            </div>
                            {/* Play count */}
                            <span className="font-body flex-shrink-0 w-20 text-right" style={{ fontSize: 11, color: "var(--text-4)" }}>
                              {(track.play_count || 0).toLocaleString()}
                            </span>
                            <Play className="w-3.5 h-3.5 flex-shrink-0 opacity-30" style={{ color: "var(--text-2)" }} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── GENRE PLAYLIST sub-view ── */}
                {!searchQuery.trim() && exploreView === "genre" && exploreGenre && (
                  <GenrePlaylistDetail genre={exploreGenre} onBack={() => setExploreView("main")} />
                )}
              </div>
            </div>
          );

        case "library":
          return (
            <div>
              <CosmicTopBar activeTab={activeTab} onTabChange={setActiveTab} searchQuery={searchQuery} onSearchChange={setSearchQuery} userProfile={userProfile} />
              <div className="px-3 sm:px-5 md:px-6 lg:px-8 py-5 space-y-4">
                {/* Filter pills */}
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {["PLAYLISTS", "ALBUMS", "ARTISTS", "SONGS", "DOWNLOADED", "RECENT"].map(tab => (
                    <FilterPill key={tab} label={tab.charAt(0) + tab.slice(1).toLowerCase()} active={libraryFilter === tab} onClick={() => setLibraryFilter(tab)} />
                  ))}
                </div>

                {/* Hexagonal grid for albums — smaller cells */}
                {(libraryFilter === "ALBUMS" || libraryFilter === "PLAYLISTS" || libraryFilter === "DOWNLOADED" || libraryFilter === "RECENT") && albums.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                    {albums.map(album => (
                      <LibraryCard
                        key={album.id}
                        image={album.cover_art_path ? supabase.storage.from("album-covers").getPublicUrl(album.cover_art_path).data.publicUrl : null}
                        label={album.title}
                        onClick={() => navigate(`/album/${album.id}`)}
                      />
                    ))}
                  </div>
                )}

                {libraryFilter === "SONGS" && (
                  <div className="rounded-[var(--radius-md)] overflow-hidden" style={{ background: "var(--glass-1)", border: "1px solid var(--glass-border)" }}>
                    <SongListHeader />
                    {genreFilteredSingles.map((track, i) => (
                      <SongRow key={track.id} track={track} index={i + 1} isPlaying={currentTrack?.id === track.id} isLiked={likedTracks.has(track.id)} onPlay={handlePlayTrack} onToggleLike={toggleLike} onAddToQueue={handleAddToQueue} />
                    ))}
                  </div>
                )}

                {libraryFilter === "ARTISTS" && (
                  <div className="flex gap-4 flex-wrap">
                    {artists.map(a => <ArtistPortal key={a.user_id} artist={a} onClick={ar => navigate(`/artist/${ar.user_id}`)} />)}
                  </div>
                )}

                <ErrorBoundary fallback={null}>
                  <UnifiedLibrary showTrending={false} onPlayYouTube={(videoId, title, artist, thumbnail) => {
                    playTrack({ id: videoId, title, artist_name: artist, source: "youtube", youtubeId: videoId, album_cover_path: thumbnail, duration: 0, file_path: "", play_count: 0 } as any);
                  }} />
                </ErrorBoundary>
              </div>
            </div>
          );

        case "feed":
          return (
            <div>
              <CosmicTopBar activeTab={activeTab} onTabChange={setActiveTab} searchQuery={searchQuery} onSearchChange={setSearchQuery} userProfile={userProfile} />
              <ProfileHub
                userProfile={userProfile}
                likedTracks={likedTracks}
                followedArtists={followedArtists}
                playlists={playlists}
                singles={singles}
                onPlayTrack={handlePlayTrack}
              />
            </div>
          );

        case "store":
          return (
            <div>
              <CosmicTopBar activeTab={activeTab} onTabChange={setActiveTab} searchQuery={searchQuery} onSearchChange={setSearchQuery} userProfile={userProfile} />
              <div className="px-3 sm:px-5 md:px-6 lg:px-8 py-5">
                <TDZStorefront artists={artists} />
              </div>
            </div>
          );

        default:
          return <div className="px-5 py-6"><p className="font-body" style={{ color: "var(--text-3)" }}>Select a tab</p></div>;
      }
    } catch (error) {
      console.error("renderContent error:", error);
      return <div className="p-8 font-body">Something went wrong</div>;
    }
  };

  return (
    <PersistentLayout activeTab={activeTab} onTabChange={setActiveTab} searchQuery={searchQuery} onSearchChange={setSearchQuery} showSearch={showSearch} onToggleSearch={() => setShowSearch(!showSearch)}>
      {renderContent()}
    </PersistentLayout>
  );
}

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

import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";

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

/* ── Section Header ── */
function Section({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="py-5">
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
  "Hip-Hop": "#8B5CF6", "R&B": "#EC4899", "Pop": "#22C55E", "Electronic": "#06B6D4",
  "Rock": "#EF4444", "Soul": "#F59E0B", "Latin": "#EAB308", "Alternative": "#A855F7",
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
function HexCell({ image, label, onClick }: { image: string | null; label: string; onClick: () => void }) {
  return (
    <div
      className="relative cursor-pointer transition-all duration-200 active:brightness-130"
      style={{ clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)", aspectRatio: "1", background: "hsl(var(--bg-surface))", maxWidth: 100 }}
      onClick={onClick}
    >
      {image && <img src={image} alt="" className="w-full h-full object-cover" />}
      <div className="absolute left-0 right-0 text-center font-body" style={{
        bottom: "22%", fontSize: 8, fontWeight: 700, color: "white",
        textShadow: "0 2px 8px rgba(0,0,0,0.9)", padding: "0 4px",
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
      }}>
        {label}
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
  const [exploreView, setExploreView] = useState<"main" | "trending" | "new" | "charts">("main");
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

  const forYouItems = useMemo(() => {
    const items: Array<{ id: string; title: string; artist: string; image: string; type: "album" | "track"; trackData?: any }> = [];
    albums.filter(a => a.cover_art_path).forEach(album => {
      items.push({ id: album.id, title: album.title, artist: album.artist_name, image: supabase.storage.from("album-covers").getPublicUrl(album.cover_art_path!).data.publicUrl, type: "album" });
    });
    singles.filter(t => t.album_cover_path).slice(0, 10 - items.length).forEach(track => {
      const bucket = track.album_cover_bucket || "album-covers";
      items.push({ id: track.id, title: track.title, artist: track.artist_name, image: supabase.storage.from(bucket).getPublicUrl(track.album_cover_path!).data.publicUrl, type: "track", trackData: track });
    });
    return items;
  }, [albums, singles]);

  const GENRES = ["Hip-Hop", "R&B", "Pop", "Electronic", "Rock", "Soul", "Latin", "Alternative"];

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

              <div className="px-5 sm:px-6 lg:px-8">
                {/* ── Featured Coverflow Carousel ── */}
                {forYouItems.length > 0 && (
                  <div className="pt-4 pb-2">
                    <Swiper
                      modules={[EffectCoverflow, Autoplay]}
                      effect="coverflow"
                      coverflowEffect={{ rotate: 32, stretch: 0, depth: 200, modifier: 1.2, slideShadows: true }}
                      centeredSlides={true}
                      slidesPerView={1.4}
                      spaceBetween={0}
                      loop={forYouItems.length > 3}
                      autoplay={{ delay: 3500, disableOnInteraction: false }}
                      className="w-full"
                      style={{ paddingTop: 8, paddingBottom: 16, overflow: "visible" }}
                    >
                      {forYouItems.slice(0, 10).map(item => (
                        <SwiperSlide key={item.id} className="!flex !justify-center">
                          <div
                            className="cursor-pointer transition-transform duration-200"
                            onClick={() => {
                              if (item.trackData) handlePlayTrack(item.trackData);
                              else navigate(item.type === "album" ? `/album/${item.id}` : `/track/${item.id}`);
                            }}
                          >
                            <div className="relative overflow-hidden mx-auto" style={{ width: 220, height: 220, borderRadius: "var(--radius-md)" }}>
                              <img src={item.image} alt="" className="w-full h-full object-cover" />
                            </div>
                          </div>
                        </SwiperSlide>
                      ))}
                    </Swiper>
                    {/* Featured info below carousel — always centered */}
                    {forYouItems[0] && (
                      <div className="text-center mt-2 px-6">
                        <h3 className="font-display truncate" style={{ fontSize: 38, color: "var(--text-1)", lineHeight: 1 }}>{forYouItems[0].title}</h3>
                        <p className="font-body truncate" style={{ fontSize: 15, color: "var(--text-2)", marginTop: 4 }}>{forYouItems[0].artist}</p>
                        <div className="flex items-center justify-center gap-4 mt-4">
                          <button
                            onClick={() => { if (forYouItems[0].trackData) handlePlayTrack(forYouItems[0].trackData); }}
                            className="flex items-center justify-center"
                            style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--text-1)", color: "#000", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}
                          >
                            <Play className="h-5 w-5 ml-0.5" fill="currentColor" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Moodscapes ── */}
                <Section title="MOODSCAPES">
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {MOODS.map(m => (
                      <button
                        key={m.id}
                        onClick={() => { setMood(m.id); toast.success(`${m.label} mode activated`); }}
                        className="flex flex-col items-center gap-2 flex-shrink-0 transition-transform duration-200 active:scale-95"
                        style={{ width: 80 }}
                      >
                        <div
                          className="w-14 h-14 rounded-full flex items-center justify-center text-xl"
                          style={{
                            background: `${m.color}18`,
                            border: `2px solid ${m.color}40`,
                            boxShadow: mood === m.id ? `0 0 20px ${m.color}40` : "none",
                          }}
                        >
                          {m.emoji}
                        </div>
                        <span className="font-body" style={{ fontSize: 9, fontWeight: 700, color: mood === m.id ? m.color : "var(--text-3)", letterSpacing: "0.06em" }}>
                          {m.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </Section>

                {/* ── New This Week ── */}
                {forYouItems.length > 1 && (
                  <Section title="NEW THIS WEEK" action={<SeeAll onClick={() => setActiveTab("library")} />}>
                    <div className="flex gap-3.5 overflow-x-auto pb-2 scrollbar-hide">
                      {forYouItems.slice(0, 10).map(item => (
                        <AlbumCard key={item.id} size="md" album={{ id: item.id, title: item.title, artist_name: item.artist, image: item.image }} onClick={() => navigate(item.type === "album" ? `/album/${item.id}` : `/track/${item.id}`)} />
                      ))}
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
                    {genreFilteredSingles.slice(0, 10).map((track, i) => (
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
              <div className="px-5 sm:px-6 lg:px-8 py-5 space-y-5">
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
                              onClick={() => { setSelectedGenre(g); setActiveTab("discover"); }}
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

                {/* ── TOP CHARTS sub-view ── */}
                {!searchQuery.trim() && exploreView === "charts" && (
                  <div className="space-y-4">
                    <button onClick={() => setExploreView("main")} className="flex items-center gap-1 font-body" style={{ fontSize: 12, color: "#00CFFF" }}>
                      ← Back to Explore
                    </button>
                    <ErrorBoundary fallback={null}><GenreTop50Section onViewAll={() => setActiveTab("library")} /></ErrorBoundary>
                  </div>
                )}
              </div>
            </div>
          );

        case "library":
          return (
            <div>
              <CosmicTopBar activeTab={activeTab} onTabChange={setActiveTab} searchQuery={searchQuery} onSearchChange={setSearchQuery} userProfile={userProfile} />
              <div className="px-5 sm:px-6 lg:px-8 py-5 space-y-4">
                {/* Filter pills */}
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {["PLAYLISTS", "ALBUMS", "ARTISTS", "SONGS", "DOWNLOADED", "RECENT"].map(tab => (
                    <FilterPill key={tab} label={tab.charAt(0) + tab.slice(1).toLowerCase()} active={libraryFilter === tab} onClick={() => setLibraryFilter(tab)} />
                  ))}
                </div>

                {/* Hexagonal grid for albums — smaller cells */}
                {(libraryFilter === "ALBUMS" || libraryFilter === "PLAYLISTS" || libraryFilter === "DOWNLOADED" || libraryFilter === "RECENT") && albums.length > 0 && (
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-1 px-1">
                    {albums.map(album => (
                      <HexCell
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
              <div className="px-5 sm:px-6 lg:px-8 py-5">
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "var(--glass-1)", border: "1px solid var(--glass-border)" }}>
                    <span style={{ fontSize: 28 }}>💬</span>
                  </div>
                  <h2 className="font-display" style={{ fontSize: 32, color: "var(--text-1)" }}>SOCIAL FEED</h2>
                  <p className="font-body text-center" style={{ fontSize: 14, color: "var(--text-3)", maxWidth: 280 }}>
                    Connect with fans, share tracks, and discover what your community is listening to.
                  </p>
                </div>
              </div>
            </div>
          );

        case "store":
          return (
            <div>
              <CosmicTopBar activeTab={activeTab} onTabChange={setActiveTab} searchQuery={searchQuery} onSearchChange={setSearchQuery} userProfile={userProfile} />
              <div className="px-5 sm:px-6 lg:px-8 py-5">
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

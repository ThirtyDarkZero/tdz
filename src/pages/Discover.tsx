import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";
import { useDiscoveryData } from "@/hooks/useDiscoveryData";
import { MerchStore } from "@/components/MerchStore";
import { usePlayer } from "@/contexts/PlayerContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ChevronRight, Play, Radio, Zap, Flame, Heart, Music, Headphones, Download, Clock } from "lucide-react";

import { PersistentLayout } from "@/components/discovery/PersistentLayout";
import { CosmicTopBar } from "@/components/discovery/CosmicTopBar";
import { SongRow, SongListHeader } from "@/components/discovery/SongRow";
import { ArtistCard } from "@/components/discovery/ArtistCard";
import { AlbumCard } from "@/components/discovery/AlbumCard";
import { UniversalSearchResults } from "@/components/discovery/UniversalSearchResults";

import { UnifiedLibrary } from "@/components/discovery/UnifiedLibrary";
import { SpotifyPlaylistSection } from "@/components/discovery/SpotifyPlaylistSection";
import { UserPlaylistsSection } from "@/components/discovery/UserPlaylistsSection";
import { GenreTop50Section } from "@/components/discovery/GenreTop50Section";
import { PlaylistManager } from "@/components/PlaylistManager";
import { MoodMixGenerator } from "@/components/discovery/MoodMixGenerator";
import { FanImpactCard } from "@/components/discovery/FanImpactCard";
import { CityTrendingSection } from "@/components/discovery/CityTrendingSection";

/* ── Section Header ── */
function Section({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="py-5">
      <div className="flex items-end justify-between mb-3.5">
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fff", letterSpacing: "-0.01em" }}>{title}</h2>
          {subtitle && <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function SeeAll({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-0.5 text-[11px] font-medium transition-colors" style={{ color: "hsl(var(--primary))" }}>
      See all <ChevronRight className="w-3.5 h-3.5" />
    </button>
  );
}

/* ── Genre Card ── */
const GENRE_COLORS: Record<string, string> = {
  "Hip-Hop": "#8B5CF6", "R&B": "#EC4899", "Pop": "#22C55E", "Electronic": "#06B6D4",
  "Rock": "#EF4444", "Soul": "#F59E0B", "Latin": "#EAB308", "Alternative": "#A855F7",
};

function GenreCard({ genre, onClick }: { genre: string; onClick: () => void }) {
  const color = GENRE_COLORS[genre] || "#06B6D4";
  return (
    <button onClick={onClick} className="relative overflow-hidden rounded-2xl transition-transform duration-200 hover:scale-[1.02] active:scale-[0.97]" style={{ background: color, height: 88 }}>
      <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
      <Music className="absolute top-3 right-3 h-7 w-7" style={{ color: "rgba(255,255,255,0.15)" }} />
      <div className="absolute bottom-3 left-3.5">
        <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{genre}</span>
      </div>
    </button>
  );
}

/* ── Mood Pill ── */
const MOODS = [
  { label: "Party", icon: Zap, color: "#EC4899" },
  { label: "Calm", icon: Headphones, color: "#06B6D4" },
  { label: "Focus", icon: Radio, color: "#8B5CF6" },
  { label: "Workout", icon: Flame, color: "#F97316" },
  { label: "Romance", icon: Heart, color: "#F43F5E" },
];

/* ── Filter Pill ── */
function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all duration-200"
      style={{
        background: active ? "hsl(var(--primary))" : "rgba(255,255,255,0.05)",
        color: active ? "#fff" : "rgba(255,255,255,0.45)",
        border: active ? "none" : "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {label}
    </button>
  );
}

export default function Discover() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("discover");
  const [selectedGenre, setSelectedGenre] = useState<string | undefined>(undefined);
  const [showSearch, setShowSearch] = useState(false);
  const [showTrending, setShowTrending] = useState(false);
  const [libraryFilter, setLibraryFilter] = useState("PLAYLISTS");
  const [userProfile, setUserProfile] = useState<any>(null);

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

  const filteredSingles = singles.filter((t) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (t.title ?? "").toLowerCase().includes(q) || (t.artist_name ?? "").toLowerCase().includes(q);
  });

  const genreFilteredSingles = selectedGenre
    ? filteredSingles.filter((t) => {
        const g = (t.genre ?? "").toLowerCase();
        const m = (t.mood ?? "").toLowerCase();
        const sel = selectedGenre.toLowerCase();
        return g.includes(sel) || m.includes(sel);
      })
    : filteredSingles;

  const handlePlayTrack = (track: any) => {
    const nt = { ...track, duration: track.duration || 0, file_path: track.file_path || "", play_count: track.play_count || 0 };
    playTrack(nt, genreFilteredSingles.map((t) => ({ ...t, duration: t.duration || 0, file_path: t.file_path || "", play_count: t.play_count || 0 })));
  };

  const handleAddToQueue = (track: any) => {
    addToQueue({ ...track, duration: track.duration || 0, file_path: track.file_path || "", play_count: track.play_count || 0 });
    toast.success(`Added "${track.title}" to queue`);
  };

  const forYouItems = useMemo(() => {
    const items: Array<{ id: string; title: string; artist: string; image: string; type: "album" | "track"; trackData?: any }> = [];
    albums.filter((a) => a.cover_art_path).forEach((album) => {
      items.push({ id: album.id, title: album.title, artist: album.artist_name, image: supabase.storage.from("album-covers").getPublicUrl(album.cover_art_path!).data.publicUrl, type: "album" });
    });
    singles.filter((t) => t.album_cover_path).slice(0, 10 - items.length).forEach((track) => {
      const bucket = track.album_cover_bucket || "album-covers";
      items.push({ id: track.id, title: track.title, artist: track.artist_name, image: supabase.storage.from(bucket).getPublicUrl(track.album_cover_path!).data.publicUrl, type: "track", trackData: track });
    });
    return items;
  }, [albums, singles]);

  const GENRES = ["Hip-Hop", "R&B", "Pop", "Electronic", "Rock", "Soul", "Latin", "Alternative"];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0D0D0D" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "hsl(var(--primary))", borderTopColor: "transparent" }} />
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Loading...</p>
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
                  <UniversalSearchResults query={searchQuery} tracks={singles} artists={artists} albums={albums} currentTrackId={currentTrack?.id} likedTracks={Array.from(likedTracks)} followedArtists={followedArtists} onPlayTrack={handlePlayTrack} onToggleLike={toggleLike} onToggleFollow={toggleFollow} onArtistClick={(a) => navigate(`/artist/${a.user_id}`)} onAlbumClick={(a) => navigate(`/album/${a.id}`)} onClose={() => setSearchQuery("")} />
                </div>
              )}

              <div className="px-5 sm:px-6 lg:px-8">
                {/* ── Hero: Playlist of the Week ── */}
                {forYouItems.length > 0 && (
                  <div className="pt-4 pb-2">
                    <p style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>Especially for you</p>
                    <div
                      className="relative rounded-3xl overflow-hidden cursor-pointer transition-transform duration-200 hover:scale-[1.01] active:scale-[0.99]"
                      style={{ height: 200, background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-dark)))" }}
                      onClick={() => {
                        if (forYouItems[0].trackData) handlePlayTrack(forYouItems[0].trackData);
                        else navigate(forYouItems[0].type === "album" ? `/album/${forYouItems[0].id}` : `/track/${forYouItems[0].id}`);
                      }}
                    >
                      {/* Waveform decoration */}
                      <div className="absolute right-4 top-0 bottom-0 w-2/5 flex items-center justify-center opacity-15">
                        {Array.from({ length: 24 }).map((_, i) => (
                          <div key={i} className="mx-[1.5px] rounded-full bg-white" style={{ width: 3, height: `${20 + Math.sin(i * 0.6) * 35 + Math.random() * 25}%` }} />
                        ))}
                      </div>
                      <div className="relative z-10 h-full flex flex-col justify-between p-6">
                        <div>
                          <p style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.6)", marginBottom: 4, letterSpacing: "0.05em", textTransform: "uppercase" }}>Playlist of the Week</p>
                          <p style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>{forYouItems[0]?.title || "Top Picks"}</p>
                          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>{forYouItems.length} tracks · Updated today</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg transition-transform hover:scale-105">
                            <Play className="h-5 w-5 ml-0.5" style={{ color: "hsl(var(--primary))" }} fill="currentColor" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Moods Radio ── */}
                <Section title="Moods Radio" subtitle="Stream based on your vibe">
                  <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
                    {MOODS.map((mood) => (
                      <button
                        key={mood.label}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
                        style={{ background: `${mood.color}12`, border: `1px solid ${mood.color}25` }}
                        onClick={() => { setSelectedGenre(mood.label); toast.success(`${mood.label} mode`); }}
                      >
                        <mood.icon className="h-3.5 w-3.5" style={{ color: mood.color }} />
                        <span style={{ fontSize: 11, fontWeight: 600, color: mood.color }}>{mood.label}</span>
                      </button>
                    ))}
                  </div>
                </Section>

                {/* ── New Releases ── */}
                {forYouItems.length > 1 && (
                  <Section title="New Releases" action={<SeeAll onClick={() => setActiveTab("library")} />}>
                    <div className="flex gap-3.5 overflow-x-auto pb-2 scrollbar-hide">
                      {forYouItems.slice(0, 10).map((item) => (
                        <div key={item.id} className="flex-shrink-0 cursor-pointer group" style={{ width: 130 }} onClick={() => navigate(item.type === "album" ? `/album/${item.id}` : `/track/${item.id}`)}>
                          <div className="relative aspect-square rounded-2xl overflow-hidden mb-2">
                            <img src={item.image} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(0,0,0,0.35)" }}>
                              <Play className="h-7 w-7 text-white" fill="white" />
                            </div>
                          </div>
                          <p className="truncate text-[12px] font-medium" style={{ color: "#fff" }}>{item.title}</p>
                          <p className="truncate text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>{item.artist}</p>
                        </div>
                      ))}
                    </div>
                  </Section>
                )}

                {/* ── Fan Impact ── */}
                {user && <ErrorBoundary fallback={null}><div className="py-3"><FanImpactCard userId={user.id} /></div></ErrorBoundary>}

                {/* ── Artists ── */}
                {artists.length > 0 && (
                  <Section title="Artists" action={<SeeAll onClick={() => setActiveTab("artists")} />}>
                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                      {artists.slice(0, 8).map((a) => (
                        <ArtistCard key={a.user_id} artist={a} isFollowing={followedArtists.has(a.user_id)} onToggleFollow={toggleFollow} onClick={(ar) => navigate(`/artist/${ar.user_id}`)} />
                      ))}
                    </div>
                  </Section>
                )}

                {/* ── Popular Tracks ── */}
                <Section title={selectedGenre || "Popular Tracks"}>
                  <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                    <div className="p-1.5">
                      <SongListHeader />
                      {genreFilteredSingles.slice(0, 10).map((track, i) => (
                        <SongRow key={track.id} track={track} index={i + 1} isPlaying={currentTrack?.id === track.id} isLiked={likedTracks.has(track.id)} onPlay={handlePlayTrack} onToggleLike={toggleLike} onAddToQueue={handleAddToQueue} />
                      ))}
                    </div>
                  </div>
                </Section>

                {/* ── Albums ── */}
                {albums.length > 0 && (
                  <Section title="Albums">
                    <div className="flex gap-3.5 overflow-x-auto pb-2 scrollbar-hide">
                      {albums.map((album) => (
                        <AlbumCard key={album.id} album={{ ...album, image: album.cover_art_path ? supabase.storage.from("album-covers").getPublicUrl(album.cover_art_path).data.publicUrl : null }} onClick={() => navigate(`/album/${album.id}`)} />
                      ))}
                    </div>
                  </Section>
                )}

                {/* Playlists */}
                <ErrorBoundary fallback={null}>
                  <div className="py-3"><UserPlaylistsSection onPlaylistClick={(id) => navigate(`/playlist/${id}`)} onViewAll={() => setActiveTab("playlists")} /></div>
                </ErrorBoundary>
              </div>
            </div>
          );

        case "trending":
          return (
            <div>
              <CosmicTopBar activeTab={activeTab} onTabChange={setActiveTab} searchQuery={searchQuery} onSearchChange={setSearchQuery} userProfile={userProfile} />
              <div className="px-5 sm:px-6 lg:px-8 py-5 space-y-5">
                {/* Search input */}
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "rgba(255,255,255,0.3)" }}>
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                  </div>
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="What do you want to listen to?"
                    className="w-full h-12 pl-11 pr-4 rounded-2xl text-sm outline-none transition-colors"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.06)", color: "#fff" }}
                  />
                </div>

                {/* Genre grid */}
                <Section title="Browse Genres">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                    {GENRES.map((g) => <GenreCard key={g} genre={g} onClick={() => { setSelectedGenre(g); setActiveTab("discover"); }} />)}
                  </div>
                </Section>

                <ErrorBoundary fallback={null}><GenreTop50Section onViewAll={() => setActiveTab("library")} /></ErrorBoundary>
                <ErrorBoundary fallback={null}><CityTrendingSection sectionNumber={0} onViewAllTrends={() => { setShowTrending(true); setActiveTab("library"); }} /></ErrorBoundary>
              </div>
            </div>
          );

        case "library":
          return (
            <div>
              <CosmicTopBar activeTab={activeTab} onTabChange={setActiveTab} searchQuery={searchQuery} onSearchChange={setSearchQuery} userProfile={userProfile} />
              <div className="px-5 sm:px-6 lg:px-8 py-5 space-y-4">
                {/* Loopster library cards */}
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    className="relative rounded-2xl overflow-hidden text-left transition-transform duration-200 hover:scale-[1.02] active:scale-[0.97]"
                    style={{ height: 100, background: "linear-gradient(135deg, #8B5CF6, #6D28D9)" }}
                    onClick={() => setLibraryFilter("SONGS")}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/15" />
                    <div className="relative z-10 p-4 h-full flex flex-col justify-between">
                      <Heart className="h-5 w-5 text-white/70" />
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Favorite Tracks</p>
                        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.55)" }}>{genreFilteredSingles.length} tracks</p>
                      </div>
                    </div>
                  </button>
                  <button
                    className="relative rounded-2xl overflow-hidden text-left transition-transform duration-200 hover:scale-[1.02] active:scale-[0.97]"
                    style={{ height: 100, background: "linear-gradient(135deg, #06B6D4, #0891B2)" }}
                    onClick={() => setLibraryFilter("ALBUMS")}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/15" />
                    <div className="relative z-10 p-4 h-full flex flex-col justify-between">
                      <Download className="h-5 w-5 text-white/70" />
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Downloads</p>
                        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.55)" }}>{albums.length} albums</p>
                      </div>
                    </div>
                  </button>
                  <button
                    className="relative rounded-2xl overflow-hidden text-left transition-transform duration-200 hover:scale-[1.02] active:scale-[0.97]"
                    style={{ height: 100, background: "linear-gradient(135deg, #F97316, #EA580C)" }}
                    onClick={() => setLibraryFilter("PLAYLISTS")}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/15" />
                    <div className="relative z-10 p-4 h-full flex flex-col justify-between">
                      <Music className="h-5 w-5 text-white/70" />
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Playlists</p>
                        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.55)" }}>{playlists?.length || 0} playlists</p>
                      </div>
                    </div>
                  </button>
                  <button
                    className="relative rounded-2xl overflow-hidden text-left transition-transform duration-200 hover:scale-[1.02] active:scale-[0.97]"
                    style={{ height: 100, background: "linear-gradient(135deg, #22C55E, #16A34A)" }}
                    onClick={() => setLibraryFilter("ARTISTS")}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/15" />
                    <div className="relative z-10 p-4 h-full flex flex-col justify-between">
                      <Clock className="h-5 w-5 text-white/70" />
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Recent</p>
                        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.55)" }}>{artists.length} artists</p>
                      </div>
                    </div>
                  </button>
                </div>

                {/* Filter tabs */}
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {["PLAYLISTS", "ALBUMS", "ARTISTS", "SONGS"].map((tab) => (
                    <FilterPill key={tab} label={tab.charAt(0) + tab.slice(1).toLowerCase()} active={libraryFilter === tab} onClick={() => setLibraryFilter(tab)} />
                  ))}
                </div>

                {(libraryFilter === "ALBUMS" || libraryFilter === "PLAYLISTS") && albums.length > 0 && (
                  <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))" }}>
                    {albums.map((album) => (
                      <AlbumCard key={album.id} size="sm" album={{ ...album, image: album.cover_art_path ? supabase.storage.from("album-covers").getPublicUrl(album.cover_art_path).data.publicUrl : null }} onClick={() => navigate(`/album/${album.id}`)} />
                    ))}
                  </div>
                )}

                {libraryFilter === "SONGS" && (
                  <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                    <div className="p-1.5">
                      <SongListHeader />
                      {genreFilteredSingles.map((track, i) => (
                        <SongRow key={track.id} track={track} index={i + 1} isPlaying={currentTrack?.id === track.id} isLiked={likedTracks.has(track.id)} onPlay={handlePlayTrack} onToggleLike={toggleLike} onAddToQueue={handleAddToQueue} />
                      ))}
                    </div>
                  </div>
                )}

                {libraryFilter === "ARTISTS" && (
                  <div className="flex gap-4 flex-wrap">
                    {artists.map((a) => <ArtistCard key={a.user_id} artist={a} isFollowing={followedArtists.has(a.user_id)} onToggleFollow={toggleFollow} onClick={(ar) => navigate(`/artist/${ar.user_id}`)} />)}
                  </div>
                )}

                <div className="grid lg:grid-cols-[1fr_280px] gap-6">
                  <div>
                    <ErrorBoundary fallback={null}><SpotifyPlaylistSection /></ErrorBoundary>
                    <ErrorBoundary fallback={<div style={{ color: "rgba(255,255,255,0.4)" }}>Library unavailable</div>}>
                      <UnifiedLibrary showTrending={showTrending} onPlayYouTube={(videoId, title, artist, thumbnail) => {
                        playTrack({ id: videoId, title, artist_name: artist, source: "youtube", youtubeId: videoId, album_cover_path: thumbnail, duration: 0, file_path: "", play_count: 0 } as any);
                        if (showTrending) setShowTrending(false);
                      }} />
                    </ErrorBoundary>
                  </div>
                </div>
              </div>
            </div>
          );

        case "artists":
          return (
            <div>
              <CosmicTopBar activeTab={activeTab} onTabChange={setActiveTab} searchQuery={searchQuery} onSearchChange={setSearchQuery} userProfile={userProfile} />
              <div className="px-5 sm:px-6 lg:px-8 py-5">
                <Section title="Artists" subtitle={`${artists.length} Artists`}>
                  <div className="flex gap-4 flex-wrap">
                    {artists.map((a) => <ArtistCard key={a.user_id} artist={a} isFollowing={followedArtists.has(a.user_id)} onToggleFollow={toggleFollow} onClick={(ar) => navigate(`/artist/${ar.user_id}`)} />)}
                  </div>
                </Section>
              </div>
            </div>
          );

        case "playlists":
          return (
            <div>
              <CosmicTopBar activeTab={activeTab} onTabChange={setActiveTab} searchQuery={searchQuery} onSearchChange={setSearchQuery} userProfile={userProfile} />
              <div className="px-5 sm:px-6 lg:px-8 py-5 space-y-6">
                <Section title="Playlists" subtitle="Your collections">
                  <ErrorBoundary fallback={null}><UserPlaylistsSection onPlaylistClick={(id) => navigate(`/playlist/${id}`)} /></ErrorBoundary>
                </Section>
                <ErrorBoundary fallback={null}><PlaylistManager userId={user?.id || null} onPlaylistSelect={(id) => navigate(`/playlist/${id}`)} /></ErrorBoundary>
              </div>
            </div>
          );

        case "merch":
          return (
            <div>
              <CosmicTopBar activeTab={activeTab} onTabChange={setActiveTab} searchQuery={searchQuery} onSearchChange={setSearchQuery} userProfile={userProfile} />
              <div className="px-5 sm:px-6 lg:px-8 py-5">
                <Section title="Merch" subtitle="Support artists"><MerchStore variant="full" /></Section>
              </div>
            </div>
          );

        case "ai-mix":
          return (
            <div>
              <CosmicTopBar activeTab={activeTab} onTabChange={setActiveTab} searchQuery={searchQuery} onSearchChange={setSearchQuery} userProfile={userProfile} />
              <div className="px-5 sm:px-6 lg:px-8 py-5">
                <ErrorBoundary fallback={<div className="p-4">AI Mix unavailable</div>}><MoodMixGenerator /></ErrorBoundary>
              </div>
            </div>
          );

        default:
          return <div className="px-5 py-6"><p style={{ color: "rgba(255,255,255,0.4)" }}>Select a tab</p></div>;
      }
    } catch (error) {
      console.error("renderContent error:", error);
      return <div className="p-8">Something went wrong</div>;
    }
  };

  return (
    <PersistentLayout activeTab={activeTab} onTabChange={setActiveTab} searchQuery={searchQuery} onSearchChange={setSearchQuery} showSearch={showSearch} onToggleSearch={() => setShowSearch(!showSearch)}>
      {renderContent()}
    </PersistentLayout>
  );
}

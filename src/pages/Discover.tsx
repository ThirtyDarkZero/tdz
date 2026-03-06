import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";
import { useDiscoveryData } from "@/hooks/useDiscoveryData";
import { MerchStore } from "@/components/MerchStore";
import { usePlayer } from "@/contexts/PlayerContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Play } from "lucide-react";

// Layout + nav
import { PersistentLayout } from "@/components/discovery/PersistentLayout";
import { CosmicTopBar } from "@/components/discovery/CosmicTopBar";

// Universal components
import { SongRow, SongListHeader } from "@/components/discovery/SongRow";
import { ArtistCard } from "@/components/discovery/ArtistCard";
import { AlbumCard } from "@/components/discovery/AlbumCard";
import { ArtistAvatar } from "@/components/discovery/ArtistAvatar";
import { UniversalSearchResults } from "@/components/discovery/UniversalSearchResults";

// Existing functional components
import { UnifiedLibrary } from "@/components/discovery/UnifiedLibrary";
import { SpotifyPlaylistSection } from "@/components/discovery/SpotifyPlaylistSection";
import { UserPlaylistsSection } from "@/components/discovery/UserPlaylistsSection";
import { GenreTop50Section } from "@/components/discovery/GenreTop50Section";
import { EditorialPlaylistsSection } from "@/components/discovery/EditorialPlaylistsSection";
import { PlaylistManager } from "@/components/PlaylistManager";
import { MoodMixGenerator } from "@/components/discovery/MoodMixGenerator";
import { FanImpactCard } from "@/components/discovery/FanImpactCard";
import { CityTrendingSection } from "@/components/discovery/CityTrendingSection";

// Swiper
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow, Autoplay } from "swiper/modules";
// @ts-ignore
import "swiper/css";
// @ts-ignore
import "swiper/css/effect-coverflow";

// ── Section Header ──
function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between mb-6">
      <div>
        <h2 style={{ fontFamily: "'Six Caps', sans-serif", fontSize: "clamp(28px, 4vw, 48px)", color: "#FFFFFF", letterSpacing: "0.04em", textTransform: "uppercase", lineHeight: 1 }}>{title}</h2>
        {subtitle && <p className="mt-1" style={{ fontFamily: "'Raleway', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ── Moodscape Bubble Cluster ──
function MoodscapeCluster({ label, colors, onClick }: { label: string; colors: string[]; onClick: () => void }) {
  const bubbles = [
    { size: 44, x: 20, y: 5 },
    { size: 30, x: 50, y: 0 },
    { size: 22, x: 75, y: 12 },
    { size: 36, x: 35, y: 35 },
    { size: 18, x: 65, y: 40 },
  ];
  return (
    <div className="flex flex-col items-center gap-2 cursor-pointer group transition-transform hover:scale-110" onClick={onClick}>
      <div className="relative" style={{ width: 100, height: 70 }}>
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 70">
          <line x1="38" y1="27" x2="62" y2="20" stroke="rgba(125,211,252,0.25)" strokeWidth="1" />
          <line x1="55" y1="20" x2="70" y2="32" stroke="rgba(125,211,252,0.25)" strokeWidth="1" />
          <line x1="38" y1="27" x2="50" y2="52" stroke="rgba(125,211,252,0.25)" strokeWidth="1" />
        </svg>
        {bubbles.map((b, i) => (
          <div key={i} className="absolute rounded-full" style={{
            width: b.size, height: b.size, left: `${b.x}%`, top: b.y,
            background: `radial-gradient(circle at 35% 35%, ${colors[i % colors.length]}, rgba(0,0,0,0.2))`,
            border: `1px solid ${colors[0]}`,
            backdropFilter: "blur(4px)",
            boxShadow: `inset 0 0 20px ${colors[0]}, 0 0 20px ${colors[0].replace("0.4", "0.08")}`,
          }} />
        ))}
      </div>
      <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 600, fontSize: 11, color: "rgba(255,255,255,0.7)", letterSpacing: "0.12em", textTransform: "uppercase" }}>{label}</span>
    </div>
  );
}

// ── Genre Node ──
function GenreNode({ label, isSelected, onClick }: { label: string; isSelected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-2 transition-all hover:scale-115">
      <div className="w-11 h-11 rounded-full flex items-center justify-center transition-all" style={{
        background: isSelected ? "rgba(192,132,252,0.35)" : "radial-gradient(circle, rgba(192,132,252,0.3), rgba(109,40,217,0.15))",
        border: `1px solid ${isSelected ? "rgba(192,132,252,0.7)" : "rgba(192,132,252,0.4)"}`,
        backdropFilter: "blur(6px)",
        boxShadow: isSelected ? "0 0 24px rgba(192,132,252,0.4)" : "none",
      }}>
        <span style={{ fontSize: 16 }}>🎵</span>
      </div>
      <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 500, fontSize: 10, color: isSelected ? "#C084FC" : "rgba(255,255,255,0.65)" }}>{label}</span>
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
  const [activeSlide, setActiveSlide] = useState(0);

  const { currentTrack, playTrack, addToQueue } = usePlayer();
  const {
    tracks, singles, artists, albums, playlists, likedTracks,
    followedArtists, loading, user, toggleLike, toggleFollow,
  } = useDiscoveryData();
  const { role } = useUserRole(user);
  const { hasFeature } = useSubscription(user);

  const filteredSingles = singles.filter((track) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (track.title ?? "").toLowerCase().includes(q) || (track.artist_name ?? "").toLowerCase().includes(q);
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
    const nt = { ...track, duration: track.duration || 0, file_path: track.file_path || '', play_count: track.play_count || 0 };
    playTrack(nt, genreFilteredSingles.map(t => ({ ...t, duration: t.duration || 0, file_path: t.file_path || '', play_count: t.play_count || 0 })));
  };

  const handleAddToQueue = (track: any) => {
    addToQueue({ ...track, duration: track.duration || 0, file_path: track.file_path || '', play_count: track.play_count || 0 });
    toast.success(`Added "${track.title}" to queue`);
  };

  // Build carousel data
  const tdzReleases = useMemo(() => {
    const r: Array<{ id: string; title: string; artist: string; image: string; genre: string }> = [];
    albums.filter(a => a.cover_art_path).forEach(album => {
      r.push({
        id: album.id, title: album.title, artist: album.artist_name,
        image: supabase.storage.from('album-covers').getPublicUrl(album.cover_art_path!).data.publicUrl,
        genre: album.genre || 'Pop',
      });
    });
    if (r.length < 8) {
      tracks.filter(t => t.album_cover_path).slice(0, 8 - r.length).forEach(track => {
        r.push({
          id: track.id, title: track.title, artist: track.artist_name,
          image: track.album_cover_bucket
            ? supabase.storage.from(track.album_cover_bucket).getPublicUrl(track.album_cover_path!).data.publicUrl
            : supabase.storage.from('album-covers').getPublicUrl(track.album_cover_path!).data.publicUrl,
          genre: track.genre || 'Pop',
        });
      });
    }
    return r;
  }, [albums, tracks]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#050510" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#00CFFF", borderTopColor: "transparent" }} />
          <p style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'Raleway', sans-serif", fontSize: 13 }}>Loading...</p>
        </div>
      </div>
    );
  }

  const GENRES = ["Hip-Hop", "R&B", "Pop", "Electronic", "Rock", "Soul", "Latin", "Alternative"];
  const MOODS = [
    { label: "CHILL", colors: ["rgba(125,211,252,0.4)", "rgba(59,130,246,0.3)", "rgba(34,211,238,0.25)"] },
    { label: "HYPE", colors: ["rgba(239,68,68,0.4)", "rgba(249,115,22,0.3)", "rgba(234,179,8,0.25)"] },
    { label: "FOCUS", colors: ["rgba(34,197,94,0.4)", "rgba(16,185,129,0.3)", "rgba(20,184,166,0.25)"] },
    { label: "VIBES", colors: ["rgba(192,132,252,0.4)", "rgba(139,92,246,0.3)", "rgba(168,85,247,0.25)"] },
    { label: "LATE NIGHT", colors: ["rgba(99,102,241,0.4)", "rgba(79,70,229,0.3)", "rgba(67,56,202,0.25)"] },
  ];

  const renderContent = () => {
    try {
      switch (activeTab) {
        case 'discover':
          return (
            <div className="space-y-0">
              <CosmicTopBar activeTab={activeTab} onTabChange={setActiveTab} searchQuery={searchQuery} onSearchChange={setSearchQuery} />

              <div className="px-4 sm:px-6 lg:px-8">
                {/* Search results overlay */}
                {searchQuery.trim() && (
                  <div className="relative">
                    <UniversalSearchResults
                      query={searchQuery}
                      tracks={singles}
                      artists={artists}
                      albums={albums}
                      currentTrackId={currentTrack?.id}
                      likedTracks={Array.from(likedTracks)}
                      followedArtists={followedArtists}
                      onPlayTrack={handlePlayTrack}
                      onToggleLike={toggleLike}
                      onToggleFollow={toggleFollow}
                      onArtistClick={(a) => navigate(`/artist/${a.user_id}`)}
                      onAlbumClick={(a) => navigate(`/album/${a.id}`)}
                      onClose={() => setSearchQuery("")}
                    />
                  </div>
                )}

                {/* Fan Impact */}
                {user && (
                  <ErrorBoundary fallback={null}>
                    <div className="pt-6"><FanImpactCard userId={user.id} /></div>
                  </ErrorBoundary>
                )}

                {/* ── Hero: 3D Coverflow Carousel ── */}
                {tdzReleases.length > 0 && (
                  <div className="py-8">
                    <div className="flex items-end gap-8">
                      <div className="flex-1">
                        <Swiper
                          modules={[EffectCoverflow, Autoplay]}
                          effect="coverflow"
                          grabCursor
                          centeredSlides
                          slidesPerView="auto"
                          loop={tdzReleases.length > 3}
                          autoplay={{ delay: 4000, disableOnInteraction: true }}
                          coverflowEffect={{ rotate: 25, stretch: 10, depth: 180, modifier: 1.3, slideShadows: true }}
                          onSlideChange={(s) => setActiveSlide(s.realIndex)}
                          className="max-w-3xl"
                        >
                          {tdzReleases.map((release) => (
                            <SwiperSlide key={release.id} style={{ width: 260, height: 260 }}>
                              <img
                                src={release.image}
                                alt={release.title}
                                className="w-full h-full object-cover rounded-xl cursor-pointer"
                                style={{ boxShadow: "0 0 60px rgba(0,207,255,0.15)" }}
                                onClick={() => {
                                  const isAlbum = albums.some(a => a.id === release.id);
                                  navigate(isAlbum ? `/album/${release.id}` : `/track/${release.id}`);
                                }}
                                onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-album.jpg'; }}
                              />
                            </SwiperSlide>
                          ))}
                        </Swiper>
                      </div>
                      {/* Featured info */}
                      {tdzReleases[activeSlide] && (
                        <div className="hidden lg:block w-64">
                          <p style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 42, color: "#FFFFFF", letterSpacing: "0.03em", lineHeight: 1.1 }}>
                            {tdzReleases[activeSlide].artist}
                          </p>
                          <p className="mt-2" style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 400, fontSize: 16, color: "rgba(255,255,255,0.7)" }}>
                            {tdzReleases[activeSlide].title}
                          </p>
                          <button
                            onClick={() => {
                              const t = tracks.find(tr => tr.artist_name === tdzReleases[activeSlide].artist);
                              if (t) handlePlayTrack(t);
                            }}
                            className="mt-4 px-6 py-2.5 rounded-full flex items-center gap-2 transition-all hover:scale-105"
                            style={{ background: "#FFFFFF", color: "#000", fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 13 }}
                          >
                            <Play className="w-4 h-4" fill="black" /> Play
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Moodscapes ── */}
                <div className="py-8">
                  <SectionHeader title="Moodscapes" subtitle="Find your vibe" />
                  <div className="flex items-center justify-between gap-4 overflow-x-auto pb-4 scrollbar-hide">
                    {MOODS.map((mood) => (
                      <MoodscapeCluster
                        key={mood.label}
                        label={mood.label}
                        colors={mood.colors}
                        onClick={() => setActiveTab('ai-mix')}
                      />
                    ))}
                  </div>
                </div>

                {/* ── Genre Pathways ── */}
                <div className="py-8">
                  <SectionHeader title="Genre Pathways" />
                  <div className="flex items-center gap-6 overflow-x-auto pb-4 scrollbar-hide">
                    {GENRES.map((genre) => (
                      <GenreNode
                        key={genre}
                        label={genre}
                        isSelected={selectedGenre === genre}
                        onClick={() => setSelectedGenre(selectedGenre === genre ? undefined : genre)}
                      />
                    ))}
                  </div>
                </div>

                {/* ── Artist Portals ── */}
                <div className="py-8">
                  <SectionHeader title="Artist Portals" subtitle={`${artists.length} Artists`} />
                  <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                    {artists.slice(0, 8).map((artist) => (
                      <ArtistCard
                        key={artist.user_id}
                        artist={artist}
                        isFollowing={followedArtists.has(artist.user_id)}
                        onToggleFollow={toggleFollow}
                        onClick={(a) => navigate(`/artist/${a.user_id}`)}
                      />
                    ))}
                  </div>
                </div>

                {/* ── New This Week ── */}
                <div className="py-8">
                  <SectionHeader title="New This Week" subtitle="Fresh releases from TDZ artists" />
                  <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide">
                    {genreFilteredSingles.slice(0, 10).map((track) => (
                      <AlbumCard
                        key={track.id}
                        album={{
                          ...track,
                          cover_art_path: track.album_cover_path,
                          image: track.album_cover_bucket
                            ? supabase.storage.from(track.album_cover_bucket).getPublicUrl(track.album_cover_path || '').data.publicUrl
                            : track.album_cover_path
                              ? supabase.storage.from('album-covers').getPublicUrl(track.album_cover_path).data.publicUrl
                              : null,
                        }}
                        onClick={() => navigate(`/track/${track.id}`)}
                        onPlay={() => handlePlayTrack(track)}
                      />
                    ))}
                  </div>
                </div>

                {/* ── Track list ── */}
                <div className="py-8">
                  <SectionHeader title={selectedGenre ? `${selectedGenre} Singles` : "TDZ Singles"} />
                  <SongListHeader />
                  {genreFilteredSingles.slice(0, 10).map((track, i) => (
                    <SongRow
                      key={track.id}
                      track={track}
                      index={i + 1}
                      isPlaying={currentTrack?.id === track.id}
                      isLiked={likedTracks.has(track.id)}
                      onPlay={handlePlayTrack}
                      onToggleLike={toggleLike}
                      onAddToQueue={handleAddToQueue}
                    />
                  ))}
                </div>

                {/* ── Editorial Picks ── */}
                <div className="py-8">
                  <SectionHeader title="Editorial Picks" />
                  <ErrorBoundary fallback={null}>
                    <EditorialPlaylistsSection />
                  </ErrorBoundary>
                </div>

                {/* ── Albums ── */}
                {albums.length > 0 && (
                  <div className="py-8">
                    <SectionHeader title="TDZ Albums" />
                    <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide">
                      {albums.map((album) => (
                        <AlbumCard
                          key={album.id}
                          album={{
                            ...album,
                            image: album.cover_art_path
                              ? supabase.storage.from('album-covers').getPublicUrl(album.cover_art_path).data.publicUrl
                              : null,
                          }}
                          onClick={() => navigate(`/album/${album.id}`)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Playlists */}
                <ErrorBoundary fallback={null}>
                  <div className="py-6">
                    <UserPlaylistsSection onPlaylistClick={(id) => navigate(`/playlist/${id}`)} onViewAll={() => setActiveTab('playlists')} />
                  </div>
                </ErrorBoundary>
              </div>
            </div>
          );

        case 'trending':
          return (
            <div className="space-y-0">
              <CosmicTopBar activeTab={activeTab} onTabChange={setActiveTab} searchQuery={searchQuery} onSearchChange={setSearchQuery} />
              <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-8">
                <div>
                  <h2 style={{
                    fontFamily: "'Six Caps', sans-serif", fontSize: "clamp(40px, 5vw, 56px)", letterSpacing: "0.04em", textTransform: "uppercase", lineHeight: 1,
                    background: "linear-gradient(180deg, #D0D0D0 0%, #FFFFFF 25%, #9A9A9A 55%, #404040 100%)",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  }}>EXPLORE TDZ</h2>
                  <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 300, fontSize: 16, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>
                    Stream independent artists worldwide. Every play pays.
                  </p>
                </div>

                {/* Category grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {["TRENDING NOW", "NEW RELEASES", "TOP CHARTS", "HIP-HOP", "R&B / SOUL", "ELECTRONIC", "POP", "ROCK", "LATIN"].map((cat, i) => (
                    <div
                      key={cat}
                      className="relative rounded-2xl overflow-hidden cursor-pointer transition-all hover:scale-[1.03] group"
                      style={{ height: 200, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                      onClick={() => {
                        if (cat === "TRENDING NOW") setSelectedGenre(undefined);
                        else setSelectedGenre(cat.split(" / ")[0]);
                        setActiveTab("discover");
                      }}
                    >
                      <div className="absolute inset-0" style={{
                        background: [
                          "linear-gradient(135deg, rgba(0,207,255,0.15), rgba(139,92,246,0.1))",
                          "linear-gradient(135deg, rgba(34,197,94,0.15), rgba(0,207,255,0.1))",
                          "linear-gradient(135deg, rgba(212,160,23,0.15), rgba(239,68,68,0.1))",
                          "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(59,130,246,0.1))",
                          "linear-gradient(135deg, rgba(236,72,153,0.15), rgba(139,92,246,0.1))",
                          "linear-gradient(135deg, rgba(0,207,255,0.2), rgba(34,197,94,0.1))",
                          "linear-gradient(135deg, rgba(249,115,22,0.15), rgba(234,179,8,0.1))",
                          "linear-gradient(135deg, rgba(239,68,68,0.15), rgba(249,115,22,0.1))",
                          "linear-gradient(135deg, rgba(34,197,94,0.2), rgba(234,179,8,0.1))",
                        ][i],
                      }} />
                      <div className="absolute bottom-0 left-0 right-0 p-5">
                        <span style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 28, color: "#FFFFFF", letterSpacing: "0.04em" }}>{cat}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Trending + Editorial */}
                <div className="grid lg:grid-cols-2 gap-8">
                  <div>
                    <SectionHeader title="Genre Charts" />
                    <ErrorBoundary fallback={null}><GenreTop50Section onViewAll={() => setActiveTab('library')} /></ErrorBoundary>
                  </div>
                  <div>
                    <SectionHeader title="Editorial Picks" />
                    <ErrorBoundary fallback={null}><EditorialPlaylistsSection /></ErrorBoundary>
                  </div>
                </div>

                {/* City Trending */}
                <ErrorBoundary fallback={null}>
                  <CityTrendingSection sectionNumber={0} onViewAllTrends={() => { setShowTrending(true); setActiveTab('library'); }} />
                </ErrorBoundary>
              </div>
            </div>
          );

        case 'library':
          return (
            <div className="space-y-0">
              <CosmicTopBar activeTab={activeTab} onTabChange={setActiveTab} searchQuery={searchQuery} onSearchChange={setSearchQuery} />
              <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                <SectionHeader title="Your Collection" subtitle="Global Library" />

                {/* Library filter tabs */}
                <div className="flex gap-2 flex-wrap">
                  {["PLAYLISTS", "ALBUMS", "ARTISTS", "SONGS", "DOWNLOADED", "RECENTLY ADDED"].map((tab) => (
                    <button key={tab} onClick={() => setLibraryFilter(tab)}
                      className="px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase transition-all"
                      style={{
                        fontFamily: "'Raleway', sans-serif",
                        background: libraryFilter === tab ? "rgba(0,207,255,0.15)" : "rgba(255,255,255,0.04)",
                        border: libraryFilter === tab ? "1px solid rgba(0,207,255,0.3)" : "1px solid rgba(255,255,255,0.06)",
                        color: libraryFilter === tab ? "#00CFFF" : "rgba(255,255,255,0.45)",
                        letterSpacing: "0.1em",
                      }}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Hex grid for albums */}
                {(libraryFilter === "ALBUMS" || libraryFilter === "PLAYLISTS") && albums.length > 0 && (
                  <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
                    {albums.map((album) => {
                      const coverUrl = album.cover_art_path
                        ? supabase.storage.from('album-covers').getPublicUrl(album.cover_art_path).data.publicUrl
                        : null;
                      return (
                        <div
                          key={album.id}
                          className="relative cursor-pointer transition-all hover:brightness-125 hover:scale-[1.04]"
                          style={{
                            aspectRatio: "1",
                            clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
                            background: "rgba(255,255,255,0.04)",
                            overflow: "hidden",
                          }}
                          onClick={() => navigate(`/album/${album.id}`)}
                        >
                          {coverUrl ? (
                            <img src={coverUrl} alt={album.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-album.jpg'; }} />
                          ) : (
                            <div className="w-full h-full" style={{ background: "linear-gradient(135deg, #1A1A2E, #2A2A4E)" }} />
                          )}
                          <div className="absolute left-0 right-0 text-center px-2" style={{ bottom: "22%" }}>
                            <span className="truncate block" style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 11, color: "#FFFFFF", textShadow: "0 2px 8px rgba(0,0,0,0.9)" }}>
                              {album.title}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Songs list */}
                {libraryFilter === "SONGS" && (
                  <div>
                    <SongListHeader />
                    {genreFilteredSingles.map((track, i) => (
                      <SongRow
                        key={track.id}
                        track={track}
                        index={i + 1}
                        isPlaying={currentTrack?.id === track.id}
                        isLiked={likedTracks.has(track.id)}
                        onPlay={handlePlayTrack}
                        onToggleLike={toggleLike}
                        onAddToQueue={handleAddToQueue}
                      />
                    ))}
                  </div>
                )}

                {/* Artists grid */}
                {libraryFilter === "ARTISTS" && (
                  <div className="flex gap-4 flex-wrap">
                    {artists.map((artist) => (
                      <ArtistCard
                        key={artist.user_id}
                        artist={artist}
                        isFollowing={followedArtists.has(artist.user_id)}
                        onToggleFollow={toggleFollow}
                        onClick={(a) => navigate(`/artist/${a.user_id}`)}
                      />
                    ))}
                  </div>
                )}

                {/* Main library content */}
                <div className="grid lg:grid-cols-[1fr_280px] gap-6">
                  <div>
                    <ErrorBoundary fallback={null}><SpotifyPlaylistSection /></ErrorBoundary>
                    <ErrorBoundary fallback={<div style={{ color: "rgba(255,255,255,0.5)" }}>Library unavailable</div>}>
                      <UnifiedLibrary showTrending={showTrending} onPlayYouTube={(videoId, title, artist, thumbnail) => {
                        playTrack({ id: videoId, title, artist_name: artist, source: 'youtube', youtubeId: videoId, album_cover_path: thumbnail, duration: 0, file_path: '', play_count: 0 } as any);
                        if (showTrending) setShowTrending(false);
                      }} />
                    </ErrorBoundary>
                  </div>

                  {/* Smart Library Sidebar */}
                  <div className="hidden lg:block space-y-4">
                    <h3 style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 800, fontSize: 12, color: "rgba(255,255,255,0.9)", letterSpacing: "0.18em", textTransform: "uppercase" }}>SMART LIBRARY</h3>
                    {[
                      { title: "Recommended Playlists for You", color: "#00CFFF" },
                      { title: "Albums by Your Favorite Artists", color: "#8B5CF6" },
                      { title: "New Releases from Artists You Follow", color: "#22C55E" },
                      { title: "Soundtracks of Your Journey", color: "#D4A017" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all hover:bg-white/[0.08]"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div className="w-11 h-11 rounded-lg flex-shrink-0" style={{ background: `${item.color}20` }} />
                        <span style={{ fontFamily: "'Raleway', sans-serif", fontSize: 12, color: "rgba(255,255,255,0.75)", fontWeight: 500, lineHeight: 1.4 }}>{item.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );

        case 'artists':
          return (
            <div className="space-y-0">
              <CosmicTopBar activeTab={activeTab} onTabChange={setActiveTab} searchQuery={searchQuery} onSearchChange={setSearchQuery} />
              <div className="px-4 sm:px-6 lg:px-8 py-6">
                <SectionHeader title="Artist Portals" subtitle={`${artists.length} Artists`} />
                <div className="flex gap-4 flex-wrap">
                  {artists.map((artist) => (
                    <ArtistCard
                      key={artist.user_id}
                      artist={artist}
                      isFollowing={followedArtists.has(artist.user_id)}
                      onToggleFollow={toggleFollow}
                      onClick={(a) => navigate(`/artist/${a.user_id}`)}
                    />
                  ))}
                </div>
              </div>
            </div>
          );

        case 'playlists':
          return (
            <div className="space-y-0">
              <CosmicTopBar activeTab={activeTab} onTabChange={setActiveTab} searchQuery={searchQuery} onSearchChange={setSearchQuery} />
              <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-8">
                <SectionHeader title="Your Library" subtitle="Playlists & Collections" />
                <ErrorBoundary fallback={null}>
                  <UserPlaylistsSection onPlaylistClick={(id) => navigate(`/playlist/${id}`)} />
                </ErrorBoundary>
                <ErrorBoundary fallback={null}>
                  <PlaylistManager userId={user?.id || null} onPlaylistSelect={(id) => navigate(`/playlist/${id}`)} />
                </ErrorBoundary>
              </div>
            </div>
          );

        case 'merch':
          return (
            <div className="space-y-0">
              <CosmicTopBar activeTab={activeTab} onTabChange={setActiveTab} searchQuery={searchQuery} onSearchChange={setSearchQuery} />
              <div className="px-4 sm:px-6 lg:px-8 py-6">
                <SectionHeader title="Merch Store" subtitle="Support your favorite artists" />
                <MerchStore variant="full" />
              </div>
            </div>
          );

        case 'ai-mix':
          return (
            <div className="space-y-0">
              <CosmicTopBar activeTab={activeTab} onTabChange={setActiveTab} searchQuery={searchQuery} onSearchChange={setSearchQuery} />
              <div className="px-4 sm:px-6 lg:px-8 py-6">
                <ErrorBoundary fallback={<div className="p-4">AI Mix unavailable</div>}>
                  <MoodMixGenerator />
                </ErrorBoundary>
              </div>
            </div>
          );

        default:
          return (
            <div className="px-4 sm:px-6 lg:px-8 py-6">
              <p style={{ color: "rgba(255,255,255,0.5)" }}>Select a tab</p>
            </div>
          );
      }
    } catch (error) {
      console.error('renderContent error:', error);
      return <div className="p-8">Something went wrong</div>;
    }
  };

  return (
    <PersistentLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      showSearch={showSearch}
      onToggleSearch={() => setShowSearch(!showSearch)}
    >
      {renderContent()}
    </PersistentLayout>
  );
}

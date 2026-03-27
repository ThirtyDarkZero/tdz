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
import { ChevronRight } from "lucide-react";

// Layout + nav
import { PersistentLayout } from "@/components/discovery/PersistentLayout";
import { CosmicTopBar } from "@/components/discovery/CosmicTopBar";

// Universal components
import { SongRow, SongListHeader } from "@/components/discovery/SongRow";
import { ArtistCard } from "@/components/discovery/ArtistCard";
import { AlbumCard } from "@/components/discovery/AlbumCard";
import { UniversalSearchResults } from "@/components/discovery/UniversalSearchResults";
import { ForYouCard } from "@/components/discovery/ForYouCard";

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
import { EffectCoverflow, Autoplay, Pagination } from "swiper/modules";
// @ts-ignore
import "swiper/css";
// @ts-ignore
import "swiper/css/effect-coverflow";
// @ts-ignore
import "swiper/css/pagination";

// Color tints for cards
const CARD_TINTS = [
  "rgba(0,207,255,0.18)",
  "rgba(139,92,246,0.22)",
  "rgba(236,72,153,0.18)",
  "rgba(34,197,94,0.15)",
  "rgba(249,115,22,0.18)",
  "rgba(99,102,241,0.2)",
  "rgba(234,179,8,0.15)",
  "rgba(0,207,255,0.15)",
];

// ── Section Header ──
function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between mb-5">
      <div>
        <h2 style={{
          fontFamily: "'Six Caps', sans-serif",
          fontSize: "clamp(28px, 4vw, 44px)",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          lineHeight: 1,
          background: "linear-gradient(180deg, #FFFFFF 0%, #999999 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1" style={{ fontFamily: "'Raleway', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

// ── Genre Filter Pill ──
function GenrePill({ label, isSelected, onClick }: { label: string; isSelected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 whitespace-nowrap"
      style={{
        fontFamily: "'Raleway', sans-serif",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        background: isSelected ? "rgba(0,207,255,0.12)" : "rgba(255,255,255,0.03)",
        border: isSelected ? "1px solid rgba(0,207,255,0.3)" : "1px solid rgba(255,255,255,0.06)",
        backdropFilter: "blur(8px)",
        color: isSelected ? "#00CFFF" : "rgba(255,255,255,0.45)",
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
  const {
    tracks, singles, artists, albums, playlists, likedTracks,
    followedArtists, loading, user, toggleLike, toggleFollow,
  } = useDiscoveryData();
  const { role } = useUserRole(user);
  const { hasFeature } = useSubscription(user);

  // Load user profile for avatar
  useEffect(() => {
    if (!user) return;
    const loadProfile = async () => {
      // Try artist profile first
      const { data: artistData } = await supabase
        .from("artist_profiles")
        .select("artist_name, profile_image_path")
        .eq("user_id", user.id)
        .maybeSingle();
      if (artistData?.profile_image_path) {
        setUserProfile(artistData);
        return;
      }
      // Try listener profile
      const { data: listenerData } = await supabase
        .from("listener_profiles")
        .select("display_name, profile_image_path")
        .eq("user_id", user.id)
        .maybeSingle();
      if (listenerData) setUserProfile(listenerData);
    };
    loadProfile();
  }, [user]);

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

  // Build "For You" carousel items from albums + singles with cover art
  const forYouItems = useMemo(() => {
    const items: Array<{ id: string; title: string; artist: string; image: string; type: 'album' | 'track'; tint: string; trackData?: any }> = [];

    albums.filter(a => a.cover_art_path).forEach((album, i) => {
      items.push({
        id: album.id,
        title: album.title,
        artist: album.artist_name,
        image: supabase.storage.from('album-covers').getPublicUrl(album.cover_art_path!).data.publicUrl,
        type: 'album',
        tint: CARD_TINTS[i % CARD_TINTS.length],
      });
    });

    singles.filter(t => t.album_cover_path).slice(0, 10 - items.length).forEach((track, i) => {
      const bucket = track.album_cover_bucket || 'album-covers';
      items.push({
        id: track.id,
        title: track.title,
        artist: track.artist_name,
        image: supabase.storage.from(bucket).getPublicUrl(track.album_cover_path!).data.publicUrl,
        type: 'track',
        tint: CARD_TINTS[(items.length + i) % CARD_TINTS.length],
        trackData: track,
      });
    });

    return items;
  }, [albums, singles]);

  const GENRES = ["Hip-Hop", "R&B", "Pop", "Electronic", "Rock", "Soul", "Latin", "Alternative"];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#050510" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#00CFFF", borderTopColor: "transparent" }} />
          <p style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'Raleway', sans-serif", fontSize: 13 }}>Loading...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    try {
      switch (activeTab) {
        case 'discover':
          return (
            <div className="space-y-0">
              <CosmicTopBar activeTab={activeTab} onTabChange={setActiveTab} searchQuery={searchQuery} onSearchChange={setSearchQuery} userProfile={userProfile} />

              {/* Search results overlay */}
              {searchQuery.trim() && (
                <div className="px-4 sm:px-6 relative">
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

              <div className="px-5 sm:px-6 lg:px-8">
                {/* ── For You Hero ── */}
                <div className="pt-4 pb-2">
                  <h1 style={{
                    fontFamily: "'Raleway', sans-serif",
                    fontSize: "clamp(28px, 5vw, 38px)",
                    fontWeight: 800,
                    color: "#FFFFFF",
                    lineHeight: 1.1,
                  }}>
                    For You
                  </h1>
                  <p style={{
                    fontFamily: "'Raleway', sans-serif",
                    fontSize: 14,
                    color: "rgba(255,255,255,0.45)",
                    marginTop: 4,
                  }}>
                    Your personalized music experience
                  </p>
                </div>

                {/* ── Immersive Card Carousel ── */}
                {forYouItems.length > 0 && (
                  <div className="py-4 -mx-5 sm:-mx-6 lg:-mx-8">
                    <Swiper
                      modules={[EffectCoverflow, Autoplay, Pagination]}
                      effect="coverflow"
                      grabCursor
                      centeredSlides
                      slidesPerView="auto"
                      loop={forYouItems.length > 3}
                      autoplay={{ delay: 5000, disableOnInteraction: true }}
                      coverflowEffect={{
                        rotate: 0,
                        stretch: -20,
                        depth: 120,
                        modifier: 1.5,
                        slideShadows: false,
                      }}
                      pagination={{ clickable: true }}
                      className="for-you-swiper"
                      style={{ paddingBottom: 36 }}
                    >
                      {forYouItems.map((item, i) => (
                        <SwiperSlide
                          key={item.id}
                          style={{
                            width: "clamp(200px, 55vw, 280px)",
                          }}
                        >
                          <ForYouCard
                            title={item.title}
                            artist={item.artist}
                            image={item.image}
                            colorTint={item.tint}
                            isPlaying={currentTrack?.id === item.id}
                            isLiked={item.type === 'track' ? likedTracks.has(item.id) : false}
                            onPlay={() => {
                              if (item.trackData) handlePlayTrack(item.trackData);
                              else {
                                const t = tracks.find(tr => tr.album_id === item.id || tr.artist_name === item.artist);
                                if (t) handlePlayTrack(t);
                              }
                            }}
                            onLike={() => { if (item.type === 'track') toggleLike(item.id); }}
                            onClick={() => navigate(item.type === 'album' ? `/album/${item.id}` : `/track/${item.id}`)}
                          />
                        </SwiperSlide>
                      ))}
                    </Swiper>

                    <style>{`
                      .for-you-swiper .swiper-pagination-bullet {
                        background: rgba(255,255,255,0.3);
                        opacity: 1;
                        width: 6px;
                        height: 6px;
                      }
                      .for-you-swiper .swiper-pagination-bullet-active {
                        background: #FFFFFF;
                        width: 20px;
                        border-radius: 3px;
                      }
                    `}</style>
                  </div>
                )}

                {/* Fan Impact */}
                {user && (
                  <ErrorBoundary fallback={null}>
                    <div className="py-4"><FanImpactCard userId={user.id} /></div>
                  </ErrorBoundary>
                )}

                {/* ── Genre Filters ── */}
                <div className="py-4">
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    <GenrePill label="All" isSelected={!selectedGenre} onClick={() => setSelectedGenre(undefined)} />
                    {GENRES.map((genre) => (
                      <GenrePill
                        key={genre}
                        label={genre}
                        isSelected={selectedGenre === genre}
                        onClick={() => setSelectedGenre(selectedGenre === genre ? undefined : genre)}
                      />
                    ))}
                  </div>
                </div>

                {/* ── Artist Portals ── */}
                {artists.length > 0 && (
                  <div className="py-4">
                    <SectionHeader
                      title="Artists"
                      action={
                        <button onClick={() => setActiveTab('artists')} className="flex items-center gap-1 text-xs" style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'Raleway', sans-serif", fontWeight: 600 }}>
                          See all <ChevronRight className="w-3 h-3" />
                        </button>
                      }
                    />
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
                )}

                {/* ── New This Week ── */}
                <div className="py-4">
                  <SectionHeader title="New This Week" subtitle="Fresh releases" />
                  <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                    {genreFilteredSingles.slice(0, 10).map((track) => {
                      const coverUrl = track.album_cover_path
                        ? supabase.storage.from(track.album_cover_bucket || 'album-covers').getPublicUrl(track.album_cover_path).data.publicUrl
                        : null;
                      return (
                        <AlbumCard
                          key={track.id}
                          size="sm"
                          album={{ ...track, cover_art_path: track.album_cover_path, image: coverUrl }}
                          onClick={() => navigate(`/track/${track.id}`)}
                          onPlay={() => handlePlayTrack(track)}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* ── Track List ── */}
                <div className="py-4">
                  <SectionHeader title={selectedGenre ? `${selectedGenre}` : "TDZ Singles"} />
                  <div
                    className="rounded-2xl overflow-hidden"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      backdropFilter: "blur(16px)",
                      border: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <div className="p-2">
                      <SongListHeader />
                      {genreFilteredSingles.slice(0, 12).map((track, i) => (
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
                  </div>
                </div>

                {/* ── Editorial Picks ── */}
                <div className="py-4">
                  <SectionHeader title="Editorial Picks" />
                  <ErrorBoundary fallback={null}>
                    <EditorialPlaylistsSection />
                  </ErrorBoundary>
                </div>

                {/* ── Albums ── */}
                {albums.length > 0 && (
                  <div className="py-4">
                    <SectionHeader title="Albums" />
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
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
                  <div className="py-4">
                    <UserPlaylistsSection onPlaylistClick={(id) => navigate(`/playlist/${id}`)} onViewAll={() => setActiveTab('playlists')} />
                  </div>
                </ErrorBoundary>
              </div>
            </div>
          );

        case 'trending':
          return (
            <div className="space-y-0">
              <CosmicTopBar activeTab={activeTab} onTabChange={setActiveTab} searchQuery={searchQuery} onSearchChange={setSearchQuery} userProfile={userProfile} />
              <div className="px-5 sm:px-6 lg:px-8 py-6 space-y-6">
                <div>
                  <h2 style={{
                    fontFamily: "'Six Caps', sans-serif", fontSize: "clamp(40px, 5vw, 56px)",
                    letterSpacing: "0.04em", textTransform: "uppercase", lineHeight: 1,
                    background: "linear-gradient(180deg, #FFFFFF 0%, #888888 100%)",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  }}>EXPLORE</h2>
                  <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 300, fontSize: 14, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
                    Stream independent artists worldwide
                  </p>
                </div>

                {/* Category grid - Glassmorphic */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {["TRENDING", "NEW RELEASES", "TOP CHARTS", "HIP-HOP", "R&B", "ELECTRONIC", "POP", "ROCK", "LATIN"].map((cat, i) => (
                    <div
                      key={cat}
                      className="relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.03] group"
                      style={{
                        height: 120,
                        background: "rgba(255,255,255,0.03)",
                        backdropFilter: "blur(16px)",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                      onClick={() => {
                        if (cat === "TRENDING") setSelectedGenre(undefined);
                        else setSelectedGenre(cat.split(" / ")[0]);
                        setActiveTab("discover");
                      }}
                    >
                      <div className="absolute inset-0" style={{
                        background: [
                          "linear-gradient(135deg, rgba(0,207,255,0.08), rgba(139,92,246,0.06))",
                          "linear-gradient(135deg, rgba(34,197,94,0.08), rgba(0,207,255,0.06))",
                          "linear-gradient(135deg, rgba(212,160,23,0.08), rgba(239,68,68,0.06))",
                          "linear-gradient(135deg, rgba(139,92,246,0.1), rgba(59,130,246,0.06))",
                          "linear-gradient(135deg, rgba(236,72,153,0.08), rgba(139,92,246,0.06))",
                          "linear-gradient(135deg, rgba(0,207,255,0.1), rgba(34,197,94,0.06))",
                          "linear-gradient(135deg, rgba(249,115,22,0.08), rgba(234,179,8,0.06))",
                          "linear-gradient(135deg, rgba(239,68,68,0.08), rgba(249,115,22,0.06))",
                          "linear-gradient(135deg, rgba(34,197,94,0.1), rgba(234,179,8,0.06))",
                        ][i],
                      }} />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <span style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 22, color: "#FFFFFF", letterSpacing: "0.04em" }}>{cat}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <ErrorBoundary fallback={null}><GenreTop50Section onViewAll={() => setActiveTab('library')} /></ErrorBoundary>
                <ErrorBoundary fallback={null}>
                  <CityTrendingSection sectionNumber={0} onViewAllTrends={() => { setShowTrending(true); setActiveTab('library'); }} />
                </ErrorBoundary>
                <div>
                  <SectionHeader title="Editorial" />
                  <ErrorBoundary fallback={null}><EditorialPlaylistsSection /></ErrorBoundary>
                </div>
              </div>
            </div>
          );

        case 'library':
          return (
            <div className="space-y-0">
              <CosmicTopBar activeTab={activeTab} onTabChange={setActiveTab} searchQuery={searchQuery} onSearchChange={setSearchQuery} userProfile={userProfile} />
              <div className="px-5 sm:px-6 lg:px-8 py-6 space-y-5">
                <SectionHeader title="Your Collection" subtitle="Library" />

                <div className="flex gap-2 flex-wrap">
                  {["PLAYLISTS", "ALBUMS", "ARTISTS", "SONGS"].map((tab) => (
                    <GenrePill key={tab} label={tab} isSelected={libraryFilter === tab} onClick={() => setLibraryFilter(tab)} />
                  ))}
                </div>

                {(libraryFilter === "ALBUMS" || libraryFilter === "PLAYLISTS") && albums.length > 0 && (
                  <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}>
                    {albums.map((album) => (
                      <AlbumCard
                        key={album.id} size="sm"
                        album={{ ...album, image: album.cover_art_path ? supabase.storage.from('album-covers').getPublicUrl(album.cover_art_path).data.publicUrl : null }}
                        onClick={() => navigate(`/album/${album.id}`)}
                      />
                    ))}
                  </div>
                )}

                {libraryFilter === "SONGS" && (
                  <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div className="p-2">
                      <SongListHeader />
                      {genreFilteredSingles.map((track, i) => (
                        <SongRow key={track.id} track={track} index={i + 1} isPlaying={currentTrack?.id === track.id} isLiked={likedTracks.has(track.id)} onPlay={handlePlayTrack} onToggleLike={toggleLike} onAddToQueue={handleAddToQueue} />
                      ))}
                    </div>
                  </div>
                )}

                {libraryFilter === "ARTISTS" && (
                  <div className="flex gap-4 flex-wrap">
                    {artists.map((artist) => (
                      <ArtistCard key={artist.user_id} artist={artist} isFollowing={followedArtists.has(artist.user_id)} onToggleFollow={toggleFollow} onClick={(a) => navigate(`/artist/${a.user_id}`)} />
                    ))}
                  </div>
                )}

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
                  <div className="hidden lg:block space-y-3">
                    <h3 style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 800, fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: "0.15em", textTransform: "uppercase" }}>SMART LIBRARY</h3>
                    {[
                      { title: "Recommended for You", color: "#00CFFF" },
                      { title: "Your Favorite Artists", color: "#8B5CF6" },
                      { title: "New from Following", color: "#22C55E" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all hover:bg-white/[0.06]"
                        style={{ background: "rgba(255,255,255,0.02)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.04)" }}>
                        <div className="w-9 h-9 rounded-lg flex-shrink-0" style={{ background: `${item.color}15`, border: `1px solid ${item.color}20` }} />
                        <span style={{ fontFamily: "'Raleway', sans-serif", fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>{item.title}</span>
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
              <CosmicTopBar activeTab={activeTab} onTabChange={setActiveTab} searchQuery={searchQuery} onSearchChange={setSearchQuery} userProfile={userProfile} />
              <div className="px-5 sm:px-6 lg:px-8 py-6">
                <SectionHeader title="Artists" subtitle={`${artists.length} Artists`} />
                <div className="flex gap-4 flex-wrap">
                  {artists.map((artist) => (
                    <ArtistCard key={artist.user_id} artist={artist} isFollowing={followedArtists.has(artist.user_id)} onToggleFollow={toggleFollow} onClick={(a) => navigate(`/artist/${a.user_id}`)} />
                  ))}
                </div>
              </div>
            </div>
          );

        case 'playlists':
          return (
            <div className="space-y-0">
              <CosmicTopBar activeTab={activeTab} onTabChange={setActiveTab} searchQuery={searchQuery} onSearchChange={setSearchQuery} userProfile={userProfile} />
              <div className="px-5 sm:px-6 lg:px-8 py-6 space-y-8">
                <SectionHeader title="Playlists" subtitle="Your collections" />
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
              <CosmicTopBar activeTab={activeTab} onTabChange={setActiveTab} searchQuery={searchQuery} onSearchChange={setSearchQuery} userProfile={userProfile} />
              <div className="px-5 sm:px-6 lg:px-8 py-6">
                <SectionHeader title="Merch" subtitle="Support artists" />
                <MerchStore variant="full" />
              </div>
            </div>
          );

        case 'ai-mix':
          return (
            <div className="space-y-0">
              <CosmicTopBar activeTab={activeTab} onTabChange={setActiveTab} searchQuery={searchQuery} onSearchChange={setSearchQuery} userProfile={userProfile} />
              <div className="px-5 sm:px-6 lg:px-8 py-6">
                <ErrorBoundary fallback={<div className="p-4">AI Mix unavailable</div>}>
                  <MoodMixGenerator />
                </ErrorBoundary>
              </div>
            </div>
          );

        default:
          return (
            <div className="px-5 py-6">
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

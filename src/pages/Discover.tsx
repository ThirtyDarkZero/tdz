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
import { ChevronRight, Play, Radio, Zap, Flame, Heart, Music, Headphones } from "lucide-react";

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

// ── Loopster-style Section Header ──
function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between mb-4">
      <div>
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        {subtitle && (
          <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}

// ── Genre Card (Loopster-style colorful) ──
const GENRE_COLORS: Record<string, string> = {
  "Hip-Hop": "hsl(270 80% 55%)",
  "R&B": "hsl(340 80% 55%)",
  "Pop": "hsl(140 70% 45%)",
  "Electronic": "hsl(200 90% 50%)",
  "Rock": "hsl(0 75% 55%)",
  "Soul": "hsl(30 85% 55%)",
  "Latin": "hsl(45 90% 50%)",
  "Alternative": "hsl(280 60% 50%)",
};

function GenreCard({ genre, onClick }: { genre: string; onClick: () => void }) {
  const color = GENRE_COLORS[genre] || "hsl(200 70% 50%)";
  return (
    <button
      onClick={onClick}
      className="relative overflow-hidden rounded-2xl transition-transform hover:scale-[1.03] active:scale-[0.98]"
      style={{
        background: color,
        height: 100,
        minWidth: 140,
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      <div className="absolute bottom-3 left-3">
        <span className="text-sm font-bold text-white">{genre}</span>
      </div>
      {/* Decorative music icon */}
      <Music className="absolute top-3 right-3 h-8 w-8 text-white/20" />
    </button>
  );
}

// ── Mood Pill ──
const MOODS = [
  { label: "Party", icon: Zap, color: "hsl(340 80% 55%)" },
  { label: "Calm", icon: Headphones, color: "hsl(200 80% 50%)" },
  { label: "Focus", icon: Radio, color: "hsl(270 70% 55%)" },
  { label: "Workout", icon: Flame, color: "hsl(20 90% 55%)" },
  { label: "Romance", icon: Heart, color: "hsl(350 80% 60%)" },
];

// ── Filter Pill ──
function FilterPill({ label, isSelected, onClick }: { label: string; isSelected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap"
      style={{
        background: isSelected ? "hsl(var(--primary))" : "rgba(255,255,255,0.05)",
        color: isSelected ? "hsl(var(--primary-foreground))" : "rgba(255,255,255,0.5)",
        border: isSelected ? "none" : "1px solid rgba(255,255,255,0.08)",
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

  useEffect(() => {
    if (!user) return;
    const loadProfile = async () => {
      const { data: artistData } = await supabase
        .from("artist_profiles")
        .select("artist_name, profile_image_path")
        .eq("user_id", user.id)
        .maybeSingle();
      if (artistData?.profile_image_path) {
        setUserProfile(artistData);
        return;
      }
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

  const forYouItems = useMemo(() => {
    const items: Array<{ id: string; title: string; artist: string; image: string; type: 'album' | 'track'; tint: string; trackData?: any }> = [];
    albums.filter(a => a.cover_art_path).forEach((album, i) => {
      items.push({
        id: album.id, title: album.title, artist: album.artist_name,
        image: supabase.storage.from('album-covers').getPublicUrl(album.cover_art_path!).data.publicUrl,
        type: 'album', tint: `rgba(255,99,71,${0.1 + (i % 3) * 0.05})`,
      });
    });
    singles.filter(t => t.album_cover_path).slice(0, 10 - items.length).forEach((track, i) => {
      const bucket = track.album_cover_bucket || 'album-covers';
      items.push({
        id: track.id, title: track.title, artist: track.artist_name,
        image: supabase.storage.from(bucket).getPublicUrl(track.album_cover_path!).data.publicUrl,
        type: 'track', tint: `rgba(255,99,71,${0.1 + (i % 3) * 0.05})`, trackData: track,
      });
    });
    return items;
  }, [albums, singles]);

  const GENRES = ["Hip-Hop", "R&B", "Pop", "Electronic", "Rock", "Soul", "Latin", "Alternative"];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#121212" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
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

              {searchQuery.trim() && (
                <div className="px-4 sm:px-6 relative">
                  <UniversalSearchResults
                    query={searchQuery} tracks={singles} artists={artists} albums={albums}
                    currentTrackId={currentTrack?.id} likedTracks={Array.from(likedTracks)}
                    followedArtists={followedArtists} onPlayTrack={handlePlayTrack}
                    onToggleLike={toggleLike} onToggleFollow={toggleFollow}
                    onArtistClick={(a) => navigate(`/artist/${a.user_id}`)}
                    onAlbumClick={(a) => navigate(`/album/${a.id}`)}
                    onClose={() => setSearchQuery("")}
                  />
                </div>
              )}

              <div className="px-5 sm:px-6 lg:px-8">
                {/* ── Especially for You ── */}
                <div className="pt-5 pb-3">
                  <SectionHeader title="Especially for you" subtitle="We have collected new popular tracks that you should like" />

                  {/* Playlist of the Week hero card */}
                  {forYouItems.length > 0 && (
                    <div
                      className="relative rounded-2xl overflow-hidden mb-6 cursor-pointer transition-transform hover:scale-[1.01]"
                      style={{ height: 180, background: "hsl(var(--primary))" }}
                      onClick={() => {
                        if (forYouItems[0].trackData) handlePlayTrack(forYouItems[0].trackData);
                        else navigate(forYouItems[0].type === 'album' ? `/album/${forYouItems[0].id}` : `/track/${forYouItems[0].id}`);
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary to-primary/80" />
                      {/* Waveform decoration */}
                      <div className="absolute right-0 top-0 bottom-0 w-1/2 flex items-center justify-center opacity-20">
                        {Array.from({ length: 30 }).map((_, i) => (
                          <div
                            key={i}
                            className="mx-[1px] rounded-full bg-white"
                            style={{
                              width: 3,
                              height: `${20 + Math.sin(i * 0.5) * 40 + Math.random() * 30}%`,
                            }}
                          />
                        ))}
                      </div>
                      <div className="relative z-10 h-full flex flex-col justify-between p-5">
                        <div>
                          <p className="text-xs font-medium text-white/70 mb-1">Playlist of the Week</p>
                          <p className="text-lg font-bold text-white">{forYouItems[0]?.title || "Top Picks"}</p>
                          <p className="text-xs text-white/60 mt-1">{forYouItems.length} tracks</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-primary shadow-lg">
                            <Play className="h-5 w-5 ml-0.5" fill="currentColor" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Moods Radio ── */}
                <div className="py-4">
                  <SectionHeader title="Moods Radio" subtitle="Stream songs based on your preferences" />
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {MOODS.map((mood) => (
                      <button
                        key={mood.label}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap transition-all hover:scale-[1.03] active:scale-[0.97]"
                        style={{
                          background: `${mood.color}15`,
                          border: `1px solid ${mood.color}30`,
                        }}
                        onClick={() => {
                          setSelectedGenre(mood.label);
                          toast.success(`${mood.label} mode activated`);
                        }}
                      >
                        <mood.icon className="h-4 w-4" style={{ color: mood.color }} />
                        <span className="text-xs font-medium" style={{ color: mood.color }}>{mood.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── For You Carousel ── */}
                {forYouItems.length > 1 && (
                  <div className="py-4">
                    <SectionHeader
                      title="New Releases"
                      action={
                        <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                          See all <ChevronRight className="w-3 h-3" />
                        </button>
                      }
                    />
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                      {forYouItems.slice(0, 10).map((item) => (
                        <div
                          key={item.id}
                          className="flex-shrink-0 cursor-pointer group"
                          style={{ width: 140 }}
                          onClick={() => navigate(item.type === 'album' ? `/album/${item.id}` : `/track/${item.id}`)}
                        >
                          <div className="relative aspect-square rounded-xl overflow-hidden mb-2">
                            <img src={item.image} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                              <Play className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="currentColor" />
                            </div>
                          </div>
                          <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{item.artist}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fan Impact */}
                {user && (
                  <ErrorBoundary fallback={null}>
                    <div className="py-4"><FanImpactCard userId={user.id} /></div>
                  </ErrorBoundary>
                )}

                {/* ── Artists ── */}
                {artists.length > 0 && (
                  <div className="py-4">
                    <SectionHeader
                      title="Artists"
                      action={
                        <button onClick={() => setActiveTab('artists')} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                          See all <ChevronRight className="w-3 h-3" />
                        </button>
                      }
                    />
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                      {artists.slice(0, 8).map((artist) => (
                        <ArtistCard
                          key={artist.user_id} artist={artist}
                          isFollowing={followedArtists.has(artist.user_id)}
                          onToggleFollow={toggleFollow}
                          onClick={(a) => navigate(`/artist/${a.user_id}`)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Popular Tracks ── */}
                <div className="py-4">
                  <SectionHeader title={selectedGenre ? selectedGenre : "Popular Tracks"} />
                  <div
                    className="rounded-2xl overflow-hidden"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <div className="p-2">
                      <SongListHeader />
                      {genreFilteredSingles.slice(0, 10).map((track, i) => (
                        <SongRow
                          key={track.id} track={track} index={i + 1}
                          isPlaying={currentTrack?.id === track.id}
                          isLiked={likedTracks.has(track.id)}
                          onPlay={handlePlayTrack} onToggleLike={toggleLike}
                          onAddToQueue={handleAddToQueue}
                        />
                      ))}
                    </div>
                  </div>
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
                {/* Search bar */}
                <div className="relative">
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="What do you want to listen to?"
                    className="w-full h-12 pl-11 pr-4 rounded-xl bg-white/5 border border-white/8 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/40 transition-colors"
                  />
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                  </div>
                </div>

                {/* Genre Grid (Loopster-style colorful cards) */}
                <div>
                  <SectionHeader title="Genres" />
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {GENRES.map((genre) => (
                      <GenreCard
                        key={genre}
                        genre={genre}
                        onClick={() => {
                          setSelectedGenre(genre);
                          setActiveTab("discover");
                        }}
                      />
                    ))}
                  </div>
                </div>

                <ErrorBoundary fallback={null}><GenreTop50Section onViewAll={() => setActiveTab('library')} /></ErrorBoundary>
                <ErrorBoundary fallback={null}>
                  <CityTrendingSection sectionNumber={0} onViewAllTrends={() => { setShowTrending(true); setActiveTab('library'); }} />
                </ErrorBoundary>
              </div>
            </div>
          );

        case 'library':
          return (
            <div className="space-y-0">
              <CosmicTopBar activeTab={activeTab} onTabChange={setActiveTab} searchQuery={searchQuery} onSearchChange={setSearchQuery} userProfile={userProfile} />
              <div className="px-5 sm:px-6 lg:px-8 py-6 space-y-5">
                {/* Loopster-style Library cards */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div
                    className="relative rounded-2xl overflow-hidden cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
                    style={{ height: 100, background: "hsl(270 80% 55%)" }}
                    onClick={() => setLibraryFilter("SONGS")}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/20" />
                    <div className="relative z-10 p-4 h-full flex flex-col justify-between">
                      <Heart className="h-5 w-5 text-white/80" />
                      <div>
                        <p className="text-sm font-bold text-white">Favorite Tracks</p>
                        <p className="text-[10px] text-white/60">{genreFilteredSingles.length} tracks</p>
                      </div>
                    </div>
                  </div>
                  <div
                    className="relative rounded-2xl overflow-hidden cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
                    style={{ height: 100, background: "hsl(200 80% 50%)" }}
                    onClick={() => setLibraryFilter("ALBUMS")}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/20" />
                    <div className="relative z-10 p-4 h-full flex flex-col justify-between">
                      <Music className="h-5 w-5 text-white/80" />
                      <div>
                        <p className="text-sm font-bold text-white">Downloads</p>
                        <p className="text-[10px] text-white/60">{albums.length} albums</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Filter tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {["PLAYLISTS", "ALBUMS", "ARTISTS", "SONGS"].map((tab) => (
                    <FilterPill key={tab} label={tab.charAt(0) + tab.slice(1).toLowerCase()} isSelected={libraryFilter === tab} onClick={() => setLibraryFilter(tab)} />
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
                  <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
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
                    <ErrorBoundary fallback={<div className="text-muted-foreground">Library unavailable</div>}>
                      <UnifiedLibrary showTrending={showTrending} onPlayYouTube={(videoId, title, artist, thumbnail) => {
                        playTrack({ id: videoId, title, artist_name: artist, source: 'youtube', youtubeId: videoId, album_cover_path: thumbnail, duration: 0, file_path: '', play_count: 0 } as any);
                        if (showTrending) setShowTrending(false);
                      }} />
                    </ErrorBoundary>
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
              <p className="text-muted-foreground">Select a tab</p>
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

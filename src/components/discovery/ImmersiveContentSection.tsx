import { memo } from "react";
import { ArtistPortal } from "@/components/discovery/ArtistPortal";
import { AlbumCard } from "@/components/discovery/AlbumCard";
import { supabase } from "@/integrations/supabase/client";
import { useScalePop, useStaggerEmerge, ScrollReveal } from "@/hooks/useScrollAnimations";

interface ImmersiveContentSectionProps {
  artists: any[];
  albums: any[];
  onArtistClick: (artist: any) => void;
  onAlbumClick: (album: any) => void;
}

export const ImmersiveContentSection = memo(function ImmersiveContentSection({
  artists,
  albums,
  onArtistClick,
  onAlbumClick,
}: ImmersiveContentSectionProps) {
  const artistStagger = useStaggerEmerge(Math.min(artists.length, 12), 60);
  const albumStagger = useStaggerEmerge(Math.min(albums.length, 10), 70);

  return (
    <>
      {/* Artists Section */}
      {artists.length > 0 && (
        <section className="relative w-full min-h-[50vh] flex items-center py-16">
          <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal effect="emerge-left" className="mb-8">
              <h2
                className="font-display"
                style={{ fontSize: "clamp(40px, 8vw, 72px)", color: "var(--text-1)", lineHeight: 0.9 }}
              >
                FEATURED ARTISTS
              </h2>
              <div className="mt-4 w-20 h-0.5 rounded-full" style={{ background: "#8B5CF6" }} />
            </ScrollReveal>

            {/* Artist grid with stagger emerge */}
            <div ref={artistStagger.containerRef} className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-6 sm:gap-8">
              {artists.slice(0, 12).map((a, i) => (
                <div
                  key={a.user_id}
                  className="flex flex-col items-center gap-3 group cursor-pointer"
                  onClick={() => onArtistClick(a)}
                  style={artistStagger.getItemStyle(i)}
                >
                  {/* Circular glow portrait */}
                  <div className="relative">
                    <div
                      className="absolute inset-[-12px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{
                        background: "radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)",
                        filter: "blur(12px)",
                      }}
                    />
                    <ArtistPortal artist={a} size={80} onClick={onArtistClick} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Albums Section */}
      {albums.length > 0 && (
        <section className="relative w-full min-h-[50vh] flex items-center py-16">
          <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal effect="emerge-right" className="mb-8">
              <h2
                className="font-display"
                style={{ fontSize: "clamp(40px, 8vw, 72px)", color: "var(--text-1)", lineHeight: 0.9 }}
              >
                ALBUMS
              </h2>
              <div className="mt-4 w-20 h-0.5 rounded-full" style={{ background: "#22C55E" }} />
            </ScrollReveal>

            <div ref={albumStagger.containerRef} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
              {albums.map((album, i) => {
                const coverUrl = album.cover_art_path
                  ? supabase.storage.from("album-covers").getPublicUrl(album.cover_art_path).data.publicUrl
                  : null;

                return (
                  <div
                    key={album.id}
                    className="group cursor-pointer"
                    onClick={() => onAlbumClick(album)}
                    style={albumStagger.getItemStyle(i)}
                  >
                    <div className="relative">
                      {/* Circular glow behind artwork */}
                      <div
                        className="absolute inset-[-10%] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                        style={{
                          background: "radial-gradient(circle, rgba(0,207,255,0.2) 0%, transparent 65%)",
                          filter: "blur(20px)",
                        }}
                      />
                      <div
                        className="relative aspect-square overflow-hidden transition-transform duration-300 group-hover:scale-[1.03]"
                        style={{ borderRadius: "var(--radius-md)", background: "var(--glass-1)" }}
                      >
                        {coverUrl ? (
                          <img src={coverUrl} alt={album.title} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(var(--primary)/0.12), hsl(var(--secondary)/0.12))" }}>
                            <span style={{ fontSize: 32, opacity: 0.2 }}>🎵</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-2.5 px-0.5">
                      <p className="font-body truncate" style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>
                        {album.title}
                      </p>
                      <p className="font-body truncate" style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
                        {album.artist_name}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </>
  );
});
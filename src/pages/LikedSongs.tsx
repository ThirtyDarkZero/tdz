import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { LikedSongsPlaylist } from "@/components/discovery/LikedSongsPlaylist";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function LikedSongs() {
  const navigate = useNavigate();
  const canonical =
    typeof window !== "undefined"
      ? `${window.location.origin}/liked-songs`
      : "/liked-songs";

  return (
    <>
      <Helmet>
        <title>Liked Songs | TDZ</title>
        <meta
          name="description"
          content="Listen to your liked songs on TDZ and keep your favorite tracks in one place."
        />
        <link rel="canonical" href={canonical} />
      </Helmet>

      <main className="min-h-screen bg-background text-foreground">
        {/* Back button header */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50 px-4 py-3">
          <div className="flex items-center gap-3 max-w-screen-sm mx-auto sm:max-w-none">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="h-9 w-9 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-semibold text-lg">Liked Songs</h1>
          </div>
        </header>
        
        <section className="px-4 sm:px-6 lg:px-8 py-6 max-w-screen-sm mx-auto sm:max-w-none">
          <LikedSongsPlaylist />
        </section>
      </main>
    </>
  );
}

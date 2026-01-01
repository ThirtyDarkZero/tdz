import { Helmet } from "react-helmet";
import { LikedSongsPlaylist } from "@/components/discovery/LikedSongsPlaylist";

export default function LikedSongs() {
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
        <section className="px-4 sm:px-6 lg:px-8 py-6">
          <LikedSongsPlaylist />
        </section>
      </main>
    </>
  );
}

import { useParams, useNavigate } from "react-router-dom";
import { GlobalAlbumDetail } from "@/components/discovery/GlobalAlbumDetail";

export default function GlobalAlbumPage() {
  const { albumId } = useParams<{ albumId: string }>();
  const navigate = useNavigate();

  if (!albumId) {
    navigate("/discover");
    return null;
  }

  return (
    <GlobalAlbumDetail
      album={{
        id: albumId,
        title: decodeURIComponent(albumId),
        artist: "",
        source: "youtube",
      }}
      onClose={() => navigate(-1)}
      onOpenArtist={() => {}}
    />
  );
}

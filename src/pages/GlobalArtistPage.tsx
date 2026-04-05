import { useParams, useNavigate } from "react-router-dom";
import { GlobalArtistProfile } from "@/components/discovery/GlobalArtistProfile";

export default function GlobalArtistPage() {
  const { artistName } = useParams<{ artistName: string }>();
  const navigate = useNavigate();

  if (!artistName) {
    navigate("/discover");
    return null;
  }

  const decodedName = decodeURIComponent(artistName);

  return (
    <GlobalArtistProfile
      artistName={decodedName}
      source="allmusic"
      onClose={() => navigate(-1)}
    />
  );
}

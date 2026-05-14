import { Helmet } from "react-helmet-async";

interface SeoProps {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article" | "profile";
  image?: string;
  noindex?: boolean;
}

const SITE = "https://www.thirtydarkzero.net";
const DEFAULT_IMAGE =
  "https://storage.googleapis.com/gpt-engineer-file-uploads/zHrCGGBhAzdZf6LjgBj7SheFL0T2/social-images/social-1762213016432-TDZDIAMONDLOGO.png";

/**
 * Per-route SEO helper. Sets unique title, description, canonical, and og:* tags.
 * Title kept under ~60 chars, description 50-160 chars by convention.
 */
export function Seo({
  title,
  description,
  path,
  type = "website",
  image = DEFAULT_IMAGE,
  noindex = false,
}: SeoProps) {
  const url = `${SITE}${path}`;
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={image} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
}

export default Seo;

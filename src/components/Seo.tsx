import { useEffect } from "react";

interface SeoProps {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article" | "profile";
  image?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

const SITE = "https://www.thirtydarkzero.net";
const DEFAULT_IMAGE =
  "https://storage.googleapis.com/gpt-engineer-file-uploads/zHrCGGBhAzdZf6LjgBj7SheFL0T2/social-images/social-1762213016432-TDZDIAMONDLOGO.png";

function setMeta(selector: string, attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

/**
 * Per-route SEO helper. Sets unique title, description, canonical, and og:* tags
 * directly on the document head. Also renders a <main> landmark wrapping route
 * children so screen-reader users can skip to main content.
 */
export function Seo({
  title,
  description,
  path,
  type = "website",
  image = DEFAULT_IMAGE,
  noindex = false,
  jsonLd,
  children,
}: SeoProps & { children?: React.ReactNode }) {
  const url = `${SITE}${path}`;
  const jsonLdString = jsonLd ? JSON.stringify(jsonLd) : "";
  useEffect(() => {
    document.title = title;
    setMeta(`meta[name="description"]`, "name", "description", description);
    setLink("canonical", url);

    setMeta(`meta[name="robots"]`, "name", "robots", noindex ? "noindex, nofollow" : "index, follow");
    setMeta(`meta[property="og:title"]`, "property", "og:title", title);
    setMeta(`meta[property="og:description"]`, "property", "og:description", description);
    setMeta(`meta[property="og:url"]`, "property", "og:url", url);
    setMeta(`meta[property="og:type"]`, "property", "og:type", type);
    setMeta(`meta[property="og:image"]`, "property", "og:image", image);
    setMeta(`meta[name="twitter:title"]`, "name", "twitter:title", title);
    setMeta(`meta[name="twitter:description"]`, "name", "twitter:description", description);
    setMeta(`meta[name="twitter:image"]`, "name", "twitter:image", image);

    const ID = "seo-route-jsonld";
    let script = document.head.querySelector<HTMLScriptElement>(`script#${ID}`);
    if (jsonLdString) {
      if (!script) {
        script = document.createElement("script");
        script.type = "application/ld+json";
        script.id = ID;
        document.head.appendChild(script);
      }
      script.textContent = jsonLdString;
    } else if (script) {
      script.remove();
    }
  }, [title, description, url, type, image, noindex, jsonLdString]);

  if (children !== undefined) {
    return <main>{children}</main>;
  }
  return null;
}

export default Seo;

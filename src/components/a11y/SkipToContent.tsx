/**
 * Skip-to-content link.
 * Visually hidden until focused, then appears as a high-contrast HUD pill.
 * Lets keyboard / screen-reader users jump past the header nav straight into
 * the page's <main> landmark.
 */
export function SkipToContent({ targetId = "main-content" }: { targetId?: string }) {
  return (
    <a
      href={`#${targetId}`}
      className="skip-to-content"
      onClick={(e) => {
        e.preventDefault();
        const el = document.getElementById(targetId);
        if (el) {
          el.setAttribute("tabindex", "-1");
          el.focus({ preventScroll: false });
          el.scrollIntoView({ block: "start" });
        }
      }}
    >
      Skip to main content
    </a>
  );
}

export default SkipToContent;

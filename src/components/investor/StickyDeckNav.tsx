import { JargonToggle } from "./JargonContext";

const ANCHORS = [
  { id: "traction", label: "Traction" },
  { id: "market", label: "Market" },
  { id: "show", label: "The Show" },
  { id: "ask", label: "The Ask" },
];

export function StickyDeckNav() {
  return (
    <div className="sticky top-0 z-40 backdrop-blur-xl bg-black/70 border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto">
          {ANCHORS.map((a) => (
            <a
              key={a.id}
              href={`#${a.id}`}
              className="px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider text-white/70 hover:text-white hover:bg-white/10 transition-all whitespace-nowrap"
              style={{ fontFamily: "'Raleway', sans-serif", letterSpacing: "0.18em" }}
            >
              {a.label}
            </a>
          ))}
        </nav>
        <JargonToggle />
      </div>
    </div>
  );
}

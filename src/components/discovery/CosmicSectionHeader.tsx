interface CosmicSectionHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function CosmicSectionHeader({ title, subtitle, className = "" }: CosmicSectionHeaderProps) {
  return (
    <div className={`text-center py-8 ${className}`}>
      <h2
        style={{
          fontFamily: "'Six Caps', sans-serif",
          fontSize: "clamp(32px, 5vw, 56px)",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "#fff",
          textShadow: "0 0 30px rgba(139,92,246,0.25)",
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <div className="flex items-center justify-center gap-3 mt-2">
          <div className="h-px w-12" style={{ background: "linear-gradient(to right, transparent, rgba(0,207,255,0.3))" }} />
          <p
            style={{
              fontFamily: "'Raleway', sans-serif",
              fontSize: 12,
              color: "#888",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              fontWeight: 500,
            }}
          >
            {subtitle}
          </p>
          <div className="h-px w-12" style={{ background: "linear-gradient(to left, transparent, rgba(0,207,255,0.3))" }} />
        </div>
      )}
    </div>
  );
}

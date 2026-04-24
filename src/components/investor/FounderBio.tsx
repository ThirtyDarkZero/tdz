import robHayes from "@/assets/rob-hayes.jpeg";

export function FounderBio() {
  return (
    <section id="founder" className="py-20 px-4 md:px-6 scroll-mt-20">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <span style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, color: "#D4A017", letterSpacing: "0.3em", textTransform: "uppercase", fontWeight: 700 }}>
            Founder & CEO
          </span>
          <h2
            className="mt-3"
            style={{
              fontFamily: "'Six Caps', sans-serif",
              fontSize: "clamp(40px, 6vw, 80px)",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              lineHeight: 1,
              color: "#FFFFFF",
            }}
          >
            Built By A Tour Veteran
          </h2>
        </div>

        <div className="grid md:grid-cols-[280px_1fr] gap-10 items-start rounded-2xl border border-[#D4A017]/20 p-8 md:p-12" style={{ background: "linear-gradient(180deg, #0F0E08 0%, #050505 100%)" }}>
          {/* Portrait */}
          <div className="mx-auto md:mx-0">
            <div
              className="relative w-[240px] h-[240px] md:w-[280px] md:h-[280px] rounded-2xl overflow-hidden"
              style={{ border: "1px solid rgba(212,160,23,0.35)", boxShadow: "0 20px 60px rgba(212,160,23,0.15), 0 0 80px rgba(212,160,23,0.08)" }}
            >
              <img src={robHayes} alt="Rob Hayes — Founder & CEO" className="w-full h-full object-cover" />
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: "linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.6) 100%)" }}
              />
              <div className="absolute bottom-3 left-4 right-4">
                <div style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 24, color: "#FFF", letterSpacing: "0.06em", lineHeight: 1 }}>Rob Hayes</div>
                <div style={{ fontFamily: "'Raleway', sans-serif", fontSize: 9, color: "#E8C76A", letterSpacing: "0.22em", textTransform: "uppercase", marginTop: 4, fontWeight: 600 }}>Founder · CEO</div>
              </div>
            </div>

            {/* Credentials */}
            <div className="mt-6 space-y-2">
              {[
                "U.S. Marine Corps Veteran",
                "Live Nation · Roc Nation · Three Six Zero",
                "Lansing, MI → Global Arenas",
              ].map((c) => (
                <div key={c} className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full" style={{ background: "#D4A017" }} />
                  <span style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, color: "#888", letterSpacing: "0.06em" }}>{c}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bio */}
          <div>
            <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 16, color: "#ccc", lineHeight: 1.85, fontWeight: 300 }}>
              Rob Hayes is a veteran tour executive, music entrepreneur, and creative strategist with global arena experience at the highest level of the industry. Originally from <span style={{ color: "#E8C76A", fontWeight: 500 }}>Lansing, Michigan</span>, his journey spans from aspiring artist to U.S. Marine, to working behind the scenes on world tours for icons including <span style={{ color: "#FFF", fontWeight: 500 }}>Madonna, U2, Beyoncé, Jay-Z, Rihanna, Bruno Mars, and Justin Timberlake</span> through roles at <span style={{ color: "#E8C76A", fontWeight: 500 }}>Live Nation</span> and <span style={{ color: "#E8C76A", fontWeight: 500 }}>Roc Nation / Three Six Zero Group</span>.
            </p>
            <p className="mt-5" style={{ fontFamily: "'Raleway', sans-serif", fontSize: 16, color: "#ccc", lineHeight: 1.85, fontWeight: 300 }}>
              With deep expertise in tour operations, artist management, logistics, and large-scale production, Rob is known for executing complex international tours with precision while protecting the artist experience at every level. His background blends <span style={{ color: "#FFF", fontWeight: 500 }}>military discipline, executive strategy, and creative insight</span> — making him equally effective in high-pressure environments and long-term planning.
            </p>
            <p className="mt-5" style={{ fontFamily: "'Raleway', sans-serif", fontSize: 16, color: "#ccc", lineHeight: 1.85, fontWeight: 300 }}>
              As the founder and CEO of <span style={{ color: "#E8C76A", fontWeight: 600 }}>Thirty Dark Zero Distribution</span>, Rob bridges the gap between artistry and infrastructure, building systems that support talent sustainably. His career is defined by resilience, leadership, and a relentless commitment to excellence — on and off the stage.
            </p>

            {/* Pull quote */}
            <div className="mt-8 pl-5" style={{ borderLeft: "2px solid #D4A017" }}>
              <p style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 22, color: "#E8C76A", letterSpacing: "0.04em", lineHeight: 1.2, textTransform: "uppercase" }}>
                "The artists built this industry. It's time the infrastructure paid them back."
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

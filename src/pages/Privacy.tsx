import { useState, useEffect, useRef } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import tdzLogo from "@/assets/tdz-logo.png";

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.12 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}
function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} className={className} style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(28px)", transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s` }}>
      {children}
    </div>
  );
}

const h2Style: React.CSSProperties = { fontFamily: "'Six Caps', sans-serif", fontSize: 32, color: "#fff", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 16 };
const pStyle: React.CSSProperties = { fontFamily: "'Raleway', sans-serif", fontSize: 14, color: "#888", lineHeight: 1.8 };
const liStyle: React.CSSProperties = { fontFamily: "'Raleway', sans-serif", fontSize: 13, color: "#888", lineHeight: 1.8 };

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ background: "#000", fontFamily: "'Raleway', sans-serif" }}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#1A1A1A]">
        <img src={tdzLogo} alt="TDZ" className="h-10 w-auto cursor-pointer" onClick={() => navigate("/")} />
        <button onClick={() => navigate("/")} className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#333] text-[#888] hover:text-white hover:border-[#555] transition-all" style={{ fontSize: 13, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          <ArrowLeft className="w-4 h-4" /> Home
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16">
        <Reveal>
          <img src={tdzLogo} alt="TDZ" className="w-10 h-10 mx-auto mb-6" />
          <h1 style={{ fontFamily: "'Six Caps', sans-serif", fontSize: "clamp(50px, 8vw, 100px)", color: "#fff", textAlign: "center", letterSpacing: "0.04em", textTransform: "uppercase", lineHeight: 1 }}>
            PRIVACY POLICY
          </h1>
          <div className="flex justify-center mt-4">
            <span className="px-4 py-1.5 rounded-full text-xs" style={{ background: "#00CFFF15", color: "#00CFFF", fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase" }}>
              Last Updated: February 2026
            </span>
          </div>
        </Reveal>

        <Reveal className="mt-12">
          <div className="rounded-2xl border border-[#222] bg-[#111] p-8 md:p-10 space-y-10">
            <section>
              <h2 style={h2Style}>1. INFORMATION WE COLLECT</h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li style={liStyle}><strong style={{ color: "#ccc" }}>Account Information:</strong> Name, email, artist name, payment details</li>
                <li style={liStyle}><strong style={{ color: "#ccc" }}>Content:</strong> Music files, metadata, artwork, and related materials</li>
                <li style={liStyle}><strong style={{ color: "#ccc" }}>Usage Data:</strong> How you interact with our platform, analytics, and logs</li>
                <li style={liStyle}><strong style={{ color: "#ccc" }}>Device Information:</strong> Browser type, IP address, device identifiers</li>
                <li style={liStyle}><strong style={{ color: "#ccc" }}>Communication:</strong> Support messages and feedback</li>
              </ul>
            </section>

            <section>
              <h2 style={h2Style}>2. HOW WE USE YOUR INFORMATION</h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li style={liStyle}>Providing and maintaining streaming and distribution services</li>
                <li style={liStyle}>Processing payments, calculating $1/stream royalties, and download revenue</li>
                <li style={liStyle}>Streaming your content on the TDZ platform</li>
                <li style={liStyle}>Improving our services and developing new features</li>
                <li style={liStyle}>Communicating updates, announcements, and support</li>
                <li style={liStyle}>Detecting and preventing fraud or abuse (stream manipulation, bot detection)</li>
                <li style={liStyle}>Complying with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 style={h2Style}>3. INFORMATION SHARING</h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li style={liStyle}><strong style={{ color: "#ccc" }}>Payment Processors:</strong> Information required to process artist payouts and fan purchases via Square</li>
                <li style={liStyle}><strong style={{ color: "#ccc" }}>Service Providers:</strong> Third parties who assist in operating our platform</li>
                <li style={liStyle}><strong style={{ color: "#ccc" }}>Legal Requirements:</strong> When required by law or to protect our rights</li>
                <li style={liStyle}><strong style={{ color: "#ccc" }}>Business Transfers:</strong> In connection with mergers or acquisitions</li>
              </ul>
              <p style={{ ...pStyle, marginTop: 12 }}>We never sell your personal information to third parties.</p>
            </section>

            <section>
              <h2 style={h2Style}>4. DATA SECURITY</h2>
              <p style={pStyle}>We implement industry-standard security measures including encryption, secure servers, and regular security audits. However, no method of transmission is 100% secure.</p>
            </section>

            <section>
              <h2 style={h2Style}>5. DATA RETENTION</h2>
              <p style={pStyle}>We retain your information for as long as necessary to provide services and comply with legal obligations.</p>
            </section>

            <section>
              <h2 style={h2Style}>6. YOUR RIGHTS</h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li style={liStyle}>Access your personal information</li>
                <li style={liStyle}>Correct inaccurate or incomplete data</li>
                <li style={liStyle}>Request deletion of your account and data</li>
                <li style={liStyle}>Export your data in a portable format</li>
                <li style={liStyle}>Opt-out of marketing communications</li>
                <li style={liStyle}>Object to certain data processing activities</li>
              </ul>
              <p style={{ ...pStyle, marginTop: 12 }}>To exercise these rights, contact us at <span style={{ color: "#00CFFF" }}>info@thirtydarkzero.com</span></p>
            </section>

            <section>
              <h2 style={h2Style}>7. COOKIES AND TRACKING</h2>
              <p style={pStyle}>We use cookies and similar technologies to enhance your experience, analyze usage patterns, and remember your preferences.</p>
            </section>

            <section>
              <h2 style={h2Style}>8. CHILDREN'S PRIVACY</h2>
              <p style={pStyle}>Our service is not intended for users under 13 years of age. We do not knowingly collect information from children.</p>
            </section>

            <section>
              <h2 style={h2Style}>9. INTERNATIONAL DATA TRANSFERS</h2>
              <p style={pStyle}>Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place.</p>
            </section>

            <section>
              <h2 style={h2Style}>10. CHANGES TO THIS POLICY</h2>
              <p style={pStyle}>We may update this Privacy Policy periodically. We will notify you of significant changes via email or platform notification.</p>
            </section>

            <section>
              <h2 style={h2Style}>11. CONTACT US</h2>
              <p style={pStyle}>Email: <span style={{ color: "#00CFFF" }}>info@thirtydarkzero.com</span></p>
            </section>
          </div>
        </Reveal>
      </div>

      <footer className="py-12 text-center border-t border-[#111]">
        <img src={tdzLogo} alt="TDZ" className="w-10 h-10 mx-auto" />
        <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 12, color: "#333", marginTop: 16 }}>© 2026 TDZ. All rights reserved.</p>
      </footer>
    </div>
  );
}

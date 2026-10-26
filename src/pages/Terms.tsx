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

const sectionStyle: React.CSSProperties = { fontFamily: "'Raleway', sans-serif" };
const h2Style: React.CSSProperties = { fontFamily: "'Six Caps', sans-serif", fontSize: 32, color: "#fff", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 16 };
const pStyle: React.CSSProperties = { fontFamily: "'Raleway', sans-serif", fontSize: 14, color: "#888", lineHeight: 1.8 };
const liStyle: React.CSSProperties = { fontFamily: "'Raleway', sans-serif", fontSize: 13, color: "#888", lineHeight: 1.8 };

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ background: "#000", fontFamily: "'Raleway', sans-serif" }}>
      {/* Nav */}
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
            TERMS & CONDITIONS
          </h1>
          <div className="flex justify-center mt-4">
            <span className="px-4 py-1.5 rounded-full text-xs" style={{ background: "#22C55E15", color: "#22C55E", fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase" }}>
              Last Updated: February 2026
            </span>
          </div>
          <p className="text-center mt-4 mx-auto" style={{ ...pStyle, maxWidth: 600 }}>
            Please read these terms carefully before using TDZ.
          </p>
        </Reveal>

        <Reveal className="mt-12">
          <div className="rounded-2xl border border-[#222] bg-[#111] p-8 md:p-10 space-y-10">
            <section style={sectionStyle}>
              <h2 style={h2Style}>1. AGREEMENT TO TERMS</h2>
              <p style={pStyle}>
                By accessing or using TDZ ("TDZ", "we", "our", or "the Platform"), you agree to be bound by these Terms and Conditions. 
                TDZ is a standalone streaming platform that pays artists $1.00 per qualified stream. If you disagree with any part of these terms, you may not access the service.
              </p>
            </section>

            <section style={sectionStyle}>
              <h2 style={h2Style}>2. PLATFORM DESCRIPTION</h2>
              <p style={{ ...pStyle, marginBottom: 12 }}>TDZ is an independent, artist-first streaming platform. Key features include:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li style={liStyle}>Direct streaming on TDZ platform (not distributed to external DSPs)</li>
                <li style={liStyle}>Industry-leading $1.00 per stream artist payout</li>
                <li style={liStyle}>Artist-set download pricing with 100% revenue to artists (minus ~2.9% processing)</li>
                <li style={liStyle}>Full support for AI-generated and AI-assisted music alongside human artists</li>
                <li style={liStyle}>Social features including fan profiles, playlists, and community engagement</li>
                <li style={liStyle}>High-fidelity audio support including HD Audio, Dolby Atmos, and Hi-Res formats</li>
                <li style={liStyle}>Motion covers and visual content capabilities</li>
                <li style={liStyle}>AI-powered tools: Storytelling Studio, Quantum AI Advisor, Mood Mix</li>
              </ul>
            </section>

            <section style={sectionStyle}>
              <h2 style={h2Style}>3. USER ACCOUNTS & SUBSCRIPTION</h2>
              <p style={{ ...pStyle, marginBottom: 12 }}>When you create an account with us:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li style={liStyle}>Subscription is required to access full platform features</li>
                <li style={liStyle}>Credit card is required for signup and payouts</li>
                <li style={liStyle}>You must provide accurate, complete, and current information</li>
                <li style={liStyle}>You are responsible for maintaining the confidentiality of your account credentials</li>
                <li style={liStyle}>You are responsible for all activities that occur under your account</li>
                <li style={liStyle}>You must notify us immediately of any unauthorized access</li>
              </ul>
              <p style={{ ...pStyle, marginTop: 16 }}>
                <strong style={{ color: "#ccc" }}>Artist Subscription Tiers:</strong> Starter ($9.99/month) — 3 track uploads, 1 album, basic analytics. Pro ($19.99/month) — 25 tracks, 5 albums, advanced analytics, AI tools. Enterprise ($49.99/month) — Unlimited uploads, full AI suite, dedicated support, priority payouts.
              </p>
              <p style={{ ...pStyle, marginTop: 8 }}>
                <strong style={{ color: "#ccc" }}>Fan Subscription:</strong> $12.00/month for unlimited streaming, HD audio, playlist creation, social features, and direct artist support.
              </p>
            </section>

            <section style={sectionStyle}>
              <h2 style={h2Style}>4. CONTENT RIGHTS AND OWNERSHIP</h2>
              <p style={{ ...pStyle, marginBottom: 12 }}>You retain all rights to the content you upload. By uploading content, you represent and warrant that:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li style={liStyle}>You own or have the necessary rights to the content</li>
                <li style={liStyle}>The content does not infringe on any third party's rights</li>
                <li style={liStyle}>You grant TDZ a license to stream and display your content on the platform</li>
                <li style={liStyle}>You will not upload content that violates any laws or regulations</li>
                <li style={liStyle}>AI-generated content must comply with all applicable AI content regulations</li>
                <li style={liStyle}>Maximum upload file size is 500MB per track</li>
              </ul>
            </section>

            <section style={sectionStyle}>
              <h2 style={h2Style}>5. ARTIST EARNINGS & PAYOUTS</h2>
              <p style={{ ...pStyle, marginBottom: 12 }}>TDZ offers an industry-leading artist compensation model:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li style={liStyle}><strong style={{ color: "#22C55E" }}>Streaming Revenue:</strong> Artists earn $1.00 per qualified stream</li>
                <li style={liStyle}>Streams count when fully played (30-second minimum threshold)</li>
                <li style={liStyle}><strong style={{ color: "#22C55E" }}>Download Revenue:</strong> Artists retain 100% of download sales (minus ~2.9% transaction fees)</li>
                <li style={liStyle}>Artists set their own download prices during upload (minimum $0.99)</li>
                <li style={liStyle}>Minimum payout threshold is $10</li>
                <li style={liStyle}>Payout cycles run monthly; payments processed via Square</li>
                <li style={liStyle}>AI artists earn the same $1/stream as human artists</li>
                <li style={liStyle}>You are responsible for applicable taxes on your earnings</li>
              </ul>
            </section>

            <section style={sectionStyle}>
              <h2 style={h2Style}>6. REVENUE POOL</h2>
              <p style={pStyle}>
                Artist payouts are funded by the TDZ Revenue Pool, which consists of: fan subscription revenue ($12/month per subscriber), artist subscription revenue ($9.99-$49.99/month), advertising revenue, 
                sponsorships, premium AI tool fees, fan purchases, download transaction fees, and live event revenue. TDZ's Golden Rule requires Average Revenue Per Stream (ARPS) to exceed $1.00, targeting $1.35–$1.80 ARPS at scale. TDZ reserves the right 
                to adjust payout rates with 30 days notice if necessary to maintain platform sustainability.
              </p>
            </section>

            <section style={sectionStyle}>
              <h2 style={h2Style}>7. SOCIAL FEATURES & COMMUNITY GUIDELINES</h2>
              <p style={{ ...pStyle, marginBottom: 12 }}>TDZ includes social features for community engagement. By using these features, you agree to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li style={liStyle}>Respect other users and their content</li>
                <li style={liStyle}>Not engage in harassment, spam, or abusive behavior</li>
                <li style={liStyle}>Not post misleading, false, or harmful content</li>
                <li style={liStyle}>Follow community moderation guidelines</li>
                <li style={liStyle}>Report inappropriate content or behavior</li>
              </ul>
              <p style={{ ...pStyle, marginTop: 12 }}>
                Social features include: fan profiles, playlists, comments, reactions, follows, shares, motion covers, tip jar, and direct messaging. 
                TDZ reserves the right to moderate, remove, or restrict content that violates these guidelines.
              </p>
            </section>

            <section style={sectionStyle}>
              <h2 style={h2Style}>8. FAN/LISTENER TERMS</h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li style={liStyle}>Non-subscribers can preview tracks for 30 seconds before subscription is required</li>
                <li style={liStyle}>Subscribers ($12/month) receive unlimited streaming access with HD audio</li>
                <li style={liStyle}>You may create and share playlists, follow artists, and engage with the community</li>
                <li style={liStyle}>Downloaded content is for personal use only and may not be redistributed</li>
                <li style={liStyle}>You may not manipulate stream counts or engage in fraudulent listening activity</li>
                <li style={liStyle}>Your subscription directly funds artist payouts through the Revenue Pool</li>
              </ul>
            </section>

            <section style={sectionStyle}>
              <h2 style={h2Style}>9. PROHIBITED USES</h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li style={liStyle}>Upload content you do not have rights to distribute</li>
                <li style={liStyle}>Infringe on intellectual property rights</li>
                <li style={liStyle}>Distribute illegal, harmful, or offensive content</li>
                <li style={liStyle}>Manipulate streaming numbers or engage in fraudulent activity</li>
                <li style={liStyle}>Use bots or automated systems to artificially inflate metrics</li>
                <li style={liStyle}>Harass, threaten, or abuse other users</li>
                <li style={liStyle}>Circumvent platform security or access restrictions</li>
                <li style={liStyle}>Violate any applicable laws or regulations</li>
              </ul>
            </section>

            <section style={sectionStyle}>
              <h2 style={h2Style}>10. AI-GENERATED CONTENT</h2>
              <p style={pStyle}>
                TDZ welcomes AI-generated and AI-assisted music equally with human-created content. AI artists earn the same $1 per stream and 100% download revenue. Artists using AI tools 
                must ensure they have proper rights to use such tools and that the resulting content does not infringe on 
                any third-party rights. AI-generated content is subject to the same quality standards and community guidelines 
                as all other content on the platform.
              </p>
            </section>

            <section style={sectionStyle}>
              <h2 style={h2Style}>11. TERMINATION</h2>
              <p style={pStyle}>
                We may terminate or suspend your account immediately, without prior notice, for any breach of 
                these Terms. Upon termination, your right to use the service will immediately cease. Any pending 
                earnings above the minimum threshold will be paid out within 60 days of termination, subject to 
                fraud verification.
              </p>
            </section>

            <section style={sectionStyle}>
              <h2 style={h2Style}>12. LIMITATION OF LIABILITY</h2>
              <p style={pStyle}>
                We shall not be liable for any indirect, incidental, special, consequential, or punitive damages 
                resulting from your use of or inability to use the service, including but not limited to loss of 
                revenue, loss of data, loss of business opportunities, or any damages related to streaming metrics 
                or payout calculations.
              </p>
            </section>

            <section style={sectionStyle}>
              <h2 style={h2Style}>13. CHANGES TO TERMS</h2>
              <p style={pStyle}>
                We reserve the right to modify these terms at any time. We will notify users of any material changes by 
                updating the "Last Updated" date and, for significant changes, via email notification. Your continued 
                use of the service after changes constitutes acceptance of the modified terms.
              </p>
            </section>

            <section style={sectionStyle}>
              <h2 style={h2Style}>14. CONTACT INFORMATION</h2>
              <p style={pStyle}>
                For questions about these Terms, please contact us at <span style={{ color: "#00CFFF" }}>info@thirtydarkzero.com</span>
              </p>
            </section>
          </div>
        </Reveal>
      </div>

      {/* Footer */}
      <footer className="py-12 text-center border-t border-[#111]">
        <img src={tdzLogo} alt="TDZ" className="w-10 h-10 mx-auto" />
        <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 12, color: "#333", marginTop: 16 }}>
          © 2026 TDZ. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

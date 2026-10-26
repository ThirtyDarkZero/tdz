import { useState, useEffect, useRef } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { DollarSign, Download, CreditCard, Music, Zap, Users, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import tdzLogo from "@/assets/tdz-logo.png";

/* Scroll reveal */
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

export default function FAQ() {
  const navigate = useNavigate();

  const faqs = [
    {
      category: "Artist Payouts",
      icon: DollarSign,
      color: "#22C55E",
      questions: [
        { q: "How do artists get paid on TDZ?", a: "TDZ pays artists $1 per qualified stream. A stream qualifies when an active paid subscriber listens for more than 30 seconds or more than 50% of the track, with the TDZ tab in focus for most of the play. Artists' own plays never count." },
        { q: "Where does TDZ get the money to pay artists $1 per stream?", a: "From the TDZ Revenue Pool — which consists of fan subscriptions ($12/month), artist subscriptions ($9.99, $19.99 or $49.99/month), download purchases, ads, premium features, sponsorships, and live event revenue. This diversified revenue model allows us to pay artists fairly." },
        { q: "How fast are payouts processed?", a: "Payouts are sent automatically through Stripe once your balance reaches $50. Connect your bank account in Studio payout settings to receive them." },
        { q: "Can I see my earnings in real-time?", a: "Yes! Your Artist Studio Dashboard shows real-time streaming counts, download sales, and total earnings. You can track every stream and every dollar as it comes in." }
      ]
    },
    {
      category: "Downloads & Sales",
      icon: Download,
      color: "#00CFFF",
      questions: [
        { q: "Can fans download music on TDZ?", a: "Yes! Artists set their own download price during upload. Fans can purchase and download tracks, and 100% of download revenue goes directly to the artist (minus standard payment processing fees of ~2.9%)." },
        { q: "How do I set a download price for my track?", a: "When uploading a track in your Studio, you'll see an optional 'Download Price' field. Set any price you want (minimum $0.99). If left blank, the track will be streaming-only." },
        { q: "What happens when someone buys my download?", a: "The buyer gets a high-quality download of your track. You receive 100% of the sale price minus payment processing fees (~2.9%). Download revenue is tracked separately from streaming revenue in your dashboard." }
      ]
    },
    {
      category: "Subscription & Account",
      icon: CreditCard,
      color: "#8B5CF6",
      questions: [
        { q: "Is a credit card required to sign up?", a: "Yes. TDZ requires an active subscription and a valid payment method for artists to distribute and monetize their music." },
        { q: "What are the artist subscription tiers?", a: "Starter ($9.99/month): 3 track uploads, 1 album, basic analytics, $1/stream earnings. Pro ($19.99/month): 25 tracks, 5 albums, advanced analytics, AI tools, priority support. Enterprise ($49.99/month): Unlimited uploads, full AI suite, dedicated account manager, priority payouts." },
        { q: "What does the fan subscription include?", a: "Fans pay $12/month for unlimited streaming, HD audio quality, playlist creation, social features, and the ability to directly support artists. Every stream from a subscriber contributes to the $1/stream payout pool." },
        { q: "Are there any hidden fees?", a: "No hidden fees. Your subscription covers all platform features. The only deduction from your earnings is standard payment processing fees (~2.9%) when you withdraw your earnings or when fans purchase downloads." }
      ]
    },
    {
      category: "AI Music",
      icon: Music,
      color: "#D4A017",
      questions: [
        { q: "Does TDZ accept AI-generated music?", a: "Absolutely! TDZ welcomes AI-generated music, AI-assisted production, AI vocals, and hybrid human/AI projects. If you created it, you can distribute and monetize it on TDZ." },
        { q: "Do AI artists earn the same as human artists?", a: "Yes. AI artists earn the same $1 per stream and 100% of download revenue as human artists. We don't discriminate based on how music is created." },
        { q: "What about copyright for AI music?", a: "You must have the rights to distribute any music you upload. For AI-generated content, ensure you have the proper licenses from your AI tools and that your music doesn't infringe on existing copyrights." }
      ]
    },
    {
      category: "Platform & Distribution",
      icon: Zap,
      color: "#00CFFF",
      questions: [
        { q: "How long does it take for my music to go live?", a: "Your music goes live on TDZ within 24 hours of publishing. There's no waiting weeks for external platform distribution." },
        { q: "Can I update my music after it's published?", a: "Yes, you can update metadata, artwork, and even upload new versions. Changes reflect within 24-48 hours." },
        { q: "Is TDZ a DSP or a distributor?", a: "TDZ is a standalone streaming platform—like Spotify or Apple Music—but artist-owned. Artists upload directly to TDZ and keep 100% of their rights. We don't distribute to external platforms." },
        { q: "What audio quality is supported?", a: "TDZ supports standard streaming, HD Audio (24-bit/96kHz), Hi-Res Audio, and even Dolby Atmos. The quality depends on what the artist uploads and the listener's subscription tier." }
      ]
    },
    {
      category: "For Fans",
      icon: Users,
      color: "#22C55E",
      questions: [
        { q: "How does my subscription help artists?", a: "Your $12/month subscription goes directly into the TDZ Revenue Pool, which funds the $1 per stream payouts to artists. Every stream you make directly supports the artists you love." },
        { q: "Can I buy music to keep forever?", a: "Yes! Many artists offer their tracks for download at prices they set. When you purchase a download, you own that file forever—no subscription needed to keep listening." },
        { q: "What social features are available?", a: "Create playlists, follow artists, like tracks, share music, comment on songs, create a fan profile, earn badges, and connect with other music lovers in the TDZ community." }
      ]
    }
  ];

  // FAQPage JSON-LD for rich search results
  useEffect(() => {
    const ID = "faq-jsonld";
    const data = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.flatMap((s) =>
        s.questions.map((q) => ({
          "@type": "Question",
          name: q.q,
          acceptedAnswer: { "@type": "Answer", text: q.a },
        }))
      ),
    };
    let script = document.head.querySelector<HTMLScriptElement>(`script#${ID}`);
    if (!script) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.id = ID;
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(data);
    return () => {
      document.head.querySelector(`script#${ID}`)?.remove();
    };
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "#000", fontFamily: "'Raleway', sans-serif" }}>
      {/* Nav */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#1A1A1A]">
        <img src={tdzLogo} alt="TDZ" className="h-10 w-auto cursor-pointer" onClick={() => navigate("/")} />
        <button onClick={() => navigate("/")} className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#333] text-[#888] hover:text-white hover:border-[#555] transition-all" style={{ fontFamily: "'Raleway', sans-serif", fontSize: 13, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          <ArrowLeft className="w-4 h-4" /> Home
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <Reveal>
          <img src={tdzLogo} alt="TDZ" className="w-10 h-10 mx-auto mb-6" />
          <h1 style={{ fontFamily: "'Six Caps', sans-serif", fontSize: "clamp(50px, 8vw, 100px)", color: "#fff", textAlign: "center", letterSpacing: "0.04em", textTransform: "uppercase", lineHeight: 1 }}>
            FREQUENTLY ASKED QUESTIONS
          </h1>
          <p className="text-center mt-4" style={{ fontFamily: "'Raleway', sans-serif", fontSize: 15, color: "#777" }}>
            Learn about our $1 per stream model, downloads, subscriptions, and more.
          </p>
        </Reveal>

        {/* Key Highlights */}
        <div className="grid md:grid-cols-3 gap-4 mt-12 mb-16">
          {[
            { icon: DollarSign, value: "$1.00", label: "Per Stream", color: "#22C55E" },
            { icon: Download, value: "100%", label: "Download Revenue", color: "#00CFFF" },
            { icon: Music, value: "AI Welcome", label: "Same Earnings", color: "#D4A017" }
          ].map((item, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <div className="rounded-2xl border border-[#222] bg-[#111] p-6 text-center">
                <item.icon className="w-8 h-8 mx-auto mb-2" style={{ color: item.color }} />
                <div style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 42, color: item.color }}>{item.value}</div>
                <div style={{ fontFamily: "'Raleway', sans-serif", fontSize: 12, color: "#888", letterSpacing: "0.15em", textTransform: "uppercase" }}>{item.label}</div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* FAQ Sections */}
        <div className="space-y-8">
          {faqs.map((section, idx) => (
            <Reveal key={idx} delay={idx * 0.08}>
              <div className="rounded-2xl border border-[#222] bg-[#111] overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-[#1A1A1A]">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${section.color}15` }}>
                    <section.icon className="w-5 h-5" style={{ color: section.color }} />
                  </div>
                  <span style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 28, color: "#fff", letterSpacing: "0.03em" }}>{section.category.toUpperCase()}</span>
                </div>
                <div className="px-6 pb-4">
                  <Accordion type="single" collapsible className="w-full">
                    {section.questions.map((faq, qIdx) => (
                      <AccordionItem key={qIdx} value={`${idx}-${qIdx}`} className="border-[#1A1A1A]">
                        <AccordionTrigger className="text-left py-4 hover:no-underline" style={{ fontFamily: "'Raleway', sans-serif", fontSize: 14, color: "#ccc", fontWeight: 500 }}>
                          {faq.q}
                        </AccordionTrigger>
                        <AccordionContent style={{ fontFamily: "'Raleway', sans-serif", fontSize: 13, color: "#777", lineHeight: 1.8 }}>
                          {faq.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Contact Support */}
        <Reveal className="mt-12">
          <div className="rounded-2xl border border-[#222] bg-[#111] p-10 text-center">
            <h3 style={{ fontFamily: "'Six Caps', sans-serif", fontSize: 36, color: "#fff", letterSpacing: "0.04em" }}>STILL HAVE QUESTIONS?</h3>
            <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 14, color: "#777", marginTop: 8 }}>Our support team is here to help you succeed.</p>
            <button
              onClick={() => navigate("/support")}
              className="mt-6 px-8 py-3 rounded-full hover:scale-105 transition-transform"
              style={{ background: "#22C55E", color: "#000", fontFamily: "'Raleway', sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" }}
            >
              Contact Support
            </button>
          </div>
        </Reveal>
      </div>

      {/* Footer */}
      <footer className="py-12 text-center border-t border-[#111]">
        <img src={tdzLogo} alt="TDZ" className="w-10 h-10 mx-auto" />
        <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 12, color: "#333", marginTop: 16 }}>
          © 2026 TDZ Distribution. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

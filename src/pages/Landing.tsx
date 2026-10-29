import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import tdzLogo from "@/assets/tdz-logo.png";
import heroStreet from "@/assets/hero-artist-street.jpg";
import heroStudio from "@/assets/hero-artist-studio.jpg";
import heroHeadphones from "@/assets/hero-artist-headphones.jpg";
import crowd from "@/assets/hero-background.jpg";
import { openStripeCheckout, isCheckoutPlan, type CheckoutPlan } from "@/lib/subscription-checkout";
import { openStore } from "@/lib/analytics";
import { PlayMeter } from "@/components/showroom/PlayMeter";
import { Chapter, Segmented } from "@/components/showroom/Showroom";
import { prefersReducedMotion, useShowroomScroll } from "@/components/showroom/useShowroomScroll";

function checkout(plan: CheckoutPlan, navigate: (p: string) => void) {
  if (isCheckoutPlan(plan)) openStripeCheckout(plan);
  else navigate("/auth?mode=signup");
}

// ─── Header ───────────────────────────────────────────
function Header({ solid }: { solid: boolean }) {
  return (
    <header className="sr-header" data-solid={solid || undefined}>
      <Link to="/" className="sr-header__logo" aria-label="TDZ Distribution home">
        <img src={tdzLogo} alt="" />
      </Link>
      <nav className="sr-header__nav" aria-label="Main">
        <Link to="/discover" className="sr-header__link sr-hide-sm">Listen</Link>
        <Link to="/studio" className="sr-header__link sr-hide-sm">Studio</Link>
        <Link to="/auth" className="sr-header__link">Log in</Link>
        <Link to="/auth?mode=signup" className="sr-button sr-button--small">Start earning</Link>
      </nav>
    </header>
  );
}

// ─── Hero: press play ─────────────────────────────────
function Hero() {
  return (
    <section className="sr-hero" aria-labelledby="hero-title">
      <img className="sr-hero__image" src={heroStreet} alt="" fetchPriority="high" />
      <div className="sr-hero__shade" />
      <div className="sr-hero__content">
        <h1 id="hero-title" className="sr-hero__title">
          Get paid $1 every time a fan plays your song.
        </h1>
        <p className="sr-hero__lede">
          Spotify pays about $0.003 a stream. TDZ pays artists $1.00 for every play by a paying fan,
          and you keep 100% of your download sales.
        </p>
        <PlayMeter />
      </div>
    </section>
  );
}

// ─── Spec strip ───────────────────────────────────────
const SPECS = [
  { value: "$1.00", label: "per play by a paying fan" },
  { value: "333×", label: "what Spotify pays per stream" },
  { value: "100%", label: "of your download sales" },
  { value: "200+", label: "territories for your rights" },
];

function Specs() {
  return (
    <section className="sr-specs" aria-label="TDZ at a glance">
      <dl className="sr-specs__grid">
        {SPECS.map((s) => (
          <div key={s.value} className="sr-specs__item">
            <dt className="sr-specs__label">{s.label}</dt>
            <dd className="sr-specs__value">{s.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

// ─── See it work ──────────────────────────────────────
const DEMOS = [
  { id: "studio", label: "Studio", src: "/videos/studio-demo.mp4",
    caption: "Upload, price your downloads and watch earnings land in real time." },
  { id: "discovery", label: "Discovery", src: "/videos/discovery-demo.mp4",
    caption: "Fans search the world's catalog and play anything, with TDZ artists up front." },
];

function SeeItWork() {
  const [active, setActive] = useState(0);
  const demo = DEMOS[active];
  return (
    <section className="sr-section sr-demo" aria-labelledby="demo-title">
      <div className="sr-section__head">
        <h2 id="demo-title" className="sr-h2">See it work</h2>
        <Segmented
          label="Product demos"
          idPrefix="demo"
          options={DEMOS.map((d) => ({ id: d.id, label: d.label }))}
          value={demo.id}
          onChange={(id) => setActive(DEMOS.findIndex((d) => d.id === id))}
        />
      </div>
      <div id="demo-panel" role="tabpanel" aria-labelledby={`demo-tab-${demo.id}`} className="sr-demo__panel">
        <video
          key={demo.src}
          className="sr-demo__video"
          src={demo.src}
          autoPlay={!prefersReducedMotion()}
          muted
          loop
          playsInline
          controls={prefersReducedMotion()}
        />
        <p className="sr-demo__caption">{demo.caption}</p>
      </div>
    </section>
  );
}

// ─── Pick your path ───────────────────────────────────
type Plan = { name: string; price: string; plan: CheckoutPlan; points: string[] };
const PATHS: { id: string; label: string; intro: string; plans: Plan[] }[] = [
  {
    id: "artist", label: "I make music",
    intro: "Release your music, set your prices and get paid $1 for every play by a paying fan. Human or AI, your music is welcome.",
    plans: [
      { name: "Starter", price: "$9.99", plan: "starter",
        points: ["Up to 50 tracks and 5 albums", "Download sales at your price", "HD audio", "Fan engagement tools"] },
      { name: "Pro", price: "$19.99", plan: "pro",
        points: ["Unlimited tracks and albums", "Full analytics", "Pre-save campaigns", "Rights in 200+ territories"] },
    ],
  },
  {
    id: "fan", label: "I listen",
    intro: "Stream everything. Your $12 follows the artists you actually play, not a global pool.",
    plans: [
      { name: "Fan", price: "$12", plan: "fan",
        points: ["Unlimited streaming", "HD and Dolby Atmos audio", "Offline downloads", "No ads"] },
    ],
  },
  {
    id: "manager", label: "I run a roster",
    intro: "Manage every artist you represent from one dashboard, under your own brand.",
    plans: [
      { name: "Enterprise", price: "$49.99", plan: "enterprise",
        points: ["Everything in Pro", "Create and manage artist accounts", "White-label dashboard", "A dedicated account manager"] },
    ],
  },
];

function PickYourPath() {
  const navigate = useNavigate();
  const [active, setActive] = useState(0);
  const path = PATHS[active];
  return (
    <section className="sr-section sr-paths" aria-labelledby="paths-title">
      <div className="sr-section__head">
        <h2 id="paths-title" className="sr-h2">Which one are you?</h2>
        <Segmented
          label="Plans"
          idPrefix="path"
          options={PATHS.map((p) => ({ id: p.id, label: p.label }))}
          value={path.id}
          onChange={(id) => setActive(PATHS.findIndex((p) => p.id === id))}
        />
      </div>
      <div id="path-panel" role="tabpanel" aria-labelledby={`path-tab-${path.id}`}>
        <p className="sr-paths__intro">{path.intro}</p>
        <div className="sr-plans" data-count={path.plans.length}>
          {path.plans.map((p) => (
            <article key={p.name} className="sr-plan">
              <div className="sr-plan__top">
                <h3 className="sr-plan__name">{p.name}</h3>
                <p className="sr-plan__price">{p.price}<span>/month</span></p>
              </div>
              <ul className="sr-plan__points">
                {p.points.map((pt) => <li key={pt}>{pt}</li>)}
              </ul>
              <button type="button" className="sr-button" onClick={() => checkout(p.plan, navigate)}>
                Choose {p.name}
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Close ────────────────────────────────────────────
function Closing() {
  return (
    <section className="sr-close" aria-labelledby="close-title">
      <img className="sr-close__image" src={crowd} alt="" loading="lazy" />
      <div className="sr-close__shade" />
      <div className="sr-close__content">
        <h2 id="close-title" className="sr-close__title">Every play, paid.</h2>
        <div className="sr-close__actions">
          <Link to="/auth?mode=signup" className="sr-button">Start earning</Link>
          <Link to="/discover" className="sr-button sr-button--ghost">Start listening</Link>
        </div>
      </div>
    </section>
  );
}

const FOOTER_LINKS = [
  { label: "Listen", to: "/discover" },
  { label: "Studio", to: "/studio" },
  { label: "Investors", to: "/investors" },
  { label: "Questions", to: "/faq" },
  { label: "Learn", to: "/learn" },
  { label: "Connect AI", to: "/connect" },
  { label: "Contact", to: "/support" },
];

function Footer() {
  return (
    <footer className="sr-footer">
      <div className="sr-footer__row">
        <img src={tdzLogo} alt="TDZ Distribution" className="sr-footer__logo" />
        <nav aria-label="Footer" className="sr-footer__links">
          {FOOTER_LINKS.map((l) => <Link key={l.to} to={l.to}>{l.label}</Link>)}
          <button type="button" onClick={() => openStore("landing_footer")}>Store</button>
        </nav>
      </div>
      <div className="sr-footer__row sr-footer__legal">
        <p>© 2026 TDZ Distribution</p>
        <div>
          <Link to="/terms">Terms</Link>
          <Link to="/privacy">Privacy</Link>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────
export default function Landing() {
  const root = useRef<HTMLDivElement>(null);
  const solid = useShowroomScroll(root);

  return (
    <div ref={root} className="showroom">
      <a href="#main" className="sr-skip">Skip to content</a>
      <Header solid={solid} />
      <main id="main">
        <Hero />
        <Specs />

        <Chapter
          word="EARN"
          image={heroStreet}
          imageAlt="An artist in a pink jacket on set with a film crew"
          title="A dollar a play, paid automatically."
          link={{ to: "/faq", label: "How payouts work" }}
        >
          A play counts when a paying fan listens for 30 seconds or half the track. Once you pass
          $50 and 50 paid plays, TDZ sends the money to your Stripe account.
        </Chapter>

        <Chapter
          word="OWN"
          image={heroStudio}
          imageAlt="A rapper recording at a studio microphone"
          title="Your music, your price, your rights."
          link={{ to: "/auth?mode=signup", label: "Release your music" }}
        >
          Set your own download prices and keep every dollar of them. Your rights are managed in
          more than 200 territories.
        </Chapter>

        <Chapter
          word="GROW"
          image={heroHeadphones}
          imageAlt="An artist listening on headphones"
          title="Know what to do next."
          link={{ to: "/studio", label: "Open the Studio" }}
        >
          TDZ Studio shows who is listening, where and what is earning, so every release is
          aimed at the fans who pay.
        </Chapter>

        <Chapter
          word="DISCOVER"
          image={crowd}
          imageAlt="A concert crowd with hands raised"
          title="The whole world's music, in one place."
          link={{ to: "/discover", label: "Start listening" }}
        >
          Fans stream a global catalog alongside TDZ artists, and every subscription is shared
          by the artists each fan actually plays.
        </Chapter>

        <SeeItWork />
        <PickYourPath />
        <Closing />
      </main>
      <Footer />
    </div>
  );
}

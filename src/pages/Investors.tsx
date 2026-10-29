import { useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import tdzLogo from "@/assets/tdz-logo.png";
import studioBg from "@/assets/studio-background.jpg";
import heroStreet from "@/assets/hero-artist-street.jpg";
import heroStudio from "@/assets/hero-artist-studio.jpg";
import heroHeadphones from "@/assets/hero-artist-headphones.jpg";
import crowd from "@/assets/hero-background.jpg";
import robHayes from "@/assets/rob-hayes.jpeg";
import { JargonProvider, useJargon } from "@/components/investor/JargonContext";
import { Chapter, Segmented } from "@/components/showroom/Showroom";
import { useShowroomScroll } from "@/components/showroom/useShowroomScroll";

// ─── Data (figures unchanged from the previous deck) ──────────────
const revenueData = [
  { year: "Year 1", revenue: 8, profit: 2 },
  { year: "Year 2", revenue: 20, profit: 5 },
  { year: "Year 3", revenue: 45, profit: 7 },
  { year: "Year 4", revenue: 70, profit: 15 },
  { year: "Year 5", revenue: 200, profit: 50 },
];
const yearly = [
  { year: "Year 1", target: "$8M", plays: "6M", arps: "$1.33" },
  { year: "Year 2", target: "$20M", plays: "15M", arps: "$1.33" },
  { year: "Year 3", target: "$45M", plays: "38M", arps: "$1.18" },
  { year: "Year 4", target: "$70M", plays: "55M", arps: "$1.27" },
  { year: "Year 5", target: "$200M", plays: "150M", arps: "$1.33" },
];
const year5Mix = [
  { source: "Fan subscriptions", amount: 144, detail: "1M fans at $12 a month" },
  { source: "Artist subscriptions", amount: 120, detail: "400K artists at $25 a month" },
  { source: "Ads", amount: 20, detail: "3–5M free listeners" },
  { source: "Premium AI tools", amount: 18, detail: "150K pro users at $10 a month" },
  { source: "Sponsorships", amount: 6, detail: "Brand partnerships" },
  { source: "Marketplace fees", amount: 5, detail: "Sync, collaborations, gigs" },
  { source: "Download fees", amount: 1.8, detail: "1M downloads at a $0.15 fee" },
];
const userGrowth = [
  { month: "Jan", artists: 5000, listeners: 50000 },
  { month: "Feb", artists: 8500, listeners: 95000 },
  { month: "Mar", artists: 14000, listeners: 168000 },
  { month: "Apr", artists: 22000, listeners: 286000 },
  { month: "May", artists: 32000, listeners: 448000 },
  { month: "Jun", artists: 45000, listeners: 675000 },
  { month: "Jul", artists: 50000, listeners: 850000 },
];
const marketShare = [
  { year: "2024", tdz: 0.5, spotify: 31, apple: 15, amazon: 13 },
  { year: "2025", tdz: 2.8, spotify: 30, apple: 14.5, amazon: 12.5 },
  { year: "2026", tdz: 6.2, spotify: 29, apple: 14, amazon: 12 },
  { year: "2027", tdz: 11.5, spotify: 28, apple: 13.5, amazon: 11.5 },
  { year: "2028", tdz: 18.3, spotify: 27, apple: 13, amazon: 11 },
];
const useOfFunds = [
  { area: "AI and product", amount: 3, purpose: "AI capabilities, new features, UX" },
  { area: "Marketing and growth", amount: 2, purpose: "Acquisition, partnerships, brand" },
  { area: "Team", amount: 2, purpose: "Engineering, data science, support" },
  { area: "Infrastructure", amount: 2, purpose: "Scale, security, global expansion" },
  { area: "Partnerships", amount: 1, purpose: "Industry integrations, distribution deals" },
];

// Chart ink: TDZ is coral, everything else is neutral context.
const INK = { tdz: "#ff6347", main: "#f2f2f2", context: "#7a7a7a", grid: "#262626", axis: "#8a8a8a" };
const tooltipStyle = {
  contentStyle: { background: "#111", border: "1px solid #2a2a2a", borderRadius: 10, color: "#fff", fontSize: 13 },
  labelStyle: { color: "#a3a3a3" },
  itemStyle: { color: "#fff" },
};
const axisProps = { stroke: INK.axis, tick: { fill: INK.axis, fontSize: 12 }, tickLine: false, axisLine: false } as const;

// ─── Small building blocks ────────────────────────────────
function Rows({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="sr-rows">
      {rows.map(([k, v]) => (
        <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
      ))}
    </dl>
  );
}

function Detail({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="sr-more__block">
      <h3 className="sr-h3">{title}</h3>
      {children}
    </div>
  );
}

function Header({ solid }: { solid: boolean }) {
  const { mode, setMode } = useJargon();
  return (
    <header className="sr-header" data-solid={solid || undefined}>
      <Link to="/" className="sr-header__logo" aria-label="TDZ Distribution home">
        <img src={tdzLogo} alt="" />
      </Link>
      <nav className="sr-header__nav" aria-label="Deck">
        <span className="sr-header__note sr-hide-sm">$10M seed at 15%</span>
        <Segmented<"generalist" | "industry">
          label="How this deck is written"
          idPrefix="lens"
          options={[{ id: "generalist", label: "Plain" }, { id: "industry", label: "Insider" }]}
          value={mode}
          onChange={setMode}
        />
        <a href="#ask" className="sr-button sr-button--small">The ask</a>
      </nav>
    </header>
  );
}

// ─── Sections ─────────────────────────────────────────────
function Hero() {
  const { t } = useJargon();
  return (
    <section className="sr-hero" aria-labelledby="hero-title">
      <img className="sr-hero__image" src={studioBg} alt="" fetchPriority="high" />
      <div className="sr-hero__shade" />
      <div className="sr-hero__content">
        <p className="sr-hero__kicker">Seed round</p>
        <h1 id="hero-title" className="sr-hero__title">
          TDZ tells every artist what to do next, and pays them $1 when it works.
        </h1>
        <p className="sr-hero__lede">
          {t(
            "Every morning each artist gets one move built from their own live data. Spotify pays $0.003 a stream. We pay $1.00.",
            "A daily 'Today's Move' plus streaks drives the DAU/MAU loop. Payout is $1.00 per paid stream against Spotify's ~$0.003.",
          )}
        </p>
        <div className="sr-hero__actions">
          <a href="#problem" className="sr-button">Start the deck</a>
          <a href="#ask" className="sr-button sr-button--ghost">Jump to the ask</a>
        </div>
      </div>
    </section>
  );
}

function Specs() {
  const { t } = useJargon();
  const specs = [
    { value: "$1.00", label: "paid to the artist per play" },
    { value: "$1.35", label: t("target revenue per play", "target ARPS") },
    { value: "187K", label: t("working artists earning over $500 a year", "artists > $500/yr on Spotify") },
    { value: "$10M", label: "raising for 15%" },
  ];
  return (
    <section className="sr-specs" aria-label="TDZ at a glance">
      <dl className="sr-specs__grid">
        {specs.map((s) => (
          <div key={s.value} className="sr-specs__item">
            <dt className="sr-specs__label">{s.label}</dt>
            <dd className="sr-specs__value">{s.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function ProblemDetail() {
  const { t } = useJargon();
  return (
    <>
      <Detail title="Why it happens">
        <p>
          {t(
            "Streaming services pool every subscription and pay by share of all plays, so a play is worth about $0.003. Platforms and labels keep the margin; artists carry the risk.",
            "Pro-rata pooling pays by share of total streams, ~$0.003/stream. Labels and DSPs capture the margin.",
          )}
        </p>
        <Rows rows={[["Earn over $500 a year", "187,000 artists"], ["Earn over $10,000 a year", "11,000 artists"]]} />
      </Detail>
      <Detail title="How big it is">
        <p>Streaming reaches $106.6B by 2029. Independent and AI music are the fastest-growing part.</p>
        <Rows rows={[["2024", "$43.7B"], ["2029", "$106.6B"], ["Independent and AI growth", "28% a year"]]} />
      </Detail>
      <Detail title="Why nobody has fixed it">
        <p>
          Incumbents are tied to long label agreements, ad-supported free tiers and legacy costs. Paying $1 a play
          would erase their margins. TDZ started from a blank sheet: artist-owned, AI-native, subscription-pool first.
        </p>
      </Detail>
      <Detail title="Who we serve">
        <p>
          <strong>Artists</strong> already earning $500 to $50,000 a year, the working middle that platforms and labels
          overlook. <strong>Fans</strong> who want their subscription to reach the artists they play.
        </p>
        <Rows rows={[["Paid music subscribers worldwide", "616M"], ["Fan plan", "$12 a month"], ["Target retention", "94%"]]} />
      </Detail>
    </>
  );
}

function EdgeDetail() {
  return (
    <>
      <Detail title="How the money works">
        <Rows rows={[
          ["Fan subscription pool", "$12 × 1M fans = $144M a year"],
          ["Artist subscriptions", "$25 × 400K artists = $120M a year"],
          ["AI cost reduction", "95% cheaper video, lyrics and promo"],
          ["Revenue per play target", "$1.35, a $0.35 cushion over payout"],
        ]} />
      </Detail>
      <Detail title="What could go wrong">
        <Rows rows={[
          ["Revenue per play falls below $1", "Diversified revenue, fraud detection, a controlled ramp in plays and dynamic pricing"],
          ["Spotify or Apple copy us", "They can't leave pro-rata label deals; TDZ is artist-owned and AI-first"],
          ["AI copyright disputes", "Rights checks, fingerprinting, transparent reporting, opt-in AI licensing"],
          ["Fans cancel", "Exclusive content, the show, direct artist connection and fan rewards"],
        ]} />
      </Detail>
    </>
  );
}

function MarketDetail() {
  return (
    <>
      <Detail title="Sizing">
        <Rows rows={[
          ["Total: global streaming, 2029", "$106B"],
          ["Serviceable: independent and AI music, 2029", "$38B"],
          ["Obtainable: TDZ by year 5", "$2.5B"],
        ]} />
      </Detail>
      <Detail title="Signals from the market">
        <Rows rows={[
          ["Suno and Udio", "$125M+ raised for AI music"],
          ["Major labels", "Investing in AI tools, not artist pay"],
          ["Independent music", "19.8% a year through 2029"],
          ["AI music", "$1.2B in 2024 to $12.4B in 2029"],
        ]} />
      </Detail>
      <Detail title="Why they can't copy it">
        <p>
          Every play, tip and download on TDZ is tied to a real fan and a real artist wallet. Paying $1 a play would
          wipe out Spotify's roughly 25% gross margin and break its label contracts.
        </p>
      </Detail>
    </>
  );
}

function ShowDetail() {
  const [scenario, setScenario] = useState<"conservative" | "aggressive">("conservative");
  const econ = {
    conservative: { viewers: "500K", conv: "12%", subs: "60K", mrr: "$720K", payback: "Under 90 days" },
    aggressive: { viewers: "2M", conv: "8%", subs: "160K", mrr: "$1.92M", payback: "Under 30 days" },
  }[scenario];
  return (
    <>
      <Detail title="The format">
        <Rows rows={[["Artists", "32 unsigned"], ["Season", "12 weeks"], ["Voting", "In the TDZ app only"], ["Prize", "$250K, a distribution deal and a national tour"]]} />
      </Detail>
      <Detail title="One season">
        <Segmented<"conservative" | "aggressive">
          label="Scenario"
          idPrefix="season"
          options={[{ id: "conservative", label: "Conservative" }, { id: "aggressive", label: "Aggressive" }]}
          value={scenario}
          onChange={setScenario}
        />
        <div id="season-panel" role="tabpanel" aria-labelledby={`season-tab-${scenario}`}>
          <Rows rows={[
            ["Viewers", econ.viewers], ["Conversion", econ.conv], ["Paid subscribers", econ.subs],
            ["New monthly revenue", econ.mrr], ["Payback", econ.payback],
          ]} />
        </div>
        <p className="sr-note">
          Production budget about $1.8M. YouTube and TikTok cutdowns drive the funnel; full episodes are only in the
          TDZ app.
        </p>
      </Detail>
      <Detail title="For the lead investor">
        <p>A board observer seat, the prize presentation at the Season 1 finale, and first look at later seasons and spin-offs.</p>
      </Detail>
    </>
  );
}

type FinTab = "revenue" | "mix" | "users" | "share";

function Numbers() {
  const [tab, setTab] = useState<FinTab>("revenue");
  const { t } = useJargon();
  const max = Math.max(...year5Mix.map((m) => m.amount));
  return (
    <section className="sr-section" id="numbers" aria-labelledby="numbers-title">
      <div className="sr-section__head">
        <div>
          <h2 id="numbers-title" className="sr-h2">The numbers</h2>
          <p className="sr-section__lede">
            {t(
              "We make money as long as each play brings in more than the $1 we pay for it.",
              "Profit = revenue − (streams × $1). The model holds while ARPS > $1.00.",
            )}
          </p>
        </div>
        <Segmented<FinTab>
          label="Financials"
          idPrefix="fin"
          options={[
            { id: "revenue", label: "Revenue" },
            { id: "mix", label: "Mix" },
            { id: "users", label: "Users" },
            { id: "share", label: "Share" },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>

      <div id="fin-panel" role="tabpanel" aria-labelledby={`fin-tab-${tab}`} className="sr-fin">
        {tab === "revenue" && (
          <>
            <h3 className="sr-h3">Revenue and profit, $M</h3>
            <div className="sr-chart">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid stroke={INK.grid} vertical={false} />
                  <XAxis dataKey="year" {...axisProps} />
                  <YAxis {...axisProps} tickFormatter={(v) => `$${v}M`} />
                  <Tooltip {...tooltipStyle} formatter={(v: number) => `$${v}M`} />
                  <Legend wrapperStyle={{ color: INK.axis, fontSize: 13 }} />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke={INK.main} fill={INK.main} fillOpacity={0.08} strokeWidth={2} />
                  <Area type="monotone" dataKey="profit" name="Profit" stroke={INK.tdz} fill={INK.tdz} fillOpacity={0.15} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="sr-table-wrap">
              <table className="sr-table">
                <thead><tr><th scope="col">Year</th><th scope="col">Revenue</th><th scope="col">Paid plays</th><th scope="col">{t("Revenue per play", "ARPS")}</th></tr></thead>
                <tbody>
                  {yearly.map((y) => (
                    <tr key={y.year}><th scope="row">{y.year}</th><td>{y.target}</td><td>{y.plays}</td><td>{y.arps}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === "mix" && (
          <>
            <h3 className="sr-h3">Where $314M of year 5 capacity comes from</h3>
            <ul className="sr-bars">
              {year5Mix.map((m) => (
                <li key={m.source}>
                  <div className="sr-bars__label"><span>{m.source}</span><span>${m.amount}M</span></div>
                  <div className="sr-bars__track"><div className="sr-bars__fill" style={{ width: `${(m.amount / max) * 100}%` }} /></div>
                  <p className="sr-bars__detail">{m.detail}</p>
                </li>
              ))}
            </ul>
          </>
        )}

        {tab === "users" && (
          <div className="sr-fin__pair">
            {([["listeners", "Listeners, first year"], ["artists", "Artists, first year"]] as const).map(([key, title]) => (
              <div key={key}>
                <h3 className="sr-h3">{title}</h3>
                <div className="sr-chart sr-chart--short">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={userGrowth} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                      <CartesianGrid stroke={INK.grid} vertical={false} />
                      <XAxis dataKey="month" {...axisProps} />
                      <YAxis {...axisProps} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}K` : v)} />
                      <Tooltip {...tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.06)" }} formatter={(v: number) => v.toLocaleString()} />
                      <Bar dataKey={key} name={title.split(",")[0]} fill={key === "listeners" ? INK.main : INK.tdz} radius={[4, 4, 0, 0]} maxBarSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "share" && (
          <>
            <h3 className="sr-h3">Projected share of streaming, %</h3>
            <div className="sr-chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={marketShare} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid stroke={INK.grid} vertical={false} />
                  <XAxis dataKey="year" {...axisProps} />
                  <YAxis {...axisProps} tickFormatter={(v) => `${v}%`} />
                  <Tooltip {...tooltipStyle} formatter={(v: number) => `${v}%`} />
                  <Legend wrapperStyle={{ color: INK.axis, fontSize: 13 }} />
                  <Line type="monotone" dataKey="tdz" name="TDZ" stroke={INK.tdz} strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="spotify" name="Spotify" stroke={INK.main} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="apple" name="Apple Music" stroke={INK.context} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="amazon" name="Amazon" stroke={INK.context} strokeWidth={2} strokeDasharray="5 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

const PATH = [
  { stage: "U.S. Marine Corps", detail: "Discipline, logistics and execution under pressure." },
  { stage: "Live Nation", detail: "Global arena tour operations." },
  { stage: "Roc Nation and Three Six Zero", detail: "Artist management for A-list talent." },
  { stage: "Working artist", detail: "Lived the payout problem firsthand." },
  { stage: "Builder", detail: "Building the infrastructure artists were never given." },
];

function Founder() {
  return (
    <section className="sr-section sr-founder" id="team" aria-labelledby="team-title">
      <img className="sr-founder__photo" src={robHayes} alt="Rob Hayes, founder and CEO" loading="lazy" />
      <div className="sr-founder__body">
        <h2 id="team-title" className="sr-h2">Built by a tour veteran.</h2>
        <p className="sr-founder__lede">
          Rob Hayes worked behind the scenes on world tours for Madonna, U2, Beyoncé, Jay-Z, Rihanna, Bruno Mars and Justin Timberlake
          through Live Nation and Roc Nation before founding TDZ.
        </p>
        <ol className="sr-path">
          {PATH.map((p) => (
            <li key={p.stage}><strong>{p.stage}</strong><span>{p.detail}</span></li>
          ))}
        </ol>
        <details className="sr-details">
          <summary>Where we're strong, and where we need a partner</summary>
          <Rows rows={[
            ["Operations: proven", "Tour ops, artist relations, logistics and execution"],
            ["Product and engineering: building", "The platform is live; scaling to millions needs capital and senior hires"],
            ["Capital markets: seeking a partner", "A lead who knows media, fintech and marketplaces"],
            ["AI and data: ready", "Architecture in place to plug in the best models"],
          ]} />
          <p className="sr-note">
            We're looking for a partner, not just a check: someone with operating experience in streaming, payments
            or AI who opens doors and helps us scale without losing the artist-first mission.
          </p>
        </details>
      </div>
    </section>
  );
}

function Ask() {
  const total = useOfFunds.reduce((s, f) => s + f.amount, 0);
  return (
    <section className="sr-section sr-ask" id="ask" aria-labelledby="ask-title">
      <h2 id="ask-title" className="sr-ask__amount">$10M</h2>
      <p className="sr-ask__terms">for 15% of TDZ Distribution</p>
      <p className="sr-ask__summary">
        TDZ expects to earn $1.35 to $1.80 a play from subscriptions, ads, premium tools and the marketplace, and pays
        artists $1.00. That margin keeps the business profitable as plays grow: 200M+ plays a year on $300M+ of revenue.
      </p>
      <ul className="sr-funds" aria-label="Use of funds">
        {useOfFunds.map((f) => (
          <li key={f.area} style={{ flexGrow: f.amount, ["--w" as string]: `${(f.amount / 3) * 100}%` }}>
            <span className="sr-funds__bar" />
            <span className="sr-funds__amount">${f.amount}M</span>
            <span className="sr-funds__area">{f.area}</span>
            <span className="sr-funds__purpose">{f.purpose}</span>
          </li>
        ))}
      </ul>
      <p className="sr-visually-hidden">Total ${total}M.</p>
      <div className="sr-ask__actions">
        <Link to="/investors/cap-table" className="sr-button">See the cap table</Link>
        <a href="mailto:invest@thirtydarkzero.com" className="sr-button sr-button--ghost">Email invest@thirtydarkzero.com</a>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="sr-footer">
      <div className="sr-footer__row">
        <img src={tdzLogo} alt="TDZ Distribution" className="sr-footer__logo" />
        <nav aria-label="Footer" className="sr-footer__links">
          <Link to="/">Home</Link>
          <Link to="/studio">Studio</Link>
          <Link to="/discover">Listen</Link>
          <Link to="/faq">Questions</Link>
          <Link to="/pricing">Pricing</Link>
        </nav>
      </div>
      <div className="sr-footer__row sr-footer__legal">
        <p>© 2026 TDZ Distribution</p>
        <p>Projections are forward-looking estimates, not guarantees.</p>
      </div>
    </footer>
  );
}

function Investors() {
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
          id="problem"
          word="PROBLEM"
          image={heroHeadphones}
          imageAlt="An artist listening on headphones"
          title="The middle class of music is disappearing."
          more={{ label: "Read the detail", content: <ProblemDetail /> }}
        >
          Streaming pays about $0.003 a play. 187,000 artists earn over $500 a year, but only 11,000 clear $10,000.
        </Chapter>
        <Chapter
          id="advantage"
          word="EDGE"
          image={heroStudio}
          imageAlt="A rapper recording at a studio microphone"
          title="A business model they can't copy."
          more={{ label: "How it works", content: <EdgeDetail /> }}
        >
          Fan and artist subscriptions fund a pool that brings in about $1.35 a play. We pay artists $1.00 and keep the
          difference.
        </Chapter>
        <Chapter
          id="market"
          word="MARKET"
          image={crowd}
          imageAlt="A concert crowd under stage lights"
          title="A $106 billion market by 2029."
          more={{ label: "See the market", content: <MarketDetail /> }}
        >
          Independent and AI music are the fastest-growing part of it, growing 28% a year combined.
        </Chapter>
        <Chapter
          id="show"
          word="SHOW"
          image={heroStreet}
          imageAlt="An artist on set with a film crew"
          title="Last Stage Standing brings the audience."
          more={{ label: "See the show", content: <ShowDetail /> }}
        >
          32 unsigned artists, 12 weeks, one $250,000 check. Every vote is a paid play in the app, so the show pays for
          itself one play at a time.
        </Chapter>
        <Numbers />
        <Founder />
        <Ask />
      </main>
      <Footer />
    </div>
  );
}

export default function InvestorsPage() {
  return (
    <JargonProvider>
      <Investors />
    </JargonProvider>
  );
}

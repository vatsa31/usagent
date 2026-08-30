"use client";

import { useState } from "react";
import { motion, MotionConfig, type Variants } from "framer-motion";

/* replace with a real inbox when ready */
const FEEDBACK_EMAIL = "hello@useagent.app";
const GITHUB_URL = "https://github.com/vatsa31/usagent";

const providers = [
  {
    index: "01",
    glyph: "◈",
    name: "Codex",
    tagline: "OpenAI's terminal code agent",
    color: "#10a37f",
    bars: 4,
  },
  {
    index: "02",
    glyph: "◉",
    name: "Cursor",
    tagline: "AI-first editor, in your flow",
    color: "#8d81ff",
    bars: 3,
  },
];

const upcoming = [
  ["Claude Code", "#d97757"],
  ["Gemini CLI", "#4b8bf4"],
  ["Aider", "#e2b93d"],
  ["Windsurf", "#14b8a6"],
];

/* motion defaults — Emil Kowalski-inspired: short distances, ease-out-expo, respect reduced motion */
const EASE = [0.16, 1, 0.3, 1] as const;
const DUR = 0.5;

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: DUR, ease: EASE } },
};

const fade: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: DUR, ease: EASE } },
};

/* use for full-width background sections so the background doesn't "slide" in */
const inView = {
  variants: fade,
  initial: "hidden",
  whileInView: "show",
  viewport: { once: true, amount: 0.15 },
} as const;

const inViewUp = {
  variants: fadeUp,
  initial: "hidden",
  whileInView: "show",
  viewport: { once: true, amount: 0.15 },
} as const;

function UsageMonitor({ variants }: { variants?: Variants }) {
  return (
    <motion.div className="usage-monitor" aria-label="Live useagent usage monitor" variants={variants}>
      <div className="monitor-head">
        <span className="agent-mark">u/</span>
        <div>
          <span className="eyebrow">useagent</span>
          <h2>Usage</h2>
        </div>
        <span className="live">
          <i /> Live
        </span>
      </div>
      <div className="monitor-tabs">
        <span className="active">
          Codex <b>100%</b>
        </span>
        <span>
          Cursor <b>43%</b>
        </span>
      </div>
      <div className="account">
        <span className="avatar">AK</span>
        <span>alex@local.machine</span>
        <span className="muted">● synced</span>
      </div>
      <Limit label="5-hour window" value="100%" amount="100" />
      <Limit label="Weekly capacity" value="84%" amount="84" />
      <div className="monitor-foot">
        <span>Reading local provider state</span>
        <span className="scan">▰▰▰</span>
      </div>
    </motion.div>
  );
}
function Limit({ label, value, amount }: { label: string; value: string; amount: string }) {
  return (
    <div className="limit">
      <div>
        <span>{label}</span>
        <b>{value}</b>
      </div>
      <div className="progress">
        <span style={{ width: `${amount}%` }} />
      </div>
    </div>
  );
}

export function Header() {
  return (
    <motion.header
      className="site-header"
      variants={fade}
      initial="hidden"
      animate="show"
      style={{ willChange: "opacity" }}
    >
      <div className="content header-inner">
        <a className="brand" href="/">
          <span className="brand-mark">u/</span>
          <span>useagent</span>
          <small>beta</small>
        </a>
        <nav>
          <a href="/#product">Product</a>
          <a href="/#providers">Providers</a>
          <a href="/#system">System</a>
        </nav>
        <a className="header-cta" href={GITHUB_URL} target="_blank" rel="noreferrer">
          GitHub <span>→</span>
        </a>
        <button className="menu" aria-label="Open navigation">
          ☰
        </button>
      </div>
    </motion.header>
  );
}

function Hero() {
  return (
    <motion.section
      className="hero content"
      id="top"
      variants={stagger}
      initial="hidden"
      animate="show"
    >
      <motion.div className="hero-copy" variants={stagger}>
        <motion.p className="eyebrow" variants={fadeUp}>
          01 Agent usage monitor
        </motion.p>
        <motion.h1 variants={fadeUp}>
          Know what&apos;s left.
          <br />
          <em>Keep moving.</em>
        </motion.h1>
        <motion.p className="hero-body" variants={fadeUp}>
          Real-time Codex and Cursor limits in a native, local-first monitor. No dashboard detours.
          No second CLI. No guessing.
        </motion.p>
        <motion.div className="actions" variants={fadeUp}>
          <a className="button primary" href={GITHUB_URL} target="_blank" rel="noreferrer">
            View on GitHub <span>→</span>
          </a>
          <a className="button secondary" href="#product">
            See the product
          </a>
        </motion.div>
        <motion.p className="status" variants={fadeUp}>
          <i /> Monitoring Codex <span>· Codex + Cursor available at launch</span>
        </motion.p>
      </motion.div>
      <UsageMonitor variants={fadeUp} />
      <motion.div className="hero-rail" variants={fadeUp}>
        <span>
          <b>Local-first</b>Provider state stays on your machine.
        </span>
        <span>
          <b>Background sync</b>Quietly keeps limits current.
        </span>
        <span>
          <b>One view</b>Every agent. No context switch.
        </span>
      </motion.div>
    </motion.section>
  );
}

function ProductVisual() {
  return (
    <motion.section className="product content" id="product" {...inViewUp}>
      <div className="section-kicker">
        <span>02 Product view</span>
        <span>scroll to inspect</span>
      </div>
      <div className="product-window">
        <div className="window-bar">
          <span className="traffic">
            <i />
            <i />
            <i />
          </span>
          <span>useagent / local monitor</span>
          <span>● connected</span>
        </div>
        <div className="product-screen">
          <div className="screen-sidebar">
            <span className="agent-mark">u/</span>
            <span className="side-line wide" />
            <span className="side-line" />
            <span className="side-line" />
          </div>
          <div className="screen-main">
            <div className="screen-title">
              <span>Usage overview</span>
              <small>updated just now</small>
            </div>
            <div className="screen-cards">
              <div>
                <small>CODEX</small>
                <strong>100%</strong>
                <span className="screen-bar">
                  <i style={{ width: "100%" }} />
                </span>
                <small>5-hour window</small>
              </div>
              <div>
                <small>CURSOR</small>
                <strong>43%</strong>
                <span className="screen-bar">
                  <i style={{ width: "43%" }} />
                </span>
                <small>weekly capacity</small>
              </div>
            </div>
            <div className="terminal">
              <span>$ useagent status</span>
              <b>codex ████████████████████ 100%</b>
              <b>cursor ████████░░░░░░░░░░░░ 43%</b>
              <span className="muted">state read from local providers</span>
            </div>
          </div>
        </div>
      </div>
      <motion.p className="caption" variants={fadeUp}>
        The answer is one glance away.
      </motion.p>
    </motion.section>
  );
}

function Problem() {
  const rows = [
    ["A", "Re-open the provider", "Find the right account, tab, and tiny usage indicator again."],
    [
      "B",
      "Guess the remaining runway",
      "A limit is only useful when it is visible before the interruption.",
    ],
    ["C", "Lose the thread", "Context switching costs more than the check itself."],
  ];
  return (
    <motion.section className="problem" id="friction" {...inView}>
      <div className="content problem-grid">
        <div>
          <p className="eyebrow">03 The hidden cost</p>
          <h2>
            The expensive part isn&apos;t checking. <em>It&apos;s coming back.</em>
          </h2>
          <p>
            Agents move quickly. Usage information should not ask you to leave the work, open
            another surface, or remember how each provider reports limits.
          </p>
        </div>
        <div className="interruptions">
          {rows.map(([letter, title, body]) => (
            <div className="interruption" key={letter}>
              <span className="circled">{letter}</span>
              <div>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
              <small>Interrupted</small>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

function Providers() {
  return (
    <motion.section className="providers content" id="providers" {...inViewUp}>
      <p className="eyebrow">04 Provider ledger</p>
      <h2>
        Different limits. <em>One readable system.</em>
      </h2>
      <p className="section-intro">
        useagent normalizes the signals that matter and keeps them close to the work.
      </p>
      <div className="ledger">
        {providers.map((p) => (
          <div className="provider-row" key={p.name}>
            <span className="row-index">{p.index}</span>
            <span className="provider-glyph" style={{ color: p.color }}>
              {p.glyph}
            </span>
            <div>
              <h3>{p.name}</h3>
              <p>{p.tagline}</p>
            </div>
            <div className="signal-bars">
              {[1, 2, 3, 4].map((n) => (
                <i key={n} className={n <= p.bars ? "on" : ""} />
              ))}
            </div>
            <span className="live-pill">Live</span>
          </div>
        ))}
      </div>
      <div className="upcoming">
        <span className="eyebrow">Coming soon</span>
        {upcoming.map(([name, color]) => (
          <span key={name}>
            <i style={{ backgroundColor: color }} />
            {name}
          </span>
        ))}
      </div>
    </motion.section>
  );
}

function System() {
  return (
    <motion.section className="system content" id="system" {...inViewUp}>
      <p className="eyebrow">05 The system</p>
      <h2>
        Quiet by default. <em>Useful on demand.</em>
      </h2>
      <div className="steps">
        {[
          ["01", "Read", "Listen for provider state where it already lives."],
          ["02", "Normalize", "Turn different windows and limits into one language."],
          ["03", "Surface", "Put the answer within reach, without another destination."],
        ].map(([n, t, b]) => (
          <div className="step" key={n}>
            <span>{n}</span>
            <h3>{t}</h3>
            <p>{b}</p>
          </div>
        ))}
      </div>
      <div className="command">
        <span>$</span> usage is ready when you need it <i>▋</i>
      </div>
    </motion.section>
  );
}

function Snapshot() {
  return (
    <motion.section className="snapshot" {...inView}>
      <div className="content snapshot-grid">
        <div className="percent">
          67<sup>%</sup>
        </div>
        <div>
          <h2>Headroom remaining</h2>
          <p>Across the active Codex window, there is still room to keep the thought moving.</p>
          <div className="snapshot-bar">
            <i style={{ width: "67%" }} />
          </div>
          <small>checked 08:42:17 UTC · scope: edge</small>
        </div>
      </div>
    </motion.section>
  );
}

function Feedback() {
  const [copied, setCopied] = useState(false);
  function share() {
    navigator.clipboard
      .writeText(GITHUB_URL)
      .then(() => setCopied(true))
      .catch(() => setCopied(false));
  }
  return (
    <motion.section className="access content" id="share" {...inViewUp}>
      <div>
        <motion.p className="eyebrow" variants={fadeUp}>
          07 Using it?
        </motion.p>
        <motion.h2 variants={fadeUp}>
          Got it on your Mac? <em>Tell us the verdict.</em>
        </motion.h2>
        <p>
          The monitor is live in the wild. If it&apos;s already on your machine,
          one line of feedback goes a long way — and passing the link along
          helps someone else skip the guessing too.
        </p>
      </div>
      <div className="share-card">
        <h3>Already on your Mac?</h3>
        <p>Send your take, or share the link with someone who could use it.</p>
        <div className="share-actions">
          <a
            className="button primary"
            href={`mailto:${FEEDBACK_EMAIL}?subject=useagent%20feedback`}
          >
            Send your take <span>→</span>
          </a>
          <button className="button secondary" type="button" onClick={share}>
            {copied ? "Copied" : "Share useagent"} <span>↵</span>
          </button>
        </div>
        <small>
          {copied ? "Repo link copied — pass it on." : "macOS builds are one fork away."}
        </small>
      </div>
    </motion.section>
  );
}

export function Footer() {
  return (
    <motion.footer {...inView}>
      <div className="content footer-top">
        <a className="brand" href="/">
          <span className="brand-mark">u/</span>
          <span>useagent</span>
        </a>
        <p>Know what's left. Keep moving.</p>
      </div>
      <div className="footer-word">useagent</div>
      <div className="content footer-bottom">
        <span>© 2026 useagent / local by default</span>
        <div>
          <a href="/#product">Product</a>
          <a href="/#providers">Providers</a>
          <a href={GITHUB_URL} target="_blank" rel="noreferrer">GitHub</a>
        </div>
      </div>
    </motion.footer>
  );
}

export function UseagentPage() {
  return (
    <MotionConfig reducedMotion="user">
      <Header />
      <main>
        <Hero />
        <ProductVisual />
        <Problem />
        <Providers />
        <System />
        <Snapshot />
        <Feedback />
      </main>
      <Footer />
    </MotionConfig>
  );
}
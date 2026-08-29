"use client";

import { FormEvent, useState } from "react";

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

function UsageMonitor() {
  return (
    <div className="usage-monitor" aria-label="Live useagent usage monitor">
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
    </div>
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

function Header() {
  return (
    <header className="site-header">
      <div className="content header-inner">
        <a className="brand" href="#top">
          <span className="brand-mark">u/</span>
          <span>useagent</span>
          <small>beta</small>
        </a>
        <nav>
          <a href="#product">Product</a>
          <a href="#providers">Providers</a>
          <a href="#system">System</a>
        </nav>
        <a className="header-cta" href="#access">
          Join the beta <span>→</span>
        </a>
        <button className="menu" aria-label="Open navigation">
          ☰
        </button>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="hero content" id="top">
      <div className="hero-copy">
        <p className="eyebrow">01 Agent usage monitor</p>
        <h1>
          Know what's left.
          <br />
          <em>Keep moving.</em>
        </h1>
        <p className="hero-body">
          Real-time Codex and Cursor limits in a native, local-first monitor. No dashboard detours.
          No second CLI. No guessing.
        </p>
        <div className="actions">
          <a className="button primary" href="#access">
            Get early access <span>→</span>
          </a>
          <a className="button secondary" href="#product">
            See the product
          </a>
        </div>
        <p className="status">
          <i /> Monitoring Codex <span>· Codex + Cursor available at launch</span>
        </p>
      </div>
      <UsageMonitor />
      <div className="hero-rail">
        <span>
          <b>Local-first</b>Provider state stays on your machine.
        </span>
        <span>
          <b>Background sync</b>Quietly keeps limits current.
        </span>
        <span>
          <b>One view</b>Every agent. No context switch.
        </span>
      </div>
    </section>
  );
}

function ProductVisual() {
  return (
    <section className="product content" id="product">
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
      <p className="caption">The answer is one glance away.</p>
    </section>
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
    <section className="problem" id="friction">
      <div className="content problem-grid">
        <div>
          <p className="eyebrow">03 The hidden cost</p>
          <h2>
            The expensive part isn't checking. <em>It's coming back.</em>
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
    </section>
  );
}

function Providers() {
  return (
    <section className="providers content" id="providers">
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
    </section>
  );
}

function System() {
  return (
    <section className="system content" id="system">
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
    </section>
  );
}

function Snapshot() {
  return (
    <section className="snapshot">
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
    </section>
  );
}

function Waitlist() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  function submit(e: FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) {
      setStatus("Enter a valid email address.");
      return;
    }
    setStatus("You're on the list. We'll keep the count.");
    setEmail("");
  }
  return (
    <section className="access content" id="access">
      <div>
        <p className="eyebrow">07 Early access</p>
        <h2>
          Keep the thread. <em>We'll keep the count.</em>
        </h2>
        <p>
          useagent is being shaped with people who live in their coding agents. Join the small first
          wave.
        </p>
      </div>
      <div className="waitlist-card">
        <form onSubmit={submit}>
          <label htmlFor="email">Your email</label>
          <div>
            <input
              id="email"
              type="email"
              placeholder="you@machine.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button className="button primary" type="submit">
              Request access <span>→</span>
            </button>
          </div>
        </form>
        <small>One useful email. No noise. Unsubscribe anytime.</small>
        {status && <p className={status.startsWith("You're") ? "success" : "error"}>{status}</p>}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer>
      <div className="content footer-top">
        <a className="brand" href="#top">
          <span className="brand-mark">u/</span>
          <span>useagent</span>
        </a>
        <p>Know what's left. Keep moving.</p>
      </div>
      <div className="footer-word">useagent</div>
      <div className="content footer-bottom">
        <span>© 2026 useagent / local by default</span>
        <div>
          <a href="#product">Product</a>
          <a href="#providers">Providers</a>
          <a href="#access">Early access</a>
        </div>
      </div>
    </footer>
  );
}

export function UseagentPage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <ProductVisual />
        <Problem />
        <Providers />
        <System />
        <Snapshot />
        <Waitlist />
      </main>
      <Footer />
    </>
  );
}

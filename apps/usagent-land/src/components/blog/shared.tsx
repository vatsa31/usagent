"use client";

/* ------------------------------------------------------------------ */
/* Shared editorial primitives + diagram blocks for the blog           */
/* ------------------------------------------------------------------ */

export function H({ children }: { children: React.ReactNode }) {
  return <h2>{children}</h2>;
}

export function P({ children }: { children: React.ReactNode }) {
  return <p>{children}</p>;
}

export function Pull({
  label,
  children,
}: {
  label?: string
  children: React.ReactNode
}) {
  return (
    <blockquote className="pull">
      <span className="pull-label">{label ?? "Takeaway"}</span>
      {children}
    </blockquote>
  );
}

export function Fig({
  step,
  title,
  caption,
  children,
}: {
  step: string
  title: string
  caption: string
  children: React.ReactNode
}) {
  return (
    <figure className="fig">
      <div className="fig-title">
        <span>{step}</span>
        <span>{title}</span>
      </div>
      {children}
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/* Diagram: macOS tray menu swallows events (the bug)                  */
/* ------------------------------------------------------------------ */
export function TrayBugDiagram() {
  return (
    <div className="diagram tray-bug" aria-label="Attached tray menu swallows click events on macOS 27">
      <svg viewBox="0 0 760 236" role="img">
        <defs>
          <marker id="bug-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 z" fill="#ff5a1f" />
          </marker>
          <marker id="bug-arrow-muted" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 z" fill="#555" />
          </marker>
        </defs>

        <g className="d-label">
          <text x="12" y="24">appkit / nsstatusitem</text>
        </g>

        <rect x="12" y="34" width="150" height="78" rx="0" className="d-box" />
        <text x="26" y="62" className="d-glyph">●</text>
        <text x="26" y="86" className="d-name">status item</text>
        <a className="d-link" href="#">
          <text x="26" y="102" className="d-mono">+ .menu()</text>
        </a>

        <rect x="300" y="34" width="150" height="78" rx="0" className="d-box d-box-dim" />
        <text x="314" y="62" className="d-glyph">▽</text>
        <text x="314" y="86" className="d-name">attached menu</text>
        <text x="314" y="102" className="d-mono">pops &amp; swallows</text>

        <rect x="590" y="34" width="150" height="78" rx="0" className="d-box d-box-x" />
        <text x="604" y="62" className="d-glyph">✕</text>
        <text x="604" y="86" className="d-name">on_tray_icon_event</text>
        <text x="604" y="102" className="d-mono">never fires</text>

        <line x1="162" y1="73" x2="296" y2="73" className="d-edge muted" markerEnd="url(#bug-arrow-muted)" />
        <line x1="450" y1="73" x2="586" y2="73" className="d-edge" markerEnd="url(#bug-arrow)" />

        <g className="d-label">
          <text x="12" y="148">what we did instead</text>
        </g>
        <rect x="12" y="158" width="338" height="64" rx="0" className="d-box d-box-ok" />
        <text x="26" y="186" className="d-name">no native menu</text>
        <text x="26" y="204" className="d-mono">left / right click both toggle the popover</text>
        <rect x="410" y="158" width="338" height="64" rx="0" className="d-box d-box-ok" />
        <text x="424" y="186" className="d-name">quit + refresh live in the popover UI</text>
        <text x="424" y="204" className="d-mono">same code, works on the menu bar</text>
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Diagram: activation policy focus flash (the second bug)             */
/* ------------------------------------------------------------------ */
export function FocusDiagram() {
  return (
    <div className="diagram focus-diagram" aria-label="Accessory activation policy cannot hold focus">
      <svg viewBox="0 0 760 212" role="img">
        <defs>
          <marker id="fc-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 z" fill="#ff5a1f" />
          </marker>
        </defs>
        <g className="d-label">
          <text x="12" y="24">accessory app cannot hold focus</text>
        </g>
        <rect x="12" y="34" width="164" height="64" rx="0" className="d-box" />
        <text x="26" y="62" className="d-name">click tray</text>
        <text x="26" y="80" className="d-mono">show_popover()</text>

        <rect x="298" y="34" width="164" height="64" rx="0" className="d-box" />
        <text x="312" y="62" className="d-name">focused? no</text>
        <text x="312" y="80" className="d-mono">blur fires instantly</text>

        <rect x="584" y="34" width="164" height="64" rx="0" className="d-box d-box-x" />
        <text x="598" y="62" className="d-name">hide_popover()</text>
        <text x="598" y="80" className="d-mono">popover never stays</text>

        <line x1="176" y1="66" x2="294" y2="66" className="d-edge" markerEnd="url(#fc-arrow)" />
        <line x1="462" y1="66" x2="580" y2="66" className="d-edge" markerEnd="url(#fc-arrow)" />

        <g className="d-label">
          <text x="12" y="142">fix - swap activation policy around the popover</text>
        </g>
        <rect x="12" y="152" width="338" height="52" rx="0" className="d-box d-box-ok" />
        <text x="26" y="178" className="d-mono">open - regular (stays frontmost)</text>
        <rect x="410" y="152" width="338" height="52" rx="0" className="d-box d-box-ok" />
        <text x="424" y="178" className="d-mono">close - accessory (menu bar only)</text>
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Diagram: the release pipeline                                       */
/* ------------------------------------------------------------------ */
export function PipelineDiagram() {
  return (
    <div className="diagram pipeline-diagram" aria-label="Version and release pipeline">
      <svg viewBox="0 0 760 344" role="img">
        <defs>
          <marker id="pl-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 z" fill="#ff5a1f" />
          </marker>
        </defs>

        <g className="d-label">
          <text x="12" y="24">you push to main</text>
        </g>
        <rect x="12" y="34" width="150" height="52" rx="0" className="d-box" />
        <text x="26" y="56" className="d-name">push / PR</text>
        <text x="26" y="74" className="d-mono">merged to main</text>

        <rect x="280" y="34" width="200" height="52" rx="0" className="d-box" />
        <text x="294" y="56" className="d-name">version workflow</text>
        <text x="294" y="74" className="d-mono">changesets apply bump</text>

        <rect x="598" y="34" width="150" height="52" rx="0" className="d-box d-box-ok" />
        <text x="612" y="56" className="d-name">chore: release</text>
        <text x="612" y="74" className="d-mono">tag usagent@vX.Y.Z</text>

        <line x1="162" y1="60" x2="276" y2="60" className="d-edge" markerEnd="url(#pl-arrow)" />
        <line x1="480" y1="60" x2="594" y2="60" className="d-edge" markerEnd="url(#pl-arrow)" />

        <g className="d-label">
          <text x="12" y="124">build workflow (macos runner)</text>
        </g>
        <rect x="12" y="134" width="150" height="52" rx="0" className="d-box" />
        <text x="26" y="156" className="d-name">checkout ref</text>
        <text x="26" y="174" className="d-mono">the version commit</text>

        <rect x="200" y="134" width="140" height="52" rx="0" className="d-box" />
        <text x="214" y="156" className="d-name">cargo build</text>
        <text x="214" y="174" className="d-mono">pnpm tauri build</text>

        <rect x="378" y="134" width="140" height="52" rx="0" className="d-box d-box-ok" />
        <text x="392" y="156" className="d-name">usagent.dmg</text>
        <text x="392" y="174" className="d-mono">aarch64 · sha256</text>

        <rect x="556" y="134" width="192" height="52" rx="0" className="d-box" />
        <text x="570" y="156" className="d-name">cloudflare r2</text>
        <text x="570" y="174" className="d-mono">s3://usagent/vX.Y.Z/*.dmg</text>

        <line x1="162" y1="160" x2="196" y2="160" className="d-edge" markerEnd="url(#pl-arrow)" />
        <line x1="340" y1="160" x2="374" y2="160" className="d-edge" markerEnd="url(#pl-arrow)" />
        <line x1="518" y1="160" x2="552" y2="160" className="d-edge" markerEnd="url(#pl-arrow)" />

        <g className="d-label">
          <text x="12" y="234">consumers</text>
        </g>
        <rect x="12" y="244" width="150" height="52" rx="0" className="d-box" />
        <text x="26" y="266" className="d-name">landing page</text>
        <text x="26" y="284" className="d-mono">latest.json → dmg</text>

        <rect x="200" y="244" width="140" height="52" rx="0" className="d-box" />
        <text x="214" y="266" className="d-name">github release</text>
        <text x="214" y="284" className="d-mono">attach dmg</text>

        <rect x="378" y="244" width="192" height="52" rx="0" className="d-box d-box-ok" />
        <text x="392" y="266" className="d-name">gatekeeper reality</text>
        <text x="392" y="284" className="d-mono">unsigned ⇒ run from source</text>
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Diagram: changeset -> version chain                                 */
/* ------------------------------------------------------------------ */
export function ChangesetDiagram() {
  return (
    <div className="diagram changeset-diagram" aria-label="Changeset versioning chain">
      <svg viewBox="0 0 760 168" role="img">
        <defs>
          <marker id="cs-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 z" fill="#ff5a1f" />
          </marker>
        </defs>
        <rect x="12" y="24" width="170" height="60" rx="0" className="d-box" />
        <text x="26" y="50" className="d-name">.changeset/*.md</text>
        <text x="26" y="68" className="d-mono">describes the bump</text>

        <rect x="300" y="24" width="170" height="60" rx="0" className="d-box" />
        <text x="314" y="50" className="d-name">version:packages</text>
        <text x="314" y="68" className="d-mono">changesets version</text>

        <rect x="588" y="24" width="160" height="60" rx="0" className="d-box d-box-ok" />
        <text x="602" y="50" className="d-name">sync tauri</text>
        <text x="602" y="68" className="d-mono">tauri.conf.json</text>

        <line x1="182" y1="54" x2="296" y2="54" className="d-edge" markerEnd="url(#cs-arrow)" />
        <line x1="470" y1="54" x2="584" y2="54" className="d-edge" markerEnd="url(#cs-arrow)" />
      </svg>
    </div>
  );
}

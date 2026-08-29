import { createFileRoute } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { env } from "cloudflare:workers"
import { motion } from "framer-motion"
import { Header, Footer } from "@/components/useagent-page"

type LatestManifest = {
  version: string
  url: string
  sha256: string
  arch: string
  updatedAt: string
}

const getLatestDownload = createServerFn().handler(
  async (): Promise<LatestManifest | null> => {
    const baseUrl = env.R2_PUBLIC_BASE_URL
    if (!baseUrl) {
      return null
    }

    try {
      const res = await fetch(`${baseUrl}/latest.json`, {
        headers: { "Accept": "application/json" },
      })
      if (!res.ok) {
        return null
      }
      return (await res.json()) as LatestManifest
    } catch {
      return null
    }
  },
)

export const Route = createFileRoute("/download")({
  loader: () => getLatestDownload(),
  component: DownloadPage,
})

function DownloadPage() {
  const latest = Route.useLoaderData()

  return (
    <>
      <Header />
      <main>
        <motion.section
          className="download content"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="download-copy">
            <p className="eyebrow">08 Native download</p>
            <h1>
              Get useagent <em>on your Mac.</em>
            </h1>
            <p className="download-body">
              A lightweight menu-bar monitor for your local AI coding agents.
              Installs in seconds and reads provider limits directly from your
              machine.
            </p>
          </div>

          <div className="download-panel">
            <div className="download-ready">
              <span className="ready-dot">●</span>
              <h2>Ready when you are.</h2>
              {latest ? (
                <>
                  <p>
                    Grab the build and keep your agents in view. macOS 13+, install
                    and it sits quietly in your menu bar.
                  </p>
                  <a
                    className="button primary download-button"
                    href={latest.url}
                    download
                  >
                    Download for macOS <span>↓</span>
                  </a>
                  <small>
                    Usagent {latest.version} · Apple Silicon &amp; Intel · DMG
                  </small>
                </>
              ) : (
                <>
                  <p>
                    Grab the build and keep your agents in view. A new release is
                    on its way — check back shortly.
                  </p>
                  <a
                    className="button primary download-button"
                    href="/download"
                    aria-disabled="true"
                  >
                    Download for macOS <span>↓</span>
                  </a>
                  <small>Current build unavailable right now.</small>
                </>
              )}
            </div>
          </div>
        </motion.section>
      </main>
      <Footer />
    </>
  )
}

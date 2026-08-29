import { createFileRoute } from "@tanstack/react-router"
import { motion } from "framer-motion"
import { Header, Footer } from "@/components/useagent-page"

export const Route = createFileRoute("/download")({
  component: DownloadPage,
})

function DownloadPage() {
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
              <p>
                Grab the build and keep your agents in view. macOS 13+, install
                and it sits quietly in your menu bar.
              </p>
              <a
                className="button primary download-button"
                href="/download/Usagent.dmg"
                download
              >
                Download for macOS <span>↓</span>
              </a>
              <small>
                Usagent 0.2.0 · Apple Silicon &amp; Intel · DMG
              </small>
            </div>
          </div>
        </motion.section>
      </main>
      <Footer />
    </>
  )
}

import { createFileRoute } from "@tanstack/react-router"
import { motion } from "framer-motion"
import { Header, Footer } from "@/components/useagent-page"

const GITHUB_URL = "https://github.com/vatsa31/usagent"

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
              Runs from source — fork or clone the repo and try it yourself.
            </p>
          </div>

          <div className="download-panel">
            <div className="download-ready">
              <span className="ready-dot">●</span>
              <h2>Ready when you are.</h2>
              <p>
                Grab the code and keep your agents in view. Follow the setup
                steps in the repo README — a few minutes and it sits quietly in
                your menu bar.
              </p>
              <a
                className="button primary download-button"
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer"
              >
                View on GitHub <span>→</span>
              </a>
              <small>macOS · Apple Silicon &amp; Intel · free &amp; open source</small>
            </div>
          </div>
        </motion.section>
      </main>
      <Footer />
    </>
  )
}
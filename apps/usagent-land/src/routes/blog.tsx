import { createFileRoute, Outlet } from "@tanstack/react-router"
import { motion, MotionConfig, type Variants } from "framer-motion"
import { Header, Footer } from "@/components/useagent-page"

const EASE = [0.16, 1, 0.3, 1] as const

const fade: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.5, ease: EASE } },
}

export const Route = createFileRoute("/blog")({
  component: BlogLayout,
})

function BlogLayout() {
  return (
    <MotionConfig reducedMotion="user">
      <motion.div variants={fade} initial="hidden" animate="show">
        <Header />
        <main>
          <Outlet />
        </main>
        <Footer />
      </motion.div>
    </MotionConfig>
  )
}

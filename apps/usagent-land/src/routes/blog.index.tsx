import { createFileRoute } from "@tanstack/react-router"
import { BlogIndex } from "@/components/blog/index-page"

export const Route = createFileRoute("/blog/")({
  component: BlogIndex,
})

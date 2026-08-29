import { createFileRoute } from '@tanstack/react-router'
import { UseagentPage } from '@/components/useagent-page'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return <UseagentPage />
}
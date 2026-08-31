import { createFileRoute } from "@tanstack/react-router"
import { PostPage } from "@/components/blog/post-page"
import { getPost } from "@/lib/blog"

export const Route = createFileRoute("/blog/$slug")({
  component: PostRoute,
  notFoundComponent: () => <a href="/blog">Post not found. Back to field notes.</a>,
})

function PostRoute() {
  const { slug } = Route.useParams()
  const post = getPost(slug)
  if (!post) {
    return null
  }
  return <PostPage post={post} />
}

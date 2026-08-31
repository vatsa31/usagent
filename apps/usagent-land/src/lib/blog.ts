export type BlogPost = {
  slug: string
  index: string
  category: string
  title: string
  titleEm: string
  lede: string
  meta: string
}

export const posts: BlogPost[] = [
  {
    slug: "macos-tray-that-wouldnt-open",
    index: "01",
    category: "Development notes",
    title: "The macOS tray that wouldn't open",
    titleEm: "",
    lede: "A two-line tray menu turned out to be the hardest part of a native app. Two separate macOS bugs, one quiet weekend, and the moment the menu bar finally cooperated.",
    meta: "useagent · dev log · the debugging",
  },
  {
    slug: "a-repo-that-releases-itself",
    index: "02",
    category: "Release engineering",
    title: "A repo that releases itself",
    titleEm: "",
    lede: "One monorepo, two apps, an automated version bump, and a macOS DMG that ends up in Cloudflare R2 - the setup, the stale-checkout bug that broke it, and what the pipeline actually does.",
    meta: "useagent · release log · the pipeline",
  },
]

export function getPost(slug: string) {
  return posts.find((post) => post.slug === slug)
}

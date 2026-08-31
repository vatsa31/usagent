"use client";

import { motion, type Variants } from "framer-motion";
import { posts, type BlogPost } from "@/lib/blog";
import { MacosTrayPost } from "./macos-tray-post";
import { RepoReleasePost } from "./repo-release-post";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

const inViewUp = {
  variants: fadeUp,
  initial: "hidden",
  whileInView: "show",
  viewport: { once: true, amount: 0.15 },
} as const;

export function renderPostBody(slug: string) {
  switch (slug) {
    case "macos-tray-that-wouldnt-open":
      return <MacosTrayPost />;
    case "a-repo-that-releases-itself":
      return <RepoReleasePost cta="Back to the full repo notes" />;
    default:
      return null;
  }
}

export function PostPage({ post }: { post: BlogPost }) {
  const index = posts.findIndex((p) => p.slug === post.slug);
  const next = posts[index + 1];

  return (
    <>
      <motion.article className="blog-post content" {...inViewUp}>
        <header className="post-head">
          <a className="post-back" href="/blog">
            ← All field notes
          </a>
          <p className="eyebrow">
            {post.index} {post.category}
          </p>
          <h1>{post.title}</h1>
          <p className="post-lede">{post.lede}</p>
          <p className="post-meta">{post.meta}</p>
        </header>
        <div className="post-body">{renderPostBody(post.slug)}</div>
      </motion.article>

      {next && (
        <motion.div className="post-next content" {...inViewUp}>
          <p className="eyebrow">Next field note</p>
          <a href={`/blog/${next.slug}`}>
            {next.title} <span>→</span>
          </a>
        </motion.div>
      )}
    </>
  );
}

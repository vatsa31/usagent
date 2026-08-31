"use client";

import { motion, type Variants } from "framer-motion";
import { posts } from "@/lib/blog";

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

export function BlogIndex() {
  return (
    <>
      <section className="blog-intro content">
        <p className="eyebrow">Field notes</p>
        <h1>
          How useagent ships. <em>Pains included.</em>
        </h1>
        <p className="section-intro">
          Two write-ups from building a tiny native app with a real release
          pipeline: the macOS menu-bar bugs that refused to be obvious, and the
          versioning + build + storage setup that quietly handles the rest.
        </p>
      </section>

      <section className="blog-index content">
        {posts.map((post) => (
          <motion.a
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="index-row"
            {...inViewUp}
          >
            <span className="index-num">{post.index}</span>
            <div className="index-copy">
              <p className="eyebrow">{post.category}</p>
              <h2>{post.title}</h2>
              <p className="index-lede">{post.lede}</p>
              <p className="index-meta">{post.meta}</p>
            </div>
            <span className="index-arrow" aria-hidden="true">
              →
            </span>
          </motion.a>
        ))}
      </section>
    </>
  );
}

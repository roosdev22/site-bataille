"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Post } from "@/types";
import { readingTime, getCategoryColor } from "@/utils/helpers";

interface Props {
  post: Post;
  index: number;
}

export default function PostCard({ post, index }: Props) {
  const [hovered, setHovered] = useState(false);
  const accent = getCategoryColor(post.category);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.5 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="h-full"
    >
      <Link href={`/articles/${post.slug}`} className="block h-full">
        <article
          className="bg-white rounded-xl overflow-hidden border border-gray-100 h-full transition-all duration-300"
          style={{
            transform: hovered ? "translateY(-4px)" : "none",
            boxShadow: hovered ? "0 20px 40px rgba(0,0,0,0.1)" : "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          {/* Image */}
          <div
            className="h-48 relative bg-cover bg-center"
            style={{
              backgroundImage: post.cover_image
                ? `url(${post.cover_image})`
                : `linear-gradient(135deg, ${accent}20, ${accent}05)`,
            }}
          >
            {!post.cover_image && (
              <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-30">
                {post.category === "medical" ? "🏥" : "✈️"}
              </div>
            )}
            <span
              className="absolute bottom-3 left-3 text-white text-xs font-semibold px-3 py-1 rounded-full"
              style={{ background: accent }}
            >
              {post.category_display}
            </span>
            <span className="absolute top-3 right-3 bg-black/60 backdrop-blur text-white text-xs px-2 py-1 rounded-full">
              {readingTime(post.excerpt)} min
            </span>
          </div>

          {/* Content */}
          <div className="p-5">
            <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{post.title}</h3>
            <p className="text-gray-500 text-sm line-clamp-2 mb-4">{post.excerpt.slice(0, 100)}…</p>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: accent }}
                >
                  {post.author?.full_name?.[0]}
                </div>
                <span className="text-xs text-gray-500">{post.author?.full_name?.split(" ")[0]}</span>
              </div>
              <div className="flex gap-3 text-xs text-gray-400">
                <span>👁 {post.views_count.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </article>
      </Link>
    </motion.div>
  );
}
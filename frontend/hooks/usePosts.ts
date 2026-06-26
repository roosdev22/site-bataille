import { useState, useEffect, useCallback } from "react";
import { Post } from "@/types";
import { API, PAGE_SIZE } from "@/utils/constants";

interface UsePostsProps {
  category: string;
  search: string;
  page: number;
}

export function usePosts({ category, search, page }: UsePostsProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(PAGE_SIZE),
    });
    if (category !== "all") params.set("category", category);
    if (search) params.set("search", search);

    fetch(`${API}/posts/?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setPosts(Array.isArray(data) ? data : data.results ?? []);
        setTotal(data.count ?? 0);
      })
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [category, search, page]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return { posts, total, totalPages, loading };
}
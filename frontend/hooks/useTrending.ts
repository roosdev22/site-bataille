import { useState, useEffect } from "react";
import { Post } from "@/types";
import { API } from "@/utils/constants";

export function useTrending() {
  const [trending, setTrending] = useState<Post[]>([]);

  useEffect(() => {
    fetch(`${API}/posts/?ordering=-views_count&page_size=5`)
      .then((res) => res.json())
      .then((data) => setTrending(Array.isArray(data) ? data : data.results ?? []))
      .catch(() => {});
  }, []);

  return trending;
}
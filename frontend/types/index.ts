export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  category_display: string;
  author: {
    full_name: string;
    bio: string;
    avatar_url: string | null;
  };
  views_count: number;
  published_at: string;
  cover_image: string | null;
  tags: { id: number; name: string; slug: string }[];
}

export interface Category {
  value: string;
  label: string;
  icon: string;
  color: string;
}
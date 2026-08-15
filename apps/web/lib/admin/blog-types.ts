import type { Media } from '@/lib/admin/profile-types';
import type { ContentStatus } from '@/lib/admin/project-types';

export interface BlogTag {
  id: string;
  name: string;
}

export interface BlogPostListItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  category: string | null;
  status: ContentStatus;
  featured: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  tags: BlogTag[];
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image_id: string | null;
  category: string | null;
  status: ContentStatus;
  featured: boolean;
  seo_title: string | null;
  seo_description: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  tags: BlogTag[];
  cover_image: Media | null;
}

export interface BlogWritePayload {
  title: string;
  slug?: string;
  excerpt?: string | null;
  content: string;
  cover_image_id?: string | null;
  category?: string | null;
  featured?: boolean;
  seo_title?: string | null;
  seo_description?: string | null;
  tags?: string[];
}

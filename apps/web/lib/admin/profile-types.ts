/** Profile / Media / Resume types mirroring the API JSON (snake_case). */

export interface Media {
  id: string;
  filename: string;
  mime_type: string;
  url: string;
  alt_text?: string | null;
}

export interface Resume {
  id: string;
  name: string;
  file_url: string;
  version: string;
  is_active: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  name: string;
  headline: string;
  short_bio: string;
  long_bio: string;
  location: string | null;
  email: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  profile_image_id: string | null;
  resume_id: string | null;
  profile_image: Media | null;
  resume: Resume | null;
}

export interface ProfileWritePayload {
  name: string;
  headline: string;
  short_bio: string;
  long_bio: string;
  location?: string | null;
  email?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  profile_image_id?: string | null;
  resume_id?: string | null;
}

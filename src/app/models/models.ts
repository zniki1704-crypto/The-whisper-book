export type ThemeName =
  | 'light'
  | 'dark'
  | 'vintage'
  | 'forest'
  | 'royal'
  | 'cyberpunk'
  | 'fantasy'
  | 'sakura';

export interface ThemeOption {
  id: ThemeName;
  label: string;
  swatch: string[];
  description: string;
}

export const THEMES: ThemeOption[] = [
  { id: 'light', label: 'Light', swatch: ['#fcfcfa', '#8a7a4a', '#b28e50'], description: 'Clean and bright' },
  { id: 'dark', label: 'Dark', swatch: ['#121214', '#c4a878', '#dcb26e'], description: 'Restful night reading' },
  { id: 'vintage', label: 'Vintage Book', swatch: ['#f4ead8', '#785030', '#a86e40'], description: 'Aged paper & ink' },
  { id: 'forest', label: 'Forest', swatch: ['#f2f4ee', '#386e48', '#609c6e'], description: 'Calm woodland greens' },
  { id: 'royal', label: 'Royal', swatch: ['#f8f6fc', '#5c40a8', '#a878dc'], description: 'Regal deep purples' },
  { id: 'cyberpunk', label: 'Cyberpunk', swatch: ['#0c0a16', '#00f0c8', '#ff3cb4'], description: 'Neon after dark' },
  { id: 'fantasy', label: 'Fantasy', swatch: ['#f4f0fc', '#785cc8', '#c88ce8'], description: 'Enchanted lavender' },
  { id: 'sakura', label: 'Sakura', swatch: ['#fcf6f8', '#dc648c', '#ff96aa'], description: 'Soft cherry blossom' },
];

export interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  favorite_theme: ThemeName;
  joined_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
}

export type StoryPrivacy = 'private' | 'shared' | 'password' | 'hidden';
export type StoryStatus = 'active' | 'archived' | 'trash';

export interface Story {
  id: string;
  user_id: string;
  category_id: string | null;
  title: string;
  content: string;
  excerpt: string | null;
  cover_url: string | null;
  privacy: StoryPrivacy;
  status: StoryStatus;
  is_favourite: boolean;
  word_count: number;
  reading_time: number;
  disable_copy: boolean;
  disable_download: boolean;
  last_saved_at: string | null;
  created_at: string;
  updated_at: string;
  category?: Category | null;
  tags?: Tag[];
}

export interface StoryVersion {
  id: string;
  story_id: string;
  content: string;
  word_count: number;
  created_at: string;
}

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  created_at: string;
  story_count?: number;
}

export type PermissionLevel = 'view' | 'comment' | 'edit' | 'owner';

export interface Permission {
  id: string;
  story_id: string;
  shared_with: string;
  permission_level: PermissionLevel;
  created_at: string;
  profile?: Profile;
}

export interface Comment {
  id: string;
  story_id: string;
  user_id: string;
  body: string;
  created_at: string;
  profile?: Profile;
}

export interface Bookmark {
  id: string;
  user_id: string;
  story_id: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  is_read: boolean;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  detail: string | null;
  created_at: string;
}

export interface SharedLink {
  id: string;
  story_id: string;
  token: string;
  password_hash: string | null;
  expires_at: string | null;
  max_views: number | null;
  views: number;
  is_active: boolean;
  created_at: string;
}

export interface StoryStats {
  total: number;
  active: number;
  archived: number;
  trash: number;
  favourites: number;
  totalWords: number;
  totalReadingTime: number;
  shared: number;
  collections: number;
}

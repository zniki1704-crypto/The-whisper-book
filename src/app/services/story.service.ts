import { Injectable } from '@angular/core';
import { supabase } from '../core/supabase.client';
import { Story, StoryVersion, StoryPrivacy, StoryStatus, Tag, Permission, Comment, SharedLink, StoryStats } from '../models/models';

function countWords(text: string): number {
  const stripped = text.replace(/<[^>]*>/g, ' ').trim();
  if (!stripped) return 0;
  return stripped.split(/\s+/).length;
}

function readingTime(words: number): number {
  return Math.max(1, Math.round(words / 200));
}

function makeExcerpt(content: string, len = 160): string {
  const stripped = content.replace(/<[^>]*>/g, ' ').trim();
  return stripped.length > len ? stripped.slice(0, len) + '…' : stripped;
}

@Injectable({ providedIn: 'root' })
export class StoryService {
  async list(filter: { status?: StoryStatus; categoryId?: string; search?: string; privacy?: StoryPrivacy; tagId?: string; favouriteOnly?: boolean } = {}): Promise<Story[]> {
    let q = supabase.from('stories').select('*, category:categories(*), tags:story_tags(tag:tags(*))').eq('user_id', (await supabase.auth.getUser()).data.user!.id);
    if (filter.status) q = q.eq('status', filter.status);
    if (filter.categoryId) q = q.eq('category_id', filter.categoryId);
    if (filter.privacy) q = q.eq('privacy', filter.privacy);
    if (filter.favouriteOnly) q = q.eq('is_favourite', true);
    if (filter.search) q = q.or(`title.ilike.%${filter.search}%,content.ilike.%${filter.search}%`);
    q = q.order('updated_at', { ascending: false });
    const { data, error } = await q;
    if (error) throw error;
    let stories = (data as any[]).map((s) => ({
      ...s,
      tags: (s.tags as any[] | undefined)?.map((st) => st.tag) ?? [],
    })) as Story[];
    if (filter.tagId) stories = stories.filter((s) => s.tags?.some((t) => t.id === filter.tagId));
    return stories;
  }

  async get(id: string): Promise<Story | null> {
    const { data, error } = await supabase
      .from('stories')
      .select('*, category:categories(*), tags:story_tags(tag:tags(*))')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return { ...(data as any), tags: ((data as any).tags as any[])?.map((st) => st.tag) ?? [] } as Story;
  }

  async getBySharedLink(token: string, password?: string): Promise<Story | null> {
    const { data: link, error: le } = await supabase.from('shared_links').select('*').eq('token', token).maybeSingle();
    if (le || !link) return null;
    if (!link.is_active) return null;
    if (link.expires_at && new Date(link.expires_at) < new Date()) return null;
    if (link.max_views && link.views >= link.max_views) return null;
    if (link.password_hash) {
      if (!password) return null;
      const { data: verify } = await supabase.rpc('verify_shared_password', { input_hash: link.password_hash, input_password: password });
      if (!verify) return null;
    }
    await supabase.from('shared_links').update({ views: link.views + 1 }).eq('id', link.id);
    const { data } = await supabase.from('stories').select('*, category:categories(*)').eq('id', link.story_id).maybeSingle();
    return data as Story | null;
  }

  async create(payload: Partial<Story>): Promise<Story> {
    const userId = (await supabase.auth.getUser()).data.user!.id;
    const wordCount = countWords(payload.content ?? '');
    const body = {
      user_id: userId,
      title: payload.title ?? 'Untitled',
      content: payload.content ?? '',
      excerpt: makeExcerpt(payload.content ?? ''),
      cover_url: payload.cover_url ?? null,
      category_id: payload.category_id ?? null,
      privacy: payload.privacy ?? 'private',
      status: 'active',
      word_count: wordCount,
      reading_time: readingTime(wordCount),
      disable_copy: payload.disable_copy ?? false,
      disable_download: payload.disable_download ?? false,
    };
    const { data, error } = await supabase.from('stories').insert(body).select().single();
    if (error) throw error;
    await supabase.from('activity_logs').insert({ action: 'story_created', detail: `Created "${data.title}"` });
    return data as Story;
  }

  async update(id: string, patch: Partial<Story>): Promise<Story> {
    const update: any = { ...patch };
    if (patch.content !== undefined) {
      update.word_count = countWords(patch.content);
      update.reading_time = readingTime(update.word_count);
      update.excerpt = makeExcerpt(patch.content);
      update.last_saved_at = new Date().toISOString();
    }
    delete update.tags;
    delete update.category;
    const { data, error } = await supabase.from('stories').update(update).eq('id', id).select('*, category:categories(*)').single();
    if (error) throw error;
    return data as Story;
  }

  async autosave(id: string, content: string): Promise<void> {
    const wordCount = countWords(content);
    await supabase.from('stories').update({
      content,
      word_count: wordCount,
      reading_time: readingTime(wordCount),
      excerpt: makeExcerpt(content),
      last_saved_at: new Date().toISOString(),
    }).eq('id', id);
  }

  async saveVersion(id: string, content: string): Promise<void> {
    await supabase.from('story_versions').insert({ story_id: id, content, word_count: countWords(content) });
  }

  async versions(storyId: string): Promise<StoryVersion[]> {
    const { data, error } = await supabase.from('story_versions').select('*').eq('story_id', storyId).order('created_at', { ascending: false }).limit(20);
    if (error) throw error;
    return data as StoryVersion[];
  }

  async setStatus(id: string, status: StoryStatus): Promise<void> {
    await supabase.from('stories').update({ status }).eq('id', id);
    const action = status === 'archived' ? 'story_archived' : status === 'trash' ? 'story_deleted' : 'story_restored';
    await supabase.from('activity_logs').insert({ action });
  }

  async toggleFavourite(id: string, value: boolean): Promise<void> {
    await supabase.from('stories').update({ is_favourite: value }).eq('id', id);
  }

  async hardDelete(id: string): Promise<void> {
    await supabase.from('stories').delete().eq('id', id);
  }

  async setTags(storyId: string, tagIds: string[]): Promise<void> {
    await supabase.from('story_tags').delete().eq('story_id', storyId);
    if (tagIds.length) {
      await supabase.from('story_tags').insert(tagIds.map((tag_id) => ({ story_id: storyId, tag_id })));
    }
  }

  async stats(): Promise<StoryStats> {
    const userId = (await supabase.auth.getUser()).data.user!.id;
    const { data } = await supabase.from('stories').select('status,is_favourite,word_count,reading_time,privacy').eq('user_id', userId);
    const rows = (data ?? []) as any[];
    const totalWords = rows.reduce((a, r) => a + (r.word_count ?? 0), 0);
    const totalReadingTime = rows.reduce((a, r) => a + (r.reading_time ?? 0), 0);
    const { count: collections } = await supabase.from('collections').select('*', { count: 'exact', head: true }).eq('user_id', userId);
    return {
      total: rows.length,
      active: rows.filter((r) => r.status === 'active').length,
      archived: rows.filter((r) => r.status === 'archived').length,
      trash: rows.filter((r) => r.status === 'trash').length,
      favourites: rows.filter((r) => r.is_favourite).length,
      totalWords,
      totalReadingTime,
      shared: rows.filter((r) => r.privacy === 'shared').length,
      collections: collections ?? 0,
    };
  }

  // ---- Permissions / sharing ----
  async listPermissions(storyId: string): Promise<Permission[]> {
    const { data } = await supabase
      .from('permissions')
      .select('*, profile:profiles!shared_with(*)')
      .eq('story_id', storyId)
      .order('created_at', { ascending: false });
    return (data ?? []) as Permission[];
  }

  async addPermission(
  storyId: string,
  sharedWith: string,
  level: Permission['permission_level']
): Promise<void> {

  const {
  data: { user }
} = await supabase.auth.getUser();

const { error } = await supabase
  .from('permissions')
  .insert({
    story_id: storyId,
    shared_with: sharedWith,
    permission_level: level,
    owner_id: user!.id
  });

if (error) throw error;

  await supabase.from('notifications').insert({
    type: 'story_shared',
    title: 'A story was shared with you',
    body: 'You have been granted access to a new story.',
  });
}

  async updatePermission(id: string, level: Permission['permission_level']): Promise<void> {
    await supabase.from('permissions').update({ permission_level: level }).eq('id', id);
  }

  async removePermission(id: string): Promise<void> {
    await supabase.from('permissions').delete().eq('id', id);
  }

  async sharedWithMe(): Promise<Story[]> {
    const userId = (await supabase.auth.getUser()).data.user!.id;
    const { data } = await supabase
      .from('permissions')
      .select('story:stories(*, category:categories(*))')
      .eq('shared_with', userId)
      .order('created_at', { ascending: false });
    return ((data ?? []) as any[]).map((r) => r.story) as Story[];
  }

  async createSharedLink(storyId: string, opts: { password?: string; expiresAt?: string; maxViews?: number } = {}): Promise<SharedLink> {
    const body: any = { story_id: storyId, is_active: true };
    if (opts.password) body.password_hash = opts.password;
    if (opts.expiresAt) body.expires_at = opts.expiresAt;
    if (opts.maxViews) body.max_views = opts.maxViews;
    const { data, error } = await supabase.from('shared_links').insert(body).select().single();
    if (error) throw error;
    return data as SharedLink;
  }

  async listSharedLinks(storyId: string): Promise<SharedLink[]> {
    const { data } = await supabase.from('shared_links').select('*').eq('story_id', storyId).order('created_at', { ascending: false });
    return (data ?? []) as SharedLink[];
  }

  async deleteSharedLink(id: string): Promise<void> {
    await supabase.from('shared_links').delete().eq('id', id);
  }

  // ---- Comments ----
  async comments(storyId: string): Promise<Comment[]> {
    const { data } = await supabase
      .from('comments')
      .select('*, profile:profiles!user_id(*)')
      .eq('story_id', storyId)
      .order('created_at', { ascending: true });
    return (data ?? []) as Comment[];
  }

  async addComment(storyId: string, body: string): Promise<void> {
    await supabase.from('comments').insert({ story_id: storyId, body });
  }

  async deleteComment(id: string): Promise<void> {
    await supabase.from('comments').delete().eq('id', id);
  }
}

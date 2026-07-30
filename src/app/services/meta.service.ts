import { Injectable } from '@angular/core';
import { supabase } from '../core/supabase.client';
import { Category, Tag, Collection } from '../models/models';

@Injectable({ providedIn: 'root' })
export class MetaService {
  // ---- Categories ----
  async listCategories(): Promise<Category[]> {
    const userId = (await supabase.auth.getUser()).data.user!.id;
    const { data } = await supabase.from('categories').select('*').eq('user_id', userId).order('name');
    return (data ?? []) as Category[];
  }
  async createCategory(name: string, color = '#8a7a4a'): Promise<Category> {
    const { data, error } = await supabase.from('categories').insert({ name, color }).select().single();
    if (error) throw error;
    return data as Category;
  }
  async updateCategory(id: string, patch: Partial<Category>): Promise<void> {
    await supabase.from('categories').update(patch).eq('id', id);
  }
  async deleteCategory(id: string): Promise<void> {
    await supabase.from('categories').delete().eq('id', id);
  }

  // ---- Tags ----
  async listTags(): Promise<Tag[]> {
    const userId = (await supabase.auth.getUser()).data.user!.id;
    const { data } = await supabase.from('tags').select('*').eq('user_id', userId).order('name');
    return (data ?? []) as Tag[];
  }
  async ensureTag(name: string): Promise<Tag> {
    const { data: existing } = await supabase.from('tags').select('*').eq('name', name).maybeSingle();
    if (existing) return existing as Tag;
    const { data, error } = await supabase.from('tags').insert({ name }).select().single();
    if (error) throw error;
    return data as Tag;
  }
  async deleteTag(id: string): Promise<void> {
    await supabase.from('tags').delete().eq('id', id);
  }

  // ---- Collections ----
  async listCollections(): Promise<Collection[]> {
    const userId = (await supabase.auth.getUser()).data.user!.id;
    const { data } = await supabase.from('collections').select('*, stories:collection_stories(story_id)').eq('user_id', userId).order('created_at', { ascending: false });
    return (data ?? []).map((c: any) => ({ ...c, story_count: c.stories?.length ?? 0 })) as Collection[];
  }
  async createCollection(name: string, description?: string, coverUrl?: string): Promise<Collection> {
    const { data, error } = await supabase.from('collections').insert({ name, description, cover_url: coverUrl }).select().single();
    if (error) throw error;
    return data as Collection;
  }
  async updateCollection(id: string, patch: Partial<Collection>): Promise<void> {
    await supabase.from('collections').update(patch).eq('id', id);
  }
  async deleteCollection(id: string): Promise<void> {
    await supabase.from('collections').delete().eq('id', id);
  }
  async addToCollection(collectionId: string, storyId: string): Promise<void> {
    await supabase.from('collection_stories').insert({ collection_id: collectionId, story_id: storyId });
  }
  async removeFromCollection(collectionId: string, storyId: string): Promise<void> {
    await supabase.from('collection_stories').delete().eq('collection_id', collectionId).eq('story_id', storyId);
  }
  async collectionStories(collectionId: string) {
    const { data } = await supabase
      .from('collection_stories')
      .select('story:stories(*, category:categories(*))')
      .eq('collection_id', collectionId)
      .order('added_at', { ascending: false });
    return ((data ?? []) as any[]).map((r) => r.story);
  }
}

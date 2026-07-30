import { Injectable } from '@angular/core';
import { supabase } from '../core/supabase.client';
import { Notification, ActivityLog, Profile } from '../models/models';

@Injectable({ providedIn: 'root' })
export class NotifyService {
  async list(): Promise<Notification[]> {
    const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(50);
    return (data ?? []) as Notification[];
  }
  async unreadCount(): Promise<number> {
    const userId = (await supabase.auth.getUser()).data.user!.id;
    const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('is_read', false);
    return count ?? 0;
  }
  async markRead(id: string): Promise<void> {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  }
  async markAllRead(): Promise<void> {
    const userId = (await supabase.auth.getUser()).data.user!.id;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
  }
  async clearAll(): Promise<void> {
    const userId = (await supabase.auth.getUser()).data.user!.id;
    await supabase.from('notifications').delete().eq('user_id', userId);
  }

  async logs(): Promise<ActivityLog[]> {
    const { data } = await supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(100);
    return (data ?? []) as ActivityLog[];
  }

  async findUserByUsername(username: string): Promise<Profile | null> {
    const { data } = await supabase.from('profiles').select('id, username, full_name, avatar_url, bio').ilike('username', username).maybeSingle();
    return data as Profile | null;
  }
}

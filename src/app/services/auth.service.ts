import { Injectable, signal, computed, effect } from '@angular/core';
import { Router } from '@angular/router';
import { supabase } from '../core/supabase.client';
import { Profile } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly user = signal<{ id: string; email: string } | null>(null);
  readonly profile = signal<Profile | null>(null);
  readonly loading = signal(true);
  readonly isAuthenticated = computed(() => this.user() !== null);

  constructor(private router: Router) {
    this.initSession();
    supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        if (session?.user) {
          this.user.set({ id: session.user.id, email: session.user.email ?? '' });
          await this.loadProfile();
        } else {
          this.user.set(null);
          this.profile.set(null);
        }
        this.loading.set(false);
      })();
    });
  }

  private async initSession() {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      this.user.set({ id: data.session.user.id, email: data.session.user.email ?? '' });
      await this.loadProfile();
    }
    this.loading.set(false);
  }

  async loadProfile() {
  if (!this.user()) return;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', this.user()!.id)
    .single();

  console.log('Current user:', this.user());
  console.log('Profile data:', data);
  console.error('Profile error:', error);

  if (error) throw error;

  this.profile.set(data as Profile);
}

 async signUp(email: string, password: string, username: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: username
      }
    }
  });

  if (error) throw error;

  if (data.user) {
    await this.logActivity('register', 'Account created');
  }

  return data;
}
  async signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  console.log("LOGIN DATA:", data);
  console.log("LOGIN ERROR:", error);

  const sessionCheck = await supabase.auth.getSession();

  console.log("SESSION AFTER LOGIN:", sessionCheck.data.session);

  if (error) throw error;

  await this.logActivity('login', 'Signed in');

  return data;
}

  async signOut() {
    await this.logActivity('logout', 'Signed out');
    await supabase.auth.signOut();
    this.user.set(null);
    this.profile.set(null);
    this.router.navigate(['/']);
  }

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  }

  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    await this.logActivity('password_changed', 'Password changed');
    await this.notify('password_changed', 'Password changed', 'Your password was updated successfully.');
  }

  async updateProfile(patch: Partial<Profile>) {
    if (!this.user()) return;
    const { error } = await supabase
      .from('profiles')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', this.user()!.id);
    if (error) throw error;
    await this.loadProfile();
  }

  async logActivity(action: string, detail?: string) {
    if (!this.user()) return;
    await supabase.from('activity_logs').insert({ action, detail });
  }

  async notify(type: string, title: string, body?: string) {
    if (!this.user()) return;
    await supabase.from('notifications').insert({ type, title, body });
  }
}



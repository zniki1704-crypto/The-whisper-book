import { Injectable, signal, effect } from '@angular/core';
import { ThemeName } from '../models/models';
import { supabase } from '../core/supabase.client';

const STORAGE_KEY = 'whisperbook-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<ThemeName>('light');

  constructor() {
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeName | null;
    if (saved) this.theme.set(saved);
    effect(() => {
      const t = this.theme();
      document.documentElement.className = `theme-${t}`;
      localStorage.setItem(STORAGE_KEY, t);
    });
  }

  setTheme(t: ThemeName) {
    this.theme.set(t);
  }

  async syncFromProfile(favorite: ThemeName) {
    const local = localStorage.getItem(STORAGE_KEY) as ThemeName | null;
    if (!local) this.theme.set(favorite);
  }

  async persistToProfile() {
    await supabase.from('profiles').update({ favorite_theme: this.theme() }).eq('id', (await supabase.auth.getUser()).data.user?.id ?? '');
  }
}

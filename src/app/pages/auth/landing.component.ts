import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen relative overflow-hidden" style="background: rgb(var(--surface));">
      <!-- ambient glow -->
      <div class="absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl opacity-30" style="background: rgb(var(--primary));"></div>
      <div class="absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-3xl opacity-20" style="background: rgb(var(--accent));"></div>

      <!-- nav -->
      <nav class="relative z-10 flex items-center justify-between px-6 sm:px-10 py-5">
        <div class="flex items-center gap-2.5">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background: rgb(var(--primary));">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          </div>
          <span class="font-display text-2xl" style="color: rgb(var(--text-1));">WhisperBook</span>
        </div>
        <div class="flex items-center gap-3">
          <a routerLink="/login" class="btn-ghost">Sign in</a>
          <a routerLink="/register" class="btn-primary">Get started</a>
        </div>
      </nav>

      <!-- hero -->
      <section class="relative z-10 max-w-5xl mx-auto px-6 pt-20 pb-24 text-center">
        <span class="chip mb-6 animate-fade-in">Privacy-first storytelling</span>
        <h1 class="font-display text-5xl sm:text-6xl md:text-7xl leading-tight mb-6 animate-fade-in" style="color: rgb(var(--text-1));">
          Your stories,<br/><span style="color: rgb(var(--primary));">whispered safely.</span>
        </h1>
        <p class="text-lg sm:text-xl max-w-2xl mx-auto mb-10 animate-fade-in" style="color: rgb(var(--text-2));">
          A premium private diary and storytelling sanctuary. Write journals, poems, novels,
          travel memories and secret notes — every word stays yours, encrypted and yours alone.
        </p>
        <div class="flex flex-wrap items-center justify-center gap-3 animate-fade-in">
          <a routerLink="/register" class="btn-primary text-base px-7 py-3">Start writing — it's free</a>
          <a routerLink="/login" class="btn-outline text-base px-7 py-3">I already have an account</a>
        </div>
      </section>

      <!-- features -->
      <section class="relative z-10 max-w-6xl mx-auto px-6 pb-24 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div *ngFor="let f of features; let i = index" class="card animate-fade-in" [style.animation-delay.ms]="i * 80">
          <div class="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style="background: rgb(var(--primary) / 0.12);" [innerHTML]="f.icon"></div>
          <h3 class="font-display text-xl mb-2" style="color: rgb(var(--text-1));">{{ f.title }}</h3>
          <p class="text-sm" style="color: rgb(var(--text-2));">{{ f.body }}</p>
        </div>
      </section>

      <!-- themes preview -->
      <section class="relative z-10 max-w-4xl mx-auto px-6 pb-24 text-center">
        <h2 class="font-display text-3xl mb-3" style="color: rgb(var(--text-1));">Eight worlds to write in</h2>
        <p class="mb-8" style="color: rgb(var(--text-2));">Switch between beautifully crafted themes — from Vintage Book to Cyberpunk.</p>
        <div class="flex flex-wrap justify-center gap-3">
          <button *ngFor="let t of themes" (click)="previewTheme(t.id)"
                  class="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border"
                  [style.background]="t.swatch[1] + '22'"
                  [style.borderColor]="t.swatch[1]"
                  [style.color]="t.swatch[1]">
            {{ t.label }}
          </button>
        </div>
      </section>

      <footer class="relative z-10 text-center py-8 text-xs" style="color: rgb(var(--text-3));">
        WhisperBook — your private storytelling sanctuary.
      </footer>
    </div>
  `,
})
export class LandingComponent {
  private auth = inject(AuthService);
  private theme = inject(ThemeService);
  private toast = inject(ToastService);
  private router = inject(Router);

  features = [
    { title: 'Private by default', body: 'Every story is locked to you. Share only when you choose, with exactly who you choose.', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(var(--primary))" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' },
    { title: 'Rich writing studio', body: 'A focused editor with autosave, word count, reading time, cover images and version history.', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(var(--primary))" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>' },
    { title: 'Granular permissions', body: 'Grant View, Comment, Edit or Owner access per person. Revoke any time.', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(var(--primary))" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' },
    { title: 'Secure share links', body: 'Generate expiring, password-protected links. Disable copy and download with one toggle.', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(var(--primary))" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>' },
    { title: 'Collections & categories', body: 'Organise stories into collections, categories and tags. Search by anything, instantly.', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(var(--primary))" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>' },
    { title: 'Memory timeline', body: 'See your writing journey unfold with statistics, activity logs and a beautiful timeline.', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(var(--primary))" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' },
  ];

  themes = [
    { id: 'light', label: 'Light', swatch: ['#fcfcfa', '#8a7a4a', '#b28e50'] },
    { id: 'dark', label: 'Dark', swatch: ['#121214', '#c4a878', '#dcb26e'] },
    { id: 'vintage', label: 'Vintage Book', swatch: ['#f4ead8', '#785030', '#a86e40'] },
    { id: 'forest', label: 'Forest', swatch: ['#f2f4ee', '#386e48', '#609c6e'] },
    { id: 'royal', label: 'Royal', swatch: ['#f8f6fc', '#5c40a8', '#a878dc'] },
    { id: 'cyberpunk', label: 'Cyberpunk', swatch: ['#0c0a16', '#00f0c8', '#ff3cb4'] },
    { id: 'fantasy', label: 'Fantasy', swatch: ['#f4f0fc', '#785cc8', '#c88ce8'] },
    { id: 'sakura', label: 'Sakura', swatch: ['#fcf6f8', '#dc648c', '#ff96aa'] },
  ];

  previewTheme(id: any) {
    this.theme.setTheme(id);
    this.toast.success('Theme preview — sign up to keep it');
  }
}

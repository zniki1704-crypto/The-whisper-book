import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { NotifyService } from '../../services/notify.service';
import { Notification } from '../../models/models';

interface NavItem { path: string; label: string; icon: string; }

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen flex" style="background: rgb(var(--surface));">
      <!-- Sidebar -->
      <aside class="hidden lg:flex flex-col w-64 shrink-0 border-r h-screen sticky top-0"
             style="background: rgb(var(--surface-2)); border-color: rgb(var(--border));">
        <a routerLink="/app/dashboard" class="flex items-center gap-2.5 px-6 h-16 border-b" style="border-color: rgb(var(--border));">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center" style="background: rgb(var(--primary));">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          </div>
          <span class="font-display text-xl" style="color: rgb(var(--text-1));">WhisperBook</span>
        </a>
        <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <a *ngFor="let item of navItems" [routerLink]="item.path" routerLinkActive="sidebar-active"
             class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 sidebar-link">
            <span class="sidebar-icon" [innerHTML]="icon(item.icon)"></span>
            <span>{{ item.label }}</span>
          </a>
        </nav>
        <div class="px-3 py-4 border-t" style="border-color: rgb(var(--border));">
          <button (click)="logout()" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors hover:bg-[rgb(var(--surface-3))]" style="color: rgb(var(--text-2));">
            <span [innerHTML]="icon('logout')"></span>
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <!-- Main -->
      <div class="flex-1 flex flex-col min-w-0">
        <!-- Topbar -->
        <header class="sticky top-0 z-30 h-16 flex items-center justify-between px-4 sm:px-6 glass border-b" style="border-color: rgb(var(--border));">
          <div class="flex items-center gap-3">
            <button class="lg:hidden btn-ghost p-2 rounded-lg" (click)="mobileOpen.set(true)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
            </button>
            <a routerLink="/app/dashboard" class="lg:hidden flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background: rgb(var(--primary));">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
              </div>
              <span class="font-display text-lg" style="color: rgb(var(--text-1));">WhisperBook</span>
            </a>
          </div>
          <div class="flex items-center gap-2">
            <a routerLink="/app/search" class="btn-ghost p-2 rounded-lg" title="Search">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </a>
            <div class="relative">
              <button class="btn-ghost p-2 rounded-lg" (click)="notifOpen.set(!notifOpen())" title="Notifications">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                <span *ngIf="unread() > 0" class="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[10px] flex items-center justify-center text-white" style="background: rgb(var(--error));">{{ unread() }}</span>
              </button>
              <div *ngIf="notifOpen()" class="absolute right-0 mt-2 w-80 glass-strong rounded-2xl shadow-glass overflow-hidden z-50 animate-scale-in">
                <div class="flex items-center justify-between px-4 py-3 border-b" style="border-color: rgb(var(--border));">
                  <span class="font-medium text-sm" style="color: rgb(var(--text-1));">Notifications</span>
                  <button class="text-xs link" (click)="markAllRead()">Mark all read</button>
                </div>
                <div class="max-h-80 overflow-y-auto">
                  <div *ngFor="let n of notifications()" class="px-4 py-3 border-b cursor-pointer hover:bg-[rgb(var(--surface-3))]" [class.opacity-60]="n.is_read" style="border-color: rgb(var(--border));">
                    <p class="text-sm font-medium" style="color: rgb(var(--text-1));">{{ n.title }}</p>
                    <p *ngIf="n.body" class="text-xs mt-0.5" style="color: rgb(var(--text-2));">{{ n.body }}</p>
                    <p class="text-[11px] mt-1" style="color: rgb(var(--text-3));">{{ timeAgo(n.created_at) }}</p>
                  </div>
                  <div *ngIf="notifications().length === 0" class="px-4 py-8 text-center text-sm" style="color: rgb(var(--text-3));">No notifications yet</div>
                </div>
              </div>
            </div>
            <a routerLink="/app/settings" class="btn-ghost p-2 rounded-lg" title="Settings">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </a>
            <a routerLink="/app/profile" class="ml-1">
              <img *ngIf="avatar()" [src]="avatar()" class="w-9 h-9 rounded-full object-cover border-2" style="border-color: rgb(var(--primary));" alt="avatar" />
              <div *ngIf="!avatar()" class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium text-white" style="background: rgb(var(--primary));">
                {{ initial() }}
              </div>
            </a>
          </div>
        </header>

        <main class="flex-1 px-4 sm:px-6 lg:px-8 py-6 animate-fade-in">
          <router-outlet />
        </main>

        <footer class="px-6 py-5 border-t text-center text-xs" style="border-color: rgb(var(--border)); color: rgb(var(--text-3));">
          WhisperBook — your private storytelling sanctuary. Every word stays yours.
        </footer>
      </div>

      <!-- Mobile sidebar -->
      <div *ngIf="mobileOpen()" class="lg:hidden fixed inset-0 z-50 flex" @overlay>
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" (click)="mobileOpen.set(false)"></div>
        <aside class="relative w-72 h-full flex flex-col animate-fade-in" style="background: rgb(var(--surface-2));">
          <div class="flex items-center justify-between px-5 h-16 border-b" style="border-color: rgb(var(--border));">
            <span class="font-display text-lg" style="color: rgb(var(--text-1));">Menu</span>
            <button class="btn-ghost p-1.5 rounded-lg" (click)="mobileOpen.set(false)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            <a *ngFor="let item of navItems" [routerLink]="item.path" routerLinkActive="sidebar-active"
               (click)="mobileOpen.set(false)"
               class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm sidebar-link">
              <span [innerHTML]="icon(item.icon)"></span><span>{{ item.label }}</span>
            </a>
          </nav>
        </aside>
      </div>
    </div>
  `,
  styles: [`
    .sidebar-link { color: rgb(var(--text-2)); }
    .sidebar-link:hover { background: rgb(var(--surface-3)); color: rgb(var(--text-1)); }
    .sidebar-active { background: rgb(var(--primary) / 0.12); color: rgb(var(--primary)) !important; font-weight: 500; }
    .sidebar-active ::ng-deep svg { stroke: rgb(var(--primary)); }
  `],
  animations: [
    trigger('overlay', [transition(':enter', [style({ opacity: 0 }), animate('200ms', style({ opacity: 1 }))])]),
  ],
})
export class AppShellComponent {
  private auth = inject(AuthService);
  private notifySvc = inject(NotifyService);
  private router = inject(Router);
  private theme = inject(ThemeService);

  mobileOpen = signal(false);
  notifOpen = signal(false);
  notifications = signal<Notification[]>([]);
  unread = signal(0);

  navItems: NavItem[] = [
    { path: '/app/dashboard', label: 'Dashboard', icon: 'home' },
    { path: '/app/library', label: 'Story Library', icon: 'book' },
    { path: '/app/story/new', label: 'Create Story', icon: 'edit' },
    { path: '/app/collections', label: 'Collections', icon: 'folder' },
    { path: '/app/categories', label: 'Categories', icon: 'tag' },
    { path: '/app/favourites', label: 'Favourites', icon: 'star' },
    { path: '/app/shared', label: 'Shared Stories', icon: 'share' },
    { path: '/app/archive', label: 'Archive', icon: 'archive' },
    { path: '/app/trash', label: 'Trash', icon: 'trash' },
    { path: '/app/timeline', label: 'Memory Timeline', icon: 'clock' },
    { path: '/app/statistics', label: 'Writing Statistics', icon: 'chart' },
    { path: '/app/activity', label: 'Activity Log', icon: 'list' },
    { path: '/app/profile', label: 'Profile', icon: 'user' },
    { path: '/app/settings', label: 'Settings', icon: 'cog' },
  ];

  avatar() { return this.auth.profile()?.avatar_url; }
  initial() { return (this.auth.profile()?.username ?? 'W').charAt(0).toUpperCase(); }

  async loadNotifs() {
    const [list, count] = await Promise.all([this.notifySvc.list(), this.notifySvc.unreadCount()]);
    this.notifications.set(list);
    this.unread.set(count);
  }

  async markAllRead() {
    await this.notifySvc.markAllRead();
    await this.loadNotifs();
  }

  async logout() {
    await this.auth.signOut();
    this.router.navigate(['/']);
  }

  timeAgo(date: string): string {
    const diff = (Date.now() - new Date(date).getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  icon(name: string): string {
    const s = 'width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
    const map: Record<string, string> = {
      home: `<svg ${s}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>`,
      book: `<svg ${s}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
      edit: `<svg ${s}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>`,
      folder: `<svg ${s}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
      tag: `<svg ${s}><path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`,
      star: `<svg ${s}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
      share: `<svg ${s}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>`,
      archive: `<svg ${s}><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>`,
      trash: `<svg ${s}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
      clock: `<svg ${s}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
      chart: `<svg ${s}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
      list: `<svg ${s}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`,
      user: `<svg ${s}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
      cog: `<svg ${s}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
      logout: `<svg ${s}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
    };
    return map[name] ?? '';
  }
}

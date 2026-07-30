import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NotifyService } from '../../services/notify.service';
import { Notification, ActivityLog } from '../../models/models';
import { LoaderComponent } from '../../components/loader/loader.component';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RouterLink, LoaderComponent],
  template: `
    <div class="max-w-3xl mx-auto">
      <header class="flex items-center justify-between mb-6">
        <h1 class="font-display text-4xl" style="color: rgb(var(--text-1));">Notifications</h1>
        <button class="btn-outline" (click)="markAll()">Mark all read</button>
      </header>
      <app-loader *ngIf="loading()" />
      <div *ngIf="!loading() && items().length === 0" class="card text-center py-12">
        <p class="text-sm" style="color: rgb(var(--text-2));">You're all caught up.</p>
      </div>
      <div *ngIf="!loading() && items().length" class="space-y-2">
        <div *ngFor="let n of items()" class="card !p-4 flex items-start gap-3 cursor-pointer" [class.opacity-60]="n.is_read" (click)="markRead(n)">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style="background: rgb(var(--primary) / 0.12);" [innerHTML]="icon(n.type)"></div>
          <div class="flex-1">
            <p class="text-sm font-medium" style="color: rgb(var(--text-1));">{{ n.title }}</p>
            <p *ngIf="n.body" class="text-xs" style="color: rgb(var(--text-2));">{{ n.body }}</p>
            <p class="text-[11px] mt-1" style="color: rgb(var(--text-3));">{{ timeAgo(n.created_at) }}</p>
          </div>
          <span *ngIf="!n.is_read" class="w-2 h-2 rounded-full mt-2" style="background: rgb(var(--primary));"></span>
        </div>
      </div>
    </div>
  `,
})
export class NotificationsComponent implements OnInit {
  private notify = inject(NotifyService);
  loading = signal(true);
  items = signal<Notification[]>([]);

  async ngOnInit() { this.items.set(await this.notify.list()); this.loading.set(false); }
  async markAll() { await this.notify.markAllRead(); this.items.set(await this.notify.list()); }
  async markRead(n: Notification) { if (!n.is_read) { await this.notify.markRead(n.id); this.items.set(await this.notify.list()); } }

  icon(type: string): string {
    const s = 'width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgb(var(--primary))" stroke-width="2"';
    const map: Record<string, string> = {
      story_shared: `<svg ${s}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>`,
      permission_changed: `<svg ${s}><path d="M9 12l2 2 4-4"/><path d="M21 12c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 19.5 4 17 4 12V6l8-3 8 3z"/></svg>`,
      password_changed: `<svg ${s}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
      new_login: `<svg ${s}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
      comment_added: `<svg ${s}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
    };
    return map[type] ?? `<svg ${s}><circle cx="12" cy="12" r="10"/></svg>`;
  }
  timeAgo(d: string): string {
    const diff = (Date.now() - new Date(d).getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }
}

@Component({
  selector: 'app-activity',
  standalone: true,
  imports: [CommonModule, LoaderComponent],
  template: `
    <div class="max-w-3xl mx-auto">
      <h1 class="font-display text-4xl mb-6" style="color: rgb(var(--text-1));">Activity log</h1>
      <app-loader *ngIf="loading()" />
      <div *ngIf="!loading() && logs().length === 0" class="card text-center py-12"><p class="text-sm" style="color: rgb(var(--text-2));">No activity recorded yet.</p></div>
      <div *ngIf="!loading() && logs().length" class="relative pl-6">
        <div class="absolute left-2 top-2 bottom-2 w-px" style="background: rgb(var(--border));"></div>
        <div *ngFor="let l of logs()" class="relative mb-5">
          <div class="absolute -left-[18px] top-1.5 w-3 h-3 rounded-full" style="background: rgb(var(--primary));"></div>
          <p class="text-sm font-medium" style="color: rgb(var(--text-1));">{{ label(l.action) }}</p>
          <p *ngIf="l.detail" class="text-xs" style="color: rgb(var(--text-2));">{{ l.detail }}</p>
          <p class="text-[11px]" style="color: rgb(var(--text-3));">{{ formatLogDate(l.created_at) }}</p>
        </div>
      </div>
    </div>
  `,
})
export class ActivityComponent implements OnInit {
  private notify = inject(NotifyService);
  loading = signal(true);
  logs = signal<ActivityLog[]>([]);

  async ngOnInit() { this.logs.set(await this.notify.logs()); this.loading.set(false); }
  label(action: string): string {
    const map: Record<string, string> = {
      login: 'Signed in', logout: 'Signed out', register: 'Account created',
      story_created: 'Story created', story_edited: 'Story edited', story_deleted: 'Story deleted',
      story_archived: 'Story archived', story_restored: 'Story restored', story_shared: 'Story shared',
      password_changed: 'Password changed',
    };
    return map[action] ?? action.replace(/_/g, ' ');
  }
  formatLogDate(d: string): string { return new Date(d).toLocaleString(); }
}

import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StoryService } from '../../services/story.service';
import { MetaService } from '../../services/meta.service';
import { NotifyService } from '../../services/notify.service';
import { AuthService } from '../../services/auth.service';
import { StoryStats, ActivityLog, Notification } from '../../models/models';
import { LoaderComponent } from '../../components/loader/loader.component';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterLink, LoaderComponent],
  template: `
    <div class="max-w-6xl mx-auto">
      <header class="mb-6">
        <h1 class="font-display text-4xl" style="color: rgb(var(--text-1));">Admin Dashboard</h1>
        <p class="text-sm mt-1" style="color: rgb(var(--text-3));">Overview of your WhisperBook workspace</p>
      </header>

      <app-loader *ngIf="loading()" />
      <div *ngIf="!loading()">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div class="card"><p class="text-3xl font-display" style="color: rgb(var(--primary));">{{ stats()?.total }}</p><p class="text-xs" style="color: rgb(var(--text-3));">Stories</p></div>
          <div class="card"><p class="text-3xl font-display" style="color: rgb(var(--primary));">{{ stats()?.collections }}</p><p class="text-xs" style="color: rgb(var(--text-3));">Collections</p></div>
          <div class="card"><p class="text-3xl font-display" style="color: rgb(var(--primary));">{{ logs().length }}</p><p class="text-xs" style="color: rgb(var(--text-3));">Activity entries</p></div>
          <div class="card"><p class="text-3xl font-display" style="color: rgb(var(--primary));">{{ notifs().length }}</p><p class="text-xs" style="color: rgb(var(--text-3));">Notifications</p></div>
        </div>

        <div class="grid md:grid-cols-2 gap-6">
          <section class="card">
            <h2 class="font-display text-xl mb-4" style="color: rgb(var(--text-1));">Recent activity</h2>
            <div class="space-y-2 max-h-72 overflow-y-auto">
              <div *ngFor="let l of logs().slice(0, 10)" class="text-sm flex justify-between">
                <span style="color: rgb(var(--text-2));">{{ l.action.replace(/_/g, ' ') }}</span>
                <span class="text-xs" style="color: rgb(var(--text-3));">{{ timeAgo(l.created_at) }}</span>
              </div>
            </div>
          </section>
          <section class="card">
            <h2 class="font-display text-xl mb-4" style="color: rgb(var(--text-1));">Quick links</h2>
            <div class="flex flex-col gap-2">
              <a routerLink="/app/library" class="btn-outline">Story Library</a>
              <a routerLink="/app/collections" class="btn-outline">Collections</a>
              <a routerLink="/app/statistics" class="btn-outline">Writing Statistics</a>
              <a routerLink="/app/settings" class="btn-outline">Settings</a>
            </div>
          </section>
        </div>
      </div>
    </div>
  `,
})
export class AdminComponent implements OnInit {
  private storySvc = inject(StoryService);
  private notify = inject(NotifyService);
  loading = signal(true);
  stats = signal<StoryStats | null>(null);
  logs = signal<ActivityLog[]>([]);
  notifs = signal<Notification[]>([]);

  async ngOnInit() {
    const [stats, logs, notifs] = await Promise.all([this.storySvc.stats(), this.notify.logs(), this.notify.list()]);
    this.stats.set(stats); this.logs.set(logs); this.notifs.set(notifs);
    this.loading.set(false);
  }
  timeAgo(d: string): string {
    const diff = (Date.now() - new Date(d).getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  }
}

import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StoryService } from '../../services/story.service';
import { MetaService } from '../../services/meta.service';
import { AuthService } from '../../services/auth.service';
import { Story, StoryStats, Collection } from '../../models/models';
import { StoryCardComponent } from '../../components/story-card/story-card.component';
import { LoaderComponent } from '../../components/loader/loader.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, StoryCardComponent, LoaderComponent],
  template: `
    <div class="max-w-7xl mx-auto">
      <header class="mb-8">
        <p class="text-sm" style="color: rgb(var(--text-3));">{{ greeting }}</p>
        <h1 class="font-display text-4xl mt-1" style="color: rgb(var(--text-1));">{{ profile()?.username ?? 'Writer' }}</h1>
      </header>

      <!-- stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div *ngFor="let s of statCards" class="card flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl flex items-center justify-center" style="background: rgb(var(--primary) / 0.12);" [innerHTML]="s.icon"></div>
          <div>
            <p class="text-2xl font-display" style="color: rgb(var(--text-1));">{{ s.value() }}</p>
            <p class="text-xs" style="color: rgb(var(--text-3));">{{ s.label }}</p>
          </div>
        </div>
      </div>

      <!-- quick actions -->
      <div class="flex flex-wrap gap-3 mb-10">
        <a routerLink="/app/story/new" class="btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
          New story
        </a>
        <a routerLink="/app/library" class="btn-outline">Browse library</a>
        <a routerLink="/app/collections" class="btn-outline">Collections</a>
        <a routerLink="/app/statistics" class="btn-outline">Statistics</a>
      </div>

      <!-- recent -->
      <section class="mb-10">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-display text-2xl" style="color: rgb(var(--text-1));">Recently updated</h2>
          <a routerLink="/app/library" class="text-sm link">View all</a>
        </div>
        <app-loader *ngIf="loading()" message="Gathering your stories…" />
        <div *ngIf="!loading() && stories().length === 0" class="card text-center py-12">
          <p class="font-display text-xl mb-2" style="color: rgb(var(--text-1));">Your library is waiting</p>
          <p class="text-sm mb-4" style="color: rgb(var(--text-2));">Write your first story and let your thoughts take shape.</p>
          <a routerLink="/app/story/new" class="btn-primary">Start writing</a>
        </div>
        <div *ngIf="!loading() && stories().length" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <app-story-card *ngFor="let s of stories()" [story]="s" />
        </div>
      </section>

      <!-- collections -->
      <section *ngIf="collections().length">
        <h2 class="font-display text-2xl mb-4" style="color: rgb(var(--text-1));">Your collections</h2>
        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <a *ngFor="let c of collections()" [routerLink]="['/app/collections', c.id]" class="card flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background: rgb(var(--primary) / 0.12);">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgb(var(--primary))" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            </div>
            <div class="min-w-0">
              <p class="font-medium truncate" style="color: rgb(var(--text-1));">{{ c.name }}</p>
              <p class="text-xs" style="color: rgb(var(--text-3));">{{ c.story_count }} stories</p>
            </div>
          </a>
        </div>
      </section>
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  private storySvc = inject(StoryService);
  private meta = inject(MetaService);
  private auth = inject(AuthService);

  loading = signal(true);
  stories = signal<Story[]>([]);
  collections = signal<Collection[]>([]);
  stats = signal<StoryStats | null>(null);
  profile = this.auth.profile;

  get greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }

  statCards = [
    { label: 'Total stories', value: () => this.stats()?.total ?? 0, icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(var(--primary))" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>' },
    { label: 'Words written', value: () => this.stats()?.totalWords ?? 0, icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(var(--primary))" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>' },
    { label: 'Reading time', value: () => `${this.stats()?.totalReadingTime ?? 0}m`, icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(var(--primary))" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' },
    { label: 'Collections', value: () => this.stats()?.collections ?? 0, icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(var(--primary))" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>' },
  ];

  async ngOnInit() {
    try {
      const [stories, collections, stats] = await Promise.all([
        this.storySvc.list({ status: 'active' }),
        this.meta.listCollections(),
        this.storySvc.stats(),
      ]);
      this.stories.set(stories.slice(0, 6));
      this.collections.set(collections.slice(0, 4));
      this.stats.set(stats);
    } catch (e) {
      console.error(e);
    } finally {
      this.loading.set(false);
    }
  }
}

import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { StoryService } from '../../services/story.service';
import { MetaService } from '../../services/meta.service';
import { Story, Category, Tag, StoryPrivacy } from '../../models/models';
import { StoryCardComponent } from '../../components/story-card/story-card.component';
import { LoaderComponent } from '../../components/loader/loader.component';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, StoryCardComponent, LoaderComponent],
  template: `
    <div class="max-w-7xl mx-auto">
      <h1 class="font-display text-4xl mb-6" style="color: rgb(var(--text-1));">Advanced search</h1>
      <div class="glass rounded-2xl p-4 mb-6 space-y-4">
        <input class="input" placeholder="Search by title or content…" [(ngModel)]="search" (ngModelChange)="reload()" />
        <div class="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label class="label">Category</label>
            <select class="input" [(ngModel)]="categoryId" (ngModelChange)="reload()">
              <option [ngValue]="null">All</option>
              <option *ngFor="let c of categories()" [value]="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div>
            <label class="label">Tag</label>
            <select class="input" [(ngModel)]="tagId" (ngModelChange)="reload()">
              <option [ngValue]="null">All</option>
              <option *ngFor="let t of tags()" [value]="t.id">{{ t.name }}</option>
            </select>
          </div>
          <div>
            <label class="label">Privacy</label>
            <select class="input" [ngModel]="privacy" (ngModelChange)="privacy = $event; reload()">
              <option [ngValue]="null">All</option>
              <option value="private">Private</option>
              <option value="shared">Shared</option>
              <option value="password">Password</option>
              <option value="hidden">Hidden</option>
            </select>
          </div>
          <div>
            <label class="label">Date</label>
            <select class="input" [(ngModel)]="dateFilter" (ngModelChange)="reload()">
              <option value="all">All time</option>
              <option value="today">Today</option>
              <option value="week">This week</option>
              <option value="month">This month</option>
              <option value="year">This year</option>
            </select>
          </div>
        </div>
      </div>
      <app-loader *ngIf="loading()" />
      <div *ngIf="!loading() && stories().length === 0" class="card text-center py-12">
        <p class="text-sm" style="color: rgb(var(--text-2));">No stories match your search.</p>
      </div>
      <div *ngIf="!loading() && stories().length" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <app-story-card *ngFor="let s of filtered()" [story]="s" />
      </div>
    </div>
  `,
})
export class SearchComponent implements OnInit {
  private storySvc = inject(StoryService);
  private meta = inject(MetaService);

  loading = signal(true);
  stories = signal<Story[]>([]);
  categories = signal<Category[]>([]);
  tags = signal<Tag[]>([]);

  search = '';
  categoryId: string | null = null;
  tagId: string | null = null;
  privacy: any = null;
  dateFilter = 'all';

  async ngOnInit() {
    const [cats, tagList] = await Promise.all([this.meta.listCategories(), this.meta.listTags()]);
    this.categories.set(cats); this.tags.set(tagList);
    await this.reload();
  }
  async reload() {
    this.loading.set(true);
    this.stories.set(await this.storySvc.list({ status: 'active', search: this.search || undefined, categoryId: this.categoryId ?? undefined, tagId: this.tagId ?? undefined, privacy: this.privacy ?? undefined }));
    this.loading.set(false);
  }
  filtered(): Story[] {
    if (this.dateFilter === 'all') return this.stories();
    const now = Date.now();
    const ranges: Record<string, number> = { today: 86400000, week: 604800000, month: 2592000000, year: 31536000000 };
    const limit = ranges[this.dateFilter];
    return this.stories().filter((s) => now - new Date(s.updated_at).getTime() < limit);
  }
}

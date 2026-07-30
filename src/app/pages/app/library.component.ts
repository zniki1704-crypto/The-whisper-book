import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { StoryService } from '../../services/story.service';
import { MetaService } from '../../services/meta.service';
import { Story, Category, Tag, StoryStatus, StoryPrivacy } from '../../models/models';
import { StoryCardComponent } from '../../components/story-card/story-card.component';
import { LoaderComponent } from '../../components/loader/loader.component';

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, StoryCardComponent, LoaderComponent],
  template: `
    <div class="max-w-7xl mx-auto">
      <header class="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 class="font-display text-4xl" style="color: rgb(var(--text-1));">Story Library</h1>
          <p class="text-sm mt-1" style="color: rgb(var(--text-3));">{{ stories().length }} stories in your collection</p>
        </div>
        <a routerLink="/app/story/new" class="btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
          New story
        </a>
      </header>

      <!-- filters -->
      <div class="glass rounded-2xl p-4 mb-6 space-y-4">
        <div class="flex flex-wrap gap-3">
          <div class="flex-1 min-w-[200px] relative">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgb(var(--text-3))" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input class="input pl-9" placeholder="Search by title or content…" [(ngModel)]="search" (ngModelChange)="reload()" />
          </div>
          <select class="input w-auto" [(ngModel)]="sortBy" (ngModelChange)="reload()">
            <option value="updated">Last updated</option>
            <option value="created">Date created</option>
            <option value="title">Title (A-Z)</option>
            <option value="words">Word count</option>
          </select>
        </div>
        <div class="flex flex-wrap gap-2">
          <button class="chip" [class.chip-active]="!privacyFilter" (click)="privacyFilter = null; reload()">All</button>
          <button *ngFor="let p of privacyOptions" class="chip" [class.chip-active]="privacyFilter === p.value"
                  (click)="privacyFilter = p.value; reload()">{{ p.label }}</button>
        </div>
        <div class="flex flex-wrap gap-2" *ngIf="categories().length">
          <button class="chip" [class.chip-active]="!categoryFilter" (click)="categoryFilter = null; reload()">All categories</button>
          <button *ngFor="let c of categories()" class="chip" [class.chip-active]="categoryFilter === c.id"
                  (click)="categoryFilter = c.id; reload()">{{ c.name }}</button>
        </div>
        <div class="flex flex-wrap gap-2" *ngIf="tags().length">
          <button class="chip" [class.chip-active]="!tagFilter" (click)="tagFilter = null; reload()">All tags</button>
          <button *ngFor="let t of tags()" class="chip" [class.chip-active]="tagFilter === t.id"
                  (click)="tagFilter = t.id; reload()">{{ t.name }}</button>
        </div>
      </div>

      <app-loader *ngIf="loading()" message="Gathering your stories…" />
      <div *ngIf="!loading() && stories().length === 0" class="card text-center py-12">
        <p class="font-display text-xl mb-2" style="color: rgb(var(--text-1));">No stories found</p>
        <p class="text-sm mb-4" style="color: rgb(var(--text-2));">Try adjusting your filters, or start a new story.</p>
        <a routerLink="/app/story/new" class="btn-primary">Start writing</a>
      </div>
      <div *ngIf="!loading() && stories().length" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <app-story-card *ngFor="let s of sortedStories()" [story]="s" />
      </div>
    </div>
  `,
})
export class LibraryComponent implements OnInit {
  private storySvc = inject(StoryService);
  private meta = inject(MetaService);

  loading = signal(true);
  stories = signal<Story[]>([]);
  categories = signal<Category[]>([]);
  tags = signal<Tag[]>([]);

  search = '';
  sortBy: 'updated' | 'created' | 'title' | 'words' = 'updated';
  privacyFilter: any = null;
  categoryFilter: string | null = null;
  tagFilter: string | null = null;

  privacyOptions = [
    { value: 'private', label: 'Private' },
    { value: 'shared', label: 'Shared' },
    { value: 'password', label: 'Password' },
    { value: 'hidden', label: 'Hidden' },
  ];

  async ngOnInit() {
    const [cats, tagList] = await Promise.all([this.meta.listCategories(), this.meta.listTags()]);
    this.categories.set(cats);
    this.tags.set(tagList);
    await this.reload();
  }

  async reload() {
    this.loading.set(true);
    try {
      const stories = await this.storySvc.list({
        status: 'active',
        search: this.search || undefined,
        privacy: this.privacyFilter ?? undefined,
        categoryId: this.categoryFilter ?? undefined,
        tagId: this.tagFilter ?? undefined,
      });
      this.stories.set(stories);
    } finally {
      this.loading.set(false);
    }
  }

  sortedStories(): Story[] {
    const list = [...this.stories()];
    switch (this.sortBy) {
      case 'created': return list.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
      case 'title': return list.sort((a, b) => a.title.localeCompare(b.title));
      case 'words': return list.sort((a, b) => b.word_count - a.word_count);
      default: return list.sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at));
    }
  }
}

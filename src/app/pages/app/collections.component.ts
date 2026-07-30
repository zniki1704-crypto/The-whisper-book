import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MetaService } from '../../services/meta.service';
import { ToastService } from '../../services/toast.service';
import { Collection } from '../../models/models';
import { ModalComponent } from '../../components/modal/modal.component';
import { LoaderComponent } from '../../components/loader/loader.component';

@Component({
  selector: 'app-collections',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ModalComponent, LoaderComponent],
  template: `
    <div class="max-w-7xl mx-auto">
      <header class="flex items-center justify-between mb-6">
        <div>
          <h1 class="font-display text-4xl" style="color: rgb(var(--text-1));">Collections</h1>
          <p class="text-sm mt-1" style="color: rgb(var(--text-3));">{{ collections().length }} curated groupings</p>
        </div>
        <button class="btn-primary" (click)="openCreate()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
          New collection
        </button>
      </header>

      <app-loader *ngIf="loading()" />
      <div *ngIf="!loading() && collections().length === 0" class="card text-center py-12">
        <p class="font-display text-xl mb-2" style="color: rgb(var(--text-1));">No collections yet</p>
        <p class="text-sm mb-4" style="color: rgb(var(--text-2));">Group related stories into beautiful collections.</p>
        <button class="btn-primary" (click)="openCreate()">Create your first collection</button>
      </div>

      <div *ngIf="!loading() && collections().length" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <a *ngFor="let c of collections()" [routerLink]="['/app/collections', c.id]" class="card group">
          <div class="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style="background: rgb(var(--primary) / 0.12);">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(var(--primary))" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          </div>
          <h3 class="font-display text-xl mb-1" style="color: rgb(var(--text-1));">{{ c.name }}</h3>
          <p class="text-sm line-clamp-2 mb-3" style="color: rgb(var(--text-2));">{{ c.description || 'No description' }}</p>
          <p class="text-xs" style="color: rgb(var(--text-3));">{{ c.story_count }} stories</p>
        </a>
      </div>

      <app-modal [open]="createOpen" (close)="createOpen=false" title="New collection">
        <div class="space-y-4">
          <div><label class="label">Name</label><input class="input" [(ngModel)]="name" placeholder="e.g. Summer travels" /></div>
          <div><label class="label">Description</label><textarea class="input" rows="3" [(ngModel)]="description"></textarea></div>
          <div><label class="label">Cover URL (optional)</label><input class="input" [(ngModel)]="coverUrl" placeholder="https://…" /></div>
        </div>
        <div class="flex justify-end gap-2 mt-6">
          <button class="btn-ghost" (click)="createOpen=false">Cancel</button>
          <button class="btn-primary" (click)="create()">Create</button>
        </div>
      </app-modal>
    </div>
  `,
})
export class CollectionsComponent implements OnInit {
  private meta = inject(MetaService);
  private toast = inject(ToastService);

  loading = signal(true);
  collections = signal<Collection[]>([]);
  createOpen = false;
  name = ''; description = ''; coverUrl = '';

  async ngOnInit() { await this.reload(); }
  async reload() {
    this.loading.set(true);
    this.collections.set(await this.meta.listCollections());
    this.loading.set(false);
  }
  openCreate() { this.name=''; this.description=''; this.coverUrl=''; this.createOpen = true; }
  async create() {
    if (!this.name.trim()) return;
    await this.meta.createCollection(this.name.trim(), this.description || undefined, this.coverUrl || undefined);
    this.createOpen = false;
    this.toast.success('Collection created.');
    await this.reload();
  }
}

@Component({
  selector: 'app-collection-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ModalComponent, LoaderComponent],
  template: `
    <div class="max-w-7xl mx-auto">
      <app-loader *ngIf="loading()" />
      <div *ngIf="!loading() && collection()">
        <header class="mb-6">
          <a routerLink="/app/collections" class="text-sm link mb-2 inline-block">← All collections</a>
          <h1 class="font-display text-4xl" style="color: rgb(var(--text-1));">{{ collection()!.name }}</h1>
          <p *ngIf="collection()!.description" class="text-sm mt-1" style="color: rgb(var(--text-2));">{{ collection()!.description }}</p>
        </header>
        <div *ngIf="stories().length === 0" class="card text-center py-12">
          <p class="text-sm" style="color: rgb(var(--text-2));">This collection is empty. Add stories from the library.</p>
        </div>
        <div *ngIf="stories().length" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div *ngFor="let s of stories()" class="card flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center font-display text-xl" style="background: rgb(var(--primary-soft) / 0.3); color: rgb(var(--primary));">{{ s.title.charAt(0) }}</div>
            <div class="flex-1 min-w-0">
              <a [routerLink]="['/app/story', s.id]" class="font-medium truncate block" style="color: rgb(var(--text-1));">{{ s.title }}</a>
              <p class="text-xs" style="color: rgb(var(--text-3));">{{ s.word_count }} words</p>
            </div>
            <button class="text-xs" style="color: rgb(var(--error));" (click)="remove(s.id)">Remove</button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class CollectionDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private meta = inject(MetaService);
  loading = signal(true);
  collection = signal<Collection | null>(null);
  stories = signal<any[]>([]);

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    const all = await this.meta.listCollections();
    this.collection.set(all.find((c) => c.id === id) ?? null);
    this.stories.set(await this.meta.collectionStories(id));
    this.loading.set(false);
  }
  async remove(storyId: string) {
    await this.meta.removeFromCollection(this.collection()!.id, storyId);
    this.stories.set(this.stories().filter((s) => s.id !== storyId));
  }
}

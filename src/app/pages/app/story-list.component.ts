import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { StoryService } from '../../services/story.service';
import { Story } from '../../models/models';
import { StoryCardComponent } from '../../components/story-card/story-card.component';
import { LoaderComponent } from '../../components/loader/loader.component';

@Component({
  selector: 'app-story-list',
  standalone: true,
  imports: [CommonModule, RouterLink, StoryCardComponent, LoaderComponent],
  template: `
    <div class="max-w-7xl mx-auto">
      <header class="mb-6">
        <h1 class="font-display text-4xl" style="color: rgb(var(--text-1));">{{ title }}</h1>
        <p class="text-sm mt-1" style="color: rgb(var(--text-3));">{{ stories().length }} {{ title.toLowerCase() }}</p>
      </header>
      <app-loader *ngIf="loading()" />
      <div *ngIf="!loading() && stories().length === 0" class="card text-center py-12">
        <p class="font-display text-xl mb-2" style="color: rgb(var(--text-1));">{{ emptyTitle }}</p>
        <p class="text-sm mb-4" style="color: rgb(var(--text-2));">{{ emptyBody }}</p>
        <a routerLink="/app/story/new" class="btn-primary" *ngIf="showNew">Start writing</a>
      </div>
      <div *ngIf="!loading() && stories().length" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <app-story-card *ngFor="let s of stories()" [story]="s" />
      </div>
    </div>
  `,
})
export class StoryListComponent implements OnInit {
  private storySvc = inject(StoryService);
  private route = inject(ActivatedRoute);
  loading = signal(true);
  stories = signal<Story[]>([]);

  title = 'Stories';
  emptyTitle = 'Nothing here yet';
  emptyBody = 'Stories will appear here once you add them.';
  showNew = true;

  async ngOnInit() {
    const mode = (this.route.snapshot.data['mode'] ?? 'favourites') as 'favourites' | 'archive' | 'trash' | 'shared';
    let list: Story[] = [];
    if (mode === 'favourites') {
      this.title = 'Favourites'; this.emptyTitle = 'No favourites yet'; this.emptyBody = 'Star stories to keep them here.';
      list = await this.storySvc.list({ status: 'active', favouriteOnly: true });
    } else if (mode === 'archive') {
      this.title = 'Archive'; this.emptyTitle = 'Archive is empty'; this.emptyBody = 'Archived stories rest here.'; this.showNew = false;
      list = await this.storySvc.list({ status: 'archived' });
    } else if (mode === 'trash') {
      this.title = 'Trash'; this.emptyTitle = 'Trash is empty'; this.emptyBody = 'Deleted stories appear here for recovery.'; this.showNew = false;
      list = await this.storySvc.list({ status: 'trash' });
    } else if (mode === 'shared') {
      this.title = 'Shared with me'; this.emptyTitle = 'No shared stories'; this.emptyBody = 'Stories others share with you appear here.'; this.showNew = false;
      list = await this.storySvc.sharedWithMe();
    }
    this.stories.set(list);
    this.loading.set(false);
  }
}


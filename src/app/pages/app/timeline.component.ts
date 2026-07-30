import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StoryService } from '../../services/story.service';
import { Story } from '../../models/models';
import { LoaderComponent } from '../../components/loader/loader.component';

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [CommonModule, RouterLink, LoaderComponent],
  template: `
    <div class="max-w-3xl mx-auto">
      <h1 class="font-display text-4xl mb-2" style="color: rgb(var(--text-1));">Memory timeline</h1>
      <p class="text-sm mb-6" style="color: rgb(var(--text-3));">Your stories, unfolding through time.</p>
      <app-loader *ngIf="loading()" />
      <div *ngIf="!loading() && groups().length === 0" class="card text-center py-12"><p class="text-sm" style="color: rgb(var(--text-2));">No stories to timeline yet.</p></div>
      <div *ngIf="!loading()" class="relative pl-6">
        <div class="absolute left-2 top-2 bottom-2 w-px" style="background: rgb(var(--border));"></div>
        <div *ngFor="let g of groups()" class="mb-8">
          <div class="absolute -left-[14px] w-4 h-4 rounded-full border-2" style="background: rgb(var(--surface)); border-color: rgb(var(--primary));"></div>
          <h2 class="font-display text-xl mb-3" style="color: rgb(var(--primary));">{{ g.label }}</h2>
          <div class="space-y-2">
            <a *ngFor="let s of g.stories" [routerLink]="['/app/story', s.id]" class="card !p-3 flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center font-display" style="background: rgb(var(--primary-soft) / 0.3); color: rgb(var(--primary));">{{ s.title.charAt(0) }}</div>
              <div class="flex-1 min-w-0">
                <p class="font-medium truncate" style="color: rgb(var(--text-1));">{{ s.title }}</p>
                <p class="text-xs" style="color: rgb(var(--text-3));">{{ s.word_count }} words · {{ timeLabel(s.created_at) }}</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class TimelineComponent implements OnInit {
  private storySvc = inject(StoryService);
  loading = signal(true);
  groups = signal<{ label: string; stories: Story[] }[]>([]);

  async ngOnInit() {
    const stories = await this.storySvc.list({ status: 'active' });
    const sorted = [...stories].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    const map = new Map<string, Story[]>();
    for (const s of sorted) {
      const label = new Date(s.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(s);
    }
    this.groups.set([...map.entries()].map(([label, stories]) => ({ label, stories })));
    this.loading.set(false);
  }
  timeLabel(d: string): string { return new Date(d).toLocaleDateString(); }
}

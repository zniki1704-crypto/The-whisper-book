import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Story, StoryPrivacy, StoryStatus } from '../../models/models';

@Component({
  selector: 'app-story-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <article class="card group cursor-pointer flex flex-col overflow-hidden"
             [routerLink]="['/app/story', story.id]">
      <div class="relative h-40 -mx-6 -mt-6 mb-4 overflow-hidden">
        <img *ngIf="story.cover_url" [src]="story.cover_url" [alt]="story.title"
             class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div *ngIf="!story.cover_url" class="w-full h-full flex items-center justify-center"
             style="background: linear-gradient(135deg, rgb(var(--primary-soft) / 0.4), rgb(var(--surface-3)));">
          <span class="text-4xl font-display" style="color: rgb(var(--primary) / 0.6);">{{ story.title.charAt(0) }}</span>
        </div>
        <div class="absolute top-3 right-3 flex gap-1.5">
          <span *ngIf="story.is_favourite" class="chip" style="background: rgb(var(--accent) / 0.9); color: white; border: none;">★</span>
          <span class="chip" [style.background]="privacyColor()">{{ privacyLabel() }}</span>
        </div>
      </div>
      <h3 class="font-display text-lg leading-snug mb-1 line-clamp-2" style="color: rgb(var(--text-1));">{{ story.title }}</h3>
      <p class="text-sm line-clamp-2 mb-3 flex-1" style="color: rgb(var(--text-2));">{{ story.excerpt || 'No preview available' }}</p>
      <div class="flex items-center justify-between text-xs" style="color: rgb(var(--text-3));">
        <div class="flex items-center gap-3">
          <span *ngIf="story.category" class="chip" [style.border-color]="story.category.color">{{ story.category.name }}</span>
          <span>{{ story.word_count }} words</span>
          <span>{{ story.reading_time }} min</span>
        </div>
        <span>{{ updatedLabel }}</span>
      </div>
      <div *ngIf="story.tags?.length" class="flex flex-wrap gap-1.5 mt-3">
        <span *ngFor="let t of story.tags" class="chip">{{ t.name }}</span>
      </div>
    </article>
  `,
})
export class StoryCardComponent {
  @Input({ required: true }) story!: Story;
  @Output() action = new EventEmitter<{ type: string; story: Story }>();

  get updatedLabel(): string {
    const d = new Date(this.story.updated_at);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return d.toLocaleDateString();
  }

  privacyLabel(): string {
    const map: Record<StoryPrivacy, string> = { private: 'Private', shared: 'Shared', password: 'Locked', hidden: 'Hidden' };
    return map[this.story.privacy];
  }
  privacyColor(): string {
    const map: Record<StoryPrivacy, string> = {
      private: 'rgb(var(--surface-3))',
      shared: 'rgb(var(--success) / 0.85)',
      password: 'rgb(var(--warning) / 0.85)',
      hidden: 'rgb(var(--text-3) / 0.6)',
    };
    return map[this.story.privacy];
  }
}

import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoryService } from '../../services/story.service';
import { Story, StoryStats } from '../../models/models';
import { LoaderComponent } from '../../components/loader/loader.component';

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [CommonModule, LoaderComponent],
  template: `
    <div class="max-w-5xl mx-auto">
      <h1 class="font-display text-4xl mb-6" style="color: rgb(var(--text-1));">Writing statistics</h1>
      <app-loader *ngIf="loading()" />
      <div *ngIf="!loading() && stats()">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div class="card text-center"><p class="text-3xl font-display" style="color: rgb(var(--primary));">{{ stats()?.total }}</p><p class="text-xs mt-1" style="color: rgb(var(--text-3));">Total stories</p></div>
          <div class="card text-center"><p class="text-3xl font-display" style="color: rgb(var(--primary));">{{ stats()?.active }}</p><p class="text-xs mt-1" style="color: rgb(var(--text-3));">Active</p></div>
          <div class="card text-center"><p class="text-3xl font-display" style="color: rgb(var(--primary));">{{ stats()?.archived }}</p><p class="text-xs mt-1" style="color: rgb(var(--text-3));">Archived</p></div>
          <div class="card text-center"><p class="text-3xl font-display" style="color: rgb(var(--primary));">{{ stats()?.favourites }}</p><p class="text-xs mt-1" style="color: rgb(var(--text-3));">Favourites</p></div>
        </div>
        <div class="grid md:grid-cols-2 gap-6">
          <div class="card">
            <h2 class="font-display text-xl mb-4" style="color: rgb(var(--text-1));">Words & time</h2>
            <div class="space-y-3">
              <div class="flex justify-between"><span style="color: rgb(var(--text-2));">Total words</span><span class="font-medium" style="color: rgb(var(--text-1));">{{ stats()?.totalWords }}</span></div>
              <div class="flex justify-between"><span style="color: rgb(var(--text-2));">Reading time</span><span class="font-medium" style="color: rgb(var(--text-1));">{{ stats()?.totalReadingTime }} min</span></div>
              <div class="flex justify-between"><span style="color: rgb(var(--text-2));">Avg words / story</span><span class="font-medium" style="color: rgb(var(--text-1));">{{ avgWords }}</span></div>
              <div class="flex justify-between"><span style="color: rgb(var(--text-2));">Avg reading time</span><span class="font-medium" style="color: rgb(var(--text-1));">{{ avgTime }} min</span></div>
            </div>
          </div>
          <div class="card">
            <h2 class="font-display text-xl mb-4" style="color: rgb(var(--text-1));">Distribution</h2>
            <div class="space-y-3">
              <div class="flex justify-between"><span style="color: rgb(var(--text-2));">Shared stories</span><span class="font-medium" style="color: rgb(var(--text-1));">{{ stats()?.shared }}</span></div>
              <div class="flex justify-between"><span style="color: rgb(var(--text-2));">In trash</span><span class="font-medium" style="color: rgb(var(--text-1));">{{ stats()?.trash }}</span></div>
              <div class="flex justify-between"><span style="color: rgb(var(--text-2));">Collections</span><span class="font-medium" style="color: rgb(var(--text-1));">{{ stats()?.collections }}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class StatisticsComponent implements OnInit {
  private storySvc = inject(StoryService);
  loading = signal(true);
  stats = signal<StoryStats | null>(null);

  get avgWords(): number { return this.stats() ? Math.round(this.stats()!.totalWords / (this.stats()!.total || 1)) : 0; }
  get avgTime(): number { return this.stats() ? Math.round(this.stats()!.totalReadingTime / (this.stats()!.total || 1)) : 0; }

  async ngOnInit() { this.stats.set(await this.storySvc.stats()); this.loading.set(false); }
}

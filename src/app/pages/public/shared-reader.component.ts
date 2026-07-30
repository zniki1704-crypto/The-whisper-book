import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { StoryService } from '../../services/story.service';
import { Story } from '../../models/models';
import { LoaderComponent } from '../../components/loader/loader.component';

@Component({
  selector: 'app-shared-reader',
  standalone: true,
  imports: [CommonModule, FormsModule, LoaderComponent],
  template: `
    <div class="min-h-screen flex items-center justify-center px-4" style="background: rgb(var(--surface));">
      <app-loader *ngIf="loading()" message="Opening shared story…" />
      <div *ngIf="!loading() && needPassword" class="w-full max-w-sm glass-strong rounded-2xl p-8 animate-scale-in">
        <h1 class="font-display text-2xl mb-2" style="color: rgb(var(--text-1));">Password required</h1>
        <p class="text-sm mb-4" style="color: rgb(var(--text-2));">This story is protected. Enter the password to continue.</p>
        <input type="password" class="input mb-3" [(ngModel)]="password" placeholder="Password" (keyup.enter)="tryPassword()" />
        <button class="btn-primary w-full" (click)="tryPassword()">Unlock</button>
      </div>
      <div *ngIf="!loading() && denied" class="w-full max-w-md text-center animate-fade-in">
        <div class="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style="background: rgb(var(--error) / 0.12);">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgb(var(--error))" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <h1 class="font-display text-3xl mb-2" style="color: rgb(var(--text-1));">Access Denied</h1>
        <p class="text-sm mb-6" style="color: rgb(var(--text-2));">This link has expired, reached its view limit, or is no longer active.</p>
      </div>
      <article *ngIf="!loading() && s() && !needPassword" class="w-full max-w-2xl animate-fade-in">
        <div *ngIf="s()!.cover_url" class="rounded-2xl overflow-hidden mb-6 h-56"><img [src]="s()!.cover_url" class="w-full h-full object-cover" [alt]="s()!.title" /></div>
        <h1 class="font-display text-4xl mb-4" style="color: rgb(var(--text-1));">{{ s()!.title }}</h1>
        <div class="reader-prose" [innerHTML]="s()!.content" [class.select-none]="s()!.disable_copy"></div>
        <p class="text-xs mt-8 text-center" style="color: rgb(var(--text-3));">Shared via WhisperBook · a private storytelling sanctuary</p>
      </article>
    </div>
  `,
})
export class SharedReaderComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private storySvc = inject(StoryService);

  loading = signal(true);
  needPassword = false;
  denied = false;
  password = '';
  token = '';
  story = signal<Story | null>(null);
  s = this.story.asReadonly();

  async ngOnInit() {
    this.token = this.route.snapshot.paramMap.get('token') ?? '';
    await this.tryLoad();
  }

  async tryLoad() {
    this.loading.set(true);
    const story = await this.storySvc.getBySharedLink(this.token);
    this.loading.set(false);
    if (!story) {
      this.denied = true;
      return;
    }
    this.story.set(story);
  }

  async tryPassword() {
    if (!this.password) return;
    this.loading.set(true);
    const story = await this.storySvc.getBySharedLink(this.token, this.password);
    this.loading.set(false);
    if (!story) { this.denied = true; return; }
    this.needPassword = false;
    this.story.set(story);
  }
}

import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { StoryService } from '../../services/story.service';
import { ToastService } from '../../services/toast.service';
import { Story, StoryStats } from '../../models/models';
import { StoryCardComponent } from '../../components/story-card/story-card.component';
import { LoaderComponent } from '../../components/loader/loader.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, StoryCardComponent, LoaderComponent],
  template: `
    <div class="max-w-5xl mx-auto">
      <app-loader *ngIf="loading()" />
      <div *ngIf="!loading() && profile()">
        <div class="card flex flex-col sm:flex-row items-center gap-6 mb-8">
          <img *ngIf="profile()?.avatar_url" [src]="profile()?.avatar_url" class="w-24 h-24 rounded-full object-cover border-2" style="border-color: rgb(var(--primary));" alt="avatar" />
          <div *ngIf="!profile()?.avatar_url" class="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-display text-white" style="background: rgb(var(--primary));">{{ (profile()?.username ?? 'W').charAt(0).toUpperCase() }}</div>
          <div class="flex-1 text-center sm:text-left">
            <h1 class="font-display text-3xl" style="color: rgb(var(--text-1));">{{ profile()?.full_name || profile()?.username }}</h1>
            <p class="text-sm" style="color: rgb(var(--text-3));">@{{ profile()?.username }}</p>
            <p *ngIf="profile()?.bio" class="text-sm mt-2 max-w-md" style="color: rgb(var(--text-2));">{{ profile()?.bio }}</p>
            <p class="text-xs mt-2" style="color: rgb(var(--text-3));">Joined {{ joinedDate }}</p>
          </div>
          <a routerLink="/app/profile/edit" class="btn-outline">Edit profile</a>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div class="card text-center"><p class="text-2xl font-display" style="color: rgb(var(--primary));">{{ stats()?.total ?? 0 }}</p><p class="text-xs" style="color: rgb(var(--text-3));">Stories</p></div>
          <div class="card text-center"><p class="text-2xl font-display" style="color: rgb(var(--primary));">{{ stats()?.totalWords ?? 0 }}</p><p class="text-xs" style="color: rgb(var(--text-3));">Words</p></div>
          <div class="card text-center"><p class="text-2xl font-display" style="color: rgb(var(--primary));">{{ stats()?.collections ?? 0 }}</p><p class="text-xs" style="color: rgb(var(--text-3));">Collections</p></div>
          <div class="card text-center"><p class="text-2xl font-display" style="color: rgb(var(--primary));">{{ stats()?.favourites ?? 0 }}</p><p class="text-xs" style="color: rgb(var(--text-3));">Favourites</p></div>
        </div>

        <h2 class="font-display text-2xl mb-4" style="color: rgb(var(--text-1));">Recent stories</h2>
        <div *ngIf="stories().length === 0" class="card text-center py-8"><p class="text-sm" style="color: rgb(var(--text-2));">No stories yet.</p></div>
        <div *ngIf="stories().length" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <app-story-card *ngFor="let s of stories()" [story]="s" />
        </div>
      </div>
    </div>
  `,
})
export class ProfileComponent implements OnInit {
  private auth = inject(AuthService);
  private storySvc = inject(StoryService);

  loading = signal(true);
  profile = this.auth.profile;
  stats = signal<StoryStats | null>(null);
  stories = signal<Story[]>([]);

  get joinedDate(): string {
    return new Date(this.profile()?.joined_at ?? Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  async ngOnInit() {
  console.log('Profile signal:', this.profile());

  const [stats, stories] = await Promise.all([
    this.storySvc.stats(),
    this.storySvc.list({ status: 'active' })
  ]);

  this.stats.set(stats);
  this.stories.set(stories.slice(0, 3));

  this.loading.set(false);
}
}

@Component({
  selector: 'app-profile-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-xl mx-auto">
      <h1 class="font-display text-4xl mb-6" style="color: rgb(var(--text-1));">Edit profile</h1>
      <div class="card space-y-4">
        <div>
          <label class="label">Avatar URL</label>
          <input class="input" [(ngModel)]="avatarUrl" placeholder="https://…" />
        </div>
        <div>
          <label class="label">Username</label>
          <input class="input" [(ngModel)]="username" />
        </div>
        <div>
          <label class="label">Full name</label>
          <input class="input" [(ngModel)]="fullName" />
        </div>
        <div>
          <label class="label">Bio</label>
          <textarea class="input" rows="4" [(ngModel)]="bio"></textarea>
        </div>
        <div class="flex gap-2 pt-2">
          <button class="btn-primary" (click)="save()" [disabled]="saving()">{{ saving() ? 'Saving…' : 'Save changes' }}</button>
          <button class="btn-ghost" (click)="cancel()">Cancel</button>
        </div>
      </div>

      <div class="card mt-6">
        <h2 class="font-display text-xl mb-2" style="color: rgb(var(--text-1));">Change password</h2>
        <div class="space-y-3">
          <input type="password" class="input" [(ngModel)]="newPassword" placeholder="New password" />
          <button class="btn-outline" (click)="changePassword()" [disabled]="!newPassword">Update password</button>
        </div>
      </div>
    </div>
  `,
})
export class ProfileEditComponent {
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);

  avatarUrl = ''; username = ''; fullName = ''; bio = '';
  newPassword = '';
  saving = signal(false);

  constructor() {
    const p = this.auth.profile();
    if (p) {
      this.avatarUrl = p.avatar_url ?? '';
      this.username = p.username;
      this.fullName = p.full_name ?? '';
      this.bio = p.bio ?? '';
    }
  }

  async save() {
    this.saving.set(true);
    try {
      await this.auth.updateProfile({ avatar_url: this.avatarUrl || null, username: this.username, full_name: this.fullName || null, bio: this.bio || null });
      this.toast.success('Profile updated.');
      this.router.navigate(['/app/profile']);
    } catch (e: any) {
      this.toast.error(e.message ?? 'Update failed');
    } finally {
      this.saving.set(false);
    }
  }
  cancel() { this.router.navigate(['/app/profile']); }

  async changePassword() {
    try {
      await this.auth.updatePassword(this.newPassword);
      this.toast.success('Password changed.');
      this.newPassword = '';
    } catch (e: any) {
      this.toast.error(e.message ?? 'Could not change password');
    }
  }
}

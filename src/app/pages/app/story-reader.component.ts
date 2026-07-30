import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { StoryService } from '../../services/story.service';
import { MetaService } from '../../services/meta.service';
import { NotifyService } from '../../services/notify.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { Story, Permission, Comment, SharedLink, PermissionLevel, Profile } from '../../models/models';
import { ModalComponent } from '../../components/modal/modal.component';
import { LoaderComponent } from '../../components/loader/loader.component';

@Component({
  selector: 'app-story-reader',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ModalComponent, LoaderComponent],
  template: `
    <div class="max-w-3xl mx-auto">
      <app-loader *ngIf="loading()" message="Opening your story…" />
      <div *ngIf="!loading() && s()">
        <header class="flex items-center justify-between mb-6">
          <a routerLink="/app/library" class="btn-ghost">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 19-7-7 7-7M19 12H5"/></svg>
            Library
          </a>
          <div class="flex items-center gap-2">
            <button class="btn-ghost" (click)="toggleFav()" [title]="s()!.is_favourite ? 'Remove favourite' : 'Add favourite'">
              <svg *ngIf="!s()!.is_favourite" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              <svg *ngIf="s()!.is_favourite" width="16" height="16" viewBox="0 0 24 24" fill="rgb(var(--accent))" stroke="rgb(var(--accent))" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </button>
            <a [routerLink]="['/app/story', s()!.id, 'edit']" class="btn-outline">Edit</a>
            <button class="btn-outline" (click)="shareOpen=true">Share</button>
            <button class="btn-ghost" (click)="menuOpen.set(!menuOpen())">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
            </button>
            <div *ngIf="menuOpen()" class="absolute mt-32 right-6 w-44 glass-strong rounded-xl shadow-glass py-1 z-50 animate-scale-in">
              <button class="w-full text-left px-4 py-2 text-sm hover:bg-[rgb(var(--surface-3))]" style="color: rgb(var(--text-1));" (click)="archive()">Archive</button>
              <button class="w-full text-left px-4 py-2 text-sm hover:bg-[rgb(var(--surface-3))]" style="color: rgb(var(--text-1));" (click)="trash()">Move to trash</button>
            </div>
          </div>
        </header>

        <article>
          <div *ngIf="s()!.cover_url" class="rounded-2xl overflow-hidden mb-6 h-64">
            <img [src]="s()!.cover_url" [alt]="s()!.title" class="w-full h-full object-cover" />
          </div>
          <div class="flex flex-wrap items-center gap-2 mb-3 text-xs" style="color: rgb(var(--text-3));">
            <span *ngIf="s()!.category" class="chip" [style.border-color]="s()!.category!.color">{{ s()!.category!.name }}</span>
            <span *ngFor="let t of s()!.tags" class="chip">{{ t.name }}</span>
            <span>{{ s()!.word_count }} words</span>
            <span>·</span>
            <span>{{ s()!.reading_time }} min read</span>
            <span>·</span>
            <span>{{ s()!.privacy }}</span>
          </div>
          <h1 class="font-display text-4xl mb-6" style="color: rgb(var(--text-1));">{{ s()!.title }}</h1>
          <div class="reader-prose" [innerHTML]="s()!.content" [class.select-none]="s()!.disable_copy"></div>
        </article>

        <!-- comments -->
        <section class="mt-12 pt-8 border-t" style="border-color: rgb(var(--border));">
          <h2 class="font-display text-2xl mb-4" style="color: rgb(var(--text-1));">Comments</h2>
          <form (ngSubmit)="addComment()" class="flex gap-2 mb-6">
            <input class="input flex-1" [(ngModel)]="newComment" name="comment" placeholder="Add a comment…" />
            <button class="btn-primary" type="submit" [disabled]="!newComment.trim()">Post</button>
          </form>
          <div class="space-y-3">
            <div *ngFor="let c of comments()" class="card !p-4">
              <div class="flex items-center gap-2 mb-2">
                <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs text-white" style="background: rgb(var(--primary));">{{ (c.profile?.username ?? 'A').charAt(0).toUpperCase() }}</div>
                <span class="text-sm font-medium" style="color: rgb(var(--text-1));">{{ c.profile?.username ?? 'Anonymous' }}</span>
                <span class="text-xs" style="color: rgb(var(--text-3));">{{ timeAgo(c.created_at) }}</span>
                <button *ngIf="c.user_id === userId" class="ml-auto text-xs opacity-60 hover:opacity-100" (click)="deleteComment(c.id)" style="color: rgb(var(--error));">Delete</button>
              </div>
              <p class="text-sm" style="color: rgb(var(--text-2));">{{ c.body }}</p>
            </div>
            <p *ngIf="comments().length === 0" class="text-sm" style="color: rgb(var(--text-3));">No comments yet.</p>
          </div>
        </section>

        <!-- share modal -->
        <app-modal [open]="shareOpen" (close)="shareOpen=false" title="Share this story">
          <div class="space-y-5">
            <!-- permissions -->
            <div>
              <h4 class="text-sm font-medium mb-2" style="color: rgb(var(--text-1));">Share with users</h4>
              <div class="flex gap-2 mb-3">
                <input class="input flex-1" [(ngModel)]="shareUsername" placeholder="Enter username…" />
                <select class="input w-32" [(ngModel)]="shareLevel">
                  <option value="view">View</option>
                  <option value="comment">Comment</option>
                  <option value="edit">Edit</option>
                  <option value="owner">Owner</option>
                </select>
                <button class="btn-primary" (click)="addPermission()">Add</button>
              </div>
              <div class="space-y-2">
                <div *ngFor="let p of permissions()" class="flex items-center gap-3 px-3 py-2 rounded-xl" style="background: rgb(var(--surface-3));">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs text-white" style="background: rgb(var(--primary));">{{ (p.profile?.username ?? 'U').charAt(0).toUpperCase() }}</div>
                  <span class="text-sm flex-1" style="color: rgb(var(--text-1));">{{ p.profile?.username ?? 'Unknown' }}</span>
                  <select class="input w-28 py-1 text-xs" [ngModel]="p.permission_level" (ngModelChange)="updatePermission(p.id, $event)">
                    <option value="view">View</option>
                    <option value="comment">Comment</option>
                    <option value="edit">Edit</option>
                    <option value="owner">Owner</option>
                  </select>
                  <button class="text-xs" style="color: rgb(var(--error));" (click)="removePermission(p.id)">Remove</button>
                </div>
                <p *ngIf="permissions().length === 0" class="text-xs" style="color: rgb(var(--text-3));">Not shared with anyone yet.</p>
              </div>
            </div>

            <!-- secure links -->
            <div class="pt-4 border-t" style="border-color: rgb(var(--border));">
              <h4 class="text-sm font-medium mb-2" style="color: rgb(var(--text-1));">Secure share links</h4>
              <div class="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label class="label">Link password (optional)</label>
                  <input class="input" [(ngModel)]="linkPassword" placeholder="No password" />
                </div>
                <div>
                  <label class="label">Expires in (days)</label>
                  <input type="number" class="input" [(ngModel)]="linkExpiryDays" placeholder="Never" />
                </div>
              </div>
              <button class="btn-outline w-full" (click)="createLink()">Generate secure link</button>
              <div *ngFor="let l of links()" class="mt-3 p-3 rounded-xl" style="background: rgb(var(--surface-3));">
                <div class="flex items-center gap-2">
                  <code class="text-xs flex-1 truncate" style="color: rgb(var(--primary));">{{ shareUrl(l.token) }}</code>
                  <button class="text-xs link" (click)="copyLink(l.token)">Copy</button>
                  <button class="text-xs" style="color: rgb(var(--error));" (click)="deleteLink(l.id)">Delete</button>
                </div>
                <div class="text-[11px] mt-1" style="color: rgb(var(--text-3));">
                  {{ l.views }} views · {{ l.expires_at ? 'expires ' + timeAgo(l.expires_at) : 'never expires' }}
                </div>
              </div>
            </div>
          </div>
        </app-modal>
      </div>

      <div *ngIf="!loading() && !s()" class="card text-center py-16">
        <h2 class="font-display text-2xl mb-2" style="color: rgb(var(--text-1));">Access Denied</h2>
        <p class="text-sm mb-4" style="color: rgb(var(--text-2));">You don't have permission to view this story, or it no longer exists.</p>
        <a routerLink="/app/library" class="btn-primary">Back to library</a>
      </div>
    </div>
  `,
})
export class StoryReaderComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private storySvc = inject(StoryService);
  private meta = inject(MetaService);
  private notify = inject(NotifyService);
  private toast = inject(ToastService);
  private auth = inject(AuthService);

  loading = signal(true);
  story = signal<Story | null>(null);
  s = this.story.asReadonly();
  comments = signal<Comment[]>([]);
  permissions = signal<Permission[]>([]);
  links = signal<SharedLink[]>([]);
  menuOpen = signal(false);

  shareOpen = false;
  shareUsername = '';
  shareLevel: PermissionLevel = 'view';
  linkPassword = '';
  linkExpiryDays: number | null = null;
  newComment = '';
  userId = '';

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.router.navigate(['/app/library']); return; }
    this.userId = this.auth.user()?.id ?? '';
    try {
      const story = await this.storySvc.get(id);
      this.story.set(story);
      if (story) {
        const [comments, perms, links] = await Promise.all([
          this.storySvc.comments(id),
          this.storySvc.listPermissions(id),
          this.storySvc.listSharedLinks(id),
        ]);
        this.comments.set(comments);
        this.permissions.set(perms);
        this.links.set(links);
      }
    } catch (e) {
      this.story.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  async toggleFav() {
    const newVal = !this.story()!.is_favourite;
    await this.storySvc.toggleFavourite(this.story()!.id, newVal);
    this.story.update((s) => s ? { ...s, is_favourite: newVal } : s);
  }

  async archive() {
    await this.storySvc.setStatus(this.story()!.id, 'archived');
    this.toast.success('Story archived.');
    this.router.navigate(['/app/library']);
  }
  async trash() {
    await this.storySvc.setStatus(this.story()!.id, 'trash');
    this.toast.success('Story moved to trash.');
    this.router.navigate(['/app/library']);
  }

  async addComment() {
    if (!this.newComment.trim()) return;
    await this.storySvc.addComment(this.story()!.id, this.newComment.trim());
    this.newComment = '';
    this.comments.set(await this.storySvc.comments(this.story()!.id));
  }
  async deleteComment(id: string) {
    await this.storySvc.deleteComment(id);
    this.comments.set(this.comments().filter((c) => c.id !== id));
  }

  async addPermission() {
    if (!this.shareUsername.trim()) return;
    const profile = await this.notify.findUserByUsername(this.shareUsername.trim());
    if (!profile) { this.toast.error('User not found'); return; }
    if (profile.id === this.userId) { this.toast.warning("You can't share with yourself"); return; }
    await this.storySvc.addPermission(this.story()!.id, profile.id, this.shareLevel);
    this.permissions.set(await this.storySvc.listPermissions(this.story()!.id));
    this.shareUsername = '';
    this.toast.success(`Shared with ${profile.username}`);
  }
  async updatePermission(id: string, level: PermissionLevel) {
    await this.storySvc.updatePermission(id, level);
    this.permissions.set(await this.storySvc.listPermissions(this.story()!.id));
  }
  async removePermission(id: string) {
    await this.storySvc.removePermission(id);
    this.permissions.set(this.permissions().filter((p) => p.id !== id));
  }

  async createLink() {
    const opts: any = {};
    if (this.linkPassword) opts.password = this.linkPassword;
    if (this.linkExpiryDays) opts.expiresAt = new Date(Date.now() + this.linkExpiryDays * 86400000).toISOString();
    await this.storySvc.createSharedLink(this.story()!.id, opts);
    this.links.set(await this.storySvc.listSharedLinks(this.story()!.id));
    this.linkPassword = '';
    this.linkExpiryDays = null;
    this.toast.success('Secure link generated.');
  }
  async deleteLink(id: string) {
    await this.storySvc.deleteSharedLink(id);
    this.links.set(this.links().filter((l) => l.id !== id));
  }

  shareUrl(token: string): string {
    return `${location.origin}/s/${token}`;
  }
  copyLink(token: string) {
    navigator.clipboard.writeText(this.shareUrl(token));
    this.toast.success('Link copied to clipboard.');
  }

  timeAgo(date: string): string {
    const diff = (Date.now() - new Date(date).getTime()) / 1000;
    if (diff < 0) return 'in the future';
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }
}

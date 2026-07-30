import { Component, inject, signal, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { StoryService } from '../../services/story.service';
import { MetaService } from '../../services/meta.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { Story, Category, Tag, StoryPrivacy } from '../../models/models';
import { RichEditorComponent } from '../../components/rich-editor/rich-editor.component';
import { ModalComponent } from '../../components/modal/modal.component';
import { LoaderComponent } from '../../components/loader/loader.component';

@Component({
  selector: 'app-story-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RichEditorComponent, ModalComponent, LoaderComponent],
  template: `
    <div class="max-w-4xl mx-auto">
      <app-loader *ngIf="loading()" message="Opening your story…" />
      <div *ngIf="!loading()">
        <header class="flex items-center justify-between mb-6">
          <a [routerLink]="storyId ? ['/app/story', storyId] : ['/app/library']" class="btn-ghost">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 19-7-7 7-7M19 12H5"/></svg>
            Back
          </a>
          <div class="flex items-center gap-3">
            <span *ngIf="lastSaved()" class="text-xs" style="color: rgb(var(--text-3));">Saved {{ lastSaved() }}</span>
            <button class="btn-outline" (click)="openSettings()">Settings</button>
            <button class="btn-primary" (click)="save()" [disabled]="saving()">{{ saving() ? 'Saving…' : 'Save' }}</button>
          </div>
        </header>

        <input class="w-full bg-transparent border-none outline-none font-display text-4xl mb-2"
               placeholder="Title your story…"
               [(ngModel)]="title"
               style="color: rgb(var(--text-1));" />
        <div class="flex flex-wrap items-center gap-3 text-sm mb-6" style="color: rgb(var(--text-3));">
          <span>{{ wordCount() }} words</span>
          <span>·</span>
          <span>{{ readingTime() }} min read</span>
          <span *ngIf="categoryName">·</span>
          <span *ngIf="categoryName">{{ categoryName }}</span>
        </div>

        <app-rich-editor [content]="content" (contentChange)="onContentChange($event)" #editor />

        <!-- settings modal -->
        <app-modal [open]="settingsOpen" (close)="settingsOpen=false" title="Story settings">
          <div class="space-y-4">
            <div>
              <label class="label">Cover image URL</label>
              <input class="input" [(ngModel)]="coverUrl" placeholder="https://…" />
            </div>
            <div>
              <label class="label">Category</label>
              <select class="input" [(ngModel)]="categoryId">
                <option [ngValue]="null">No category</option>
                <option *ngFor="let c of categories()" [value]="c.id">{{ c.name }}</option>
              </select>
            </div>
            <div>
              <label class="label">Privacy</label>
              <select class="input" [(ngModel)]="privacy">
                <option value="private">Private — only you</option>
                <option value="shared">Shared — with selected users</option>
                <option value="password">Password protected</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>
            <div>
              <label class="label">Tags (comma separated)</label>
              <input class="input" [(ngModel)]="tagInput" placeholder="journal, travel, poem" />
            </div>
            <div class="space-y-2">
              <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" class="accent-[rgb(var(--primary))]" [(ngModel)]="disableCopy" />
                <span class="text-sm" style="color: rgb(var(--text-2));">Disable copy on shared stories</span>
              </label>
              <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" class="accent-[rgb(var(--primary))]" [(ngModel)]="disableDownload" />
                <span class="text-sm" style="color: rgb(var(--text-2));">Disable download</span>
              </label>
            </div>
          </div>
          <div class="flex justify-end gap-2 mt-6">
            <button class="btn-ghost" (click)="settingsOpen=false">Cancel</button>
            <button class="btn-primary" (click)="applySettings()">Apply</button>
          </div>
        </app-modal>
      </div>
    </div>
  `,
})
export class StoryEditorComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private storySvc = inject(StoryService);
  private meta = inject(MetaService);
  private toast = inject(ToastService);
  private auth = inject(AuthService);

  @ViewChild('editor') editor!: RichEditorComponent;

  loading = signal(true);
  saving = signal(false);
  storyId: string | null = null;
  title = '';
  content = '';
  coverUrl = '';
  categoryId: string | null = null;
  privacy: StoryPrivacy = 'private';
  tagInput = '';
  disableCopy = false;
  disableDownload = false;
  settingsOpen = false;

  categories = signal<Category[]>([]);
  categoryName = '';
  lastSaved = signal<string | null>(null);
  private autosaveTimer: any;

  async ngOnInit() {
  const id = this.route.snapshot.paramMap.get('id');

  this.categories.set(await this.meta.listCategories());

  // New story
  if (!id || id === 'new') {
    this.storyId = null;
    this.loading.set(false);
    return;
  }

  // Existing story
  this.storyId = id;

  const story = await this.storySvc.get(id);

  if (!story) {
    this.toast.error('Story not found');
    this.router.navigate(['/app/library']);
    return;
  }

  this.title = story.title;
  this.content = story.content;
  this.coverUrl = story.cover_url ?? '';
  this.categoryId = story.category_id;
  this.privacy = story.privacy;
  this.disableCopy = story.disable_copy;
  this.disableDownload = story.disable_download;
  this.categoryName = story.category?.name ?? '';
  this.tagInput = (story.tags ?? []).map(t => t.name).join(', ');

  this.loading.set(false);
}

  onContentChange(html: string) {
    this.content = html;
    if (this.autosaveTimer) clearTimeout(this.autosaveTimer);
    if (this.storyId) {
      this.autosaveTimer = setTimeout(() => this.autosave(), 2500);
    }
  }

  wordCount(): number {
    const text = this.content.replace(/<[^>]*>/g, ' ').trim();
    return text ? text.split(/\s+/).length : 0;
  }
  readingTime(): number {
    return Math.max(1, Math.round(this.wordCount() / 200));
  }

  openSettings() { this.settingsOpen = true; }

  applySettings() {
    this.settingsOpen = false;
    const cat = this.categories().find((c) => c.id === this.categoryId);
    this.categoryName = cat?.name ?? '';
  }

  async autosave() {
    if (!this.storyId) return;
    await this.storySvc.autosave(this.storyId, this.content);
    this.lastSaved.set('just now');
  }

  async save() {
    this.saving.set(true);
    try {
      let id = this.storyId;
      if (!id) {
        const created = await this.storySvc.create({
          title: this.title || 'Untitled',
          content: this.content,
          cover_url: this.coverUrl || undefined,
          category_id: this.categoryId ?? undefined,
          privacy: this.privacy,
          disable_copy: this.disableCopy,
          disable_download: this.disableDownload,
        });
        id = created.id;
        this.storyId = id;
      } else {
        await this.storySvc.update(id, {
          title: this.title || 'Untitled',
          content: this.content,
          cover_url: this.coverUrl || undefined,
          category_id: this.categoryId,
          privacy: this.privacy,
          disable_copy: this.disableCopy,
          disable_download: this.disableDownload,
        });
        await this.storySvc.saveVersion(id, this.content);
        await this.auth.logActivity('story_edited', `Edited "${this.title}"`);
      }
      // tags
      if (this.tagInput.trim()) {
        const names = this.tagInput.split(',').map((s) => s.trim()).filter(Boolean);
        const tagIds: string[] = [];
        for (const n of names) {
          const t = await this.meta.ensureTag(n);
          tagIds.push(t.id);
        }
        await this.storySvc.setTags(id, tagIds);
      }
      this.lastSaved.set('just now');
      this.toast.success('Story saved.');
      this.router.navigate(['/app/story', id]);
    } catch (e: any) {
      this.toast.error(e.message ?? 'Save failed');
    } finally {
      this.saving.set(false);
    }
  }
}

import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MetaService } from '../../services/meta.service';
import { ToastService } from '../../services/toast.service';
import { Category } from '../../models/models';
import { ModalComponent } from '../../components/modal/modal.component';
import { LoaderComponent } from '../../components/loader/loader.component';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, LoaderComponent],
  template: `
    <div class="max-w-4xl mx-auto">
      <header class="flex items-center justify-between mb-6">
        <div>
          <h1 class="font-display text-4xl" style="color: rgb(var(--text-1));">Categories</h1>
          <p class="text-sm mt-1" style="color: rgb(var(--text-3));">{{ categories().length }} categories</p>
        </div>
        <button class="btn-primary" (click)="openCreate()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
          New category
        </button>
      </header>

      <app-loader *ngIf="loading()" />
      <div *ngIf="!loading() && categories().length === 0" class="card text-center py-12">
        <p class="font-display text-xl mb-2" style="color: rgb(var(--text-1));">No categories yet</p>
        <p class="text-sm mb-4" style="color: rgb(var(--text-2));">Organise your stories with categories like Journal, Poem, or Travel.</p>
        <button class="btn-primary" (click)="openCreate()">Create a category</button>
      </div>

      <div *ngIf="!loading() && categories().length" class="grid sm:grid-cols-2 gap-4">
        <div *ngFor="let c of categories()" class="card flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl" [style.background]="c.color"></div>
          <div class="flex-1">
            <p class="font-medium" style="color: rgb(var(--text-1));">{{ c.name }}</p>
          </div>
          <button class="btn-ghost text-xs" (click)="openEdit(c)">Edit</button>
          <button class="text-xs" style="color: rgb(var(--error));" (click)="remove(c)">Delete</button>
        </div>
      </div>

      <app-modal [open]="modalOpen" (close)="modalOpen=false" [title]="editing ? 'Edit category' : 'New category'">
        <div class="space-y-4">
          <div><label class="label">Name</label><input class="input" [(ngModel)]="name" placeholder="e.g. Travel" /></div>
          <div><label class="label">Color</label><input type="color" class="input h-12" [(ngModel)]="color" /></div>
        </div>
        <div class="flex justify-end gap-2 mt-6">
          <button class="btn-ghost" (click)="modalOpen=false">Cancel</button>
          <button class="btn-primary" (click)="save()">{{ editing ? 'Update' : 'Create' }}</button>
        </div>
      </app-modal>
    </div>
  `,
})
export class CategoriesComponent implements OnInit {
  private meta = inject(MetaService);
  private toast = inject(ToastService);

  loading = signal(true);
  categories = signal<Category[]>([]);
  modalOpen = false;
  editing: Category | null = null;
  name = ''; color = '#8a7a4a';

  async ngOnInit() { await this.reload(); }
  async reload() { this.loading.set(true); this.categories.set(await this.meta.listCategories()); this.loading.set(false); }

  openCreate() { this.editing = null; this.name = ''; this.color = '#8a7a4a'; this.modalOpen = true; }
  openEdit(c: Category) { this.editing = c; this.name = c.name; this.color = c.color; this.modalOpen = true; }

  async save() {
    if (!this.name.trim()) return;
    if (this.editing) {
      await this.meta.updateCategory(this.editing.id, { name: this.name.trim(), color: this.color });
      this.toast.success('Category updated.');
    } else {
      await this.meta.createCategory(this.name.trim(), this.color);
      this.toast.success('Category created.');
    }
    this.modalOpen = false;
    await this.reload();
  }
  async remove(c: Category) {
    await this.meta.deleteCategory(c.id);
    this.toast.success('Category deleted.');
    await this.reload();
  }
}

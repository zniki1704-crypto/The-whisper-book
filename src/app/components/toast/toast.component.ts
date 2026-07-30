import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-4 right-4 z-[60] flex flex-col gap-2 max-w-sm">
      <div *ngFor="let t of toastService.toasts()"
           class="glass-strong rounded-xl px-4 py-3 shadow-glass flex items-start gap-3 animate-fade-in"
           [class]="borderClass(t.type)">
        <span class="mt-0.5" [innerHTML]="icon(t.type)"></span>
        <p class="text-sm flex-1" style="color: rgb(var(--text-1));">{{ t.message }}</p>
        <button class="text-xs opacity-60 hover:opacity-100" (click)="toastService.dismiss(t.id)" style="color: rgb(var(--text-3));">✕</button>
      </div>
    </div>
  `,
  styles: [`
    .toast-success { border-left: 3px solid rgb(var(--success)); }
    .toast-error { border-left: 3px solid rgb(var(--error)); }
    .toast-info { border-left: 3px solid rgb(var(--primary)); }
    .toast-warning { border-left: 3px solid rgb(var(--warning)); }
  `],
})
export class ToastComponent {
  constructor(public toastService: ToastService) {}

  borderClass(type: string) {
    return `toast-${type}`;
  }

  icon(type: string) {
    const icons: Record<string, string> = {
      success: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgb(var(--success))" stroke-width="2.5"><path d="M20 6 9 17l-5-5"/></svg>',
      error: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgb(var(--error))" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>',
      info: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgb(var(--primary))" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>',
      warning: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgb(var(--warning))" stroke-width="2.5"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>',
    };
    return icons[type] ?? icons['info'];
  }
}

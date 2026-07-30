import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('overlay', [transition(':enter', [style({ opacity: 0 }), animate('200ms ease-out', style({ opacity: 1 }))])]),
    trigger('panel', [transition(':enter', [style({ opacity: 0, transform: 'scale(0.96) translateY(8px)' }), animate('220ms cubic-bezier(0.16,1,0.3,1)', style({ opacity: 1, transform: 'scale(1) translateY(0)' }))])]),
  ],
  template: `
    <div *ngIf="open" class="fixed inset-0 z-50 flex items-center justify-center p-4" @overlay>
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" (click)="close.emit()"></div>
      <div class="relative w-full max-w-lg glass-strong rounded-2xl shadow-glass p-6 animate-scale-in" @panel>
        <div class="flex items-start justify-between mb-4">
          <h3 class="text-xl font-display" style="color: rgb(var(--text-1));">{{ title }}</h3>
          <button class="btn-ghost p-1.5 rounded-lg" (click)="close.emit()" aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <ng-content></ng-content>
      </div>
    </div>
  `,
})
export class ModalComponent {
  @Input() open = false;
  @Input() title = '';
  @Output() close = new EventEmitter<void>();
}

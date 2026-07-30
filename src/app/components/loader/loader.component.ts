import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col items-center justify-center gap-3 py-12">
      <div class="relative w-12 h-12">
        <div class="absolute inset-0 rounded-full border-2" style="border-color: rgb(var(--border));"></div>
        <div class="absolute inset-0 rounded-full border-2 border-transparent animate-spin"
             style="border-top-color: rgb(var(--primary)); animation-duration: 0.8s;"></div>
      </div>
      <p class="text-sm" style="color: rgb(var(--text-3));">{{ message }}</p>
    </div>
  `,
})
export class LoaderComponent {
  @Input() message = 'Loading…';
}

import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-forgot',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center px-4" style="background: rgb(var(--surface));">
      <div class="w-full max-w-md glass-strong rounded-2xl shadow-glass p-8 animate-scale-in">
        <h1 class="font-display text-3xl mb-1" style="color: rgb(var(--text-1));">Reset password</h1>
        <p class="text-sm mb-6" style="color: rgb(var(--text-2));">We'll send a recovery link to your email.</p>
        <form (ngSubmit)="submit()" class="space-y-4">
          <input type="email" class="input" name="email" [(ngModel)]="email" required placeholder="you@example.com" />
          <button type="submit" class="btn-primary w-full py-3" [disabled]="loading()">{{ loading() ? 'Sending…' : 'Send reset link' }}</button>
        </form>
        <p class="text-center text-sm mt-6" style="color: rgb(var(--text-2));"><a routerLink="/login" class="link">Back to sign in</a></p>
      </div>
    </div>
  `,
})
export class ForgotComponent {
  email = '';
  loading = signal(false);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  async submit() {
    if (!this.email) return;
    this.loading.set(true);
    try {
      await this.auth.resetPassword(this.email);
      this.toast.success('If that email exists, a reset link is on its way.');
    } catch (e: any) {
      this.toast.error(e.message ?? 'Could not send reset link');
    } finally {
      this.loading.set(false);
    }
  }
}

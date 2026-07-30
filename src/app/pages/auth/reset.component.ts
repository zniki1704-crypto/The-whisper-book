import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-reset',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center px-4" style="background: rgb(var(--surface));">
      <div class="w-full max-w-md glass-strong rounded-2xl shadow-glass p-8 animate-scale-in">
        <h1 class="font-display text-3xl mb-1" style="color: rgb(var(--text-1));">New password</h1>
        <p class="text-sm mb-6" style="color: rgb(var(--text-2));">Choose a new password for your account.</p>
        <form (ngSubmit)="submit()" class="space-y-4">
          <input type="password" class="input" name="password" [(ngModel)]="password" required minlength="6" placeholder="New password" />
          <input type="password" class="input" name="confirm" [(ngModel)]="confirm" required placeholder="Confirm password" />
          <button type="submit" class="btn-primary w-full py-3" [disabled]="loading()">{{ loading() ? 'Updating…' : 'Update password' }}</button>
        </form>
        <p class="text-center text-sm mt-6" style="color: rgb(var(--text-2));"><a routerLink="/login" class="link">Back to sign in</a></p>
      </div>
    </div>
  `,
})
export class ResetComponent {
  password = '';
  confirm = '';
  loading = signal(false);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);

  async submit() {
    if (this.password !== this.confirm) {
      this.toast.error('Passwords do not match');
      return;
    }
    this.loading.set(true);
    try {
      await this.auth.updatePassword(this.password);
      this.toast.success('Password updated. Please sign in.');
      this.router.navigate(['/login']);
    } catch (e: any) {
      this.toast.error(e.message ?? 'Could not update password');
    } finally {
      this.loading.set(false);
    }
  }
}

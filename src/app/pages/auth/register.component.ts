import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style="background: rgb(var(--surface));">
      <div class="absolute -top-32 -left-32 w-80 h-80 rounded-full blur-3xl opacity-25" style="background: rgb(var(--primary));"></div>
      <div class="absolute -bottom-32 -right-32 w-80 h-80 rounded-full blur-3xl opacity-20" style="background: rgb(var(--accent));"></div>

      <div class="relative w-full max-w-md glass-strong rounded-2xl shadow-glass p-8 animate-scale-in">
        <a routerLink="/" class="flex items-center gap-2.5 mb-8">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background: rgb(var(--primary));">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          </div>
          <span class="font-display text-2xl" style="color: rgb(var(--text-1));">WhisperBook</span>
        </a>

        <h1 class="font-display text-3xl mb-1" style="color: rgb(var(--text-1));">Begin your story</h1>
        <p class="text-sm mb-6" style="color: rgb(var(--text-2));">Create a private storytelling account.</p>

        <form (ngSubmit)="submit()" class="space-y-4">
          <div>
            <label class="label">Username</label>
            <input class="input" name="username" [(ngModel)]="username" required placeholder="yourname" autocomplete="username" />
          </div>
          <div>
            <label class="label">Email</label>
            <input type="email" class="input" name="email" [(ngModel)]="email" required placeholder="you@example.com" autocomplete="email" />
          </div>
          <div>
            <label class="label">Password</label>
            <input type="password" class="input" name="password" [(ngModel)]="password" required minlength="6" placeholder="At least 6 characters" autocomplete="new-password" />
          </div>
          <div class="flex items-start gap-2 text-xs" style="color: rgb(var(--text-3));">
            <input type="checkbox" class="mt-0.5 accent-[rgb(var(--primary))]" required />
            <span>I understand my stories are private and stored securely.</span>
          </div>
          <button type="submit" class="btn-primary w-full py-3" [disabled]="loading()">{{ loading() ? 'Creating account…' : 'Create account' }}</button>
        </form>

        <p class="text-center text-sm mt-6" style="color: rgb(var(--text-2));">
          Already have an account? <a routerLink="/login" class="link">Sign in</a>
        </p>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  username = '';
  email = '';
  password = '';
  loading = signal(false);

  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);

  async submit() {
    if (!this.username || !this.email || !this.password) return;
    this.loading.set(true);
    try {
      await this.auth.signUp(this.email, this.password, this.username);
      this.toast.success('Account created — welcome to WhisperBook.');
      this.router.navigate(['/app/dashboard']);
    } catch (e: any) {
      this.toast.error(e.message ?? 'Registration failed');
    } finally {
      this.loading.set(false);
    }
  }
}

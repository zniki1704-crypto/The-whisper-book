import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style="background: rgb(var(--surface));">
      <div class="absolute -top-32 -right-32 w-80 h-80 rounded-full blur-3xl opacity-25" style="background: rgb(var(--primary));"></div>
      <div class="absolute -bottom-32 -left-32 w-80 h-80 rounded-full blur-3xl opacity-20" style="background: rgb(var(--accent));"></div>

      <div class="relative w-full max-w-md glass-strong rounded-2xl shadow-glass p-8 animate-scale-in">
        <a routerLink="/" class="flex items-center gap-2.5 mb-8">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background: rgb(var(--primary));">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          </div>
          <span class="font-display text-2xl" style="color: rgb(var(--text-1));">WhisperBook</span>
        </a>

        <h1 class="font-display text-3xl mb-1" style="color: rgb(var(--text-1));">Welcome back</h1>
        <p class="text-sm mb-6" style="color: rgb(var(--text-2));">Sign in to your private library.</p>

        <form (ngSubmit)="submit()" class="space-y-4">
          <div>
            <label class="label">Email</label>
            <input type="email" class="input" name="email" [(ngModel)]="email" required placeholder="you@example.com" autocomplete="email" />
          </div>
          <div>
            <label class="label">Password</label>
            <div class="relative">
              <input [type]="showPass() ? 'text' : 'password'" class="input pr-10" name="password" [(ngModel)]="password" required placeholder="••••••••" autocomplete="current-password" />
              <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100" (click)="showPass.set(!showPass())" style="color: rgb(var(--text-3));">
                <svg *ngIf="!showPass()" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <svg *ngIf="showPass()" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              </button>
            </div>
          </div>
          <div class="flex items-center justify-between text-sm">
            <label class="flex items-center gap-2 cursor-pointer" style="color: rgb(var(--text-2));">
              <input type="checkbox" class="accent-[rgb(var(--primary))]" /> Remember me
            </label>
            <a routerLink="/forgot" class="link">Forgot password?</a>
          </div>
          <button type="submit" class="btn-primary w-full py-3" [disabled]="loading()">{{ loading() ? 'Signing in…' : 'Sign in' }}</button>
        </form>

        <p class="text-center text-sm mt-6" style="color: rgb(var(--text-2));">
          New here? <a routerLink="/register" class="link">Create an account</a>
        </p>
      </div>
    </div>
  `,
})
export class LoginComponent {
  email = '';
  password = '';
  showPass = signal(false);
  loading = signal(false);

  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);

  async submit() {
    if (!this.email || !this.password) return;
    this.loading.set(true);
    try {
      await this.auth.signIn(this.email, this.password);
      this.toast.success('Welcome back to your library.');
      this.router.navigate(['/app/dashboard']);
    } catch (e: any) {
      this.toast.error(e.message ?? 'Sign in failed');
    } finally {
      this.loading.set(false);
    }
  }
}

import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { THEMES, ThemeName } from '../../models/models';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-3xl mx-auto">
      <h1 class="font-display text-4xl mb-6" style="color: rgb(var(--text-1));">Settings</h1>

      <section class="card mb-6">
        <h2 class="font-display text-xl mb-1" style="color: rgb(var(--text-1));">Theme</h2>
        <p class="text-sm mb-4" style="color: rgb(var(--text-3));">Choose how your library feels. Switches instantly across the whole app.</p>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button *ngFor="let t of themes" (click)="setTheme(t.id)"
                  class="p-3 rounded-xl border-2 transition-all duration-200 text-left"
                  [style.border-color]="themeSvc.theme() === t.id ? 'rgb(var(--primary))' : 'rgb(var(--border))'"
                  [style.background]="themeSvc.theme() === t.id ? 'rgb(var(--primary) / 0.08)' : 'rgb(var(--surface-2))'">
            <div class="flex gap-1 mb-2">
              <div *ngFor="let c of t.swatch" class="w-5 h-5 rounded-full" [style.background]="c"></div>
            </div>
            <p class="text-sm font-medium" style="color: rgb(var(--text-1));">{{ t.label }}</p>
            <p class="text-[11px]" style="color: rgb(var(--text-3));">{{ t.description }}</p>
          </button>
        </div>
      </section>

      <section class="card mb-6">
        <h2 class="font-display text-xl mb-1" style="color: rgb(var(--text-1));">Account</h2>
        <p class="text-sm mb-4" style="color: rgb(var(--text-3));">{{ email }}</p>
        <div class="space-y-3">
          <button class="btn-outline w-full" (click)="goProfile()">Edit profile</button>
          <button class="btn-outline w-full" (click)="changePass()">Change password</button>
          <button class="btn-danger w-full" (click)="logout()">Sign out</button>
        </div>
      </section>

      <section class="card">
        <h2 class="font-display text-xl mb-2" style="color: rgb(var(--text-1));">Privacy</h2>
        <p class="text-sm" style="color: rgb(var(--text-2));">Every story you write is private by default. Only stories you explicitly share — by user or secure link — can be seen by others. You can revoke access at any time from each story's Share panel.</p>
      </section>
    </div>
  `,
})
export class SettingsComponent {
  themeSvc = inject(ThemeService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);

  themes = THEMES;
  email = this.auth.user()?.email ?? '';

  setTheme(t: ThemeName) {
    this.themeSvc.setTheme(t);
    this.auth.updateProfile({ favorite_theme: t });
    this.toast.success('Theme applied across WhisperBook.');
  }
  goProfile() { this.router.navigate(['/app/profile/edit']); }
  changePass() { this.router.navigate(['/app/profile/edit']); }
  async logout() { await this.auth.signOut(); this.router.navigate(['/']); }
}

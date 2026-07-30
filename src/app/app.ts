import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { AuthService } from './services/auth.service';
import { ThemeService } from './services/theme.service';
import { ToastComponent } from './components/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, ToastComponent],
  template: `
    <app-toast />
    <router-outlet />
  `,
})
export class App implements OnInit {
  private auth = inject(AuthService);
  private theme = inject(ThemeService);
  private router = inject(Router);

  async ngOnInit() {
    await this.auth.loadProfile();
    const fav = this.auth.profile()?.favorite_theme;
    if (fav) this.theme.syncFromProfile(fav as any);
  }
}

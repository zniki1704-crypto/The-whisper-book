import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.loading()) {
    await new Promise((r) => setTimeout(r, 300));
  }
  if (auth.isAuthenticated()) return true;
  router.navigate(['/login']);
  return false;
};

export const guestGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.loading()) await new Promise((r) => setTimeout(r, 300));
  if (!auth.isAuthenticated()) return true;
  router.navigate(['/app/dashboard']);
  return false;
};

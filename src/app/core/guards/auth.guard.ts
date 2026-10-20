import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};

export const superAdminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  if (authService.isSuperAdmin()) {
    return true;
  }

  // Si es un admin normal, no puede entrar a la gestión de consorcios
  router.navigate(['/dashboard']);
  return false;
};

export const condoOrBuildingAdminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  if (authService.isSuperAdmin()) {
    // SuperAdmin solo gestiona consorcios y dashboard de plataforma
    router.navigate(['/consortiums']);
    return false;
  }

  return true;
};

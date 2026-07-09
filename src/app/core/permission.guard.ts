import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, UserPermission } from '../services/auth.service';

export const permissionGuard: CanActivateFn = route => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const permission = route.data['permission'] as UserPermission | undefined;
  const requiresAdminPanelAccess = route.data['requiresAdminPanelAccess'] === true;

  if (requiresAdminPanelAccess && authService.canAccessAdminPanel()) {
    return true;
  }

  if (requiresAdminPanelAccess) {
    return router.createUrlTree(['/unauthorized']);
  }

  if (!permission || authService.hasPermission(permission)) {
    return true;
  }

  return router.createUrlTree(['/unauthorized']);
};

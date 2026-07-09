import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, UserPermission } from '../services/auth.service';

export const permissionGuard: CanActivateFn = route => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  const permission = route.data['permission'] as UserPermission | undefined;
  const permissions = route.data['permissions'] as UserPermission[] | undefined;
  const requiresAdminPanelAccess = route.data['requiresAdminPanelAccess'] === true;

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  if (requiresAdminPanelAccess && authService.canAccessAdminPanel()) {
    return true;
  }

  if (requiresAdminPanelAccess) {
    return router.createUrlTree(['/unauthorized']);
  }

  if (permissions && permissions.every(item => authService.hasPermission(item))) {
    return true;
  }

  if (!permissions && (!permission || authService.hasPermission(permission))) {
    return true;
  }

  return router.createUrlTree(['/unauthorized']);
};

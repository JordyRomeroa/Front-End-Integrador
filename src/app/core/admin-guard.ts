import { CanActivate, CanActivateFn, Router } from "@angular/router";
import { inject, Injectable } from "@angular/core";
import { AuthService } from "../../services/auth-service";

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.token()) {
    console.log(" No hay token. Redirigiendo a login...");
    router.navigate(['/login']);
    return false;
  }

  const role = authService.userRole();

  if (role === 'ROLE_ADMIN' || role === 'admin') {
    return true;
  }

  router.navigate(['/home']);
  return false;
};
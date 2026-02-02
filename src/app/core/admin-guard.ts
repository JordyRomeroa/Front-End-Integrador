import { CanActivate, CanActivateFn, Router } from "@angular/router";
import { inject, Injectable } from "@angular/core";
import { AuthService } from "../../services/auth-service";

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log("🛡️ [AdminGuard] Verificando acceso...");

  if (!authService.token()) {
    console.log("❌ No hay token. Redirigiendo a login...");
    router.navigate(['/login']);
    return false;
  }

  const role = authService.userRole();
  console.log("🛡️ Rol detectado en señal:", role);

  // === CAMBIO AQUÍ: Aceptar 'admin' o 'ROLE_ADMIN' ===
  if (role === 'ROLE_ADMIN' || role === 'admin') {
    console.log("🟩 Acceso autorizado como ADMIN");
    return true;
  }

  console.log("⛔ Acceso DENEGADO. No es admin.");
  router.navigate(['/home']);
  return false;
};
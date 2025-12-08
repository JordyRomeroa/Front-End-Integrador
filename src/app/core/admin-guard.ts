import { CanActivate, Router } from "@angular/router";
import { Injectable } from "@angular/core";
import { AuthService } from "../../services/auth-service";

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  async canActivate(): Promise<boolean> {

    console.log("🛡️ [AdminGuard] Verificando acceso...");

    // Esperamos al usuario autenticado real
    const user = await this.auth.waitForFirebaseUser();

    if (!user) {
      console.log("❌ No hay usuario. Redirigiendo a login...");
      this.router.navigate(['/login']);
      return false;
    }

    // Esperamos a que el rol esté completamente cargado
    await this.auth.waitForRoleLoaded();

    const role = this.auth.getUserRole();
    console.log("🛡️ Rol detectado:", role);

    // PERMITIR SOLO ADMIN
    if (role === 'admin') {
      console.log("🟩 Acceso autorizado como ADMIN");
      return true;
    }

    console.log("⛔ Acceso DENEGADO. No es admin.");
    this.router.navigate(['/home']);
    return false;
  }
}

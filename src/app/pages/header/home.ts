import { Component, effect, signal } from '@angular/core';
import { AuthService, Role } from '../../../services/auth-service';
import { NgIf } from '@angular/common';
import { Router, RouterModule, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
  standalone: true,
  imports: [NgIf, RouterOutlet, RouterModule]
})
export class Home {

  role: Role | null = null;
  currentRoute: string;
  loading = signal(true);

  constructor(
    public authService: AuthService,
    private router: Router
  ) {

    this.currentRoute = this.router.url;

    effect(() => {

      const firebaseUser = this.authService.currentUser();
      const loaded = this.authService.roleLoaded();

      console.log("🟦 [HOME EFFECT] Ejecutando efecto...");
      console.log("   🔹 Usuario Firebase:", firebaseUser);
      console.log("   🔹 Rol cargado (loaded):", loaded);

      // ❌ NO redirigir si Firebase aún no actualiza
      if (!firebaseUser) {
        console.log("⏳ Esperando a Firebase Auth...");
        return;
      }

      console.log("✔ Usuario autenticado:", firebaseUser.email);

      // Esperar rol cargado
      if (!loaded) {
        console.log("⏳ Esperando carga de rol...");
        return;
      }

      // Ya está todo
      console.log("🟩 Rol CARGADO:", this.authService.getUserRole());
      console.log("🟩 Home listo para mostrarse.");

      this.loading.set(false);
      this.role = this.authService.getUserRole();
    });

    this.router.events.subscribe(() => {
      this.currentRoute = this.router.url;
    });
  }

  getInitials(email?: string | null): string {
    if (!email) return '';
    return email.split('@')[0].slice(0, 2).toUpperCase();
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        console.log("📤 Sesión cerrada. Redirigiendo a login...");
        this.router.navigate(['/login']);
      },
      error: (err) => console.error('Error al cerrar sesión:', err)
    });
  }
}

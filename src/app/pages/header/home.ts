import { Component, effect, signal } from '@angular/core';
import { AuthService, Role } from '../../../services/auth-service';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

// Componentes internos
import { User } from './components/user/user';
import { AboutUs } from './components/admin/AboutUs/AboutUs';
import { Team } from './components/admin/team/team';

@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
  standalone: true,
  imports: [RouterOutlet, RouterModule, CommonModule, User, AboutUs, Team]
})
export class Home {

  myRepos: any[] = [];
  partnerRepos: any[] = [];  // evita errores en tu template

  role: Role | null = null;
  currentRoute: string = '';

  loading = signal(true);
  showAsesoriaModal = signal(false);

  constructor(
    public authService: AuthService,
    private router: Router
  ) {

    // Inicialización de ruta actual
    this.currentRoute = this.router.url;

    // Detectar cambios de ruta
    this.router.events.subscribe(() => {
      this.currentRoute = this.router.url;
    });

    // Efecto para manejar usuario y rol
    effect(() => {
      const firebaseUser = this.authService.currentUser();
      const loaded = this.authService.roleLoaded();

      if (!firebaseUser) {
        this.role = null;
        this.loading.set(false);
        return;
      }

      if (!loaded) return; // esperar rol

      const role = this.authService.getUserRole();
      if (!role) return;

      console.log("🟩 Rol cargado:", role);

      this.role = role;
      this.loading.set(false);

      // Solo abrir modal automáticamente si es usuario
      if (role === 'user') {
        this.showAsesoriaModal.set(true);
      }
    });

  }

  closeModal() {
    this.showAsesoriaModal.set(false);
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

  /** 
   * 🔥 Se usa en el template para mostrar el CTA solo en /home/inicio
   */
  get showAsesoria(): boolean {
    return this.currentRoute === '/home/inicio';
  }

}

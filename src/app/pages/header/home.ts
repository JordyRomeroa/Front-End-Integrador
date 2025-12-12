import { Component, effect, signal } from '@angular/core';
import { AuthService, Role } from '../../../services/auth-service';
import { Router, RouterLinkActive, RouterModule, RouterOutlet } from '@angular/router';
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
  imports: [
    RouterOutlet,
    RouterModule,
    CommonModule,
    User,
    RouterLinkActive
  ]
})
export class Home {

  sidebarOpen = false;

  myRepos: any[] = [];
  partnerRepos: any[] = [];

  role: Role | null = null;
  currentRoute = '';

  loading = signal(true);
  showAsesoriaModal = signal(false);

  constructor(
    public authService: AuthService,
    private router: Router
  ) {

    this.currentRoute = this.router.url;

    this.router.events.subscribe(() => {
      this.currentRoute = this.router.url;
    });

    effect(() => {
      const firebaseUser = this.authService.currentUser();
      const loaded = this.authService.roleLoaded();

      if (!firebaseUser) {
        this.role = null;
        this.loading.set(false);
        return;
      }

      if (!loaded) return;

      const role = this.authService.getUserRole();
      if (!role) return;

      console.log("Rol cargado:", role);

      this.role = role;
      this.loading.set(false);
    });
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
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
        console.log("Sesión cerrada");
        this.router.navigate(['/login']);
      },
      error: (err) => console.error('Error al cerrar sesión:', err)
    });
  }

  get showAsesoria(): boolean {
    return this.currentRoute === '/home/inicio';
  }
}

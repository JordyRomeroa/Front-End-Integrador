import { Component, effect, signal, OnInit } from '@angular/core';
import { AuthService, Role } from '../../../services/auth-service';
import { Router, RouterLinkActive, RouterModule, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

import { User } from './components/user/user';
import { Advice as UserAdviceModal } from './components/user/advice/advice';
import { Advice } from './components/programmer/advice/advice';

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
    RouterLinkActive,
    UserAdviceModal,
    Advice
  ]
})
export class Home implements OnInit {
  showWelcomeBanner = signal(false);
  private bannerCheckDone = false; 
  // UI
  sidebarOpen = false;
  currentRoute = '';

  role: Role | null = null;
  user: any = null;

  isLogged = false;
  isUser = false;
  isAdmin = false;
  isProgrammer = false;
  // State
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
      const currentUser = this.authService.currentUser();
      const loaded = this.authService.roleLoaded();

      // SI NO HAY USUARIO
      if (!currentUser) {
        this.resetRoles();
        this.loading.set(false);
        return;
      }
      // SI LOS ROLES AÚN NO CARGAN
      if (!loaded) return;

      // MAPEO DE USUARIO
      this.user = {
        ...currentUser,
        email: currentUser.email || currentUser.contacto,
        nombre: currentUser.nombre || 'Usuario'
      };
      const roleName = this.authService.getUserRole();

      this.isAdmin = roleName === 'admin' || roleName === 'ROLE_ADMIN';
      this.isProgrammer = roleName === 'programmer' || roleName === 'ROLE_PROGRAMMER';
      this.isUser = !this.isAdmin && !this.isProgrammer && (roleName === 'user' || roleName === 'ROLE_USER');
      // Solo entra si es programador, tiene email y NO hemos hecho el chequeo ya
      if (this.isProgrammer && this.user?.email && !this.bannerCheckDone) {
        const hasSeenWelcome = localStorage.getItem(`welcome_seen_${this.user.email}`);
        
        if (!hasSeenWelcome) {
          this.showWelcomeBanner.set(true);
        }
        // Bloqueamos futuras ejecuciones del banner en esta carga de página
        this.bannerCheckDone = true; 
      }

      this.isLogged = true;
      this.loading.set(false);
    });
  }
  ngOnInit() {
  }

  private resetRoles() {
    this.role = null;
    this.isLogged = false;
    this.isUser = false;
    this.isAdmin = false;
    this.isProgrammer = false;
    this.showWelcomeBanner.set(false);
    this.bannerCheckDone = false;
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
        this.resetRoles();
        this.router.navigate(['/login']);
      },
      error: (err) => console.error('Error al cerrar sesión:', err)
    });
  }

  get showAsesoria(): boolean {
    return this.currentRoute === '/home/inicio';
  }

  checkFirstTimeProgrammer() {
    if (this.isProgrammer && this.user?.email && !this.bannerCheckDone) {
      const hasSeenWelcome = localStorage.getItem(`welcome_seen_${this.user.email}`);
      if (!hasSeenWelcome) {
        this.showWelcomeBanner.set(true);
      }
      this.bannerCheckDone = true;
    }
  }

  dismissWelcome() {
    if (this.user?.email) {
      // Guardamos la marca permanente
      localStorage.setItem(`welcome_seen_${this.user.email}`, 'true');
    }
    this.showWelcomeBanner.set(false);
    this.bannerCheckDone = true; // Bloqueo extra
  }
  activarPerfilYLogin() {
    // Borramos datos de sesión, pero respetamos las marcas de bienvenida
    localStorage.removeItem('token'); 
    localStorage.removeItem('currentUser'); 
    sessionStorage.clear();

    this.router.navigate(['/login']).then(() => {
      window.location.reload();
    });
  }
}
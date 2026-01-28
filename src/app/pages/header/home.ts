import { Component, effect, signal } from '@angular/core';
import { AuthService, Role } from '../../../services/auth-service';
import { Router, RouterLinkActive, RouterModule, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

// Componentes internos
import { User } from './components/user/user';
import { Advice } from './components/user/advice/advice';

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
    Advice
    
]
})
export class Home {

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
  const firebaseUser = this.authService.currentUser();
  const loaded = this.authService.roleLoaded();


  this.resetRoles();

  if (!firebaseUser) {
    this.loading.set(false);
    return;
  }


  this.user = firebaseUser;

  this.isLogged = true;

  if (!loaded) return;

  const role = this.authService.getUserRole();
  if (!role) return;

  this.role = role;

  this.isUser = role === 'user';
  this.isAdmin = role === 'admin';
  this.isProgrammer = role === 'programmer';

  this.loading.set(false);
});
  }

  private resetRoles() {
    this.role = null;
    this.isLogged = false;
    this.isUser = false;
    this.isAdmin = false;
    this.isProgrammer = false;
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
}

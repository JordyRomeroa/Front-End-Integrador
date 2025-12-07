import { Component, effect } from '@angular/core';
import { AuthService, Role } from '../../../services/auth-service';
import { NgIf } from '@angular/common';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { Programmer } from './components/programmer/programmer';
import { Admin } from "./components/admin/admin";
import { User } from './components/user/user';

@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
  standalone: true,
  imports: [NgIf,RouterOutlet, RouterModule]
})
export class Home {
  role: Role | null = null;
  currentRoute: string;

  constructor(public authService: AuthService, private router: Router) {
    this.currentRoute = this.router.url;

    // Efecto para actualizar el rol cuando cambie
    effect(() => {
      if (this.authService.roleLoaded()) {
        this.role = this.authService.getUserRole(); // usa getUserRole()
        console.log('Home - Rol actualizado:', this.role);
      }
    });

    // Actualiza la ruta al navegar
    this.router.events.subscribe(() => {
      this.currentRoute = this.router.url;
    });
  }

  getInitials(email?: string | null): string {
    if (!email) return '';
    const namePart = email.split('@')[0]; // parte antes de @
    return namePart.slice(0, 2).toUpperCase(); // primeras dos letras
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        console.log('Sesión cerrada');

        // Reinicia señales
        this.authService.currentUser.set(null);
        this.authService.userRole.set(null);
        this.authService.roleLoaded.set(false);

        // Redirige al login
        this.router.navigate(['/login']);
      },
      error: (err) => console.error('Error al cerrar sesión:', err)
    });
  }
}

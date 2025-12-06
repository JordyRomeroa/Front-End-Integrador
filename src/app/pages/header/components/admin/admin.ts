import { NgFor } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect } from '@angular/core';
import { AuthService, Role } from '../../../../../services/auth-service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin',
  imports: [],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Admin { 
   role: Role | null = null;

  constructor(public authService: AuthService, private router: Router) {
    // Efecto para actualizar el rol cuando cambie
    effect(() => {
      if (this.authService.roleLoaded()) {
        this.role = this.authService.getUserRole();
        console.log('Programmer - Rol actualizado:', this.role);
      }
    });
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
      error: (err) => console.error('Error al cerrar sesión:', err),
    });
  }
  registerProgrammer() {
   this.router.navigate(['/register-programmer']);
    
    
  }
}

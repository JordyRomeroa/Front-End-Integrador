import { ChangeDetectionStrategy, Component, effect } from '@angular/core';
import { AuthService, Role } from '../../../../../services/auth-service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user',
  imports: [],
  templateUrl: './user.html',
  styleUrl: './user.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class User { 
   role: Role | null = null;

  constructor(public authService: AuthService, private router: Router) {
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

        this.authService.currentUser.set(null);
        this.authService.userRole.set(null);
        this.authService.roleLoaded.set(false);

        this.router.navigate(['/login']);
      },
      error: (err) => console.error('Error al cerrar sesión:', err),
    });
  }
}

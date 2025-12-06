import { Component, effect } from '@angular/core';
import { AuthService, Role } from '../../../services/auth-service';
import { NgIf } from '@angular/common';
import { Router } from '@angular/router';
import { Programmer } from './components/programmer/programmer';
import { Admin } from "./components/admin/admin";
import { User } from './components/user/user';

@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
  standalone: true,
  imports: [NgIf, Programmer, Admin,User]
})
export class Home {
  role: Role | null = null;

  constructor(public authService: AuthService, private router: Router) {
    // Efecto para actualizar el rol cuando cambie
    effect(() => {
      if (this.authService.roleLoaded()) {
        this.role = this.authService.getUserRole(); // usa getUserRole()
        console.log('Home - Rol actualizado:', this.role);
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
    error: (err) => console.error('Error al cerrar sesión:', err)
  });

}

}
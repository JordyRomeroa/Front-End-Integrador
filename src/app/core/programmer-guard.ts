import { Injectable, inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../../services/auth-service';

@Injectable({
  providedIn: 'root'
})
export class ProgrammerGuard implements CanActivate {
  private router = inject(Router);
  private authService = inject(AuthService); // Inyectamos el servicio para usar sus señales

  canActivate(): boolean {
    // 1. Intentamos usar la señal del servicio primero (es más confiable)
    const role = this.authService.userRole();
    
    // 2. Si la señal está vacía (por un refresh), miramos el localStorage
    const storedRole = localStorage.getItem('authRole');
    const userJson = localStorage.getItem('user');

    // 3. Verificamos contra todas las variantes posibles
    const isProgrammer = 
      role === 'programmer' || 
      role === 'ROLE_PROGRAMMER' || 
      storedRole === 'programmer' || 
      storedRole === 'ROLE_PROGRAMMER';

    const isAdmin = 
      role === 'admin' || 
      role === 'ROLE_ADMIN' || 
      storedRole === 'admin' || 
      storedRole === 'ROLE_ADMIN';

    if (isProgrammer || isAdmin) {
      return true; // ✅ Acceso concedido
    }

    // 4. Si no tiene acceso, verificamos si es que ni siquiera está logueado
    if (!userJson) {
      this.router.navigate(['/login']);
    } else {
      this.router.navigate(['/home/inicio']);
    }
    
    return false;
  }
}
import { Injectable, inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../../services/auth-service';

@Injectable({
  providedIn: 'root'
})
export class ProgrammerGuard implements CanActivate {
  private router = inject(Router);
  private authService = inject(AuthService); 

  canActivate(): boolean {

    const role = this.authService.userRole();
    
    const storedRole = localStorage.getItem('authRole');
    const userJson = localStorage.getItem('user');

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
      return true;
    }

    if (!userJson) {
      this.router.navigate(['/login']);
    } else {
      this.router.navigate(['/home/inicio']);
    }
    
    return false;
  }
}
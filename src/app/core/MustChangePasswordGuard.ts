import { Injectable, inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../../services/auth-service';

@Injectable({ providedIn: 'root' })
export class MustChangePasswordGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(): boolean {
    const mustChange = this.authService.mustChangePassword();
    
    if (!mustChange) {
      // Si no necesita cambiar, redirige a home
      this.router.navigate(['/home']);
      return false;
    }

    return true;
  }
}

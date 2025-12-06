import { Component, effect } from '@angular/core';
import { AuthService, Role } from '../../../services/auth-service';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
  standalone: true,
  imports: [NgIf]
})
export class Home {
  role: Role | null = null;

  constructor(public authService: AuthService) {
    // Efecto para actualizar el rol cuando cambie
    effect(() => {
      if (this.authService.roleLoaded()) {
        this.role = this.authService.getUserRole(); // usa getUserRole()
        console.log('Home - Rol actualizado:', this.role);
      }
    });
  }
}
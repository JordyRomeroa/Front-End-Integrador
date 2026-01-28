import { ChangeDetectionStrategy, Component, effect, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { AuthService, Role } from '../../../../../services/auth-service';
import { Router, RouterOutlet } from '@angular/router';
import { Asesoria, AsesoriaService } from '../../../../../services/advice';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ProgramadorService } from '../../../../../services/programmer-service';
import { Subscription } from 'rxjs';
import { ProgramadorData } from '../../../interface/programador';

type ProgramadorConId = ProgramadorData & { uid: string };

@Component({
  selector: 'app-user',
  imports: [CommonModule, FormsModule,RouterOutlet],
  templateUrl: './user.html',
  styleUrls: ['./user.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class User{

  // Rol del usuario actual
  role = signal<Role | null>(null);
  isUser = signal(false);
  

  constructor() {
    // Mantener la señal isUser actualizada según el rol
    effect(() => {
      this.isUser.set(this.role() === 'user');
    });
  }

  
}

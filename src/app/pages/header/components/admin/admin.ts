import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../../../services/auth-service';
import { ProgramadorService, ProgramadorData } from '../../../../../services/programmer-service';
import { CommonModule } from '@angular/common';
import { RegisterProgrammer } from './register-programmer/register';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [RouterOutlet, CommonModule,RegisterProgrammer],
  templateUrl: './admin.html',
  styleUrls: ['./admin.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Admin {

  private router = inject(Router);
  private authService = inject(AuthService);
  private programadorService = inject(ProgramadorService);

  role = signal<string | null>(null);
  programadores = signal<ProgramadorData[]>([]);
  
  // ← Controla la visibilidad del modal
  showRegisterModal = signal(false);

  constructor() {
    const r = this.authService.userRole();
    this.role.set(r);

    if (!r || r !== 'admin') {
      console.warn("No es admin, redirigiendo...");
      this.router.navigate(['/login']);
    }

    this.programadorService.programadores$.subscribe(lista => {
      this.programadores.set(lista);
    });
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: err => console.error(err)
    });
  }

  // Abrir modal
  registerProgrammer() {
    this.showRegisterModal.set(true);
  }

  // Cerrar modal
  cerrarRegistro() {
    this.showRegisterModal.set(false);
  }

  editarProgramador(programmer: ProgramadorData) {
    localStorage.setItem('editProgrammer', JSON.stringify(programmer));
    this.showRegisterModal.set(true);
  }

  eliminarProgramador(programmer: ProgramadorData) {
    if (confirm(`¿Seguro que deseas eliminar a ${programmer.nombre}?`)) {
      this.programadores.set(
        this.programadores().filter(p => p.uid !== programmer.uid)
      );
    }
  }

  isLast(redes?: string[], red?: string) {
    if (!redes || !red) return false;
    return redes.indexOf(red) === redes.length - 1;
  }

  obtenerRedes(redes?: string[]) {
    return redes?.filter(r => r.trim() !== '') || [];
  }
}

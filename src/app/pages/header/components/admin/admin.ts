import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../../../services/auth-service';
import { ProgramadorService,  } from '../../../../../services/programmer-service';
import { CommonModule } from '@angular/common';
import { RegisterProgrammer } from './register-programmer/register';
import { ProgramadorData } from '../../../interface/programador';

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

  // Abrir modal para registrar un programador NUEVO
registerProgrammer() {
  this.programmerSelected.set(null);  // <-- Limpiamos cualquier programador seleccionado
  this.showRegisterModal.set(true);
}

  // Cerrar modal
  cerrarRegistro() {
    this.showRegisterModal.set(false);
  }

 // Señal para el programador a editar
programmerSelected = signal<ProgramadorData | null>(null);

editarProgramador(programmer: ProgramadorData) {
  this.programmerSelected.set(programmer); // Guardamos el programador a editar
  this.showRegisterModal.set(true); // Abrimos el modal
}

async eliminarProgramador(programmer: ProgramadorData) {
  if (!programmer.uid) return;

  if (confirm(`¿Seguro que deseas eliminar a ${programmer.nombre}?`)) {
    try {
      await this.programadorService.eliminarProgramador(programmer.uid);
      alert(`${programmer.nombre} eliminado correctamente.`);
    } catch (error) {
      console.error(error);
      alert('Error eliminando el programador.');
    }
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

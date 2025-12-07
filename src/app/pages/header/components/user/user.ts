import { ChangeDetectionStrategy, Component, effect, signal, inject } from '@angular/core';
import { AuthService, Role } from '../../../../../services/auth-service';
import { Router } from '@angular/router';
import { Asesoria, AsesoriaService } from '../../../../../services/advice';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ProgramadorService } from '../../../../../services/programmer-service';

@Component({
  selector: 'app-user',
  imports: [CommonModule, FormsModule],
  templateUrl: './user.html',
  styleUrls: ['./user.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class User { 
  role: Role | null = null;
  mensaje: string = '';
  programadores = signal<{ uid: string; nombre: string }[]>([]);
  programadorId = '';
  private progService = inject(ProgramadorService);

  constructor(
    public authService: AuthService, 
    private router: Router,
    private asesoriaService: AsesoriaService
  ) {
    effect(() => {
      if (this.authService.roleLoaded() && this.authService.getUserRole() === 'user') {
        this.role = 'user';
        this.cargarProgramadores();
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

  async cargarProgramadores() {
    try {
      const progList = await this.progService.obtenerProgramadores();
      console.log('Resultado de obtenerProgramadores():', progList);

      this.programadores.set(progList);

      if (this.programadores().length) {
        this.programadorId = this.programadores()[0].uid;
        console.log('Programador seleccionado por defecto:', this.programadores()[0]);
      } else {
        console.warn('No se encontraron programadores.');
      }
    } catch (err) {
      console.error('Error al cargar programadores:', err);
    }
  }

  async enviarAsesoria() {
    if (!this.mensaje || !this.programadorId) {
      alert('Debe ingresar un mensaje y seleccionar un programador.');
      return;
    }

    const currentUser = this.authService.currentUser();
    if (!currentUser) return;

    const nuevaAsesoria: Asesoria = {
      mensaje: this.mensaje,
      estado: 'pendiente',
      mensajeRespuesta: '',
      programadorId: this.programadorId,
      usuarioId: currentUser.uid
    };

    try {
      const id = await this.asesoriaService.crearAsesoria(nuevaAsesoria);
      alert(`Asesoría enviada con ID: ${id}`);
      this.mensaje = '';
      this.programadorId = this.programadores().length ? this.programadores()[0].uid : '';
    } catch (error) {
      console.error(error);
      alert('Error al enviar la asesoría.');
    }
  }
}

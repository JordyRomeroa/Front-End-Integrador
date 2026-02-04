import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../../../services/auth-service';
import { ProgramadorService,  } from '../../../../../services/programmer-service';
import { CommonModule } from '@angular/common';
import { RegisterProgrammer } from './register-programmer/register';
import { ProgramadorData } from '../../../interface/programador';
@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [RouterOutlet, CommonModule, RegisterProgrammer],
  templateUrl: './admin.html',
  styleUrls: ['./admin.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Admin implements OnInit {
  private router = inject(Router);
  public authService = inject(AuthService);
  private programadorService = inject(ProgramadorService);

  // Señales de Estado
  role = signal<string | null>(null);
  programadores = signal<ProgramadorData[]>([]);
  showRegisterModal = signal(false);
  programmerSelected = signal<ProgramadorData | null>(null);

  // --- NUEVAS SEÑALES PARA MODALS Y TOASTS ---
  showDeleteModal = signal(false);
  isDeleting = signal(false);
  showToast = signal(false);
  toastMessage = signal('');
  programmerToDelete = signal<ProgramadorData | null>(null);

  constructor() {
    const r = this.authService.userRole();
    this.role.set(r);

    if (!r || r !== 'admin') {
      this.router.navigate(['/login']);
    }

    this.programadorService.programadores$.subscribe(lista => {
      this.programadores.set(lista);
    });
  }

  ngOnInit() {
    this.programadorService.refrescarTabla();
  }

  // --- MÉTODOS DE REGISTRO / EDICIÓN ---
  registerProgrammer() {
    this.programmerSelected.set(null);
    this.showRegisterModal.set(true);
  }

  editarProgramador(programmer: ProgramadorData) {
    this.programmerSelected.set(programmer);
    this.showRegisterModal.set(true);
  }

  cerrarRegistro() {
    this.showRegisterModal.set(false);
  }

  // --- MÉTODOS DE ELIMINACIÓN REFACTORIZADOS ---
  
  // 1. En lugar de confirm(), abrimos nuestro modal
  eliminarProgramador(programmer: ProgramadorData) {
    if (!programmer.uid) return;
    this.programmerToDelete.set(programmer);
    this.showDeleteModal.set(true);
  }

  // 2. Ejecución real de la eliminación
  async confirmarEliminacionReal() {
    const programmer = this.programmerToDelete();
    if (!programmer?.uid) return;

    try {
      this.isDeleting.set(true);
      await this.programadorService.eliminarProgramador(programmer.uid);
      
      this.lanzarToast(`${programmer.nombre} ha sido eliminado.`);
      this.cerrarDeleteModal();
    } catch (error) {
      console.error(error);
      this.lanzarToast('Error al eliminar el programador');
    } finally {
      this.isDeleting.set(false);
    }
  }

  cerrarDeleteModal() {
    this.showDeleteModal.set(false);
    this.programmerToDelete.set(null);
  }

  // --- UTILIDADES ---
  lanzarToast(mensaje: string) {
    this.toastMessage.set(mensaje);
    this.showToast.set(true);
    setTimeout(() => this.showToast.set(false), 3000);
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: err => console.error(err)
    });
  }

  isLast(redes?: string[], red?: string) {
    if (!redes || !red) return false;
    return redes.indexOf(red) === redes.length - 1;
  }

  obtenerRedes(redes?: string[]) {
    return redes?.filter(r => r.trim() !== '') || [];
  }
}
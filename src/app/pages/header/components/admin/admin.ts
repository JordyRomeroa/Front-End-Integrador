import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../../../services/auth-service';
import { ProgramadorService } from '../../../../../services/programmer-service';
import { CommonModule } from '@angular/common';
import { RegisterProgrammer } from './register-programmer/register';
import { ProgramadorData } from '../../../interface/programador';

// Nuevas Importaciones para PDF y Excel
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

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

  // --- SEÑALES DE ESTADO ORIGINALES (NO TOCAR) ---
  role = signal<string | null>(null);
  programadores = signal<ProgramadorData[]>([]);
  showRegisterModal = signal(false);
  programmerSelected = signal<ProgramadorData | null>(null);

  showDeleteModal = signal(false);
  isDeleting = signal(false);
  showToast = signal(false);
  toastMessage = signal('');
  programmerToDelete = signal<ProgramadorData | null>(null);

  // --- NUEVAS SEÑALES PARA ESTADÍSTICAS ---
  // Calculamos el total de programadores automáticamente basado en la lista
  totalProgramadores = computed(() => this.programadores().length);
  // Ejemplo de otras stats (puedes conectar estos números a tus servicios de asesorías/proyectos)
  totalProyectos = signal(0); 
  totalAsesorias = signal(0);

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

  // --- NUEVOS MÉTODOS DE EXPORTACIÓN ---
  exportarPDF() {
    const doc = new jsPDF();
    doc.text('Reporte de Programadores', 14, 15);
    
    const head = [['Nombre', 'Especialidad', 'Contacto']];
    const data = this.programadores().map(p => [p.nombre, p.especialidad, p.contacto || 'N/A']);

    autoTable(doc, {
      head: head,
      body: data,
      startY: 20,
      theme: 'grid'
    });

    doc.save('lista-programadores.pdf');
  }

  exportarExcel() {
    const data = this.programadores().map(p => ({
      Nombre: p.nombre,
      Especialidad: p.especialidad,
      Contacto: p.contacto,
      Descripcion: p.descripcion
    }));

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Programadores');
    XLSX.writeFile(wb, 'reporte-programadores.xlsx');
  }

  // --- TUS MÉTODOS ORIGINALES (MANTENIDOS TAL CUAL) ---
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

  eliminarProgramador(programmer: ProgramadorData) {
    if (!programmer.uid) return;
    this.programmerToDelete.set(programmer);
    this.showDeleteModal.set(true);
  }

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
import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../../../services/auth-service';
import { ProgramadorService } from '../../../../../services/programmer-service';
import { CommonModule } from '@angular/common';
import { RegisterProgrammer } from './register-programmer/register';
import { ProgramadorData } from '../../../interface/programador';

// Librerías para reportes
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

  // Señales de Estado
  role = signal<string | null>(null);
  programadores = signal<ProgramadorData[]>([]);
  showRegisterModal = signal(false);
  programmerSelected = signal<ProgramadorData | null>(null);

  // Señales para Modals y Toasts
  showDeleteModal = signal(false);
  isDeleting = signal(false);
  showToast = signal(false);
  toastMessage = signal('');
  programmerToDelete = signal<ProgramadorData | null>(null);

  // --- NUEVAS SEÑALES PARA REPORTES (DASHBOARD) ---
  // Ejemplo de cálculos automáticos basados en la lista de programadores
  totalProgramadores = computed(() => this.programadores().length);
  
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

  // --- MÉTODOS DE EXPORTACIÓN (REPORTES ADM) ---

  exportToExcel() {
    try {
      // Preparamos los datos de la tabla
      const dataToExport = this.programadores().map(p => ({
        Nombre: p.nombre,
        Especialidad: p.especialidad,
        Email: p.contacto || 'No registrado',
        Descripcion: p.descripcion || ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Programadores');
      
      XLSX.writeFile(workbook, 'Reporte_Administrativo.xlsx');
      this.lanzarToast('Excel descargado correctamente');
    } catch (error) {
      this.lanzarToast('Error al generar Excel');
    }
  }

  exportToPDF() {
    try {
      const doc = new jsPDF();
      
      // Título del PDF
      doc.setFontSize(18);
      doc.text('Reporte Administrativo de Programadores', 14, 20);
      doc.setFontSize(10);
      doc.text(`Fecha de generación: ${new Date().toLocaleDateString()}`, 14, 28);

      // Generación de la tabla
      autoTable(doc, {
        startY: 35,
        head: [['Nombre', 'Especialidad', 'Contacto']],
        body: this.programadores().map(p => [
          p.nombre, 
          p.especialidad, 
          p.contacto || 'N/A'
        ]),
        headStyles: { fillColor: [79, 70, 229] } // Color Indigo-600
      });

      doc.save('Reporte_Programadores.pdf');
      this.lanzarToast('PDF descargado correctamente');
    } catch (error) {
      this.lanzarToast('Error al generar PDF');
    }
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

  // --- MÉTODOS DE ELIMINACIÓN ---
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

  obtenerRedes(redes?: string[]) {
    return redes?.filter(r => r.trim() !== '') || [];
  }
}
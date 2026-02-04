import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../../../services/auth-service';
import { ProgramadorService } from '../../../../../services/programmer-service';
import { CommonModule } from '@angular/common';
import { RegisterProgrammer } from './register-programmer/register';
import { ProgramadorData } from '../../../interface/programador';

// Nuevas Importaciones para reportes y servicios
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Asesoria, AsesoriaService } from '../../../../../services/advice';
import { ProyectoService } from '../../../../../services/proyecto-service';

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
  private asesoriaService = inject(AsesoriaService);
  private proyectoService = inject(ProyectoService);

  // Señales de Estado Originales
  role = signal<string | null>(null);
  programadores = signal<ProgramadorData[]>([]);
  showRegisterModal = signal(false);
  programmerSelected = signal<ProgramadorData | null>(null);

  // Señales de Datos adicionales para estadísticas
  todasAsesorias = signal<Asesoria[]>([]);
  todosProyectos = signal<any[]>([]);

  // Señales para Modals y Toasts
  showDeleteModal = signal(false);
  isDeleting = signal(false);
  showToast = signal(false);
  toastMessage = signal('');
  programmerToDelete = signal<ProgramadorData | null>(null);

  // --- NUEVAS ESTADÍSTICAS COMPUTADAS ---
  totalProgramadores = computed(() => this.programadores().length);
  totalAsesorias = computed(() => this.todasAsesorias().length);
  proyectosActivos = computed(() => this.todosProyectos().length);

  constructor() {
    const r = this.authService.userRole();
    this.role.set(r);

    if (!r || r !== 'admin') {
      this.router.navigate(['/login']);
    }

    this.programadorService.programadores$.subscribe(lista => {
      this.programadores.set(lista);
    });

    // Suscripción a proyectos para el contador
    this.proyectoService.todosProyectos$.subscribe(lista => {
      this.todosProyectos.set(lista || []);
    });
  }

  ngOnInit() {
    this.programadorService.refrescarTabla();
    this.cargarDatosEstadisticos();
  }

  // Carga de datos para las nuevas estadísticas
  async cargarDatosEstadisticos() {
    await this.proyectoService.cargarTodosLosProyectos();
    this.asesoriaService.obtenerAsesoriasPorUsuario(0).subscribe({
      next: (data) => this.todasAsesorias.set(data || []),
      error: (err) => console.error('Error cargando asesorías', err)
    });
  }

  // Helpers para conteo por programador en la tabla
  getAsesoriasCount(nombre: string): number {
    const n = nombre?.toLowerCase().trim();
    return this.todasAsesorias().filter(a => a.nombreProgramador?.toLowerCase().trim() === n).length;
  }

  getProyectosCount(nombre: string): number {
    const n = nombre?.toLowerCase().trim();
    return this.todosProyectos().filter(p => 
      p.assignedTo?.toLowerCase().trim() === n || p.nombre?.toLowerCase().trim() === n
    ).length;
  }

  // --- MÉTODOS DE EXPORTACIÓN (REPORTES) ---
  exportToExcel() {
    const data = this.programadores().map(p => ({
      'Programador': p.nombre,
      'Especialidad': p.especialidad,
      'Email': p.contacto || 'N/A',
      'Asesorías': this.getAsesoriasCount(p.nombre),
      'Proyectos': this.getProyectosCount(p.nombre)
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte General');
    XLSX.writeFile(wb, `Reporte_Admin_${new Date().getTime()}.xlsx`);
  }

  exportToPDF() {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Reporte Administrativo de Desempeño', 14, 20);
    
    autoTable(doc, {
      startY: 30,
      head: [['Nombre', 'Especialidad', 'Asesorías', 'Proyectos']],
      body: this.programadores().map(p => [
        p.nombre, 
        p.especialidad, 
        this.getAsesoriasCount(p.nombre),
        this.getProyectosCount(p.nombre)
      ]),
      headStyles: { fillColor: [79, 70, 229] }
    });
    doc.save('Reporte_General_Admin.pdf');
  }

  // --- TUS MÉTODOS ORIGINALES (SIN CAMBIOS) ---
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
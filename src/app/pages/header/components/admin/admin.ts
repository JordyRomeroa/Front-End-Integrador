import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../../../services/auth-service';
import { ProgramadorService } from '../../../../../services/programmer-service';
import { CommonModule } from '@angular/common';
import { RegisterProgrammer } from './register-programmer/register';
import { ProgramadorData } from '../../../interface/programador';
import { Proyecto } from '../../../interface/proyecto'; // Asegúrate que esta interfaz coincida

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

  programadores = signal<ProgramadorData[]>([]);
  todasAsesorias = signal<Asesoria[]>([]);
  todosProyectos = signal<Proyecto[]>([]);

  // Computed para Dashboard general
  totalProgramadores = computed(() => this.programadores().length);
  totalAsesorias = computed(() => this.todasAsesorias().length);
  proyectosActivos = computed(() => this.todosProyectos().length);

  // UI Signals
  showRegisterModal = signal(false);
  programmerSelected = signal<ProgramadorData | null>(null);
  showDeleteModal = signal(false);
  isDeleting = signal(false);
  showToast = signal(false);
  toastMessage = signal('');
  programmerToDelete = signal<ProgramadorData | null>(null);

  constructor() {
    const r = this.authService.userRole();
    if (!r || r !== 'admin') {
      this.router.navigate(['/login']);
    }

    this.programadorService.programadores$.subscribe(lista => this.programadores.set(lista));
    this.proyectoService.todosProyectos$.subscribe(lista => this.todosProyectos.set(lista));
  }

  ngOnInit() {
    this.cargarDatosDashboard();
  }

  async cargarDatosDashboard() {
    this.programadorService.refrescarTabla();
    await this.proyectoService.cargarTodosLosProyectos();
    
    this.asesoriaService.obtenerAsesoriasPorUsuario(0).subscribe({
      next: (data) => this.todasAsesorias.set(data),
      error: (err) => console.error('Error cargando asesorías', err)
    });
  }

  /**
   * ESTADÍSTICAS FUNCIONALES CORREGIDAS
   * Usamos 'assignedTo' o el campo que tu API use para vincular al programador.
   */
  getAsesoriasCount(nombre: string): number {
    const normalizado = nombre.toLowerCase().trim();
    return this.todasAsesorias().filter(a => 
      a.nombreProgramador?.toLowerCase().trim() === normalizado
    ).length;
  }

  getProyectosCount(nombre: string): number {
    const normalizado = nombre.toLowerCase().trim();
    return this.todosProyectos().filter((p: any) => {
      // Usamos as any para evitar el error de tipado si la interfaz Proyecto es rígida
      // Buscamos coincidencia en asignación o nombre del creador
      const asignado = p.assignedTo?.toLowerCase().trim();
      const creador = p.nombreUsuario?.toLowerCase().trim(); // Solo si existe
      return asignado === normalizado || creador === normalizado;
    }).length;
  }

  // --- REPORTES ---
  exportToExcel() {
    const data = this.programadores().map(p => ({
      'Programador': p.nombre,
      'Especialidad': p.especialidad,
      'Asesorías': this.getAsesoriasCount(p.nombre),
      'Proyectos': this.getProyectosCount(p.nombre)
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
    XLSX.writeFile(wb, 'Admin_Report.xlsx');
  }

  exportToPDF() {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [['Nombre', 'Especialidad', 'Asesorías', 'Proyectos']],
      body: this.programadores().map(p => [
        p.nombre, 
        p.especialidad, 
        this.getAsesoriasCount(p.nombre),
        this.getProyectosCount(p.nombre)
      ]),
    });
    doc.save('Reporte_Admin.pdf');
  }

  // Métodos de gestión...
  registerProgrammer() { this.programmerSelected.set(null); this.showRegisterModal.set(true); }
  editarProgramador(p: ProgramadorData) { this.programmerSelected.set(p); this.showRegisterModal.set(true); }
  cerrarRegistro() { this.showRegisterModal.set(false); }
  eliminarProgramador(p: ProgramadorData) { this.programmerToDelete.set(p); this.showDeleteModal.set(true); }
  cerrarDeleteModal() { this.showDeleteModal.set(false); }
  async confirmarEliminacionReal() {
    const p = this.programmerToDelete();
    if (p?.uid) {
      this.isDeleting.set(true);
      await this.programadorService.eliminarProgramador(p.uid);
      this.lanzarToast('Eliminado correctamente');
      this.isDeleting.set(false);
      this.cerrarDeleteModal();
    }
  }
  lanzarToast(msg: string) {
    this.toastMessage.set(msg);
    this.showToast.set(true);
    setTimeout(() => this.showToast.set(false), 3000);
  }
}
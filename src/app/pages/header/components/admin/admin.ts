import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../../../services/auth-service';
import { ProgramadorService } from '../../../../../services/programmer-service';
import { CommonModule } from '@angular/common';
import { RegisterProgrammer } from './register-programmer/register';
import { ProgramadorData } from '../../../interface/programador';
import { Proyecto } from '../../../interface/proyecto';

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

  // Señales de Datos
  programadores = signal<ProgramadorData[]>([]);
  todasAsesorias = signal<Asesoria[]>([]);
  todosProyectos = signal<Proyecto[]>([]);

  // UI Signals
  showRegisterModal = signal(false);
  programmerSelected = signal<ProgramadorData | null>(null);
  showDeleteModal = signal(false);
  isDeleting = signal(false);
  showToast = signal(false);
  toastMessage = signal('');
  programmerToDelete = signal<ProgramadorData | null>(null);

  // Computed Dashboard
  totalProgramadores = computed(() => this.programadores().length);
  totalAsesorias = computed(() => this.todasAsesorias().length);
  proyectosActivos = computed(() => this.todosProyectos().length);

  constructor() {
    const r = this.authService.userRole();
    if (!r || r !== 'admin') {
      this.router.navigate(['/login']);
    }

    // Suscripciones reactivas
    this.programadorService.programadores$.subscribe(lista => this.programadores.set(lista || []));
    this.proyectoService.todosProyectos$.subscribe(lista => this.todosProyectos.set(lista || []));
  }

  ngOnInit() {
    this.cargarDatosDashboard();
  }

  async cargarDatosDashboard() {
    this.programadorService.refrescarTabla();
    await this.proyectoService.cargarTodosLosProyectos();
    
    this.asesoriaService.obtenerAsesoriasPorUsuario(0).subscribe({
      next: (data) => this.todasAsesorias.set(data || []),
      error: (err) => console.error('Error cargando asesorías', err)
    });
  }

  // Helper para redes sociales (Mantenido del original)
  obtenerRedes(redes: any): string[] {
    if (!redes) return [];
    if (Array.isArray(redes)) return redes;
    if (typeof redes === 'string') return [redes];
    return Object.values(redes).filter(r => typeof r === 'string' && r.includes('http')) as string[];
  }

  // Estadísticas con normalización de nombres
  getAsesoriasCount(nombre: string): number {
    if (!nombre) return 0;
    const n = nombre.toLowerCase().trim();
    return this.todasAsesorias().filter(a => a.nombreProgramador?.toLowerCase().trim() === n).length;
  }

  getProyectosCount(nombre: string): number {
    if (!nombre) return 0;
    const n = nombre.toLowerCase().trim();
    return this.todosProyectos().filter((p: any) => 
      p.assignedTo?.toLowerCase().trim() === n || 
      p.nombreUsuario?.toLowerCase().trim() === n ||
      p.nombre?.toLowerCase().trim() === n // Algunos proyectos guardan el nombre en 'nombre'
    ).length;
  }

  // --- REPORTES ---
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
    doc.text('Reporte de Desempeño de Programadores', 14, 20);
    autoTable(doc, {
      startY: 30,
      head: [['Nombre', 'Especialidad', 'Asesorías', 'Proyectos']],
      body: this.programadores().map(p => [
        p.nombre, 
        p.especialidad, 
        this.getAsesoriasCount(p.nombre),
        this.getProyectosCount(p.nombre)
      ]),
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] }
    });
    doc.save('Reporte_Admin.pdf');
  }

  // Métodos UI
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
      this.lanzarToast('Programador eliminado correctamente');
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
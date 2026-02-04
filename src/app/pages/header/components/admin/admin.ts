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
    this.programadorService.programadores$.subscribe(lista => this.programadores.set(lista));
    this.proyectoService.todosProyectos$.subscribe(lista => this.todosProyectos.set(lista));
  }

  ngOnInit() {
    this.cargarDatosDashboard();
  }

  async cargarDatosDashboard() {
    this.programadorService.refrescarTabla();
    await this.proyectoService.cargarTodosLosProyectos();
    
    // Obtener asesorías (Admin pide todas)
    this.asesoriaService.obtenerAsesoriasPorUsuario(0).subscribe({
      next: (data) => this.todasAsesorias.set(data),
      error: (err) => console.error('Error cargando asesorías', err)
    });
  }

  // Helper para conteo en tabla
  getAsesoriasCount(nombre: string) {
    return this.todasAsesorias().filter(a => a.nombreProgramador === nombre).length;
  }

  getProyectosCount(nombre: string) {
    // Asumiendo que el proyecto tiene el nombre del creador o asignado
    return this.todosProyectos().filter(p => p.nombre === nombre).length;
  }

  // --- REPORTES ---
  exportToExcel() {
    const data = this.programadores().map(p => ({
      'Programador': p.nombre,
      'Especialidad': p.especialidad,
      'Email': p.contacto || 'N/A',
      'Asesorías Realizadas': this.getAsesoriasCount(p.nombre),
      'Proyectos Creados': this.getProyectosCount(p.nombre),
      'Fecha Reporte': new Date().toLocaleDateString()
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte Administrativo');
    XLSX.writeFile(wb, `Reporte_General_${new Date().getTime()}.xlsx`);
  }

  exportToPDF() {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Dashboard Administrativo - Reporte de Desempeño', 14, 20);
    doc.setFontSize(10);
    doc.text(`Generado el: ${new Date().toLocaleString()}`, 14, 28);

    autoTable(doc, {
      startY: 35,
      head: [['Nombre', 'Especialidad', 'Asesorías', 'Proyectos', 'Contacto']],
      body: this.programadores().map(p => [
        p.nombre, 
        p.especialidad, 
        this.getAsesoriasCount(p.nombre),
        this.getProyectosCount(p.nombre),
        p.contacto || 'N/A'
      ]),
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] } // Color Indigo-600
    });

    doc.save('Reporte_Admin_Completo.pdf');
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
      this.lanzarToast('Programador eliminado de la base de datos');
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
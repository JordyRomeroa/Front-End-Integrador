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

  // Señales de UI
  showRegisterModal = signal(false);
  programmerSelected = signal<ProgramadorData | null>(null);
  showDeleteModal = signal(false);
  isDeleting = signal(false);
  showToast = signal(false);
  toastMessage = signal('');
  programmerToDelete = signal<ProgramadorData | null>(null);

  // --- CONTADORES DINÁMICOS (DASHBOARD) ---
  totalProgramadores = computed(() => this.programadores().length);
  
  // Contamos asesorías totales
  totalAsesorias = computed(() => this.todasAsesorias().length);
  
  // Contamos proyectos con estado 'activo' (o simplemente el total)
  proyectosActivos = computed(() => this.todosProyectos().length);

  constructor() {
    const r = this.authService.userRole();
    if (!r || r !== 'admin') {
      this.router.navigate(['/login']);
    }

    // Suscripción a Programadores
    this.programadorService.programadores$.subscribe(lista => this.programadores.set(lista));
    
    // Suscripción a Proyectos del Servicio (Admin View)
    this.proyectoService.todosProyectos$.subscribe(lista => this.todosProyectos.set(lista));
  }

  ngOnInit() {
    this.cargarDatosDashboard();
  }

  async cargarDatosDashboard() {
    this.programadorService.refrescarTabla();
    
    // Cargar Proyectos (usando tu método del servicio)
    await this.proyectoService.cargarTodosLosProyectos();

    // Cargar Asesorías (puedes crear un método obtenerTodas en tu servicio o usar uno por programador)
    // Suponiendo que necesitas todas para el dashboard admin:
    this.asesoriaService.obtenerAsesoriasPorUsuario(0).subscribe({ // Ajusta según tu API para traer todas
      next: (data) => this.todasAsesorias.set(data),
      error: (err) => console.error('Error cargando asesorías', err)
    });
  }

  // --- REPORTES ---
  exportToExcel() {
    const data = this.programadores().map(p => ({
      Nombre: p.nombre,
      Especialidad: p.especialidad,
      Contacto: p.contacto,
      Asesorias: this.todasAsesorias().filter(a => a.nombreProgramador === p.nombre).length
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
    XLSX.writeFile(wb, 'Admin_Report.xlsx');
  }

  exportToPDF() {
    const doc = new jsPDF();
    doc.text('Dashboard Administrativo', 14, 20);
    autoTable(doc, {
      startY: 30,
      head: [['Programador', 'Especialidad', 'Contacto']],
      body: this.programadores().map(p => [p.nombre, p.especialidad, p.contacto || 'N/A'])
    });
    doc.save('Reporte_Admin.pdf');
  }

  // --- MÉTODOS EXISTENTES ---
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

  obtenerRedes(redes?: string[]) { return redes?.filter(r => r.trim() !== '') || []; }
}
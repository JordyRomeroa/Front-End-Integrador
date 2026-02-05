import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed, OnDestroy } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../../../services/auth-service';
import { ProgramadorService } from '../../../../../services/programmer-service';
import { ProyectoService } from '../../../../../services/proyecto-service'; 
import { AsesoriaService } from '../../../../../services/advice';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { RegisterProgrammer } from './register-programmer/register';
import { ProgramadorData } from '../../../interface/programador';
import { Proyecto } from '../../../interface/proyecto';

// Importaciones para reportes
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [RouterOutlet, CommonModule, RegisterProgrammer, FormsModule],
  templateUrl: './admin.html',
  styleUrls: ['./admin.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Admin implements OnInit, OnDestroy {
  private router = inject(Router);
  public authService = inject(AuthService);
  private programadorService = inject(ProgramadorService);
  private proyectoService = inject(ProyectoService);
  private asesoriaService = inject(AsesoriaService);

  private subscriptions = new Subscription();

  // --- SEÑALES DE ESTADO ---
  role = signal<string | null>(null);
  programadores = signal<ProgramadorData[]>([]);
  proyectos = signal<Proyecto[]>([]);
  asesorias = signal<any[]>([]);

  // Modales y UI
  showRegisterModal = signal(false);
  programmerSelected = signal<ProgramadorData | null>(null);
  showDeleteModal = signal(false);
  isDeleting = signal(false);
  showToast = signal(false);
  toastMessage = signal('');
  programmerToDelete = signal<ProgramadorData | null>(null);

  // --- FILTRADO ---
  filtroBusqueda = signal('');

  programadoresFiltrados = computed(() => {
    const busqueda = this.filtroBusqueda().toLowerCase().trim();
    if (!busqueda) return this.programadores();
    return this.programadores().filter(p => 
      p.nombre.toLowerCase().includes(busqueda) || 
      p.especialidad.toLowerCase().includes(busqueda)
    );
  });

  // Métricas rápidas (Reactiva a través de signals)
  totalProgramadores = computed(() => this.programadores().length);
  totalProyectos = computed(() => this.proyectos().length);
  totalAsesorias = computed(() => this.asesorias().length);

  constructor() {
    // Verificación de seguridad inmediata al construir el componente
    const r = this.authService.userRole();
    this.role.set(r);
    if (!r || r !== 'admin') {
      this.router.navigate(['/login']);
    }
  }

  ngOnInit() {
    // 1. SUSCRIPCIONES REACTIVAS (Detectan cambios automáticamente)
    
    // Suscripción a Programadores
    this.subscriptions.add(
      this.programadorService.programadores$.subscribe(lista => {
        this.programadores.set(lista || []);
      })
    );

    // Suscripción a Proyectos
    this.subscriptions.add(
      this.proyectoService.todosProyectos$.subscribe(lista => {
        this.proyectos.set(lista || []);
      })
    );

    // Suscripción a Asesorías (Patrón BehaviorSubject del servicio)
    this.subscriptions.add(
      this.asesoriaService.asesoriasActuales$.subscribe(lista => {
        this.asesorias.set(lista || []);
        console.log("🔄 UI de Admin: Lista de asesorías actualizada automáticamente.");
      })
    );

    // 2. CARGA INICIAL DE DATOS
    this.cargarTodoElSistema();
  }

  ngOnDestroy() {
    // Limpieza de suscripciones para evitar fugas de memoria
    this.subscriptions.unsubscribe();
  }

  /**
   * Dispara la carga inicial en todos los servicios
   */
  private async cargarTodoElSistema() {
    try {
      this.programadorService.refrescarTabla();
      await this.proyectoService.cargarTodosLosProyectos();
      
      // La carga de asesorías notificará al Subject asesoriasActuales$
      this.asesoriaService.obtenerTodas().subscribe({
        error: (err) => {
          if (err.status === 500) this.lanzarToast("Error 500: El servidor falló al cargar asesorías");
        }
      });
      
      console.log("✅ Sistema sincronizado y suscrito.");
    } catch (err) {
      console.error("Error cargando el sistema:", err);
    }
  }

  // --- REPORTES ---
  async exportarPDF() {
    const doc = new jsPDF();
    const fechaReporte = new Date().toLocaleDateString();

    doc.setFontSize(18);
    doc.text('REPORTE GENERAL DE GESTIÓN', 14, 15);
    doc.setFontSize(10);
    doc.text(`Generado por Admin - ${fechaReporte}`, 14, 22);

    // Tabla 1: Programadores
    doc.setFontSize(14);
    doc.text('1. Listado de Programadores', 14, 35);
    autoTable(doc, {
      startY: 40,
      head: [['Nombre', 'Especialidad', 'Email']],
      body: this.programadores().map(p => [p.nombre, p.especialidad, p.contacto || 'N/A']),
      theme: 'striped'
    });

    // Tabla 2: Proyectos
    const finalY1 = (doc as any).lastAutoTable.finalY || 40;
    doc.text('2. Resumen de Proyectos', 14, finalY1 + 15);
    autoTable(doc, {
      startY: finalY1 + 20,
      head: [['Proyecto', 'Categoría', 'Responsable']],
      body: this.proyectos().map(pro => [
        pro.nombre, 
        pro.categoria || 'N/A', 
        pro.assignedTo && typeof pro.assignedTo === 'object' ? (pro.assignedTo as any).nombre : 'Sin asignar'
      ]),
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] }
    });

    // Tabla 3: Asesorías
    const finalY2 = (doc as any).lastAutoTable.finalY || finalY1 + 20;
    doc.text('3. Registro de Asesorías', 14, finalY2 + 15);
    autoTable(doc, {
      startY: finalY2 + 20,
      head: [['Fecha', 'Usuario', 'Estado', 'Programador']],
      body: this.asesorias().map(as => [
        as.fecha || 'N/A', 
        as.nombreUsuario || 'Usuario', 
        as.estado, 
        as.nombreProgramador || 'Pendiente'
      ]),
      theme: 'striped',
      headStyles: { fillColor: [50, 50, 50] }
    });

    doc.save(`Reporte_Sistema_${fechaReporte}.pdf`);
  }

  exportarExcel() {
    const data = this.programadores().map(p => ({
      Nombre: p.nombre,
      Especialidad: p.especialidad,
      Contacto: p.contacto,
      Descripcion: p.descripcion
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Programadores');
    XLSX.writeFile(wb, 'reporte-programadores.xlsx');
  }

  // --- ACCIONES CRUD ---
  registerProgrammer() {
    this.programmerSelected.set(null);
    this.showRegisterModal.set(true);
  }

  editarProgramador(programmer: ProgramadorData) {
    this.programmerSelected.set(programmer);
    this.showRegisterModal.set(true);
  }

  async confirmarEliminacionReal() {
    const programmer = this.programmerToDelete();
    if (!programmer?.uid) return;
    try {
      this.isDeleting.set(true);
      await this.programadorService.eliminarProgramador(programmer.uid);
      this.lanzarToast(`${programmer.nombre} eliminado con éxito.`);
      this.cerrarDeleteModal();
    } catch (error) {
      this.lanzarToast('Error al procesar la eliminación');
    } finally {
      this.isDeleting.set(false);
    }
  }

  // --- UI HELPERS ---
  cerrarRegistro() { this.showRegisterModal.set(false); }
  cerrarDeleteModal() { this.showDeleteModal.set(false); this.programmerToDelete.set(null); }
  eliminarProgramador(p: ProgramadorData) { this.programmerToDelete.set(p); this.showDeleteModal.set(true); }
  
  lanzarToast(mensaje: string) {
    this.toastMessage.set(mensaje);
    this.showToast.set(true);
    setTimeout(() => this.showToast.set(false), 3000);
  }

  logout() {
    this.authService.logout().subscribe(() => this.router.navigate(['/login']));
  }
}
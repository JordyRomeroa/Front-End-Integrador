import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../../../services/auth-service';
import { ProgramadorService } from '../../../../../services/programmer-service';
import { ProyectoService } from '../../../../../services/proyecto-service'; 
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { RegisterProgrammer } from './register-programmer/register';
import { ProgramadorData } from '../../../interface/programador';
import { Proyecto } from '../../../interface/proyecto';

// Importaciones para PDF y Excel
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { firstValueFrom } from 'rxjs';
import { AsesoriaService } from '../../../../../services/advice';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [RouterOutlet, CommonModule, RegisterProgrammer, FormsModule],
  templateUrl: './admin.html',
  styleUrls: ['./admin.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Admin implements OnInit {
  private router = inject(Router);
  public authService = inject(AuthService);
  private programadorService = inject(ProgramadorService);
  private proyectoService = inject(ProyectoService);
  private asesoriaService = inject(AsesoriaService);

  // --- SEÑALES DE ESTADO ---
  role = signal<string | null>(null);
  programadores = signal<ProgramadorData[]>([]);
  proyectos = signal<Proyecto[]>([]);
  asesorias = signal<any[]>([]);

  showRegisterModal = signal(false);
  programmerSelected = signal<ProgramadorData | null>(null);
  showDeleteModal = signal(false);
  isDeleting = signal(false);
  showToast = signal(false);
  toastMessage = signal('');
  programmerToDelete = signal<ProgramadorData | null>(null);

  // --- LÓGICA DE FILTRADO ---
  filtroBusqueda = signal('');

  programadoresFiltrados = computed(() => {
    const busqueda = this.filtroBusqueda().toLowerCase().trim();
    if (!busqueda) return this.programadores();
    return this.programadores().filter(p => 
      p.nombre.toLowerCase().includes(busqueda) || 
      p.especialidad.toLowerCase().includes(busqueda)
    );
  });

  totalProgramadores = computed(() => this.programadores().length);
  totalProyectos = computed(() => this.proyectos().length);
  totalAsesorias = computed(() => this.asesorias().length);

  constructor() {
    const r = this.authService.userRole();
    this.role.set(r);

    if (!r || r !== 'admin') {
      this.router.navigate(['/login']);
    }

    // Suscripción a programadores
    this.programadorService.programadores$.subscribe(lista => {
      this.programadores.set(lista || []);
    });

    // Suscripción a proyectos
    this.proyectoService.todosProyectos$.subscribe(lista => {
      this.proyectos.set(lista || []);
    });
  }

  async ngOnInit() {
    this.programadorService.refrescarTabla();
    await this.proyectoService.cargarTodosLosProyectos();
    this.cargarAsesoriasGlobales();
  }

  private async cargarAsesoriasGlobales() {
    try {
      const lista = await firstValueFrom(this.asesoriaService.obtenerTodas());
      if (lista) {
        this.asesorias.set(lista);
      }
    } catch (e) { 
      console.error("Error al cargar asesorías:", e); 
    }
  }

  // --- MÉTODOS DE EXPORTACIÓN ---
  async exportarPDF() {
    const doc = new jsPDF();
    const fechaReporte = new Date().toLocaleDateString();

    doc.setFontSize(18);
    doc.text('REPORTE GENERAL DE GESTIÓN', 14, 15);
    doc.setFontSize(10);
    doc.text(`Fecha de generación: ${fechaReporte}`, 14, 22);

    // 1. TABLA PROGRAMADORES
    doc.setFontSize(14);
    doc.text('1. Listado de Programadores', 14, 35);
    autoTable(doc, {
      startY: 40,
      head: [['Nombre', 'Especialidad', 'Contacto']],
      body: this.programadores().map(p => [p.nombre, p.especialidad, p.contacto || 'N/A']),
      theme: 'striped'
    });

    // 2. TABLA PROYECTOS (SOLUCIÓN AL [object Object])
    const finalY1 = (doc as any).lastAutoTable.finalY || 40;
    doc.text('2. Proyectos y Responsables', 14, finalY1 + 15);
    autoTable(doc, {
      startY: finalY1 + 20,
      head: [['Proyecto', 'Estado', 'Programador Asignado']],
      body: this.proyectos().map(pro => {
        // Lógica para extraer el nombre si es un objeto
        let nombreProgramador = 'No asignado';
        if (pro.assignedTo) {
          nombreProgramador = typeof pro.assignedTo === 'object' 
            ? (pro.assignedTo as any).nombre || 'Sin nombre' 
            : pro.assignedTo;
        }

        return [
          pro.nombre, 
          pro.categoria  || 'Sin categoría', 
          nombreProgramador
        ];
      }),
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] }
    });

    // 3. TABLA ASESORÍAS
    const finalY2 = (doc as any).lastAutoTable.finalY || finalY1 + 20;
    doc.text('3. Historial de Asesorías', 14, finalY2 + 15);
    autoTable(doc, {
      startY: finalY2 + 20,
      head: [['Fecha', 'Usuario', 'Estado', 'Mensaje']],
      body: this.asesorias().map(as => [
        as.fecha || 'S/F', 
        as.nombreUsuario || 'Cliente', 
        as.estado, 
        (as.mensaje || '').substring(0, 50) + (as.mensaje?.length > 50 ? '...' : '')
      ]),
      theme: 'plain'
    });

    doc.save(`Reporte_Admin_${fechaReporte}.pdf`);
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

  // --- MÉTODOS ORIGINALES ---
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
      this.lanzarToast('Error al eliminar');
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
      next: () => this.router.navigate(['/login'])
    });
  }

  obtenerRedes(redes?: string[]) {
    return redes?.filter(r => r.trim() !== '') || [];
  }
}
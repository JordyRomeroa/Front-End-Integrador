import { ChangeDetectionStrategy, Component, inject, signal, effect } from '@angular/core';
import { Proyecto } from '../../../../interface/proyecto';
import { ProyectoService } from '../../../../../../services/proyecto-service';
import { AuthService } from '../../../../../../services/auth-service';
import { ProgramadorService } from '../../../../../../services/programmer-service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ProgramadorData } from '../../../../interface/programador';

@Component({
  selector: 'app-management',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './management.html',
  styleUrls: ['./management.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Management {
  private proyectoService = inject(ProyectoService);
  private authService = inject(AuthService);
  private programadorService = inject(ProgramadorService);

  // Estados de la lista y UI
  proyectos = signal<Proyecto[]>([]);
  cargando = signal(true);
  
  // Modales
  showModal = signal(false);
  showConfirmModal = signal(false);
  
  // Selección para editar o eliminar
  proyectoSelected = signal<Proyecto | null>(null);
  proyectoAEliminar = signal<Proyecto | null>(null);
  
  // Mensajes de feedback
  mensajeError = signal<string | null>(null);
  mensajeExito = signal<string | null>(null);

  programador: ProgramadorData | null = null;
  tecnologiasInput: string = '';

  proyectoForm: Proyecto = this.resetForm();

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      if (!user) {
        this.cargando.set(false);
        return;
      }

      // Priorizamos ID numérico para el backend de Java
      const userIdParaBackend = user.id || user.uid; 
      if (userIdParaBackend) {
        this.cargarProyectos(userIdParaBackend);
      }
      
      this.programadorService.programadores$.subscribe(lista => {
        this.programador = lista.find(p => p.uid === user.uid || p.id === user.id) || null;
      });
    });
  }

  private async cargarProyectos(userId: string | number) {
    this.cargando.set(true);
    try {
      await this.proyectoService.cargarProyectosProgramador(userId);
      this.proyectoService.proyectosProgramador$.subscribe(lista => {
        this.proyectos.set(lista);
      });
    } catch (error) {
      this.mensajeError.set('No se pudieron cargar los proyectos.');
    } finally {
      this.cargando.set(false);
    }
  }

  private resetForm(): Proyecto {
    return {
      nombre: '',
      descripcion: '',
      tipo: '',
      categoria: '',
      tecnologias: [],
      repo: '',
      deploy: '',
      assignedTo: ''
    };
  }

  crearProyecto() {
    const user = this.authService.currentUser();
    if (!user) return;
    this.mensajeError.set(null);
    this.proyectoForm = this.resetForm();
    this.proyectoForm.assignedTo = user.uid;
    this.tecnologiasInput = '';
    this.proyectoSelected.set(null);
    this.showModal.set(true);
  }

  editarProyecto(proyecto: Proyecto) {
    this.mensajeError.set(null);
    this.proyectoForm = { ...proyecto };
    this.tecnologiasInput = proyecto.tecnologias.join(', ');
    this.proyectoSelected.set(proyecto);
    this.showModal.set(true);
  }

  async guardarProyecto() {
    const user = this.authService.currentUser() as any;
    if (!user || !user.id) {
      this.mensajeError.set('Sesión no válida o ID de usuario ausente.');
      return;
    }

    const listaTecnologias = this.tecnologiasInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t);

    const proyectoData: any = {
      ...this.proyectoForm,
      tecnologias: listaTecnologias,
      assignedToId: Number(user.id) 
    };

    try {
      if (this.proyectoSelected()?.id) {
        proyectoData.id = this.proyectoSelected()!.id;
        await this.proyectoService.actualizarProyecto(proyectoData);
      } else {
        await this.proyectoService.crearProyecto(proyectoData);
      }
      
      await this.cargarProyectos(user.id);
      this.showModal.set(false);
      this.mensajeExito.set('¡Proyecto guardado con éxito!');
      setTimeout(() => this.mensajeExito.set(null), 3000);

    } catch (error) {
      this.mensajeError.set('Error en el servidor (500). Revisa los datos.');
    }
  }

  // --- Lógica de Eliminación (Sin confirm() nativo) ---
  
  prepararEliminacion(proyecto: Proyecto) {
    this.proyectoAEliminar.set(proyecto);
    this.showConfirmModal.set(true);
  }

  async confirmarEliminacion() {
    const proyecto = this.proyectoAEliminar();
    const user = this.authService.currentUser() as any;
    
    if (!user || !proyecto?.id) return;

    try {
      await this.proyectoService.eliminarProyecto(String(proyecto.id), user.uid);
      
      // Actualización inmediata para que desaparezca de "Mis Proyectos"
      await this.cargarProyectos(user.id);
      
      this.showConfirmModal.set(false);
      this.proyectoAEliminar.set(null);
      this.mensajeExito.set('Proyecto eliminado correctamente.');
      setTimeout(() => this.mensajeExito.set(null), 3000);
      
    } catch (error) {
      this.showConfirmModal.set(false);
      this.mensajeError.set('No se pudo eliminar el proyecto.');
      setTimeout(() => this.mensajeError.set(null), 4000);
    }
  }

  cancelarEliminacion() {
    this.showConfirmModal.set(false);
    this.proyectoAEliminar.set(null);
  }

  cerrarModal() {
    this.showModal.set(false);
    this.mensajeError.set(null);
  }
}
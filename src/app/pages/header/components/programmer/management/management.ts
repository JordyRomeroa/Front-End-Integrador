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
  imports: [FormsModule, CommonModule],
  templateUrl: './management.html',
  styleUrls: ['./management.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Management {
  private proyectoService = inject(ProyectoService);
  private authService = inject(AuthService);
  private programadorService = inject(ProgramadorService);

  proyectos = signal<Proyecto[]>([]);
  showModal = signal(false);
  proyectoSelected = signal<Proyecto | null>(null);

  programador: ProgramadorData | null = null;

  proyectoForm: Proyecto = {
    nombre: '',
    descripcion: '',
    tipo: '',
    categoria: '',
    tecnologias: [],
    repo: '',
    deploy: '',
    assignedTo: ''
  };

  tecnologiasInput: string = '';
  cargando = signal(true);

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      if (!user) {
        this.cargando.set(false);
        return;
      }

      //  Cargar solo proyectos del programador
      this.proyectoService.cargarProyectosProgramador(user.uid)
        .then(() => {
          //  Escuchar solo proyectos del programador
          this.proyectoService.proyectosProgramador$.subscribe(lista => {
            this.proyectos.set(lista);
          });
        })
        .finally(() => this.cargando.set(false));

      //  Cargar info del programador actual
      this.programadorService.programadores$.subscribe(lista => {
        this.programador = lista.find(p => p.uid === user.uid) || null;
      });
    });
  }

  crearProyecto() {
    const user = this.authService.currentUser();
    if (!user) return;

    this.proyectoForm = {
      nombre: '',
      descripcion: '',
      tipo: '',
      categoria: '',
      tecnologias: [],
      repo: '',
      deploy: '',
      assignedTo: user.uid
    };

    this.tecnologiasInput = '';
    this.proyectoSelected.set(null);
    this.showModal.set(true);
  }

  editarProyecto(proyecto: Proyecto) {
    this.proyectoForm = { ...proyecto };
    this.tecnologiasInput = proyecto.tecnologias.join(', ');
    this.proyectoSelected.set(proyecto);
    this.showModal.set(true);
  }

  async guardarProyecto() {
    const user = this.authService.currentUser();
    if (!user) return;

    this.proyectoForm.tecnologias = this.tecnologiasInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t);

    this.proyectoForm.assignedTo = user.uid;

    try {
      if (this.proyectoSelected() && this.proyectoSelected()!.id) {
        this.proyectoForm.id = this.proyectoSelected()!.id;
        await this.proyectoService.actualizarProyecto(this.proyectoForm);
      } else {
        await this.proyectoService.crearProyecto(this.proyectoForm);
      }

      this.showModal.set(false);
    } catch (error) {
      console.error('Error guardando proyecto:', error);
      alert('No tienes permisos para guardar este proyecto.');
    }
  }

  async eliminarProyecto(proyecto: Proyecto) {
    const user = this.authService.currentUser();
    if (!user || !proyecto.id) return;

    if (confirm('¿Seguro que deseas eliminar este proyecto?')) {
      try {
        await this.proyectoService.eliminarProyecto(proyecto.id, user.uid);
      } catch (error) {
        console.error('Error eliminando proyecto:', error);
        alert('No tienes permisos para eliminar este proyecto.');
      }
    }
  }
}

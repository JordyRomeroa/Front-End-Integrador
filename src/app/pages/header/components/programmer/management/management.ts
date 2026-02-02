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

    // PRIORIDAD: Usar el ID numérico para el Backend de Java
    const userIdParaBackend = user.id || user.uid; 

    if (userIdParaBackend) {
      this.proyectoService.cargarProyectosProgramador(userIdParaBackend)
        .then(() => {
          this.proyectoService.proyectosProgramador$.subscribe(lista => {
            this.proyectos.set(lista);
          });
        })
        .finally(() => this.cargando.set(false));
    }
    
    // Para la info del programador (si usas uid como clave)
    this.programadorService.programadores$.subscribe(lista => {
      this.programador = lista.find(p => p.uid === user.uid || p.id === user.id) || null;
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

 // management.ts

async guardarProyecto() {
  const user = this.authService.currentUser() as any; // Casteo para evitar error de ID
  if (!user || !user.id) {
    alert('Sesión no válida o ID de usuario ausente.');
    return;
  }

  // 1. Limpiar tecnologías
  const listaTecnologias = this.tecnologiasInput
    .split(',')
    .map(t => t.trim())
    .filter(t => t);

  // 2. CONSTRUIR OBJETO LIMPIO PARA JAVA
  // No enviamos 'assignedTo' (objeto), enviamos 'assignedToId' (ID numérico)
  const proyectoData: any = {
    nombre: this.proyectoForm.nombre,
    descripcion: this.proyectoForm.descripcion,
    categoria: this.proyectoForm.categoria,
    tipo: this.proyectoForm.tipo,
    deploy: this.proyectoForm.deploy,
    repo: this.proyectoForm.repo,
    tecnologias: listaTecnologias,
    assignedToId: Number(user.id) 
  };

  try {
    if (this.proyectoSelected() && this.proyectoSelected()?.id) {
      // ACTUALIZAR: Incluimos el ID del proyecto en el cuerpo y lo enviamos
      proyectoData.id = this.proyectoSelected()!.id;
      await this.proyectoService.actualizarProyecto(proyectoData);
      console.log('Proyecto actualizado con éxito');
    } else {
      // CREAR
      await this.proyectoService.crearProyecto(proyectoData);
      console.log('Proyecto creado con éxito');
    }
    
    // 3. Refrescar la lista tras guardar
    await this.proyectoService.cargarProyectosProgramador(user.id);
    this.showModal.set(false);

  } catch (error) {
    console.error('Error guardando proyecto en Java:', error);
    alert('Error 500: El servidor rechazó los datos. Revisa la consola del Backend.');
  }
}

  async eliminarProyecto(proyecto: Proyecto) {
    const user = this.authService.currentUser();
    if (!user || !proyecto.id) return;

    if (confirm('¿Seguro que deseas eliminar este proyecto?')) {
      try {
await this.proyectoService.eliminarProyecto(String(proyecto.id), user.uid);
      } catch (error) {
        console.error('Error eliminando proyecto:', error);
        alert('No tienes permisos para eliminar este proyecto.');
      }
    }
  }
}

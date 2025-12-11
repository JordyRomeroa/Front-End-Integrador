import { Component, effect, signal, inject } from '@angular/core';
import { NgIf, NgFor, CommonModule } from '@angular/common';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { AuthService, Role } from '../../../../../services/auth-service';
import { collection, getDocs, query, where, Firestore } from '@angular/fire/firestore';
import { AsesoriaService } from '../../../../../services/advice';
import { AsesoriaConId } from '../../../interface/asesoria';
import { FormsModule } from '@angular/forms';

interface Proyecto {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: string;
  tecnologias: string[];
  repo: string;
  deploy: string;
}

@Component({
  selector: 'app-programmer',
  templateUrl: './programmer.html',
  styleUrls: ['./programmer.css'],
  standalone: true,
  imports: [CommonModule, FormsModule,RouterModule],
})
export class Programmer {
  role: Role | null = null;
  proyectos = signal<Proyecto[]>([]);
  asesorias = signal<AsesoriaConId[]>([]); // <-- señal con AsesoriaConId
  private firestore = inject(Firestore);

  constructor(
    public authService: AuthService,
    private router: Router,
    private asesoriaService: AsesoriaService
  ) {
    effect(() => {
      if (this.authService.roleLoaded()) {
        this.role = this.authService.getUserRole();
        console.log('Programmer - Rol actualizado:', this.role);
        if (this.role === 'programmer') {
          this.cargarProyectos();
          this.cargarAsesorias();
        }
      }
    });
  }

  async cargarProyectos() {
    const currentUser = this.authService.currentUser();
    if (!currentUser) return;

    try {
      const proyectosCol = collection(this.firestore, 'proyectos');
      const q = query(proyectosCol, where('assignedTo', '==', currentUser.uid));
      const snapshot = await getDocs(q);

      const lista: Proyecto[] = snapshot.docs.map(doc => ({
        id: doc.id,
        nombre: doc.data()['nombre'] || '',
        descripcion: doc.data()['descripcion'] || '',
        tipo: doc.data()['tipo'] || '',
        tecnologias: doc.data()['tecnologias'] || [],
        repo: doc.data()['repo'] || '#',
        deploy: doc.data()['deploy'] || '#',
      }));

      this.proyectos.set(lista);
      console.log('Proyectos cargados:', lista);

    } catch (err) {
      console.error('Error al cargar proyectos:', err);
    }
  }

  async cargarAsesorias() {
    const currentUser = this.authService.currentUser();
    if (!currentUser) return;

    try {
      const asesoriasCol = collection(this.firestore, 'asesorias');
      const q = query(asesoriasCol, where('programadorId', '==', currentUser.uid));
      const snapshot = await getDocs(q);

      const lista: AsesoriaConId[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AsesoriaConId));

      this.asesorias.set(lista);
      console.log('Asesorías cargadas:', lista);

    } catch (err) {
      console.error('Error al cargar asesorías:', err);
    }
  }
// Dentro de la clase Programmer
motivosRechazo: { [asesoriaId: string]: string } = {}; // para guardar temporalmente cada motivo
showRechazo: { [asesoriaId: string]: boolean } = {};

async cambiarEstado(asesoriaId: string, nuevoEstado: string) {
  try {
    const mensajeRespuesta = this.motivosRechazo[asesoriaId]?.trim() || '';

    if (nuevoEstado === 'rechazada' && !mensajeRespuesta) {
      alert('Debe proporcionar un motivo para rechazar la asesoría.');
      return;
    }

    const datosActualizar = { 
      estado: nuevoEstado,
      mensajeRespuesta
    };

    await this.asesoriaService.actualizarAsesoria(asesoriaId, datosActualizar);

    // Actualizamos la señal local
    const updatedList = this.asesorias().map(a => 
      a.id === asesoriaId ? { ...a, ...datosActualizar } : a
    );
    this.asesorias.set(updatedList);

    // Limpiamos el campo
    delete this.motivosRechazo[asesoriaId];
    // Ocultamos el textarea
delete this.showRechazo[asesoriaId];


  } catch (err) {
    console.error('Error al actualizar estado de la asesoría:', err);
  }
}






  logout() {
    this.authService.logout().subscribe({
      next: () => {
        console.log('Sesión cerrada');
        this.authService.currentUser.set(null);
        this.authService.userRole.set(null);
        this.authService.roleLoaded.set(false);
        this.router.navigate(['/login']);
      },
      error: (err) => console.error('Error al cerrar sesión:', err),
    });
  }
}

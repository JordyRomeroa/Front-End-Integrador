import { Component, effect, signal, inject } from '@angular/core';
import { NgIf, NgFor, CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService, Role } from '../../../../../services/auth-service';
import { collection, getDocs, query, where, Firestore } from '@angular/fire/firestore';
import { AsesoriaService } from '../../../../../services/advice';
import { AsesoriaConId } from '../../../interface/asesoria';

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
  imports: [NgIf, NgFor,CommonModule,RouterOutlet],
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

  async cambiarEstado(asesoriaId: string, nuevoEstado: string) {
    try {
      await this.asesoriaService.actualizarAsesoria(asesoriaId, { estado: nuevoEstado });
      console.log(`Asesoría ${asesoriaId} actualizada a ${nuevoEstado}`);

      // Actualizamos localmente la señal
      const actualizadas = this.asesorias().map(a =>
        a.id === asesoriaId ? { ...a, estado: nuevoEstado } : a
      );
      this.asesorias.set(actualizadas);

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

import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { collection, Firestore, getDocs, query, where } from '@angular/fire/firestore';
import { AuthService } from '../../../../../../services/auth-service';
import { AsesoriaConId } from '../../../../interface/asesoria';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-solicitudes',
  imports: [CommonModule, RouterOutlet],
  templateUrl: './solicitudes.html',
  styleUrl: './solicitudes.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Solicitudes {
  private firestore = inject(Firestore);

  asesorias = signal<AsesoriaConId[]>([]);
  loading = signal(true);

  constructor(private authService: AuthService) {

    effect(() => {
      const user = this.authService.currentUser();
      if (!user) return;

      this.cargarAsesorias(user.uid);
    });
  }

  // ======================================================
  // CARGAR SOLICITUDES DEL USUARIO
  // ======================================================
  async cargarAsesorias(usuarioId: string) {
    try {
      const col = collection(this.firestore, 'asesorias');
      const q = query(col, where('usuarioId', '==', usuarioId));

      const snap = await getDocs(q);

      const lista = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AsesoriaConId[];

      this.asesorias.set(lista);

    } catch (err) {
      console.error('Error cargando asesorías:', err);
    } finally {
      this.loading.set(false);
    }
  }

  // ======================================================
  // CLASE VISUAL DEL ESTADO
  // ======================================================
  estadoClase(estado: string) {
    return {
      'badge-warning': estado === 'pendiente',
      'badge-success': estado === 'aceptada',
      'badge-error': estado === 'rechazada'
    };
  }
 }

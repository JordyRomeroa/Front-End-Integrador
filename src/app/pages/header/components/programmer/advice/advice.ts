import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Firestore, collection, getDocs, query, where } from '@angular/fire/firestore';
import { AsesoriaConId } from '../../../../interface/asesoria';
import { AuthService, Role } from '../../../../../../services/auth-service';
import { AsesoriaService } from '../../../../../../services/advice';

@Component({
  selector: 'app-advice',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './advice.html',
  styleUrls: ['./advice.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Advice {
  role: Role | null = null;
  asesorias = signal<AsesoriaConId[]>([]);
  motivosRechazo: { [asesoriaId: string]: string } = {};
  showRechazo: { [asesoriaId: string]: boolean } = {};

  // Señales para notificaciones visuales
  notificacionUsuario = signal<string | null>(null);
  notificacionAdmin = signal<string | null>(null);

  private firestore = inject(Firestore);

  constructor(
    public authService: AuthService,
    private router: Router,
    private asesoriaService: AsesoriaService
  ) {
    // Cargar rol y asesorías al iniciar
    if (this.authService.roleLoaded()) {
      this.role = this.authService.getUserRole();
      if (this.role === 'programmer') {
        this.cargarAsesorias();
      }
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

      // Limpiamos motivos y ocultamos textarea
      delete this.motivosRechazo[asesoriaId];
      delete this.showRechazo[asesoriaId];

      // 🔔 Simulación de notificación
      this.mostrarNotificacion(asesoriaId, nuevoEstado);

    } catch (err) {
      console.error('Error al actualizar estado de la asesoría:', err);
    }
  }

  // Método que simula notificaciones de correo
  private mostrarNotificacion(asesoriaId: string, estado: string) {
    const asesoria = this.asesorias().find(a => a.id === asesoriaId);
    if (!asesoria) return;

    const usuario = asesoria.nombreUsuario || 'Usuario';
    const admin = 'Admin';

    // Simular notificación al usuario solo si su rol es user
    if (this.role === 'user' || this.role === 'programmer') {
      this.notificacionUsuario.set(`📧 Correo a ${usuario}: Tu solicitud ha sido ${estado}.`);
    }

    // Simular notificación al admin solo si su rol es admin
    if (this.role === 'admin') {
      this.notificacionAdmin.set(`📧 Correo a ${admin}: La asesoría del usuario ${usuario} ha sido ${estado}.`);
    }

    // Desaparecen después de 4 segundos
    setTimeout(() => {
      this.notificacionUsuario.set(null);
      this.notificacionAdmin.set(null);
    }, 4000);

    // Mostrar también en consola para depuración
    console.log('Usuario:', this.notificacionUsuario());
    console.log('Admin:', this.notificacionAdmin());
  }
}
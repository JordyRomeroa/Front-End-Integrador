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

  // NUEVO: listas separadas como tu otro proyecto
  pendientes = signal<AsesoriaConId[]>([]);
  historial = signal<AsesoriaConId[]>([]);

  // Modal
  asesorSeleccionado = signal<AsesoriaConId | null>(null);
  mensajeRespuesta = signal('');

  // Notificaciones visuales
  notificacionUsuario = signal<string | null>(null);
  notificacionAdmin = signal<string | null>(null);

  motivosRechazo: { [asesoriaId: string]: string } = {};
  showRechazo: { [asesoriaId: string]: boolean } = {};

  private firestore = inject(Firestore);

  constructor(
    public authService: AuthService,
    private router: Router,
    private asesoriaService: AsesoriaService
  ) {
    if (this.authService.roleLoaded()) {
      this.role = this.authService.getUserRole();
      this.cargarAsesorias();
    }
  }

  async cargarAsesorias() {
    const currentUser = this.authService.currentUser();
    if (!currentUser) return;

    try {
      const asesoriasCol = collection(this.firestore, 'asesorias');
      let q;

      if (this.role === 'programmer') {
        q = query(asesoriasCol, where('programadorId', '==', currentUser.uid));
      } else if (this.role === 'user') {
        q = query(asesoriasCol, where('usuarioId', '==', currentUser.uid));
      } else {
        return;
      }

      const snapshot = await getDocs(q);
      const lista: AsesoriaConId[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AsesoriaConId));

      this.asesorias.set(lista);

      // separar pendientes y revisadas
      this.pendientes.set(lista.filter(a => a.estado === 'pendiente'));
      this.historial.set(lista.filter(a => a.estado !== 'pendiente'));

      if (this.role === 'user') {
        this.mostrarNotificacionesPendientesUsuario(lista);
      }

    } catch (err) {
      console.error('Error al cargar asesorías:', err);
    }
  }

  private mostrarNotificacionesPendientesUsuario(lista: AsesoriaConId[]) {
    const pendientes = lista.filter(a => a.estado !== 'pendiente');
    if (pendientes.length === 0) return;

    const ultima = pendientes[pendientes.length - 1];
    this.notificacionUsuario.set(`📧 Tu solicitud ha sido ${ultima.estado}.`);
    setTimeout(() => this.notificacionUsuario.set(null), 4000);
  }


  abrirModal(asesoria: AsesoriaConId) {
    this.asesorSeleccionado.set(asesoria);
    this.mensajeRespuesta.set('');
  }


  async enviarRespuesta(estado: 'aceptada' | 'rechazada') {
    const asesoria = this.asesorSeleccionado();
    if (!asesoria) return;

    const msj = this.mensajeRespuesta().trim();
    if (!msj) {
      alert('Escribe un mensaje para el usuario.');
      return;
    }

    const datosActualizar = {
      estado,
      mensajeRespuesta: msj
    };

    try {
      await this.asesoriaService.actualizarAsesoria(asesoria.id, datosActualizar);

      // actualizar en memoria
      const actualizada = this.asesorias().map(a =>
        a.id === asesoria.id ? { ...a, ...datosActualizar } : a
      );

      this.asesorias.set(actualizada);
      this.pendientes.set(actualizada.filter(a => a.estado === 'pendiente'));
      this.historial.set(actualizada.filter(a => a.estado !== 'pendiente'));

      if (estado === 'aceptada') {
        alert('Solicitud aceptada. Ahora puedes contactar al cliente.');
      } else {
        alert('Solicitud rechazada.');
      }

      this.asesorSeleccionado.set(null);

    } catch (err) {
      console.error(err);
      alert('Error al actualizar');
    }
  }


  getWhatsAppLink(data: AsesoriaConId): string {
    if (!data.telefono) return '#';

    const text = `Hola ${data.nombreUsuario}, he aceptado tu solicitud de asesoría sobre "${data.mensaje}".`;

    return `https://wa.me/${data.telefono}?text=${encodeURIComponent(text)}`;
  }

  private mostrarNotificacion(asesoriaId: string, estado: string) {
    const asesoria = this.asesorias().find(a => a.id === asesoriaId);
    if (!asesoria) return;

    const usuario = asesoria.nombreUsuario ?? 'Usuario';
    const admin = 'Admin';

    this.notificacionUsuario.set(`📧 Correo a ${usuario}: Tu solicitud ha sido ${estado}.`);

    if (this.role === 'admin') {
      this.notificacionAdmin.set(`📧 Correo al admin: La asesoría del usuario ${usuario} ha sido ${estado}.`);
    }

    setTimeout(() => {
      this.notificacionUsuario.set(null);
      this.notificacionAdmin.set(null);
    }, 4000);
  }
}

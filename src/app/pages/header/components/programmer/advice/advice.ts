import { ChangeDetectionStrategy, Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AsesoriaConId } from '../../../../interface/asesoria';
import { AuthService, Role } from '../../../../../../services/auth-service';
import { AsesoriaService } from '../../../../../../services/advice';
import { Subscription, filter, take } from 'rxjs';

@Component({
  selector: 'app-programmer-advice',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './advice.html',
  styleUrls: ['./advice.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Advice implements OnInit, OnDestroy {
  // Servicios
  public authService = inject(AuthService);
  private router = inject(Router);
  private asesoriaService = inject(AsesoriaService);
  
  private subscripciones = new Subscription();

  // Estado con Signals
  role: Role | null = null;
  asesorias = signal<AsesoriaConId[]>([]);
  pendientes = signal<AsesoriaConId[]>([]);
  historial = signal<AsesoriaConId[]>([]);

  // Modales y Feedback
  asesorSeleccionado = signal<AsesoriaConId | null>(null);
  mensajeRespuesta = signal('');
  mensajeExito = signal<string | null>(null);
  mensajeError = signal<string | null>(null);
  notificacionUsuario = signal<string | null>(null);

  ngOnInit() {
    // 1. CARGA ULTRA-RÁPIDA: Escuchamos el estado del usuario inmediatamente
    this.subscripciones.add(
      this.authService.user$.pipe(
        filter(user => !!user), // Solo procedemos cuando el usuario no sea null
        take(1) // Solo nos interesa la primera carga exitosa para disparar el fetch
      ).subscribe(user => {
        this.role = this.authService.getUserRole();
        this.cargarAsesorias();
      })
    );

    // 2. ESCUCHAR CAMBIOS EN TIEMPO REAL (Si tu servicio usa BehaviorSubject como hicimos antes)
    this.subscripciones.add(
      this.asesoriaService.asesoriasActuales$.subscribe(lista => {
        if (lista.length > 0) {
          this.asesorias.set(lista);
          this.actualizarListas(lista);
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscripciones.unsubscribe();
  }

  async cargarAsesorias() {
    const currentUser = this.authService.currentUser();
    if (!currentUser) return;

    const userId = currentUser.id || currentUser.uid;

    // Llamada directa al servicio
    this.asesoriaService.obtenerAsesoriasPorProgramador(userId).subscribe({
      next: (lista: AsesoriaConId[]) => {
        this.asesorias.set(lista);
        this.actualizarListas(lista);
        if (this.role === 'user') this.mostrarNotificacionesPendientesUsuario(lista);
      },
      error: () => this.mostrarError('Error de conexión con el servidor.')
    });
  }

  private actualizarListas(lista: AsesoriaConId[]) {
    // Usamos signal.set para que OnPush detecte el cambio instantáneo
    this.pendientes.set(lista.filter(a => a.estado === 'pendiente'));
    this.historial.set(lista.filter(a => a.estado !== 'pendiente'));
  }

  async enviarRespuesta(estado: 'aceptada' | 'rechazada') {
    const asesoria = this.asesorSeleccionado();
    const msj = this.mensajeRespuesta().trim();
    
    if (!asesoria || !msj) {
      this.mostrarError('Escribe un mensaje antes de enviar.');
      return;
    }

    this.asesoriaService.actualizarAsesoria(asesoria.id, { estado, mensajeRespuesta: msj }).subscribe({
      next: () => {
        this.mostrarExito(`Solicitud ${estado} correctamente.`);
        this.asesorSeleccionado.set(null);
        // El servicio refrescará automáticamente si implementaste el BehaviorSubject
      },
      error: () => this.mostrarError('No se pudo actualizar la asesoría.')
    });
  }

  // --- HELPERS DE UI ---
  abrirModal(as: AsesoriaConId) {
    this.asesorSeleccionado.set(as);
    this.mensajeRespuesta.set('');
  }

  cerrarModal() { this.asesorSeleccionado.set(null); }

  private mostrarExito(msj: string) {
    this.mensajeExito.set(msj);
    setTimeout(() => this.mensajeExito.set(null), 3000);
  }

  private mostrarError(msj: string) {
    this.mensajeError.set(msj);
    setTimeout(() => this.mensajeError.set(null), 3000);
  }

  getWhatsAppLink(data: AsesoriaConId): string {
    if (!data.telefono) return '#';
    const text = `Hola ${data.nombreUsuario}, respondo a tu consulta: "${data.mensaje}"`;
    return `https://wa.me/${data.telefono}?text=${encodeURIComponent(text)}`;
  }

  private mostrarNotificacionesPendientesUsuario(lista: AsesoriaConId[]) {
    const revisadas = lista.filter(a => a.estado !== 'pendiente');
    if (revisadas.length > 0) {
      const ultima = revisadas[revisadas.length - 1];
      this.notificacionUsuario.set(`Tu solicitud está: ${ultima.estado}`);
      setTimeout(() => this.notificacionUsuario.set(null), 5000);
    }
  }
}
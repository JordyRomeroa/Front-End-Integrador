import { ChangeDetectionStrategy, Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Firestore } from '@angular/fire/firestore';
import { AsesoriaConId } from '../../../../interface/asesoria';
import { AuthService, Role } from '../../../../../../services/auth-service';
import { AsesoriaService } from '../../../../../../services/advice';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-programmer-advice',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './advice.html',
  styleUrls: ['./advice.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Advice implements OnInit, OnDestroy {

  role: Role | null = null;
  asesorias = signal<AsesoriaConId[]>([]);
  pendientes = signal<AsesoriaConId[]>([]);
  historial = signal<AsesoriaConId[]>([]);

  // Modales
  asesorSeleccionado = signal<AsesoriaConId | null>(null);
  mensajeRespuesta = signal('');
  
  // Feedback Visual
  mensajeExito = signal<string | null>(null);
  mensajeError = signal<string | null>(null);

  // Notificaciones visuales
  notificacionUsuario = signal<string | null>(null);
  notificacionAdmin = signal<string | null>(null);

  private firestore = inject(Firestore);
  private subscriptions = new Subscription(); // Para manejar la limpieza de memoria

  constructor(
    public authService: AuthService,
    private router: Router,
    private asesoriaService: AsesoriaService
  ) {}

  ngOnInit(): void {
    // Escuchamos al usuario de forma reactiva. 
    // Si el usuario cambia o inicia sesión, se disparará cargarAsesorias automáticamente.
    this.subscriptions.add(
      this.authService.user$.subscribe(user => {
        if (user) {
          this.role = this.authService.getUserRole();
          this.cargarAsesorias();
        }
      })
    );
  }

  ngOnDestroy(): void {
    // Muy importante: cancelar suscripciones al salir para evitar lentitud
    this.subscriptions.unsubscribe();
  }

  async cargarAsesorias() {
    const currentUser = this.authService.currentUser();
    if (!currentUser) return;

    // Priorizamos el id de base de datos Java que seteamos en el AuthService
    const userId = currentUser.id || currentUser.uid; 

    this.asesoriaService.obtenerAsesoriasPorProgramador(userId).subscribe({
      next: (lista: AsesoriaConId[]) => {
        this.asesorias.set(lista);
        this.actualizarListas(lista);

        if (this.role === 'user') {
          this.mostrarNotificacionesPendientesUsuario(lista);
        }
      },
      error: (err) => {
        this.mostrarError('No se pudieron cargar las asesorías desde el servidor.');
      }
    });
  }

  private actualizarListas(lista: AsesoriaConId[]) {
    this.pendientes.set(lista.filter(a => a.estado === 'pendiente'));
    this.historial.set(lista.filter(a => a.estado !== 'pendiente'));
  }

  async enviarRespuesta(estado: 'aceptada' | 'rechazada') {
    const asesoria = this.asesorSeleccionado();
    if (!asesoria) return;

    const msj = this.mensajeRespuesta().trim();
    if (!msj) {
      this.mostrarError('Por favor, escribe un mensaje para el usuario.');
      return;
    }

    const datosActualizar = { estado, mensajeRespuesta: msj };

    this.asesoriaService.actualizarAsesoria(asesoria.id, datosActualizar).subscribe({
      next: () => {
        // Actualizamos localmente para feedback instantáneo
        const actualizada = this.asesorias().map(a =>
          a.id === asesoria.id ? { ...a, ...datosActualizar } : a
        );

        this.asesorias.set(actualizada);
        this.actualizarListas(actualizada);
        
        this.mostrarExito(estado === 'aceptada' ? 'Solicitud aceptada con éxito.' : 'Solicitud rechazada correctamente.');
        this.asesorSeleccionado.set(null);
      },
      error: (err) => {
        this.mostrarError('Error al procesar la solicitud en el servidor Java.');
      }
    });
  }

  // Helpers para Feedback (Mantenidos)
  private mostrarExito(msj: string) {
    this.mensajeExito.set(msj);
    setTimeout(() => this.mensajeExito.set(null), 3500);
  }

  private mostrarError(msj: string) {
    this.mensajeError.set(msj);
    setTimeout(() => this.mensajeError.set(null), 4000);
  }

  abrirModal(asesoria: AsesoriaConId) {
    this.mensajeError.set(null);
    this.asesorSeleccionado.set(asesoria);
    this.mensajeRespuesta.set('');
  }

  cerrarModal() {
    this.asesorSeleccionado.set(null);
    this.mensajeError.set(null);
  }

  getWhatsAppLink(data: AsesoriaConId): string {
    if (!data.telefono) return '#';
    const text = `Mucho gusto, he revisado tu solicitud ${data.nombreUsuario}, sobre "${data.mensaje}".`;
    return `https://wa.me/${data.telefono}?text=${encodeURIComponent(text)}`;
  }

  private mostrarNotificacionesPendientesUsuario(lista: AsesoriaConId[]) {
    const revisadas = lista.filter(a => a.estado !== 'pendiente');
    if (revisadas.length === 0) return;

    const ultima = revisadas[revisadas.length - 1];
    this.notificacionUsuario.set(`📧 Tu solicitud ha sido ${ultima.estado}.`);
    setTimeout(() => this.notificacionUsuario.set(null), 4000);
  }
}
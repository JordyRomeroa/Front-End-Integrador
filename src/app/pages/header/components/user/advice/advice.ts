import { ChangeDetectionStrategy, Component, effect, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { AuthService, Role } from '../../../../../../services/auth-service';
import { ProgramadorService } from '../../../../../../services/programmer-service';
import { ProgramadorData } from '../../../../interface/programador';
import { Router } from '@angular/router';
import { Asesoria, AsesoriaService } from '../../../../../../services/advice';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

type ProgramadorConId = ProgramadorData & { uid: string };

@Component({
  selector: 'app-advice',
  imports: [CommonModule, FormsModule],
  templateUrl: './advice.html',
  styleUrl: './advice.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Advice  implements OnInit, OnDestroy {

  // Rol del usuario actual
  role = signal<Role | null>(null);
  isUser = signal(false);
  dialogVisible = signal(false);
  dialogMessage = signal('');
  fecha: string = '';
  mensaje: string = '';
  programadores = signal<ProgramadorConId[]>([]);
  programadorId = '';
  telefono: string = '';

  private progService = inject(ProgramadorService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private asesoriaService = inject(AsesoriaService);
  private sub?: Subscription;

  constructor() {
    // Mantener la señal isUser actualizada según el rol
    effect(() => {
      this.isUser.set(this.role() === 'user');
    });
  }

  ngOnInit() {
    // Cargar rol del usuario actual
    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    const userRole = this.authService.getUserRole();
    this.role.set(userRole ?? null);

    // Suscribirse a los programadores
    this.suscribirseProgramadores();
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        console.log('Sesión cerrada');
        this.router.navigate(['/login']);
      },
      error: (err) => console.error('Error al cerrar sesión:', err),
    });
  }

  suscribirseProgramadores() {
    this.sub?.unsubscribe();

    this.sub = this.progService.programadores$.subscribe(lista => {
      console.log('Programadores recibidos:', lista);
      const listaConUid: ProgramadorConId[] = lista.map(p => ({ ...p, uid: (p as any).uid }));
      this.programadores.set(listaConUid);

      if (listaConUid.length && !this.programadorId) {
        this.programadorId = listaConUid[0].uid;
      }
    });

    this.progService.refrescarTabla().catch(console.error);
  }
 async enviarAsesoria() {
  const currentUser = this.authService.currentUser();
  
  // LOGICA IGUAL A PROYECTOS: Intentar sacar el ID real de la base de datos
  // En tu sistema, cuando el usuario se loguea en Java, el ID viene como 'id'
  const idParaJava = currentUser?.id; 

  if (!currentUser) {
    return this.showDialog('Debes iniciar sesión para solicitar una asesoría.');
  }

  // Si idParaJava es undefined o NaN, el backend fallará con error 500
  if (!idParaJava || isNaN(Number(idParaJava))) {
    console.error('Detalle del usuario sin ID:', currentUser);
    return this.showDialog('Error: No se encontró tu ID de base de datos. Por favor, cierra sesión y vuelve a entrar.');
  }

  if (!this.mensaje || !this.programadorId || !this.fecha) {
    return this.showDialog('Debe ingresar un mensaje, seleccionar un programador y una fecha.');
  }

  // Validaciones de fecha...
  const fechaSeleccionada = new Date(this.fecha);
  if (fechaSeleccionada.getDay() === 0 || fechaSeleccionada.getDay() === 6) {
    return this.showDialog('La asesoría no puede ser en fin de semana.');
  }

  const programador = this.programadores().find(p => p.uid === this.programadorId);

  // En tu método enviarAsesoria()
// Esto asegura el formato YYYY-MM-DDTHH:mm requerido por tu @JsonFormat

const nuevaAsesoria: any = {
  mensaje: this.mensaje,
  estado: 'pendiente',
  mensajeRespuesta: '',
  programadorId: Number(this.programadorId),
  usuarioId: Number(idParaJava),
  nombreUsuario: currentUser.nombre || currentUser.displayName,
  fecha: this.fecha, // <--- Enviamos la fecha formateada
  telefono: this.telefono
};

  this.asesoriaService.crearAsesoria(nuevaAsesoria).subscribe({
    next: (res) => {
      this.showDialog(`Asesoría enviada correctamente a ${programador?.nombre}`);
      this.limpiarFormulario();
    },
    error: (err) => {
      console.error('Error Backend:', err);
      this.showDialog('Error al guardar en el servidor. Verifica los datos.');
    }
  });
}
  private limpiarFormulario() {
    this.mensaje = '';
    this.fecha = '';
    this.telefono = '';
    if (this.programadores().length) {
      this.programadorId = this.programadores()[0].uid;
    }
  }

  showDialog(msg: string) {
    this.dialogMessage.set(msg);
    this.dialogVisible.set(true);
  }

  closeDialog() {
    this.dialogVisible.set(false);
    this.dialogMessage.set('');
  }


  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

}


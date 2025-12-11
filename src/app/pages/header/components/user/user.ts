import { ChangeDetectionStrategy, Component, effect, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { AuthService, Role } from '../../../../../services/auth-service';
import { Router } from '@angular/router';
import { Asesoria, AsesoriaService } from '../../../../../services/advice';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ProgramadorService } from '../../../../../services/programmer-service';
import { Subscription } from 'rxjs';
import { ProgramadorData } from '../../../interface/programador';

type ProgramadorConId = ProgramadorData & { uid: string };

@Component({
  selector: 'app-user',
  imports: [CommonModule, FormsModule],
  templateUrl: './user.html',
  styleUrls: ['./user.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class User implements OnInit, OnDestroy {

  // Rol del usuario actual
  role = signal<Role | null>(null);
  isUser = signal(false);
  dialogVisible = signal(false);
  dialogMessage = signal('');
  fecha: string = '';
  mensaje: string = '';
  programadores = signal<ProgramadorConId[]>([]);
  programadorId = '';

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
    if (!currentUser) return this.showDialog('Debes iniciar sesión para solicitar una asesoría.');

    if (!this.mensaje || !this.programadorId || !this.fecha) 
      return this.showDialog('Debe ingresar un mensaje, seleccionar un programador y una fecha.');

    const fechaSeleccionada = new Date(this.fecha);
    const diaSemana = fechaSeleccionada.getDay();
    if (diaSemana === 0 || diaSemana === 6)
      return this.showDialog('La asesoría no puede ser en fin de semana.');

    const hora = fechaSeleccionada.getHours();
    if (hora < 7 || hora >= 17)
      return this.showDialog('La asesoría debe ser entre las 07:00 y las 17:00.');

    const nuevaAsesoria: Asesoria = {
      mensaje: this.mensaje,
      estado: 'pendiente',
      mensajeRespuesta: '',
      programadorId: this.programadorId,
      usuarioId: currentUser.uid,
      nombreUsuario: currentUser.displayName || currentUser.email?.split('@')[0] || 'Usuario',
      fecha: this.fecha
    };

    try {
      const id = await this.asesoriaService.crearAsesoria(nuevaAsesoria);
      this.showDialog(`Asesoría enviada `);
      this.mensaje = '';
      this.programadorId = this.programadores().length ? this.programadores()[0].uid : '';
      this.fecha = '';
    } catch (error) {
      console.error(error);
      this.showDialog('Error al enviar la asesoría.');
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

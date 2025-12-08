import { ChangeDetectionStrategy, Component, effect, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { AuthService, Role } from '../../../../../services/auth-service';
import { Router } from '@angular/router';
import { Asesoria, AsesoriaService } from '../../../../../services/advice';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ProgramadorService, ProgramadorData } from '../../../../../services/programmer-service';
import { Subscription } from 'rxjs';

// Extendemos ProgramadorData temporalmente para incluir uid
type ProgramadorConId = ProgramadorData & { uid: string };

@Component({
  selector: 'app-user',
  imports: [CommonModule, FormsModule],
  templateUrl: './user.html',
  styleUrls: ['./user.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class User implements OnInit, OnDestroy {
  // Señal para el rol, así la vista reacciona
  role = signal<Role | null>(null);

  mensaje: string = '';
  programadores = signal<ProgramadorConId[]>([]);
  programadorId = '';

  private progService = inject(ProgramadorService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private asesoriaService = inject(AsesoriaService);
  private sub?: Subscription;

  // ✅ Effect movido a un field initializer
  private initEffect = effect(() => {
    if (this.authService.roleLoaded() && this.authService.getUserRole() === 'user') {
      this.role.set('user');
      this.suscribirseProgramadores();
    }
  });

  ngOnInit() {
    // Aquí ya no necesitamos llamar a effect()
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
    if (!this.mensaje || !this.programadorId) {
      alert('Debe ingresar un mensaje y seleccionar un programador.');
      return;
    }

    const currentUser = this.authService.currentUser();
    if (!currentUser) return;

    const nuevaAsesoria: Asesoria = {
      mensaje: this.mensaje,
      estado: 'pendiente',
      mensajeRespuesta: '',
      programadorId: this.programadorId,
      usuarioId: currentUser.uid
    };

    try {
      const id = await this.asesoriaService.crearAsesoria(nuevaAsesoria);
      alert(`Asesoría enviada con ID: ${id}`);
      this.mensaje = '';
      this.programadorId = this.programadores().length ? this.programadores()[0].uid : '';
    } catch (error) {
      console.error(error);
      alert('Error al enviar la asesoría.');
    }
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}

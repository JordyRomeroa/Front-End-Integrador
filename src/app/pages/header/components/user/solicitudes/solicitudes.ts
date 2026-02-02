import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { AuthService } from '../../../../../../services/auth-service';
import { AsesoriaService } from '../../../../../../services/advice'; // Importa tu servicio
import { AsesoriaConId } from '../../../../interface/asesoria';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-solicitudes',
  standalone: true, // Asegúrate de que sea standalone si no usas módulos
  imports: [CommonModule, RouterOutlet],
  templateUrl: './solicitudes.html',
  styleUrl: './solicitudes.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Solicitudes {
  // Cambiamos Firestore por tu servicio de Java
  private asesoriaService = inject(AsesoriaService);
  private authService = inject(AuthService);

  asesorias = signal<AsesoriaConId[]>([]);
  loading = signal(true);

  constructor() {
    effect(() => {
      const user = this.authService.currentUser() as any;
      if (!user || !user.id) return;

      // Cargamos usando el ID numérico que espera tu Backend
      this.cargarAsesorias(user.id);
    });
  }

  async cargarAsesorias(usuarioId: string | number) {
    this.loading.set(true);
    try {
      // Usamos el método de tu servicio que conecta con la API de Java
      // Nota: Si no tienes 'obtenerAsesoriasPorUsuario', asegúrate de crearlo en el servicio
      const idNumerico = Number(usuarioId);
      
      // Suponiendo que tu servicio tiene un método para que el usuario vea sus propias solicitudes
      const lista = await firstValueFrom(this.asesoriaService.obtenerAsesoriasPorUsuario(idNumerico));
      
      this.asesorias.set(lista);
    } catch (err) {
      console.error('Error cargando asesorías desde el Backend:', err);
    } finally {
      this.loading.set(false);
    }
  }

  estadoClase(estado: string) {
    return {
      'badge-warning': estado === 'pendiente',
      'badge-success': estado === 'aceptada',
      'badge-danger': estado === 'rechazada' // Cambié 'badge-error' por 'badge-danger' (común en Bootstrap/Tailwind)
    };
  }
}
import { Component, effect, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService, Role } from '../../../../../services/auth-service';
import { ProyectoService } from '../../../../../services/proyecto-service'; 
import { AsesoriaService } from '../../../../../services/advice';
import { AsesoriaConId } from '../../../interface/asesoria';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

// Definimos la interfaz aquí o impórtala si ya existe
interface Proyecto {
  id: string | number;
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
  imports: [CommonModule, FormsModule, RouterModule],
})
export class Programmer {
  role: Role | null = null;
  proyectos = signal<Proyecto[]>([]);
  asesorias = signal<AsesoriaConId[]>([]);
  
  // SOLUCIÓN AL ERROR TS2300: Solo usamos inject O constructor, no ambos.
  private proyectoService = inject(ProyectoService);
  private asesoriaService = inject(AsesoriaService);
  private authService = inject(AuthService);
  private router = inject(Router);

  constructor() {
    // 1. FORZAR REFRESCO: Igual que en Mi Perfil para obtener el ID real de Java
    this.authService.refreshCurrentUser().then((user: any) => {
      console.log('🔄 Usuario sincronizado:', user?.id);
    });

    effect(() => {
      // SOLUCIÓN AL ERROR TS2339: Casteamos a 'any' para que TS no chille por el .id
      const user = this.authService.currentUser() as any;
      const role = this.authService.getUserRole();

      // 2. VALIDACIÓN: Esperamos a que el ID exista
      if (!user || !user.id) {
        console.warn('⏳ Esperando ID del programador...');
        return;
      }

      if (this.authService.roleLoaded() && (role === 'programmer' || role === 'ROLE_PROGRAMMER')) {
        this.role = role;
        this.cargarProyectos(user.id);
        this.cargarAsesorias(user.id);
      }
    });
  }

 async cargarProyectos(userId: number | string) {
    try {
      // Convertimos explícitamente a número para que el servicio no de error
      const idNumerico = Number(userId); 
      const lista = await this.proyectoService.obtenerProyectos(idNumerico);
      this.proyectos.set(lista as any);
      console.log('✅ Proyectos cargados:', lista);
    } catch (err) {
      console.error('❌ Error proyectos:', err);
    }
  }

  async cargarAsesorias(userId: number | string) {
    try {
      // Convertimos explícitamente a número aquí también
      const idNumerico = Number(userId);
      const lista = await firstValueFrom(this.asesoriaService.obtenerAsesoriasPorProgramador(idNumerico));
      this.asesorias.set(lista);
    } catch (err) {
    }
  }

  // --- MÉTODOS DE LÓGICA MANTENIDOS ---

  motivosRechazo: { [asesoriaId: string]: string } = {}; 
  showRechazo: { [asesoriaId: string]: boolean } = {};

  async cambiarEstado(asesoriaId: string, nuevoEstado: string) {
    try {
      const mensajeRespuesta = this.motivosRechazo[asesoriaId]?.trim() || '';
      if (nuevoEstado === 'rechazada' && !mensajeRespuesta) {
        alert('Debe proporcionar un motivo para rechazar la asesoría.');
        return;
      }
      const datosActualizar = { estado: nuevoEstado, mensajeRespuesta };
      await firstValueFrom(this.asesoriaService.actualizarAsesoria(asesoriaId, datosActualizar));
      
      this.asesorias.update(list => list.map(a => a.id === asesoriaId ? { ...a, ...datosActualizar } : a));
      delete this.motivosRechazo[asesoriaId];
      delete this.showRechazo[asesoriaId];
    } catch (err) {
      console.error('Error al actualizar estado:', err);
    }
  }

  logout() {
    this.authService.logout().subscribe(() => this.router.navigate(['/login']));
  }
}
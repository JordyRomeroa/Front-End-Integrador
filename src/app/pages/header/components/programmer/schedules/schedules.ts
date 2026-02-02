import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../../../services/auth-service';
import { AsesoriaService } from '../../../../../../services/advice';
import { AsesoriaConId } from '../../../../interface/asesoria';
import { DiaCalendario } from '../../../../interface/diaCalendario';

@Component({
  selector: 'app-schedules',
  templateUrl: './schedules.html',
  styleUrls: ['./schedules.css'],
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Schedules implements OnInit {
  asesorias = signal<AsesoriaConId[]>([]);
  dias = signal<DiaCalendario[]>([]);
  mesActual = new Date().getMonth(); 
  anioActual = new Date().getFullYear();

  private authService = inject(AuthService);
  private asesoriaService = inject(AsesoriaService);

  ngOnInit() {
    console.log('Schedules: Iniciando carga desde Backend Java...');
    this.cargarAsesorias();
  }

 cargarAsesorias() {
  const user = this.authService.currentUser();
  
  // 1. Extraemos el ID (que el error dice que puede ser string o number)
  const rawId = user?.id; 

  if (!rawId) {
    console.warn('No se encontró el ID del programador.');
    return;
  }

  // 2. FORZAMOS la conversión a number para que el compilador esté feliz
  const programadorId: number = Number(rawId);

  // 3. Ahora ya no dará error ts(2345)
  this.asesoriaService.obtenerAsesoriasPorProgramador(programadorId).subscribe({
    next: (listaCompleta) => {
      const aceptadas = listaCompleta.filter(a => a.estado === 'aceptada');
      this.asesorias.set(aceptadas);
      this.generarDiasDelMes();
    },
    error: (err) => console.error('Error:', err)
  });
}

  generarDiasDelMes() {
    const diasDelMes = new Date(this.anioActual, this.mesActual + 1, 0).getDate();
    const diasArray: DiaCalendario[] = [];

    for (let i = 1; i <= diasDelMes; i++) {
      const asesoriasDelDia = this.asesorias().filter(a => {
        if (!a.fecha) return false;
        
        const fecha = new Date(a.fecha);
        return (
          fecha.getDate() === i && 
          fecha.getMonth() === this.mesActual &&
          fecha.getFullYear() === this.anioActual
        );
      });

      diasArray.push({ dia: i, asesorias: asesoriasDelDia });
    }

    this.dias.set(diasArray);
  }

  // Métodos de navegación de meses...
  mesAnterior() {
    if (this.mesActual === 0) {
      this.mesActual = 11;
      this.anioActual--;
    } else {
      this.mesActual--;
    }
    this.generarDiasDelMes();
  }

  mesSiguiente() {
    if (this.mesActual === 11) {
      this.mesActual = 0;
      this.anioActual++;
    } else {
      this.mesActual++;
    }
    this.generarDiasDelMes();
  }
}
import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { NgFor, NgIf, CommonModule } from '@angular/common';
import { collection, Firestore, getDocs, query, where } from '@angular/fire/firestore';
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
  dias = signal<DiaCalendario[]>([]); // señal reactiva
  mesActual = new Date().getMonth(); // 0 = Enero
  anioActual = new Date().getFullYear();

  private firestore = inject(Firestore);

  constructor(
    private authService: AuthService,
    private asesoriaService: AsesoriaService
  ) {}

  ngOnInit() {
    console.log('ngOnInit llamado: cargando asesorías...');
    this.cargarAsesorias();
  }

  async cargarAsesorias() {
    const user = this.authService.currentUser();
    if (!user) {
      console.warn('No hay usuario logueado');
      return;
    }

    try {
      const asesoriasCol = collection(this.firestore, 'asesorias');
      const q = query(asesoriasCol, where('programadorId', '==', user.uid));
      const snapshot = await getDocs(q);

      // Filtramos solo las aceptadas
      const lista: AsesoriaConId[] = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as AsesoriaConId))
        .filter(a => a.estado === 'aceptada');

      this.asesorias.set(lista);
      console.log('Asesorías aceptadas cargadas:', lista);

      this.generarDiasDelMes();

    } catch (err) {
      console.error('Error al cargar asesorías:', err);
    }
  }

  generarDiasDelMes() {
    const diasDelMes = new Date(this.anioActual, this.mesActual + 1, 0).getDate();
    const diasArray: DiaCalendario[] = [];

    console.log('Generando días del mes:', this.mesActual + 1, this.anioActual);
    console.log('Número de días en el mes:', diasDelMes);

    for (let i = 1; i <= diasDelMes; i++) {
      const asesoriasDelDia = this.asesorias().filter(a => {
        if (!a.fecha) {
          console.warn(`Asesoría ${a.id} sin fecha`);
          return false;
        }
        const fecha = new Date(a.fecha);
        return fecha.getDate() === i && fecha.getMonth() === this.mesActual;
      });

      diasArray.push({ dia: i, asesorias: asesoriasDelDia });
    }

    this.dias.set(diasArray);
    console.log('Días generados con asesorías aceptadas:', this.dias());
  }

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

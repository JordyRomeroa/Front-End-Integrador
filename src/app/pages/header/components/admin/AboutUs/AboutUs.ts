import {
  Component,
  inject,
  signal,
  ViewChild,
  ElementRef,
  AfterViewInit
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { ProgramadorService } from '../../../../../../services/programmer-service';
import { ProgramadorInfo } from '../../../../interface/programadorInfo';

@Component({
  selector: 'app-about-us',
  standalone: true,
  templateUrl: './AboutUs.html',
  styleUrls: ['./AboutUs.css'],
  imports: [
    CommonModule,
    RouterLink  // Necesario para que funcione [routerLink]
  ]
})
export class AboutUs implements AfterViewInit {

  private programadorService = inject(ProgramadorService);

  // Signal para los programadores
  bloques = signal<ProgramadorInfo[]>([]);

  @ViewChild('carousel') carousel!: ElementRef<HTMLDivElement>;

  constructor() {
    this.cargarProgramadores();
  }

  /** Carga los programadores desde el servicio */
  async cargarProgramadores() {
    try {
      const lista = await this.programadorService.camposEspecificosProgramadores();
      this.bloques.set(lista);
    } catch (error) {
      console.error('Error cargando programadores:', error);
    }
  }

  /** Asegura que el ViewChild esté disponible */
  ngAfterViewInit(): void {
    if (!this.carousel) {
      console.warn('⚠ El carrusel no está listo todavía.');
    }
  }

  /** Mover carrusel a la izquierda */
  scrollLeft() {
    if (!this.carousel) return;
    this.carousel.nativeElement.scrollBy({ left: -350, behavior: 'smooth' });
  }

  /** Mover carrusel a la derecha */
  scrollRight() {
    if (!this.carousel) return;
    this.carousel.nativeElement.scrollBy({ left: 350, behavior: 'smooth' });
  }
}

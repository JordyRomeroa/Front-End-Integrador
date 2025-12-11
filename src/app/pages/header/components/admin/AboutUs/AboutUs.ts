import { Component, inject, signal, effect, ViewChild, ElementRef } from '@angular/core';
import { ProgramadorService } from '../../../../../../services/programmer-service';
import { ProgramadorInfo } from '../../../../interface/programadorInfo';

@Component({
  selector: 'app-about-us',
  templateUrl: './AboutUs.html',
  styleUrls: ['./AboutUs.css'],
})
export class AboutUs {
  private programadorService = inject(ProgramadorService);

  bloques = signal<ProgramadorInfo[]>([]);

  constructor() {
     this.cargarProgramadores();
  }

  async cargarProgramadores() {
    const lista = await this.programadorService.camposEspecificosProgramadores();
    this.bloques.set(lista);
  }
  @ViewChild('carousel') carousel!: ElementRef;

scrollLeft() {
  this.carousel.nativeElement.scrollBy({ left: -300, behavior: 'smooth' });
}

scrollRight() {
  this.carousel.nativeElement.scrollBy({ left: 300, behavior: 'smooth' });
}

}

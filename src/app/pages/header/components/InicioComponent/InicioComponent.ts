import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AboutUs } from "../admin/AboutUs/AboutUs";
import { Team } from "../admin/team/team";

@Component({
  selector: 'app-inicio-component',
  templateUrl: './InicioComponent.html',
  styleUrls: ['./InicioComponent.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, AboutUs, Team],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InicioComponent implements OnInit {

  // Lista definitiva de proyectos (Sin aleatoriedad)
  allRepos: any[] = [];

  constructor(private cd: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadSpecificRepos();
  }

  /**
   * Carga exactamente los proyectos definidos con sus GitHub Pages.
   */
  private loadSpecificRepos(): void {
    this.allRepos = [
      {
        id: 1,
        name: 'Práctica Heurísticas',
        description: 'Análisis de usabilidad y evaluación de interfaces basado en las heurísticas de Nielsen.',
        html_url: 'https://github.com/NayeliC98/icc-ppw-practica-heuristicas-nuevo',
        homepage: 'https://nayelic98.github.io/icc-ppw-practica-heuristicas-nuevo/',
        owner: { login: 'NayeliC98', avatar_url: 'https://avatars.githubusercontent.com/NayeliC98' }
      },
      {
        id: 2,
        name: 'Estilos y Componentes',
        description: 'Proyecto de Angular enfocado en la modularización de componentes y manejo de SCSS.',
        html_url: 'https://github.com/NayeliC98/icc-ppw-u1-estilos-componentes-nuevo',
        homepage: 'https://nayelic98.github.io/icc-ppw-u1-estilos-componentes-nuevo/',
        owner: { login: 'NayeliC98', avatar_url: 'https://avatars.githubusercontent.com/NayeliC98' }
      },
      {
        id: 3,
        name: 'WC3',
        description: 'Dashboard integrador desarrollado con tecnologías web modernas.',
        html_url: 'https://github.com/NayeliC98/WC3',
        homepage: 'https://nayelic98.github.io/WC3/',
        owner: { login: 'NayeliC98', avatar_url: 'https://avatars.githubusercontent.com/NayeliC98' }
      },
      {
        id: 4,
        name: 'Componentes y Estilos',
        description: 'Exploración avanzada de estilos dinámicos en entornos Angular.',
        html_url: 'https://github.com/JordyRomeroa/icc-ppw-03-componentes-estilos',
        homepage: 'https://jordyromeroa.github.io/icc-ppw-03-componentes-estilos/',
        owner: { login: 'JordyRomeroa', avatar_url: 'https://avatars.githubusercontent.com/JordyRomeroa' }
      },
      {
        id: 5,
        name: 'UI Componentes',
        description: 'Librería de componentes de interfaz de usuario para aplicaciones integradoras.',
        html_url: 'https://github.com/JordyRomeroa/icc-ppw-02-ui-componentes',
        homepage: 'https://jordyromeroa.github.io/icc-ppw-02-ui-componentes/',
        owner: { login: 'JordyRomeroa', avatar_url: 'https://avatars.githubusercontent.com/JordyRomeroa' }
      },
      {
        id: 6,
        name: 'Angular Práctica U1',
        description: 'Fundamentos de Angular: Rutas, servicios y estructura de proyecto inicial.',
        html_url: 'https://github.com/JordyRomeroa/icc-ppw-u1-AngularPractica',
        homepage: 'https://jordyromeroa.github.io/icc-ppw-u1-AngularPractica/',
        owner: { login: 'JordyRomeroa', avatar_url: 'https://avatars.githubusercontent.com/JordyRomeroa' }
      }
    ];
    this.cd.markForCheck();
  }
}
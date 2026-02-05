import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { GitHubService, Repo } from '../../../../../services/github-service';
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

  // Cambiamos el tipo a any[] para evitar el error de propiedad inexistente en el HTML
  allRepos: any[] = [];

  readonly users = ['NayeliC98', 'JordyRomeroa'];

  constructor(
    private githubService: GitHubService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const requests = this.users.map(user => 
      this.githubService.getRepos(user).pipe(
        catchError(err => {
          console.warn(`Error cargando repos de ${user}:`, err);
          return of([]); 
        })
      )
    );

    forkJoin(requests).subscribe({
      next: ([nayeliRepos, jordyRepos]) => {
        if (nayeliRepos.length === 0 && jordyRepos.length === 0) {
          this.loadFallbackRepos();
        } else {
          // Procesamos los repositorios para inyectar la propiedad homepage
          const processedNayeli = this.processRepos(nayeliRepos);
          const processedJordy = this.processRepos(jordyRepos);

          const filteredNayeli = this.getRandomRepos(processedNayeli, 3);
          const filteredJordy = this.getRandomRepos(processedJordy, 3);
          
          this.allRepos = [...filteredNayeli, ...filteredJordy].sort(() => Math.random() - 0.5);
        }
        this.cd.markForCheck();
      },
      error: () => {
        this.loadFallbackRepos();
        this.cd.markForCheck();
      }
    });
  }

  /**
   * Genera la URL de GitHub Pages y la asigna al objeto.
   * Usamos 'any' para poder añadir la propiedad 'homepage' sin que TS se queje.
   */
  private processRepos(repos: Repo[]): any[] {
    return repos.map(repo => ({
      ...repo,
      homepage: (repo as any).homepage || `https://${repo.owner.login}.github.io/${repo.name}/`
    }));
  }

  /**
   * Filtra originales y selecciona aleatorios.
   */
  private getRandomRepos(repos: any[], count: number): any[] {
    if (!repos || repos.length === 0) return [];
    
    const originals = repos.filter(r => !r.fork);
    
    return [...originals]
      .sort(() => Math.random() - 0.5)
      .slice(0, count);
  }

  /**
   * Datos de respaldo con los enlaces directos de GitHub Pages.
   */
  private loadFallbackRepos(): void {
    this.allRepos = [
      {
        id: 1,
        name: 'icc-ppw-practica-heuristicas-nuevo',
        description: 'Práctica sobre evaluación de heurísticas de usabilidad.',
        html_url: 'https://github.com/NayeliC98/icc-ppw-practica-heuristicas-nuevo',
        homepage: 'https://nayelic98.github.io/icc-ppw-practica-heuristicas-nuevo/',
        fork: false,
        owner: { login: 'NayeliC98', avatar_url: 'https://avatars.githubusercontent.com/NayeliC98' }
      },
      {
        id: 2,
        name: 'icc-ppw-u1-estilos-componentes-nuevo',
        description: 'Desarrollo de componentes y gestión de estilos en Angular.',
        html_url: 'https://github.com/NayeliC98/icc-ppw-u1-estilos-componentes-nuevo',
        homepage: 'https://nayelic98.github.io/icc-ppw-u1-estilos-componentes-nuevo/',
        fork: false,
        owner: { login: 'NayeliC98', avatar_url: 'https://avatars.githubusercontent.com/NayeliC98' }
      },
      {
        id: 3,
        name: 'WC3',
        description: 'Proyecto integrador WC3 desplegado.',
        html_url: 'https://github.com/NayeliC98/WC3',
        homepage: 'https://nayelic98.github.io/WC3/',
        fork: false,
        owner: { login: 'NayeliC98', avatar_url: 'https://avatars.githubusercontent.com/NayeliC98' }
      },
      {
        id: 4,
        name: 'Front-End-Integrador',
        description: 'Interfaz de usuario para el proyecto integrador final.',
        html_url: 'https://github.com/JordyRomeroa/icc-ppw-03-componentes-estilos',
        homepage: 'https://jordyromeroa.github.io/icc-ppw-03-componentes-estilos/',
        fork: false,
        owner: { login: 'JordyRomeroa', avatar_url: 'https://avatars.githubusercontent.com/JordyRomeroa' }
      },
      {
         id: 5,
        name: 'Front-End-Integrador',
        description: 'Interfaz de usuario para el proyecto integrador final.',
        html_url: 'https://github.com/JordyRomeroa/icc-ppw-02-ui-componentes',
        homepage: 'https://jordyromeroa.github.io/icc-ppw-02-ui-componentes/',
        fork: false,
        owner: { login: 'JordyRomeroa', avatar_url: 'https://avatars.githubusercontent.com/JordyRomeroa' }
      },
      {
         id: 6,
        name: 'Front-End-Integrador',
        description: 'Interfaz de usuario para el proyecto integrador final.',
        html_url: 'https://github.com/JordyRomeroa/icc-ppw-u1-AngularPractica',
        homepage: 'https://jordyromeroa.github.io/icc-ppw-u1-AngularPractica/',
        fork: false,
        owner: { login: 'JordyRomeroa', avatar_url: 'https://avatars.githubusercontent.com/JordyRomeroa' }
      }

    ];
  }
}
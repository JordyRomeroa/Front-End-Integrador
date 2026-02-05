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

  // Lista unificada para el grid
  allRepos: Repo[] = [];

  readonly users = ['NayeliC98', 'JordyRomeroa'];

  constructor(
    private githubService: GitHubService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Creamos las peticiones con manejo de errores individual
    const requests = this.users.map(user => 
      this.githubService.getRepos(user).pipe(
        catchError(err => {
          console.warn(`Error cargando repos de ${user}:`, err);
          return of([]); // Si falla uno, devolvemos lista vacía para no romper el forkJoin
        })
      )
    );

    forkJoin(requests).subscribe({
      next: ([nayeliRepos, jordyRepos]) => {
        // Si ambos fallan (listas vacías), cargamos datos de respaldo
        if (nayeliRepos.length === 0 && jordyRepos.length === 0) {
          this.loadFallbackRepos();
        } else {
          const filteredNayeli = this.getRandomRepos(nayeliRepos, 3);
          const filteredJordy = this.getRandomRepos(jordyRepos, 3);
          
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
   * Filtra repositorios que no sean copias (forks) y selecciona N cantidad al azar.
   */
  private getRandomRepos(repos: Repo[], count: number): Repo[] {
    if (!repos || repos.length === 0) return [];
    
    // Filtramos originales usando as any para evitar conflictos de interfaz si no se ha actualizado
    const originals = repos.filter(r => !(r as any).fork);
    
    return [...originals]
      .sort(() => Math.random() - 0.5)
      .slice(0, count);
  }

  /**
   * Datos de emergencia en caso de que la API de GitHub falle (Error 401/403)
   */
  private loadFallbackRepos(): void {
    this.allRepos = [
      {
        id: 1,
        name: 'Sistema de Gestión Académica',
        description: 'Plataforma educativa robusta desarrollada con Spring Boot y Angular.',
        html_url: 'https://github.com/NayeliC98',
        fork: false,
        owner: { login: 'NayeliC98', avatar_url: 'https://avatars.githubusercontent.com/NayeliC98' }
      },
      {
        id: 2,
        name: 'E-commerce Pro',
        description: 'Tienda virtual con integración de pagos y diseño responsivo premium.',
        html_url: 'https://github.com/JordyRomeroa',
        fork: false,
        owner: { login: 'JordyRomeroa', avatar_url: 'https://avatars.githubusercontent.com/JordyRomeroa' }
      },
      {
        id: 3,
        name: 'Dashboard Administrativo',
        description: 'Panel de control con métricas en tiempo real y gestión de usuarios.',
        html_url: 'https://github.com/NayeliC98',
        fork: false,
        owner: { login: 'NayeliC98', avatar_url: 'https://avatars.githubusercontent.com/NayeliC98' }
      }
    ] as Repo[];
  }
}
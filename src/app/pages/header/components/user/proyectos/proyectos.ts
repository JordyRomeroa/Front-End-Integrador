import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProyectoService } from '../../../../../../services/proyecto-service';
import { AuthService } from '../../../../../../services/auth-service';

interface Project {
  name: string;
  description?: string;
  techs?: string[];
  repoLink?: string;
  deployLink?: string;
  category?: string;
  owner: { 
    login: string, 
    avatar_url: string,
    bio?: string
  };
}

@Component({
  selector: 'app-proyectos',
  templateUrl: './proyectos.html',
  styleUrls: ['./proyectos.css'],
  standalone: true,
  imports: [CommonModule],
})
export class Proyectos implements OnInit {
  repos: Project[] = [];
  filteredRepos: Project[] = [];
  selectedCategory: string = '';
  selectedCollaborator: string = '';
  collaborators: string[] = [];
  activeFilter: 'category' | 'collaborator' = 'category';
  
  // Nueva propiedad para las estadísticas llamativas
  stats = {
    totalProjects: 0,
    totalCollaborators: 0,
    totalCategories: 0
  };

  constructor(
    private proyectoService: ProyectoService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.proyectoService.cargarTodosLosProyectos();

    this.proyectoService.todosProyectos$.subscribe(async (proyectos) => {
      const dataPromises = proyectos.map(p => 
        this.authService.getNombreProgramador(p.assignedTo ?? '')
      );
      
      const resGitHub: any[] = await Promise.all(dataPromises);

      this.repos = proyectos.map((p, i) => {
        const info = resGitHub[i];
        const githubUserFromUrl = p.repo?.split('github.com/')[1]?.split('/')[0];
        
        let nombreFinal = 'Colaborador';
        if (info && typeof info === 'object') {
          nombreFinal = info.name || info.login || githubUserFromUrl || p.assignedTo || 'Colaborador';
        } else if (typeof info === 'string' && info.trim() !== '' && info !== 'Sin nombre') {
          nombreFinal = info;
        } else {
          nombreFinal = githubUserFromUrl || p.assignedTo || 'Colaborador';
        }

        const avatarFinal = (info && info.avatar_url) 
          ? info.avatar_url 
          : (githubUserFromUrl 
              ? `https://avatars.githubusercontent.com/${githubUserFromUrl}` 
              : `https://ui-avatars.com/api/?name=${nombreFinal}&background=random`);

        return {
          name: p.nombre || 'Proyecto sin título',
          description: p.descripcion || 'Este proyecto es una muestra del talento de nuestro equipo.',
          techs: p.tecnologias || [],
          repoLink: p.repo,
          deployLink: p.deploy,
          category: p.categoria || 'Laboral',
          owner: {
            login: nombreFinal,
            avatar_url: avatarFinal,
            bio: (info && info.bio) ? info.bio : ''
          }
        };
      });

      // Cálculo de estadísticas
      this.collaborators = Array.from(new Set(this.repos.map(r => r.owner.login))).sort();
      this.stats.totalProjects = this.repos.length;
      this.stats.totalCollaborators = this.collaborators.length;
      this.stats.totalCategories = new Set(this.repos.map(r => r.category)).size;
      
      this.applyFilters();
      this.cdr.detectChanges();
    });
  }

  getCategories(projects: Project[]): string[] {
    return Array.from(new Set(projects.map(p => p.category || 'Laboral').filter(cat => cat !== 'Personal'))).sort();
  }

  setActiveFilter(filter: 'category' | 'collaborator') {
    this.activeFilter = filter;
    this.selectedCategory = '';
    this.selectedCollaborator = '';
    this.applyFilters();
  }

  filterByCategory(cat: string) { this.selectedCategory = cat; this.applyFilters(); }
  filterByCollaborator(user: string) { this.selectedCollaborator = user; this.applyFilters(); }
  showAllCategories() { this.selectedCategory = ''; this.applyFilters(); }
  showAllCollaborators() { this.selectedCollaborator = ''; this.applyFilters(); }

  private applyFilters() {
    this.filteredRepos = this.repos.filter(p => {
      const matchCategory = this.selectedCategory ? p.category === this.selectedCategory : true;
      const matchCollaborator = this.selectedCollaborator ? p.owner.login === this.selectedCollaborator : true;
      return matchCategory && matchCollaborator;
    });
    this.cdr.detectChanges();
  }
}
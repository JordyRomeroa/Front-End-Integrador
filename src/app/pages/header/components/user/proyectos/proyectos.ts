import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProyectoService } from '../../../../../../services/proyecto-service';
import { AuthService } from '../../../../../../services/auth-service';

interface Collaborator {
  login: string; // Nombre del programador
  avatar_url: string; // URL del avatar
}

interface Project {
  name: string;
  description?: string;
  role?: string;
  techs?: string[];
  repoLink?: string;
  deployLink?: string;
  category?: string;
  owner: { login: string, avatar_url: string };
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

  constructor(
    private proyectoService: ProyectoService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {


    this.proyectoService.cargarTodosLosProyectos();


    this.proyectoService.todosProyectos$.subscribe(async (proyectos) => {

  // Mapear todas las promesas de nombres
  const nombresPromises = proyectos.map(p => this.authService.getNombreProgramador(p.assignedTo));

  // Esperar todos los nombres al mismo tiempo
  const nombres = await Promise.all(nombresPromises);

  // Construir los proyectos actualizados
  const updatedRepos: Project[] = proyectos.map((p, i) => ({
    name: p.nombre,
    description: p.descripcion,
    role: 'Programador',
    techs: p.tecnologias || [],
    repoLink: p.repo,
    deployLink: p.deploy,
    category: p.categoria || 'Laboral',
    owner: {
      login: nombres[i],
      avatar_url:
        'https://avatars.githubusercontent.com/' +
          p.repo?.split('github.com/')[1]?.split('/')[0] ||
        'https://via.placeholder.com/40'
    }
  }));

  this.repos = updatedRepos;

  // Colaboradores únicos
  this.collaborators = Array.from(new Set(this.repos.map(r => r.owner.login))).sort();

  this.applyFilters();
  this.cdr.detectChanges();
});

  }



  getCategories(projects: Project[]): string[] {
  return Array.from(
    new Set(
      projects
        .map(p => p.category || 'Laboral')
        .filter(cat => cat !== 'Personal') // <-- Excluir "Personal"
    )
  ).sort();
}


  setActiveFilter(filter: 'category' | 'collaborator') {
    this.activeFilter = filter;
    this.selectedCategory = '';
    this.selectedCollaborator = '';
    this.applyFilters();
  }

  filterByCategory(cat: string) {
    this.selectedCategory = cat;
    this.applyFilters();
  }

  filterByCollaborator(user: string) {
    this.selectedCollaborator = user;
    this.applyFilters();
  }

  showAllCategories() {
    this.selectedCategory = '';
    this.applyFilters();
  }

  showAllCollaborators() {
    this.selectedCollaborator = '';
    this.applyFilters();
  }

  private applyFilters() {
    this.filteredRepos = this.repos.filter(p => {
      const matchCategory = this.selectedCategory ? p.category === this.selectedCategory : true;
      const matchCollaborator = this.selectedCollaborator ? p.owner.login === this.selectedCollaborator : true;
      return matchCategory && matchCollaborator;
    });

    this.cdr.detectChanges();
  }
}

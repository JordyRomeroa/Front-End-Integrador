import { ChangeDetectorRef, Component, OnInit } from '@angular/core'; 
import { filter, forkJoin } from 'rxjs';
import { CommonModule } from '@angular/common';
import { GitHubService, Repo } from '../../../../../../services/github-service';
import { NavigationEnd, Router } from '@angular/router';

interface Project extends Repo {
  role?: string;           
  techs?: string[];        
  repoLink?: string;       
  deployLink?: string;     
  category?: string;       
}

@Component({
  selector: 'app-proyectos',
  templateUrl: './proyectos.html',
  styleUrls: ['./proyectos.css'],
  standalone: true,
  imports: [CommonModule],
})
export class Proyectos implements OnInit {
  collaborators: string[] = [];
  repos: Project[] = [];
  filteredRepos: Project[] = [];
  selectedUser: string = '';

  constructor(
    private githubService: GitHubService, 
    private router: Router,
    private cdr: ChangeDetectorRef // <-- inyectamos ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadRepos();

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      if (this.repos.length > 0) {
        this.resetProjects();
      }
    });
  }

  private loadRepos() {
    const initialUsers = ['NayeliC98', 'JordyRomeroa'];
    const requests = initialUsers.map(user => this.githubService.getRepos(user));

    forkJoin(requests).subscribe({
      next: results => {
        this.repos = results.flat().map(repo => ({
          ...repo,
          role: 'Frontend',
          techs: ['Angular', 'Tailwind'],
          repoLink: repo.html_url,
          deployLink: '',
          category: Math.random() > 0.5 ? 'Académico' : 'Laboral'
        }));

        const uniqueUsers = new Set(this.repos.map(r => r.owner.login));
        this.collaborators = Array.from(uniqueUsers);

        // Seleccionamos automáticamente el primer usuario
        if (this.collaborators.length > 0) {
          this.selectUser(this.collaborators[0]);
        } else {
          this.resetProjects();
        }

        // Forzar actualización del template
        this.cdr.detectChanges();
      },
      error: err => console.error('Error cargando repos:', err)
    });
  }

  selectUser(user: string) {
    this.selectedUser = user;
    this.filteredRepos = this.repos.filter(
      repo => repo.owner.login.toLowerCase() === user.toLowerCase()
    );
    this.cdr.detectChanges(); // <-- aseguramos que Angular renderice de inmediato
  }

  showAll() {
    this.resetProjects();
  }

  private resetProjects() {
    this.selectedUser = '';
    this.filteredRepos = [...this.repos];
    this.cdr.detectChanges();
  }
}

import { ChangeDetectionStrategy, Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { forkJoin } from 'rxjs';
import { GitHubService, Repo } from '../../../../../services/github-service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterModule, RouterOutlet } from '@angular/router';
import { Team } from '../admin/team/team';
import { AboutUs } from "../admin/AboutUs/AboutUs";

@Component({
  selector: 'app-inicio-component',
  templateUrl: './InicioComponent.html',
  styleUrls: ['./InicioComponent.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, Team, AboutUs],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InicioComponent implements OnInit {
  myRepos: Repo[] = [];
  partnerRepos: Repo[] = [];

  users: string[] = ['NayeliC98', 'JordyRomeroa'];

  constructor(private githubService: GitHubService, private cd: ChangeDetectorRef) {}

  ngOnInit(): void {
    const requests = this.users.map(user => this.githubService.getRepos(user));

    forkJoin(requests).subscribe({
      next: (results) => {
        this.myRepos = this.getRandomRepos(results[0], 2);
        this.partnerRepos = this.getRandomRepos(results[1], 2);

        // Fuerza la actualización de la vista porque usamos OnPush
        this.cd.markForCheck();
      },
      error: (err) => console.error('Error cargando repos:', err)
    });
  }

  private getRandomRepos(repos: Repo[], n: number): Repo[] {
    if (!repos || repos.length === 0) return [];
    const shuffled = [...repos].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, n);
  }
}

import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { forkJoin } from 'rxjs';
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

  myRepos: Repo[] = [];
  partnerRepos: Repo[] = [];

  readonly users = ['NayeliC98', 'JordyRomeroa'];

  constructor(
    private githubService: GitHubService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const requests = this.users.map(user => this.githubService.getRepos(user));

    forkJoin(requests).subscribe({
      next: ([firstUserRepos, secondUserRepos]) => {
        this.myRepos = this.getRandomRepos(firstUserRepos, 3);
        this.partnerRepos = this.getRandomRepos(secondUserRepos, 3);
        this.cd.markForCheck();
      },
      error: () => console.error(' Error al cargar los repositorios.')
    });
  }

  private getRandomRepos(repos: Repo[], count: number): Repo[] {
    if (!repos?.length) return [];
    return [...repos]
      .sort(() => Math.random() - 0.5)
      .slice(0, count);
  }
}

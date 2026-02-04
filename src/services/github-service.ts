import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// github-service.ts
export interface Repo {
  id: number;           // <--- Faltaba para el track por ID
  name: string;
  html_url: string;
  description: string;  // <--- Añadido para la descripción
  fork: boolean;        // <--- Añadido para el filtrado
  owner: {
    login: string;
    avatar_url: string;
  };
}

export interface GitHubUser {
  login: string;
  avatar_url: string;
}

@Injectable({ providedIn: 'root' })
export class GitHubService {
  constructor(private http: HttpClient) {}

  getRepos(username: string): Observable<Repo[]> {
    return this.http.get<Repo[]>(`https://api.github.com/users/${username}/repos`);
  }

  getUser(username: string): Observable<GitHubUser> {
    return this.http.get<GitHubUser>(`https://api.github.com/users/${username}`);
  }

}
export interface RepoOwner {
  login: string;
  avatar_url: string;
}

export interface Repo {
  name: string;
  description: string;
  html_url: string;
  owner: RepoOwner; // <-- agregamos esto
}

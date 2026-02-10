import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
export interface Repo {
  id: number;
  name: string;
  html_url: string;
  description: string;
  fork: boolean;
  language?: string; 
  owner: {
    login: string;
    avatar_url: string;
  };
}
export interface GitHubUser {
  login: string;
  avatar_url: string;
  bio?: string;
}

@Injectable({ providedIn: 'root' })
export class GitHubService {
  private http = inject(HttpClient);

  getRepos(username: string): Observable<Repo[]> {
    // Si usas token, descomenta las siguientes 3 líneas:
    // const headers = new HttpHeaders({ 'Authorization': `token ${this.GITHUB_TOKEN}` });
    // return this.http.get<Repo[]>(`https://api.github.com/users/${username}/repos`, { headers });
    
    return this.http.get<Repo[]>(`https://api.github.com/users/${username}/repos`);
  }

  getUser(username: string): Observable<GitHubUser> {
    return this.http.get<GitHubUser>(`https://api.github.com/users/${username}`);
  }
}
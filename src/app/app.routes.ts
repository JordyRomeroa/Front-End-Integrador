import { Routes } from '@angular/router';
import { AdminGuard } from '../services/programmer-service';
import { ProgrammerGuard } from '../services/admin-service';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then(m => m.Login)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register').then(m => m.RegisterPage)
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/header/home').then(m => m.Home)
  },
   { path: 'admin', loadComponent: () => import('./pages/admin/admin').then(m => m.Admin), canActivate: [AdminGuard] },
  { path: 'programmer', loadComponent: () => import('./pages/programmer/programmer').then(m => m.Programmer), canActivate: [ProgrammerGuard] },
];


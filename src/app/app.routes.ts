import { Routes } from '@angular/router';
import { AdminGuard } from '../services/programmer-service';
import { ProgrammerGuard } from '../services/admin-service';
import { RegisterPage } from './pages/header/components/register-user/register';

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
    path: 'register-programmer',
    loadComponent: () => import('./pages/header/components/register-programmer/register').then(m => m.Register)
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/header/home').then(m => m.Home)
  },
  {
    path: 'register' , loadComponent: () => import('./pages/header/components/register-user/register').then(m => m.RegisterPage)
},
   { path: 'admin', loadComponent: () => import('./pages/header/components/admin/admin').then(m => m.Admin), canActivate: [AdminGuard] },
  { path: 'programmer', loadComponent: () => import('./pages/header/components/programmer/programmer').then(m => m.Programmer), canActivate: [ProgrammerGuard] },
];


import { Routes } from '@angular/router';
import { AdminGuard } from './core/admin-guard';
import { ProgrammerGuard } from './core/programmer-guard';


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
path:'register',
loadComponent:() => import('./pages/header/components/register-user/register').then(m => m.RegisterPage)
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/header/home').then(m => m.Home),
    children: [
      { path: '', redirectTo: 'inicio', pathMatch: 'full' },
      { 
        path: 'inicio', 
        loadComponent: () => import('./pages/header/components/InicioComponent/InicioComponent').then(m => m.InicioComponent) 
      },
      { 
        path: 'proyectos',
        loadComponent: () => import('./pages/header/components/user/proyectos/proyectos').then(m => m.Proyectos)
      },
      { 
        path: 'admin',
        loadComponent: () => import('./pages/header/components/admin/admin').then(m => m.Admin),
        canActivate: [AdminGuard],
        children: [
          { 
            path: 'register-programmer', 
            canActivate: [AdminGuard], 
            loadComponent: () => import('./pages/header/components/admin/register-programmer/register').then(m => m.RegisterProgrammer)
          }
        ]
      },
      { 
        path: 'programmer', 
        loadComponent: () => import('./pages/header/components/programmer/programmer').then(m => m.Programmer), 
        canActivate: [ProgrammerGuard] ,
        children: [
          { 
            path: 'management', 
            loadComponent: () => import('./pages/header/components/programmer/management/management').then(m => m.Management)
          }
        ]
      },
      { 
        path: 'user', 
        loadComponent: () => import('./pages/header/components/user/user').then(m => m.User) 
      },
    ]
  }
];

import { Routes } from '@angular/router';
import { AdminGuard } from '../services/admin-service';
import { ProgrammerGuard } from '../services/programmer-service';


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
        loadComponent: () => import('./pages/header/components/programmer/proyectos/proyectos').then(m => m.Proyectos)
      },
      { 
        path: 'admin',
        loadComponent: () => import('./pages/header/components/admin/admin').then(m => m.Admin),
        canActivate: [AdminGuard],
        children: [
          { 
            path: 'register-programmer', 
            loadComponent: () => import('./pages/header/components/admin/register-programmer/register').then(m => m.RegisterProgrammer)
          }
        ]
      },
      { 
        path: 'programmer', 
        loadComponent: () => import('./pages/header/components/programmer/programmer').then(m => m.Programmer), 
        canActivate: [ProgrammerGuard] 
      },
      { 
        path: 'user', 
        loadComponent: () => import('./pages/header/components/user/user').then(m => m.User) 
      },
    ]
  }
];

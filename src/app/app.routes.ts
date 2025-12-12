import { AdminGuard } from './core/admin-guard';
import { ProgrammerGuard } from './core/programmer-guard';
import { MustChangePasswordGuard } from './core/MustChangePasswordGuard';
import { Routes } from '@angular/router';
import { User } from './pages/header/components/user/user';
import { EquipoComponent } from './pages/header/components/InicioComponent/equipo/equipo.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home/inicio',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then(m => m.Login)
  },
  {
    path: 'must-change-password',
    loadComponent: () => import('./pages/login/mustChangePassword/mustChangePassword').then(m => m.MustChangePassword),
    canActivate: [MustChangePasswordGuard]
  },

  {
    path: 'register',
    loadComponent: () => import('./pages/header/components/register-user/register').then(m => m.RegisterPage)
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
        path: 'about-us',
        loadComponent: () => import('./pages/header/components/admin/AboutUs/AboutUs').then(m => m.AboutUs)
      },
      {
        path: 'proyectos',
        loadComponent: () => import('./pages/header/components/user/proyectos/proyectos').then(m => m.Proyectos)
      },
        //prueba
{ path: 'equipo', component: EquipoComponent },
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
        canActivate: [ProgrammerGuard],
        loadComponent: () => import('./pages/header/components/programmer/programmer').then(m => m.Programmer),
        children: [
          { path: '', redirectTo: 'advice', pathMatch: 'full' },

    {
            path: 'management',

            loadComponent: () => import('./pages/header/components/programmer/management/management').then(m => m.Management)
          },
          {
            path: 'editprofile',

            loadComponent: () => import('./pages/header/components/programmer/editprofile/editprofile').then(m => m.EditProfileProgrammerComponent)
          },
        {
          path: 'advice',        // ← nueva ruta para solicitudes
      loadComponent: () => import('./pages/header/components/programmer/advice/advice').then(m => m.Advice)
        },
          {
            path: 'schedules',

            loadComponent: () => import('./pages/header/components/programmer/schedules/schedules').then(m => m.Schedules)
          }
        ]
      }
    ]
  }

];

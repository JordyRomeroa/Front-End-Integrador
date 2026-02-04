import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { catchError, from, of, take } from 'rxjs';

import { FormUtils } from '../../shared/form-utils';
import { AuthService } from '../../../services/auth-service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  showPassword = false;
  mostrarNuevoPassword = signal(false);
  loginForm: FormGroup;
  errorVisible = signal<string | null>(null);

  private loginTrigger = signal<{ email: string; password: string } | null>(null);

  loginResource = rxResource({
    params: () => this.loginTrigger(),
    stream: ({ params }) => {
      if (!params) return of(null);
      return from(this.authService.login(params.email, params.password)).pipe(
        catchError(err => {
          console.error('Login fallido:', err);
          return of({ error: err }); 
        })
      );
    }
  });

  formUtils = FormUtils;

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: [''] 
    });

    effect(() => {
      const result: any = this.loginResource.value();
      if (!result) return;

      if (result.error) {
        const errorData = result.error;
        this.errorVisible.set(this.getFriendlyError(errorData));
        this.loginForm.get('password')?.reset();
        this.loginForm.get('password')?.valueChanges.pipe(take(1)).subscribe(() => {
          this.errorVisible.set(null);
        });
        return;
      }

      // GUARDAR EN STORAGE: Guardamos el objeto completo (que incluye el token)
      localStorage.setItem('user', JSON.stringify(result));
      
      // También guardamos 'auth_token' por separado para facilitar la lectura en los servicios
      if (result.token) {
        localStorage.setItem('auth_token', result.token);
      }

      this.errorVisible.set(null);

      if (result.mustChangePassword) {
        this.router.navigate(['/must-change-password']);
      } else {
        this.router.navigate(['/home']);
      }
    });
  }

  private getFriendlyError(error: any): string {
    const code = error.code || error.error?.code || error.status || '';
    const errorMessages: { [key: string]: string } = {
      'auth/invalid-email': 'El correo electrónico no es válido.',
      'auth/user-not-found': 'No existe una cuenta con este correo.',
      'auth/wrong-password': 'La contraseña es incorrecta.',
      'auth/invalid-credential': 'Credenciales incorrectas. Verifica tus datos.',
      '401': 'Usuario o contraseña no válidos.'
    };
    return errorMessages[code] || 'Credenciales inválidas. Inténtalo de nuevo.';
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.errorVisible.set(null);
    const { email, password } = this.loginForm.value;
    this.loginTrigger.set({ 
      email: email.trim(), 
      password: password.trim() 
    });
  }

  async loginWithGoogle() {
    try {
      const result = await this.authService.loginWithGoogle();
      localStorage.setItem('user', JSON.stringify(result));
      
      if (result.token) {
        localStorage.setItem('auth_token', result.token);
      }

      if (result.mustChangePassword) {
        this.router.navigate(['/must-change-password']);
      } else {
        this.router.navigate(['/home']);
      }
    } catch (error: any) {
      console.error("Error en Google Login:", error);
      this.errorVisible.set('No se pudo conectar con Google.');
    }
  }

  loading = this.loginResource.isLoading;

  errorMessage = () => {
    const error = this.loginResource.error();
    if (!error) return '';
    return 'Error al iniciar sesión';
  }

  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }
}
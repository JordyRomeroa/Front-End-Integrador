import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';

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

  loginForm: FormGroup;

  // Signal para disparar el login
  private loginTrigger = signal<{ email: string; password: string } | null>(null);

  // rxResource para manejar el proceso de login (Angular 20+)
  loginResource = rxResource({
    params: () => this.loginTrigger(),
    stream: ({ params }) => {
      if (!params) return of(null);
      return this.authService.login(params.email, params.password);
    }
  });

  formUtils = FormUtils;

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    // Effect para navegar cuando el login sea exitoso
    effect(() => {
      if (this.loginResource.hasValue() && this.loginResource.value()) {
        console.log('Login exitoso');
        this.router.navigate(['/home']);
      }
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.loginForm.value;

    // Disparar el login actualizando el signal
    this.loginTrigger.set({ email, password });
  }
async loginWithGoogle() {
  try {
    const user = await this.authService.loginWithGoogle();
    console.log("Google login OK:", user);
    this.router.navigate(['/home']);
  } catch (error) {
    console.error(error);
    alert("Error con Google: " + (error as any).message);
  }
}

  // Computed signal para el estado de carga
  loading = this.loginResource.isLoading;

  // Computed signal para el mensaje de error
  errorMessage = () => {
    const error = this.loginResource.error();
    if (!error) return '';

    const code = (error as any).code || '';
    const errorMessages: { [key: string]: string } = {
      'auth/invalid-email': 'El correo electrónico no es válido',
      'auth/user-disabled': 'El usuario ha sido deshabilitado',
      'auth/user-not-found': 'No existe un usuario con este correo',
      'auth/wrong-password': 'Contraseña incorrecta',
      'auth/invalid-credential': 'Credenciales inválidas'
    };
    return errorMessages[code] || 'Error al iniciar sesión';
  }

  // Getters para validación en el template
  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }
}

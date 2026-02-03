import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { catchError, from, of, take } from 'rxjs'; // Añadido take

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

  // Señal para el error visual amigable (reemplaza al alert)
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
      const result = this.loginResource.value();
      if (!result) return;

      // 1. Manejo de Errores SIN ALERT
      if ((result as any).error) {
        const errorData = (result as any).error;
        console.log('❌ Error de login:', errorData);
        
        // Seteamos el mensaje amigable
        this.errorVisible.set(this.getFriendlyError(errorData));
        
        // Reseteamos el campo password para que lo reintente limpiamente
        this.loginForm.get('password')?.reset();

        // Limpia el mensaje de error automáticamente cuando el usuario empiece a escribir de nuevo
        this.loginForm.get('password')?.valueChanges.pipe(take(1)).subscribe(() => {
          this.errorVisible.set(null);
        });
        return;
      }

      // 2. GUARDAR EN STORAGE
      localStorage.setItem('user', JSON.stringify(result));
      this.errorVisible.set(null);

      // 3. Redirección lógica
      if (result.mustChangePassword) {
        this.router.navigate(['/must-change-password']);
      } else {
        this.router.navigate(['/home']);
      }
    });
  }

  // Traductor de errores técnicos a mensajes profesionales
  private getFriendlyError(error: any): string {
    // Si el error viene del backend o de Firebase, mapeamos el código
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
    this.errorVisible.set(null); // Limpiar error previo al intentar
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
    // Mantenemos este método por si lo usas en otros inputs, 
    // pero el error principal ahora lo maneja errorVisible()
    const error = this.loginResource.error();
    if (!error) return '';
    return 'Error al iniciar sesión';
  }

  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }
}
import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { FormUtils } from '../../../../shared/form-utils';
import { AuthService } from '../../../../../services/auth-service';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class RegisterPage {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  registerForm: FormGroup;
  formUtils = FormUtils;
  errorVisible = signal<string | null>(null);

  private registerTrigger = signal<{ email: string; password: string } | null>(null);

  registerResource = rxResource({
    params: () => this.registerTrigger(),
    stream: ({ params }) => {
      if (!params) return of(null);
      return this.authService.register(params.email, params.password);
    }
  });

  constructor() {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required, 
        Validators.minLength(6),
        // Regex para: Al menos una Mayúscula, una Minúscula y un Número
        Validators.pattern(/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z]).*$/)
      ]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });

    effect(() => {
      if (this.registerResource.isLoading()) return;

      const result = this.registerResource.value();
      if (result) {
        console.log('✅ Registro exitoso, navegando...');
        this.router.navigate(['/home']);
        return;
      }

      const error = this.registerResource.error() as any;
      if (error) {
        console.log('❌ Error capturado:', error);
        
        let msg = 'Ocurrió un error al registrarte.';
        if (error.status === 400) {
          // Si el error es 400, casi siempre es por la política de contraseñas del backend
          msg = 'La contraseña no cumple con los requisitos (Mayúscula, minúscula y número).';
        }
        if (error.status === 409) msg = 'Este correo ya está en uso.';
        if (error.status === 0) msg = 'No hay conexión con el servidor.';

        this.errorVisible.set(msg);
        
        // Limpiamos contraseñas para reintentar
        this.registerForm.get('password')?.reset();
        this.registerForm.get('confirmPassword')?.reset();
      }
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    this.errorVisible.set(null);
    const { email, password } = this.registerForm.value;
    this.registerTrigger.set({ email: email.trim(), password: password.trim() });
  }

  loading = this.registerResource.isLoading;

  // Helpers para el HTML
  get email() { return this.registerForm.get('email'); }
  get password() { return this.registerForm.get('password'); }
  get confirmPassword() { return this.registerForm.get('confirmPassword'); }
}
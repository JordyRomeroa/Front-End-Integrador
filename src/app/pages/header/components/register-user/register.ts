import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { from, of } from 'rxjs';
import { FormUtils } from '../../../../shared/form-utils';
import { ProgramadorService } from '../../../../../services/programmer-service';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class RegisterPage {
  private fb = inject(FormBuilder);
  private programadorService = inject(ProgramadorService); // Inyectamos el servicio del Backend
  private router = inject(Router);

  registerForm: FormGroup;
  formUtils = FormUtils;

  // Signal para disparar el registro (mantenemos tu lógica)
  private registerTrigger = signal<{ email: string; password: string } | null>(null);

  // rxResource adaptado para llamar a Java/Neon
  registerResource = rxResource({
    params: () => this.registerTrigger(),
  stream: ({ params }) => {
    if (!params) return of(null);
    
    const dto = {
      contacto: params.email,
      password: params.password,
      nombre: 'Nuevo Usuario',
      especialidad: 'Programador'
    };

    // 💡 Convertimos la Promise del servicio a un Observable usando from()
    return from(this.programadorService.registrarProgramador(dto as any));
  
    }
  });

  constructor() {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });

    // Mantenemos tu efecto de navegación
    effect(() => {
      if (this.registerResource.hasValue() && this.registerResource.value()) {
        console.log('Registro exitoso en Backend, navegando a /home');
        this.router.navigate(['/home']);
      }
    });

    // Debug opcional (puedes comentar authService si ya no lo usas)
    effect(() => {
      console.log('Estado del registro:', this.registerResource.value());
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
    const { email, password } = this.registerForm.value;
    // Disparar el registro actualizando el signal (Tal cual lo tenías)
    this.registerTrigger.set({ email, password });
  }

  loading = this.registerResource.isLoading;

  // Actualizamos los mensajes de error para que vengan del Backend
  errorMessage = () => {
    const error = this.registerResource.error();
    if (!error) return '';

    // Manejamos errores HTTP en lugar de códigos de Firebase
    const status = (error as any).status;
    if (status === 409 || status === 400) {
      return 'Este correo ya está registrado en el sistema';
    }
    
    return 'Error al conectar con el servidor de registro';
  }

  get email() { return this.registerForm.get('email'); }
  get password() { return this.registerForm.get('password'); }
  get confirmPassword() { return this.registerForm.get('confirmPassword'); }
}
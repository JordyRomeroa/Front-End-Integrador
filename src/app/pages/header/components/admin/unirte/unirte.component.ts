import { Component, inject, signal, effect } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../../../services/auth-service';



class FirestoreService {
  private coleccion = 'solicitudes_programadores';

  async agregarDocumento(data: any): Promise<void> {
    console.log(`[Firestore] Agregando documento a la colección ${this.coleccion}:`, data);
    await new Promise(resolve => setTimeout(resolve, 1500));
    if (Math.random() < 0.1) {
      throw new Error("Fallo simulado de conexión a Firestore.");
    }
    console.log("[Firestore] Documento agregado con ID simulado: XXX");
  }
}

@Component({
  selector: 'app-unirte',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './unirte.component.html',
  styleUrl: './unirte.component.css',
})
export class UnirteComponent {

  private fb = inject(FormBuilder);
  private firestoreService = new FirestoreService();
  public authService = inject(AuthService);

  solicitudForm: FormGroup;
  isSubmitting = signal(false);
  submitSuccess = signal(false);
  submitError = signal(false);


  canPostulate = signal(false);

  constructor() {
    this.solicitudForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      especialidad: ['', [Validators.required]],
      portafolio: ['', [Validators.required, Validators.pattern(/https?:\/\/.+/)]],
      descripcion: ['', [Validators.required, Validators.minLength(20)]],
    });


    effect(() => {
        this.checkUserRole();
    });


    this.checkUserRole();
  }

  checkUserRole() {

      const role = this.authService.getUserRole();


      if (role === 'user') {
          this.canPostulate.set(true);
      } else {

          this.canPostulate.set(false);
      }
      console.log(`Rol: ${role}. ¿Puede postularse?: ${this.canPostulate()}`);
  }


  async enviarSolicitud() {


    if (!this.canPostulate()) {
        alert('Acceso denegado: Solo usuarios con rol "User" pueden enviar esta solicitud.');
        return;
    }

    this.solicitudForm.markAllAsTouched();

    if (this.solicitudForm.invalid) {
      console.warn('Formulario inválido. No se puede enviar.');
      return;
    }

    this.isSubmitting.set(true);
    this.submitSuccess.set(false);
    this.submitError.set(false);

    try {
      const data = {
        ...this.solicitudForm.value,
        fechaSolicitud: new Date().toISOString(),
        estado: 'Pendiente'
      };

      await this.firestoreService.agregarDocumento(data);

      this.submitSuccess.set(true);
      this.solicitudForm.reset({ especialidad: '' });

    } catch (error) {
      console.error('Error al enviar la solicitud a Firestore:', error);
      this.submitError.set(true);

    } finally {
      this.isSubmitting.set(false);
      setTimeout(() => {
        this.submitSuccess.set(false);
        this.submitError.set(false);
      }, 7000);
    }
  }
}

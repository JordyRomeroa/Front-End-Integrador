import { Component, inject, signal, effect } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../../../services/auth-service';

// 1. ⬇️ NUEVAS IMPORTACIONES DE ANGULARFIRE (Necesarias para la conexión real) ⬇️
import { Firestore, collection, addDoc } from '@angular/fire/firestore';

// 2. ❌ ELIMINAMOS O REEMPLAZAMOS LA CLASE SIMULADA ❌
// Ya no necesitamos esta clase porque inyectaremos Firestore directamente en el componente.
// Si la quitas, el código es más limpio:

/*
class FirestoreService {
    // ... (Se elimina la clase simulada)
}
*/

@Component({
  selector: 'app-unirte',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './unirte.component.html',
  styleUrl: './unirte.component.css',
})
export class UnirteComponent {

  private fb = inject(FormBuilder);

  // 3. ⬇️ INYECTAMOS EL SERVICIO DE FIREBASE/FIRESTORE OFICIAL ⬇️
  private firestore: Firestore = inject(Firestore);

  public authService = inject(AuthService);

  solicitudForm: FormGroup;
  isSubmitting = signal(false);
  submitSuccess = signal(false);
  submitError = signal(false);

  canPostulate = signal(false);

  // ... (Constructor y checkUserRole son iguales) ...

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

  // 4. ⬇️ LÓGICA REAL DE FIRESTORE EN EL MÉTODO ⬇️
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

      // 🎯 CONEXIÓN Y GUARDADO DIRECTO EN FIRESTORE
      const coleccionRef = collection(this.firestore, 'notificaciones');
      await addDoc(coleccionRef, data);

      console.log('✅ Documento guardado exitosamente en la colección "notificaciones".');
      // 🎯 FIN CONEXIÓN FIRESTORE

      this.submitSuccess.set(true);
      this.solicitudForm.reset({ especialidad: '' });

    } catch (error) {
      // Ahora se capturarán errores reales de Firebase (permisos, red, etc.)
      console.error('Error REAL al enviar la solicitud a Firestore:', error);
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

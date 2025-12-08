import { CommonModule } from '@angular/common';
import { Component,EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth, setPersistence, createUserWithEmailAndPassword, getAuth, inMemoryPersistence } from 'firebase/auth';
import { ProgramadorData, ProgramadorService } from '../../../../../../services/programmer-service';
import { AuthService } from '../../../../../../services/auth-service';
import { getSecondaryApp } from '../../../../../../services/firebase-secondary';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class RegisterProgrammer {
 @Output() cerrar = new EventEmitter<void>();
  nombre = '';
  especialidad = '';
  descripcion = '';
  contacto = '';
  password = '';
  redes: string[] = [''];
  foto: File | null = null;

  constructor(
    private router: Router,
    private programadorService: ProgramadorService,
    private authService: AuthService
  ) {}

  private async createTemporaryAuth(): Promise<Auth> {
    const secondaryApp = getSecondaryApp();
    const auth2 = getAuth(secondaryApp);
    await setPersistence(auth2, inMemoryPersistence);
    return auth2;
  }

  /** Registrar programador */
  async registrarProgramador() {

    const adminUser = this.authService.currentUser();
    if (!adminUser) {
      alert("Debes iniciar sesión como administrador.");
      return;
    }

    if (!this.nombre || !this.especialidad || !this.contacto || !this.password) {
      alert("Completa todos los campos obligatorios");
      return;
    }

    try {
      const auth2 = await this.createTemporaryAuth();

      // Crear CUENTA del programador sin afectar al admin
      const cred = await createUserWithEmailAndPassword(auth2, this.contacto, this.password);
      const uid = cred.user.uid;

      // Guardar datos del programador
      const nuevoProgramador: ProgramadorData = {
        nombre: this.nombre,
        especialidad: this.especialidad,
        descripcion: this.descripcion,
        contacto: this.contacto,
        redes: this.redes,
      };

      // Registrar y refrescar la tabla automáticamente
      await this.programadorService.registrarProgramador(nuevoProgramador, adminUser, uid);

      // Cerrar sesión del usuario recién creado
      await auth2.signOut();

      alert("Programador registrado correctamente");

      // Reset formulario
      this.nombre = '';
      this.especialidad = '';
      this.descripcion = '';
      this.contacto = '';
      this.password = '';
      this.redes = [''];
      this.foto = null;

      // No es necesario navegar, la tabla se actualizará automáticamente
      // Si quieres cerrar el registro, puedes usar un modal o ocultar el formulario

    } catch (error: any) {
      console.error(error);
      alert("Error registrando programador: " + error.message);
    }
  }
cancelar() {
    this.cerrar.emit(); // <-- emitimos el evento al padre
  }

  agregarRed() { this.redes.push(''); }
  eliminarRed(i: number) { this.redes.splice(i, 1); }

  onFotoSeleccionada(event: any) {
    this.foto = event.target.files[0] ?? null;
  }
}

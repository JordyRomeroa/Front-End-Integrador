import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, Input, OnChanges, SimpleChanges } from '@angular/core';
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
export class RegisterProgrammer implements OnChanges {
  @Output() cerrar = new EventEmitter<void>();
  @Input() programmer: ProgramadorData | null = null; // Programador a editar

  // Campos del formulario
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

  ngOnChanges(changes: SimpleChanges) {
    if (changes['programmer'] && this.programmer) {
      // Llenar formulario con datos del programador
      this.nombre = this.programmer.nombre || '';
      this.especialidad = this.programmer.especialidad || '';
      this.descripcion = this.programmer.descripcion || '';
      this.contacto = this.programmer.contacto || '';
      this.redes = this.programmer.redes?.length ? [...this.programmer.redes] : [''];
      this.foto = null; // Foto no se rellena automáticamente
      this.password = ''; // No mostrar password existente
    } else if (!this.programmer) {
      // Nuevo registro, reset campos
      this.resetFormulario();
    }
  }

  private async createTemporaryAuth(): Promise<Auth> {
    const secondaryApp = getSecondaryApp();
    const auth2 = getAuth(secondaryApp);
    await setPersistence(auth2, inMemoryPersistence);
    return auth2;
  }

  /** Crear o actualizar programador */
  async registrarProgramador() {
    const adminUser = this.authService.currentUser();
    if (!adminUser) {
      alert("Debes iniciar sesión como administrador.");
      return;
    }

    if (!this.nombre || !this.especialidad || !this.contacto || (!this.programmer && !this.password)) {
      alert("Completa todos los campos obligatorios");
      return;
    }

    try {
      let uid = this.programmer?.uid;

      // Si es nuevo programador, crear usuario en Auth
      if (!uid) {
        const auth2 = await this.createTemporaryAuth();
        const cred = await createUserWithEmailAndPassword(auth2, this.contacto, this.password);
        uid = cred.user.uid;
        await auth2.signOut();
      }

      // Guardar o actualizar datos en Firestore
      const nuevoProgramador: ProgramadorData = {
        uid,
        nombre: this.nombre,
        especialidad: this.especialidad,
        descripcion: this.descripcion,
        contacto: this.contacto,
        redes: this.redes,
        foto: this.programmer?.foto // Mantener foto existente si no hay nueva
      };

      // Si se seleccionó nueva foto, actualizarla
      if (this.foto) {
        // Aquí podrías subir la foto a Firebase Storage y obtener URL
        // nuevoProgramador.foto = urlSubida;
      }

      await this.programadorService.registrarProgramador(nuevoProgramador, adminUser, uid);

      alert(this.programmer ? "Programador actualizado correctamente" : "Programador registrado correctamente");

      this.cerrar.emit(); // Cerrar modal
      this.resetFormulario();
    } catch (error: any) {
      console.error(error);
      alert("Error registrando programador: " + error.message);
    }
  }

  cancelar() {
    this.cerrar.emit();
  }

  agregarRed() { this.redes.push(''); }
  eliminarRed(i: number) { this.redes.splice(i, 1); }

  onFotoSeleccionada(event: any) {
    this.foto = event.target.files[0] ?? null;
  }

  private resetFormulario() {
    this.nombre = '';
    this.especialidad = '';
    this.descripcion = '';
    this.contacto = '';
    this.password = '';
    this.redes = [''];
    this.foto = null;
  }
}

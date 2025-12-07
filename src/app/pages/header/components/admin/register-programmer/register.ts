import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  indexedDBLocalPersistence 
} from 'firebase/auth';
import { ProgramadorData, ProgramadorService } from '../../../../../../services/programmer-service';
import { getApp } from 'firebase/app';
import { AuthService } from '../../../../../../services/auth-service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
})
export class RegisterProgrammer {

  nombre = '';
  especialidad = '';
  descripcion = '';
  contacto = '';
  password = '';
  redes: string[] = [''];
  foto: File | null = null;

  // Instancia secundaria reutilizable para no afectar al admin
  public static secondaryAuth: ReturnType<typeof getAuth> | null = null;

  constructor(
    private router: Router,
    private programadorService: ProgramadorService,
    private authService: AuthService  // <-- usamos AuthService para la sesión del admin
  ) {}

  /** Manejar archivo de foto */
  onFotoSeleccionada(event: any) {
    this.foto = event.target.files[0] ?? null;
  }

  /** Agregar un input de red social */
  agregarRed() {
    this.redes.push('');
  }

  /** Eliminar un input de red social */
  eliminarRed(index: number) {
    this.redes.splice(index, 1);
  }

  /** Obtener instancia secundaria de Auth */
  public getSecondaryAuth() {
    if (!RegisterProgrammer.secondaryAuth) {
      const app = getApp();
      const auth2 = getAuth(app);
      auth2.useDeviceLanguage();
      auth2.setPersistence(indexedDBLocalPersistence)
        .catch(err => console.error("Error setting persistence for secondary auth:", err));
      RegisterProgrammer.secondaryAuth = auth2;
    }
    return RegisterProgrammer.secondaryAuth;
  }

  /** Registrar programador sin afectar al admin */
  async registrarProgramador() {
    const adminUser = this.authService.currentUser(); // obtenemos la sesión del admin
    if (!adminUser) {
      alert("Debes iniciar sesión como admin.");
      return;
    }

    if (!this.nombre || !this.especialidad || !this.contacto || !this.password) {
      alert("Completa los campos obligatorios: nombre, especialidad, correo y contraseña");
      return;
    }

    try {
      const auth2 = this.getSecondaryAuth();

      // Crear la cuenta del programador en la instancia secundaria
      await createUserWithEmailAndPassword(
        auth2,
        this.contacto,
        this.password
      );

      const nuevoProgramador: ProgramadorData = {
        nombre: this.nombre,
        especialidad: this.especialidad,
        descripcion: this.descripcion,
        contacto: this.contacto,
        redes: this.redes,
      };

      // Guardar programador en Firestore con referencia al admin
      await this.programadorService.registrarProgramador(nuevoProgramador, adminUser);

      // Cerrar sesión secundaria inmediatamente para no afectar al admin
      await auth2.signOut();

      alert("Programador registrado con éxito!");
      this.router.navigate(['/home/admin']); // vuelve al panel admin

    } catch (error) {
      console.error("Error registrando programador:", error);
      alert("Error al registrar programador: " + (error as any).message);
    }
  }

  /** Cancelar registro y volver al panel admin */
  cancelar() {
    this.router.navigate(['/home/admin']);
  }
}

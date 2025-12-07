import { ChangeDetectionStrategy, Component, inject, effect, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../../../services/auth-service';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { getAuth, User, createUserWithEmailAndPassword } from 'firebase/auth';
import { ProgramadorData, ProgramadorService } from '../../../../../services/programmer-service';

interface Programador {
  id: string;
  nombre: string;
  especialidad: string;
  descripcion: string;
  contacto: string;
  redes: string;
  foto?: string;
  role: string;
}

@Component({
  selector: 'app-admin',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './admin.html',
  styleUrls: ['./admin.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Admin { 
  private router = inject(Router);
  private authService = inject(AuthService);
  private firestore = inject(Firestore);
  private programadorService = inject(ProgramadorService);

  role = signal<string | null>(null);
  programadores = signal<Programador[]>([]);

  constructor() {
    console.log("========== ADMIN COMPONENT INICIADO ==========");

    effect(() => {
      const r = this.authService.userRole();
      this.role.set(r);
      console.log("Rol actualizado:", r);

      if (!r || r !== 'admin') {
        console.warn("⚠ No es admin, redirigiendo...");
        this.router.navigate(['/login']);
      } else {
        this.cargarProgramadores();
      }
    });
  }

  /** Cargar programadores desde Firestore */
  async cargarProgramadores() {
    try {
      const querySnapshot = await getDocs(collection(this.firestore, 'usuarios'));
      const lista: Programador[] = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          nombre: doc.data()['nombre'] || '',
          especialidad: doc.data()['especialidad'] || '',
          descripcion: doc.data()['descripcion'] || '',
          contacto: doc.data()['contacto'] || '',
          redes: doc.data()['redes'] || '',
          foto: doc.data()['foto'] || 'https://via.placeholder.com/40',
          role: doc.data()['role'] || 'usuario',
        }))
        .filter(user => user.role === 'programmer');

      this.programadores.set(lista);
      console.log("Programadores cargados:", lista);
    } catch (err) {
      console.error("Error al cargar programadores:", err);
    }
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: (err) => console.error(err)
    });
  }

  /** Navegar a la página de registro de programador */
  registerProgrammer() {
    this.router.navigate(['/home/admin/register-programmer']);
  }

  /** Editar programador usando ProgramadorService */
  async editarProgramador(programmer: Programador) {
    localStorage.setItem('editProgrammer', JSON.stringify(programmer));
    this.router.navigate(['/home/admin/register-programmer']);
  }

  /** Eliminar programador localmente */
  eliminarProgramador(programmer: Programador) {
    if (confirm(`¿Seguro que deseas eliminar a ${programmer.nombre}?`)) {
      this.programadores.set(this.programadores().filter(p => p.id !== programmer.id));
      console.log("Programador eliminado localmente:", programmer);
    }
  }

  isLast(redes: string, red: string) {
    const arr = redes.split(',');
    return arr.indexOf(red) === arr.length - 1;
  }

  obtenerRedes(redes: string) {
    return redes ? redes.split(',').map(r => r.trim()).filter(r => r) : [];
  }

  async crearProgramadorAuth(data: ProgramadorData) {
    if (!this.authService.currentUser()) {
      alert("Debes iniciar sesión como admin.");
      return;
    }

    try {
      // Crear la cuenta en Firebase Authentication
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(auth, data.contacto, data.password || '123456');
      const newUser = userCredential.user;

      // Registrar en Firestore con el servicio
      await this.programadorService.registrarProgramador(data, this.authService.currentUser()!);

      alert("Programador creado correctamente sin cerrar tu sesión de admin.");
      this.cargarProgramadores();

    } catch (err: any) {
      console.error("Error al crear programador:", err);
      alert("Error al crear programador. Revisa la consola.");
    }
  }
}

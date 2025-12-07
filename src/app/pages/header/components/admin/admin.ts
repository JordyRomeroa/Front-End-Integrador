import { ChangeDetectionStrategy, Component, inject, effect, signal } from '@angular/core';
import { Router, ActivatedRoute, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../../../services/auth-service';

interface Programador {
  id: string;
  nombre: string;
  especialidad: string;
  descripcion: string;
  contacto: string;
  redes: string;
  foto?: string;
}

@Component({
  selector: 'app-admin',
  imports: [RouterOutlet],
  templateUrl: './admin.html',
  styleUrls: ['./admin.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Admin { 
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);

  // Signal para rol actual
  role = signal<string | null>(null);

  // Lista de programadores (simulada)
  programadores = signal<Programador[]>([
    {
      id: '1',
      nombre: 'Juan Pérez',
      especialidad: 'Frontend',
      descripcion: 'Especialista en Angular y React',
      contacto: 'correo@ejemplo.com',
      redes: 'https://linkedin.com,https://github.com',
      foto: 'https://via.placeholder.com/40'
    },
    {
      id: '2',
      nombre: 'Ana López',
      especialidad: 'Backend',
      descripcion: 'Especialista en Node.js y Bases de Datos',
      contacto: 'ana@ejemplo.com',
      redes: 'https://linkedin.com,https://github.com',
      foto: 'https://via.placeholder.com/40'
    }
  ]);

  constructor() {
    console.log("========== ADMIN COMPONENT INICIADO ==========");

    // Cargar rol desde AuthService
    effect(() => {
      const r = this.authService.userRole(); // debe devolver 'admin', 'programmer' o 'user'
      this.role.set(r);
      console.log("Rol actualizado:", r);

      // Si no hay rol o no es admin, redirigir
      if (!r || r !== 'admin') {
        console.warn("⚠ No es admin, redirigiendo...");
        this.router.navigate(['/login']);
      }
    });
  }

  /** Logout centralizado */
  logout() {
    console.log("========== CERRANDO SESIÓN ==========");
    this.authService.logout().subscribe({
      next: () => {
        console.log("✔ Sesión cerrada");
        this.router.navigate(['/login']);
      },
      error: (err) => console.error("❌ Error al cerrar sesión:", err)
    });
  }

  /** Navegar a registro de programadores */
  registerProgrammer() {
    if (this.role() !== 'admin') {
      alert("⛔ BLOQUEADO: no eres admin");
      return;
    }
    this.router.navigate(['/home/admin/register-programmer']);
  }

  /** Editar programador: navega a register con datos precargados */
  editarProgramador(programmer: Programador) {
    console.log("Editar programador:", programmer);
    // Guardamos datos en localStorage temporalmente para precargar en el form
    localStorage.setItem('editProgrammer', JSON.stringify(programmer));
    this.router.navigate(['/home/admin/register-programmer']);
  }

  /** Eliminar programador */
  eliminarProgramador(programmer: Programador) {
    console.log("Eliminar programador:", programmer);
    if (confirm(`¿Seguro que deseas eliminar a ${programmer.nombre}?`)) {
      this.programadores.set(this.programadores().filter(p => p.id !== programmer.id));
      alert(`Programador ${programmer.nombre} eliminado.`);
    }
  }
}

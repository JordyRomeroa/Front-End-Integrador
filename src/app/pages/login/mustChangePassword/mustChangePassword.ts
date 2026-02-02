import { ChangeDetectionStrategy, Component, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../services/auth-service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-must-change-password',
  templateUrl: './mustChangePassword.html',
  styleUrls: ['./mustChangePassword.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true, // Asegúrate de que sea standalone si lo usas así
  imports: [FormsModule]
})
export class MustChangePassword {
  newPassword = signal('');
  confirmPassword = signal('');
  mensaje = signal('');

  private authService = inject(AuthService);
  private router = inject(Router);

  async cambiarContrasena() {
    const pwd = this.newPassword();
    const confirm = this.confirmPassword();

    // 1. Validaciones básicas
    if (!pwd || !confirm) {
      this.mensaje.set('Debe ingresar ambas contraseñas');
      return;
    }

    if (pwd !== confirm) {
      this.mensaje.set('Las contraseñas no coinciden');
      return;
    }

    // 2. Obtener el contacto del localStorage
    const userJson = localStorage.getItem('user');
    if (!userJson) {
      this.mensaje.set('Sesión expirada. Inicie sesión de nuevo.');
      this.router.navigate(['/login']);
      return;
    }

    const user = JSON.parse(userJson);
// CAMBIO AQUÍ: Usar email o contacto según lo que exista
const contacto = user.email || user.contacto; 

if (!contacto) {
    this.mensaje.set('No se pudo identificar al usuario.');
    return;
}

try {
    // Es mejor llamar a la función genérica del servicio que ya maneja la lógica
    await this.authService.updatePassword(contacto, pwd);

      // 4. Actualizar el estado local para que el Guard nos deje pasar
      user.mustChangePassword = false;
      localStorage.setItem('user', JSON.stringify(user));

      this.mensaje.set('Contraseña cambiada con éxito');
      
      // 5. Redirigir según el rol
      this.router.navigate(['/home']);

    } catch (err: any) {
      console.error("Error en el componente:", err);
      this.mensaje.set('Error al conectar con el servidor.');
    }
  }
}
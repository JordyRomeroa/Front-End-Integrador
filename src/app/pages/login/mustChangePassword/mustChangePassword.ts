import { ChangeDetectionStrategy, Component, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../services/auth-service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-must-change-password',
  templateUrl: './mustChangePassword.html',
  styleUrls: ['./mustChangePassword.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:[FormsModule]
})
export class MustChangePassword {
  // Señal para enlazar el input de la nueva contraseña
  newPassword = signal('');
  confirmPassword = signal('');

  mensaje = signal('');

  private authService = inject(AuthService);
  private router = inject(Router);

  // Método para cambiar la contraseña
  async cambiarContrasena() {
    const pwd = this.newPassword();
    const confirm = this.confirmPassword();

    if (!pwd || !confirm) {
      this.mensaje.set('Debe ingresar ambas contraseñas');
      return;
    }

    if (pwd !== confirm) {
      this.mensaje.set('Las contraseñas no coinciden');
      return;
    }

    try {
      await this.authService.changePassword(pwd);
      this.mensaje.set('Contraseña cambiada con éxito');

      // Redirigir a home o dashboard después de cambiar la contraseña
      this.router.navigate(['/home']);
    } catch (err) {
      console.error(err);
      this.mensaje.set('Error al cambiar la contraseña. Intente nuevamente.');
    }
  }
}

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
    // 1️⃣ Cambiar la contraseña en Firebase
    await this.authService.changePassword(pwd);

    // 2️⃣ Refrescar el usuario para actualizar la señal currentUser
    await this.authService.refreshCurrentUser();

    // 3️⃣ Redirigir a Home
    this.router.navigate(['/home']);
    this.mensaje.set('Contraseña cambiada con éxito');

  } catch (err: any) {
    console.error(err);
    this.mensaje.set('Error al cambiar la contraseña. Intente nuevamente.');
  }
}

}

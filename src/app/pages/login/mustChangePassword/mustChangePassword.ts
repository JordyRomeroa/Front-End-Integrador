import { ChangeDetectionStrategy, Component, signal, inject, computed } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../services/auth-service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-must-change-password',
  templateUrl: './mustChangePassword.html',
  styleUrls: ['./mustChangePassword.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [FormsModule, CommonModule]
})
export class MustChangePassword {
  // Signals para el formulario
  newPassword = signal('');
  confirmPassword = signal('');
  
  // Signals para el estado de la UI
  mensaje = signal('');
  mensajeExito = signal(false);
  loading = signal(false);
  showPassword = signal(false);

  private authService = inject(AuthService);
  private router = inject(Router);

  // Lógica de fuerza de contraseña calculada
  passwordStrength = computed(() => {
    const pwd = this.newPassword();
    if (!pwd) return { label: '', color: 'bg-gray-200', width: '0%' };
    
    let score = 0;
    if (pwd.length >= 6) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    const levels = [
      { label: 'Muy débil', color: 'bg-red-400', width: '25%' },
      { label: 'Débil', color: 'bg-orange-400', width: '50%' },
      { label: 'Fuerte', color: 'bg-yellow-400', width: '75%' },
      { label: 'Segura', color: 'bg-green-500', width: '100%' }
    ];
    return levels[score - 1] || levels[0];
  });

  async cambiarContrasena() {
    const pwd = this.newPassword();
    const confirm = this.confirmPassword();

    // 1. Validaciones básicas
    if (!pwd || !confirm) {
      this.showStatus('Debe ingresar ambas contraseñas', false);
      return;
    }

    if (pwd.length < 6) {
      this.showStatus('La contraseña debe tener al menos 6 caracteres', false);
      return;
    }

    if (pwd !== confirm) {
      this.showStatus('Las contraseñas no coinciden', false);
      return;
    }

    // 2. Obtener el contacto del localStorage
    const userJson = localStorage.getItem('user');
    if (!userJson) {
      this.showStatus('Sesión expirada. Inicie sesión de nuevo.', false);
      setTimeout(() => this.router.navigate(['/login']), 2000);
      return;
    }

    const user = JSON.parse(userJson);
    const contacto = user.email || user.contacto; 

    if (!contacto) {
      this.showStatus('No se pudo identificar al usuario.', false);
      return;
    }

    // 3. Proceso de actualización
    this.loading.set(true);
    try {
      await this.authService.updatePassword(contacto, pwd);

      // 4. Actualizar el estado local para el Guard
      user.mustChangePassword = false;
      localStorage.setItem('user', JSON.stringify(user));

      this.showStatus('¡Contraseña cambiada con éxito!', true);
      
      // 5. Redirigir tras una pequeña pausa
      setTimeout(() => {
        this.router.navigate(['/home']);
      }, 1500);

    } catch (err: any) {
      console.error("Error en el componente:", err);
      this.showStatus('Error al conectar con el servidor.', false);
    } finally {
      this.loading.set(false);
    }
  }

  private showStatus(msg: string, success: boolean) {
    this.mensaje.set(msg);
    this.mensajeExito.set(success);
  }

  togglePassword() {
    this.showPassword.update(v => !v);
  }
}
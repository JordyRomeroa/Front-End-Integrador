import { Component, inject, signal, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../../../services/auth-service';
import { PostulacionService } from '../../../../../../services/postulacion-service';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-unirte',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './unirte.component.html',
  styleUrl: './unirte.component.css',
})
export class UnirteComponent implements OnInit {
  private fb = inject(FormBuilder);
  public authService = inject(AuthService);
  private postuService = inject(PostulacionService);
  activeTab = signal<'formulario' | 'estado'>('formulario');
  solicitudForm: FormGroup;
  isSubmitting = signal(false);
  submitSuccess = signal(false);
  submitError = signal(false);
  private router = inject(Router);
  // Estados de vista
  isAdmin = signal(false);
  canPostulate = signal(false);
  // 1. Nueva señal para controlar las pestañas del admin
adminTab = signal<'pendientes' | 'historial'>('pendientes');

// 2. Señales para los datos (Backend debe separar o filtrar por estado)
solicitudesPendientes = signal<any[]>([]); 
historialSolicitudes = signal<any[]>([]);

setAdminTab(tab: 'pendientes' | 'historial') {
  this.adminTab.set(tab);
}

// 3. Al actualizar el estado, recarga ambas listas

  miSolicitud = signal<any | null>(null);    // Para el Usuario

  constructor() {
    
   // unirte.component.ts
this.solicitudForm = this.fb.group({
  nombre: ['', [Validators.required]],
  email: ['', [Validators.required, Validators.email]], // <-- Debe decir 'email'
  especialidad: ['', [Validators.required]],
  portafolio: ['', [Validators.required]],
  descripcion: ['', [Validators.required]]

});

    effect(() => {
      this.checkRoles();
    });
  }

  ngOnInit() {
    this.checkRoles();
  }

  checkRoles() {
    const role = this.authService.getUserRole();
    const isLogged = this.authService.isLogged();

    this.isAdmin.set(role === 'admin' || role === 'ROLE_ADMIN');
    this.canPostulate.set(role === 'user' || role === 'ROLE_USER');
    
    if (this.isAdmin()) {
      this.cargarSolicitudes();
    } else if (isLogged) {
      this.cargarMiEstado();
    }
  }
activarPerfilYLogin() {
  // 1. Limpiamos cualquier rastro de la sesión vieja (ROLE_USER)
  localStorage.clear(); 
  sessionStorage.clear();

  // 2. Redirigimos a la raíz /login 
  // Usamos ['/login'] con la barra inicial para que sea ruta absoluta
  this.router.navigate(['/login']).then(() => {
    // 3. Forzamos un refresco rápido para asegurar que los Guards 
    // y el AuthService se reinicien de cero
    window.location.reload();
  });
}
  
cargarMiEstado() {
    this.postuService.obtenerMiSolicitud().subscribe({
      next: (data) => {
        if (data) {
          this.miSolicitud.set(data);
          this.activeTab.set('estado'); // Cambia a la vista de estado automáticamente
          if (data.estado === 'APROBADO') {
            alert('¡Felicidades! Tu postulación ha sido aprobada. Nos pondremos en contacto contigo pronto.');
          }
        }
      },
      error: (err) => console.log('Sin postulación previa')
    });
  }
  
  setTab(tab: 'formulario' | 'estado') {
    this.activeTab.set(tab);
  }
  cargarSolicitudes() {
    this.postuService.obtenerTodas().subscribe({
      next: (data: any[]) => {
        // Filtramos las solicitudes que están en espera
        this.solicitudesPendientes.set(
          data.filter(s => s.estado === 'PENDIENTE')
        );
        
        // Movemos las ACEPTADAS o RECHAZADAS al historial
        this.historialSolicitudes.set(
          data.filter(s => s.estado === 'APROBADO' || s.estado === 'RECHAZADO')
        );
      },
      error: (err) => console.error('Error cargando solicitudes', err)
    });
  }

 enviarSolicitud() {
  if (this.solicitudForm.invalid) {
    console.warn("Formulario inválido. Revisa los campos:", this.solicitudForm.controls);
    alert("Por favor, completa todos los campos correctamente.");
    return;
  }
  
  console.log("Enviando datos...", this.solicitudForm.value);
  this.isSubmitting.set(true);
  
  this.postuService.enviarPostulacion(this.solicitudForm.value).subscribe({
    next: () => {
      this.submitSuccess.set(true);
      this.isSubmitting.set(false);
      this.cargarMiEstado(); 
    },
    error: (err) => {
      console.error("Error en el servidor:", err);
      this.submitError.set(true);
      this.isSubmitting.set(false);
      alert("Error del servidor: " + (err.error?.message || "No se pudo enviar"));
    }
  });
}

  actualizarEstado(id: number, nuevoEstado: string) {
    this.postuService.actualizarEstado(id, nuevoEstado).subscribe({
      next: () => {
        this.cargarSolicitudes(); // Esto moverá la solicitud al historial automáticamente
      },
      error: (err) => console.error('Error al actualizar', err)
    });
  }

  copiarClave(clave: string) {
    navigator.clipboard.writeText(clave);
    alert('Contraseña copiada al portapapeles');
  }
}
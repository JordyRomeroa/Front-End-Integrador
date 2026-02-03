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

  // 1. Definimos quién es quién
  const esAdmin = role === 'admin' || role === 'ROLE_ADMIN';
  const esProgramador = role === 'programmer' || role === 'ROLE_PROGRAMMER';
  const esUsuarioNormal = !esAdmin && !esProgramador;

  // 2. Seteamos las señales de estado
  this.isAdmin.set(esAdmin);
  this.canPostulate.set(esUsuarioNormal && isLogged);

  // 3. ¡ACTUALIZACIÓN CRÍTICA!: Cargar los datos según el rol
  if (esAdmin) {
    // Si es admin, traemos TODAS las postulaciones para el panel
    this.cargarSolicitudes();
  } else if (isLogged) {
    // Si es usuario o programador, traemos su estado personal
    this.cargarMiEstado();
  }
}
activarPerfilYLogin() {
  // Limpia TODO el almacenamiento para que el nuevo login genere un token fresco
  localStorage.clear();
  sessionStorage.clear();

  alert('¡Configuración completada! Inicia sesión para entrar con tu nuevo rol.');

  this.router.navigate(['/login']).then(() => {
    // El reload es vital para resetear el estado de los servicios (AuthService)
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
  console.log("BOTÓN PRESIONADO - ID:", id, "ESTADO:", nuevoEstado); // <--- ESTO DEBE SALIR EN F12
  
  this.postuService.actualizarEstado(id, nuevoEstado).subscribe({
    next: () => {
      console.log("Respuesta del servidor OK");
      this.cargarSolicitudes(); 
    },
    error: (err) => {
      console.error('ERROR EN LA PETICIÓN:', err);
      alert("Error: El servidor no respondió.");
    }
  });
}

  copiarClave(clave: string) {
    navigator.clipboard.writeText(clave);
    alert('Contraseña copiada al portapapeles');
  }
}
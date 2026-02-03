import { Component, EventEmitter, Output, OnInit, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../../../services/auth-service';
import { ProgramadorService } from '../../../../../../services/programmer-service';
import { ProgramadorData } from '../../../../interface/programador';
import axios from 'axios';

@Component({
  selector: 'app-edit-profile-programmer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './editprofile.html',
  styleUrls: ['./editprofile.css']
})
export class EditProfileProgrammerComponent implements OnInit {
  // Referencia original del programador desde el backend
  programmer: any | null = null;

  // Campos del formulario
  nombre = '';
  especialidad = '';
  descripcion = '';
  contacto = '';
  redes: string[] = [''];
  foto: File | null = null;
  fotoPreview: string = 'https://via.placeholder.com/150';
  loading = false;

  // Señales para UI
  message = signal<string | null>(null);
  messageType = signal<'success' | 'error'>('success');

  @Output() updated = new EventEmitter<void>();

  constructor(
    private authService: AuthService,
    private programadorService: ProgramadorService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarDatosPerfil();
  }

  private cargarDatosPerfil() {
    const storedToken = localStorage.getItem("auth_token");
    if (!storedToken && !this.authService.token()) {
      this.showMessage('No hay sesión activa', 'error');
      return;
    }

    this.loading = true;

    // Sincronizamos con el servidor para obtener los datos más recientes
    (this.authService.refreshCurrentUser() as Promise<any>)
      .then(res => {
        if (res) {
          this.programmer = res;
          // Mapeo de campos del Backend Java
          this.nombre = res.nombre || '';
          this.especialidad = res.especialidad || '';
          this.descripcion = res.descripcion || '';
          this.contacto = res.contacto || '';
          
          if (res.redes) {
            this.redes = Array.isArray(res.redes) ? [...res.redes] : res.redes.split(',');
          } else {
            this.redes = [''];
          }
          
          this.fotoPreview = res.foto || 'https://via.placeholder.com/150';
        }
      })
      .catch(err => {
        console.error('Error al cargar perfil:', err);
        this.showMessage('Error al cargar datos del servidor', 'error');
      })
      .finally(() => {
        this.loading = false;
        this.cdr.detectChanges();
      });
  }

  async actualizarPerfil() {
    // Obtenemos el ID del objeto que devolvió Java (id, uid o idUsuario)
    const currentId = this.programmer?.id || this.programmer?.uid || this.programmer?.idUsuario;
    
    if (!currentId) {
      this.showMessage('Error: No se pudo determinar tu ID de usuario', 'error');
      return;
    }

    this.loading = true;

    try {
      let fotoURL = this.fotoPreview;
      if (this.foto) {
        fotoURL = await this.subirImagenCloudinary(this.foto);
      }

      // Payload limpio para el DTO de Java
      const datosParaJava: ProgramadorData = {
        nombre: this.nombre,
        contacto: this.contacto,
        descripcion: this.descripcion,
        especialidad: this.especialidad,
        redes: this.redes.filter(r => r && r.trim() !== ''),
        foto: fotoURL
      };

      // Llamada corregida: Pasamos los datos y el ID (sin el parámetro adminUser de Firebase)
      await this.programadorService.registrarProgramador(
        datosParaJava, 
        currentId.toString() 
      );

      this.showMessage('¡Perfil actualizado con éxito!', 'success');
      this.updated.emit();
      
    } catch (err: any) {
      console.error('Error en actualización:', err);
      const errorMsg = err.error?.message || 'Error al procesar la actualización en el servidor';
      this.showMessage(errorMsg, 'error');
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  // --- MÉTODOS AUXILIARES ---

  private async subirImagenCloudinary(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'preset_angular');
    formData.append('folder', 'programadores');

    const url = `https://api.cloudinary.com/v1_1/dfsuyz4vw/image/upload`;
    const response = await axios.post(url, formData);
    return response.data.secure_url;
  }

  onFotoSeleccionada(event: any) {
    const file = event.target.files[0] ?? null;
    if (file) {
      this.foto = file;
      this.fotoPreview = URL.createObjectURL(file);
    }
  }

  agregarRed() { this.redes.push(''); }
  eliminarRed(i: number) { this.redes.splice(i, 1); }

  private showMessage(msg: string, type: 'success' | 'error' = 'success') {
    this.messageType.set(type);
    this.message.set(msg);
    setTimeout(() => this.message.set(null), 4000);
  }
}
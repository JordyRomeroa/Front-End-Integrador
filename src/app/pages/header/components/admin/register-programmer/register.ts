import { Component, EventEmitter, Input, OnChanges, Output, signal, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
// Eliminadas las importaciones de Firebase Auth y Firebase Secondary
import { ProgramadorService } from '../../../../../../services/programmer-service';
import { AuthService } from '../../../../../../services/auth-service';
import { ProgramadorData } from '../../../../interface/programador';
import axios from 'axios';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class RegisterProgrammer implements OnChanges {
  @Output() cerrar = new EventEmitter<void>();
  @Input() programmer: ProgramadorData | null = null; 

  nombre = '';
  especialidad = '';
  descripcion = '';
  contacto = '';
  password = ''; // Se enviará al backend para que él cree la cuenta
  redes: string[] = [''];
  foto: File | null = null;
  fotoPreview: string = 'https://via.placeholder.com/150';
  loading = false;

  dialogVisible = signal(false);
  dialogMessage = signal('');
  dialogTitle = signal('');

  constructor(
    private router: Router,
    private programadorService: ProgramadorService,
    private authService: AuthService
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['programmer'] && this.programmer) {
      console.log("Modo Edición para:", this.programmer.uid);
      this.nombre = this.programmer.nombre || '';
      this.especialidad = this.programmer.especialidad || '';
      this.descripcion = this.programmer.descripcion || '';
      this.contacto = this.programmer.contacto || '';
      this.redes = this.programmer.redes?.length ? [...this.programmer.redes] : [''];
      this.fotoPreview = this.programmer.foto || 'https://via.placeholder.com/150';
      this.password = ''; 
    } else if (changes['programmer'] && !this.programmer) {
      this.resetFormulario();
    }
  }

  async registrarProgramador() {
    const esEdicion = !!(this.programmer?.uid || this.programmer?.id);

    // Validaciones básicas
    if (!this.nombre || !this.especialidad || !this.contacto) {
      this.showDialog("Campos incompletos", "Nombre, especialidad y contacto son obligatorios.");
      return;
    }

    if (!esEdicion && !this.password) {
      this.showDialog("Contraseña obligatoria", "Debes asignar una contraseña para el nuevo registro.");
      return;
    }

    this.loading = true;

    try {
      // 1. Subida de imagen a Cloudinary (si hay una nueva)
      let fotoURL = this.fotoPreview;
      if (this.foto) {
        fotoURL = await this.subirImagenCloudinary(this.foto);
      }

      // 2. Construcción del Payload
      // Nota: Incluimos la password para que el Backend cree el usuario de Spring Security/Auth
      const payload: any = {
        nombre: this.nombre,
        especialidad: this.especialidad,
        descripcion: this.descripcion,
        contacto: this.contacto, // Usado como email/username
        password: this.password, 
        redes: this.redes.filter(r => r.trim() !== ''),
        foto: fotoURL,
        mustChangePassword: !esEdicion 
      };

      // 3. Llamada única al Backend
      const uidExistente = this.programmer?.uid || this.programmer?.id?.toString();
      
      await this.programadorService.registrarProgramador(payload, uidExistente);

      this.showDialog("Éxito", esEdicion ? "Programador actualizado correctamente" : "Programador registrado en el sistema");
      
      this.cerrar.emit();
      this.resetFormulario();

    } catch (error: any) {
      console.error("Error en registro:", error);
      // Captura el error de tu API (ej: Correo duplicado 400 Bad Request)
      const errorMsg = error.error?.message || "No se pudo conectar con el servidor.";
      this.showDialog("Error de Registro", errorMsg);
    } finally {
      this.loading = false;
    }
  }

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
    const file = event.target.files[0];
    if (file) {
      this.foto = file;
      this.fotoPreview = URL.createObjectURL(file);
    }
  }

  agregarRed() { this.redes.push(''); }
  eliminarRed(i: number) { this.redes.splice(i, 1); }
  cancelar() { this.cerrar.emit(); }
  
  private showDialog(t: string, m: string) { 
    this.dialogTitle.set(t); 
    this.dialogMessage.set(m); 
    this.dialogVisible.set(true); 
  }

  cerrarDialog() { this.dialogVisible.set(false); }

  private resetFormulario() {
    this.nombre = ''; this.especialidad = ''; this.descripcion = ''; this.contacto = '';
    this.password = ''; this.redes = ['']; this.foto = null; 
    this.fotoPreview = 'https://via.placeholder.com/150';
  }
}
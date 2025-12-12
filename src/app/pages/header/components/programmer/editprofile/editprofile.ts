import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, OnInit, ChangeDetectorRef, signal } from '@angular/core';
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
  programmer: ProgramadorData | null = null;

  // Campos del formulario
  nombre = '';
  especialidad = '';
  descripcion = '';
  contacto = '';
  redes: string[] = [''];
  foto: File | null = null;
  fotoPreview: string = 'https://via.placeholder.com/150';
  loading = false;

  // Señal para mostrar mensaje
  message = signal<string | null>(null);
  messageType = signal<'success' | 'error'>('success');

  @Output() updated = new EventEmitter<void>();

  constructor(
    private authService: AuthService,
    private programadorService: ProgramadorService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const user = this.authService.currentUser();
    if (!user) return;

    this.loading = true;

    this.programadorService.getProgramadorByUid(user.uid)
      .then(programmer => {
        if (programmer) {
          this.programmer = programmer;
          this.nombre = programmer.nombre || '';
          this.especialidad = programmer.especialidad || '';
          this.descripcion = programmer.descripcion || '';
          this.contacto = programmer.contacto || '';
          this.redes = programmer.redes?.length ? [...programmer.redes] : [''];
          this.fotoPreview = programmer.foto || 'https://via.placeholder.com/150';
        }
      })
      .catch(err => this.showMessage('Error al cargar perfil', 'error'))
      .finally(() => {
        this.loading = false;
        this.cdr.detectChanges();
      });
  }

  onFotoSeleccionada(event: any) {
    const file = event.target.files[0] ?? null;
    if (file) {
      this.foto = file;
      this.fotoPreview = URL.createObjectURL(file);
    } else {
      this.foto = null;
      this.fotoPreview = this.programmer?.foto || 'https://via.placeholder.com/150';
    }
  }

  agregarRed() { this.redes.push(''); }
  eliminarRed(i: number) { this.redes.splice(i, 1); }

  private async subirImagenCloudinary(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'preset_angular');
    formData.append('folder', 'programadores');

    const url = `https://api.cloudinary.com/v1_1/dfsuyz4vw/image/upload`;
    const response = await axios.post(url, formData);
    return response.data.secure_url;
  }

  async actualizarPerfil() {
    if (!this.programmer) return;

    this.loading = true;

    try {
      const currentUser = this.authService.currentUser();
      if (!currentUser) {
        this.showMessage('Debes iniciar sesión para actualizar tu perfil', 'error');
        return;
      }

      let fotoURL = this.programmer.foto || 'https://via.placeholder.com/150';
      if (this.foto) {
        fotoURL = await this.subirImagenCloudinary(this.foto);
      }

      const actualizado: ProgramadorData = {
        ...this.programmer,
        nombre: this.nombre,
        especialidad: this.especialidad,
        descripcion: this.descripcion,
        contacto: this.contacto,
        redes: this.redes,
        foto: fotoURL
      };

      await this.programadorService.registrarProgramador(
        actualizado,
        currentUser,
        actualizado.uid
      );

      this.showMessage('Perfil actualizado correctamente', 'success');
      this.updated.emit();
      this.foto = null;
      this.fotoPreview = fotoURL;

    } catch (err: any) {
      console.error(err);
      this.showMessage('Error al actualizar perfil: ' + err.message, 'error');
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  private showMessage(msg: string, type: 'success' | 'error' = 'success') {
    this.messageType.set(type);
    this.message.set(msg);
    setTimeout(() => this.message.set(null), 4000); // desaparece después de 4s
  }
}

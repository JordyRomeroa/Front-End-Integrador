import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';

@Component({
  selector: 'app-register',
  standalone: true, 
  imports: [CommonModule, FormsModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
})
export class RegisterProgrammer {

  nombre = '';
  especialidad = '';
  descripcion = '';
  contacto = '';
  redes = '';
  foto: File | null = null;
  currentUser: User | null = null;

  constructor(
    private firestore: Firestore,
    private router: Router
  ) {
    const auth = getAuth();

    onAuthStateChanged(auth, (user) => {
      if (!user) {
        console.warn('Usuario no autenticado. Redirigiendo a login...');
        this.router.navigate(['/login']);
      } else {
        this.currentUser = user;
        // opcional: verifica rol si quieres
      }
    });
  }

  onFotoSeleccionada(event: any) {
    this.foto = event.target.files[0] ?? null;
  }

  async registrarProgramador() {
    if (!this.currentUser) {
      alert("Debes iniciar sesión para registrar programadores.");
      return;
    }

    if (!this.nombre || !this.especialidad || !this.contacto) {
      alert("Debes completar todos los campos obligatorios.");
      return;
    }

    const id = crypto.randomUUID();
    const data = {
      nombre: this.nombre,
      especialidad: this.especialidad,
      descripcion: this.descripcion,
      contacto: this.contacto,
      redes: this.redes,
      role: "programmer",
      createdBy: this.currentUser.uid,
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(this.firestore, "usuarios", id), data);
      alert("Programador registrado correctamente.");
      this.router.navigate(['/admin']);
    } catch (error) {
      console.error("Error al registrar programador:", error);
      alert("Error al registrar programador. Revisa la consola.");
    }
  }

  cancelar() {
    this.router.navigate(['/home/admin']);
  }
}

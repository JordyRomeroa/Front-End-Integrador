import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, setDoc, serverTimestamp, getDocs } from '@angular/fire/firestore';
import { getAuth, User } from 'firebase/auth';

export interface ProgramadorData {
  nombre: string;
  especialidad: string;
  descripcion?: string;
  contacto: string;
  password?: string; // opcional si no queremos crear la cuenta Auth aquí
  redes?: string[];
  foto?: string;
}

@Injectable({ providedIn: 'root' })
export class ProgramadorService {
  private firestore = inject(Firestore);
  private auth = getAuth();

  /**
   * Crea un documento de programador en Firestore
   * @param data Datos del programador
   * @param adminUser Usuario admin que lo está creando
   */
   async registrarProgramador(data: ProgramadorData, adminUser: User, uid?: string) {
    const usuariosCol = collection(this.firestore, "usuarios");

    // Si no se pasa UID, genera uno automático
    const nuevoDocRef = uid ? doc(usuariosCol, uid) : doc(usuariosCol);

    const docData = {
      uid: uid || nuevoDocRef.id,
      nombre: data.nombre,
      especialidad: data.especialidad,
      descripcion: data.descripcion || '',
      contacto: data.contacto,
      redes: (data.redes || []).filter(r => r.trim() !== '').join(','),
      role: "programmer",
      createdBy: adminUser.uid,
      createdAt: serverTimestamp(),
      foto: data.foto || 'https://via.placeholder.com/40'
    };

    await setDoc(nuevoDocRef, docData);
    return docData;
  }

  async obtenerProgramadores(): Promise<{ uid: string; nombre: string }[]> {
    const usuariosCol = collection(this.firestore, "usuarios");
    const snapshot = await getDocs(usuariosCol);

    return snapshot.docs
      .filter(doc => doc.data()['role'] === 'programmer')
      .map(doc => ({
        uid: doc.id,
        nombre: doc.data()['nombre'] || 'Sin nombre'
      }));
  }
  guardarProgramador(data: ProgramadorData, adminUser: User, uid?: string) {
    return this.registrarProgramador(data, adminUser, uid);
  }

}

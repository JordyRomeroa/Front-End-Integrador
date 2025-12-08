import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, setDoc, serverTimestamp, getDocs,deleteDoc } from '@angular/fire/firestore';
import { getAuth, User } from 'firebase/auth';
import { BehaviorSubject } from 'rxjs';

export interface ProgramadorData {
  uid?: string; // <--- Agregamos uid opcional para identificar programadores
  nombre: string;
  especialidad: string;
  descripcion?: string;
  contacto: string;
  password?: string;
  redes?: string[];
  foto?: string;
}

@Injectable({ providedIn: 'root' })
export class ProgramadorService {
  private firestore = inject(Firestore);
  private auth = getAuth();

  // Observable interno para emitir cambios en la lista de programadores
  private programadoresSubject = new BehaviorSubject<ProgramadorData[]>([]);
  programadores$ = this.programadoresSubject.asObservable();

  constructor() {
    // Inicializamos la lista al crear el servicio
    this.refrescarTabla(); 
  }

  /** Crea un programador en Firestore */
  async registrarProgramador(data: ProgramadorData, adminUser: User, uid?: string) {
    const usuariosCol = collection(this.firestore, "usuarios");
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

    // Actualizar la tabla automáticamente
    await this.refrescarTabla();

    return docData;
  }

  /** Obtiene todos los programadores de Firestore */
  async obtenerProgramadores(): Promise<ProgramadorData[]> {
    const usuariosCol = collection(this.firestore, "usuarios");
    const snapshot = await getDocs(usuariosCol);

    return snapshot.docs
      .filter(doc => doc.data()['role'] === 'programmer')
      .map(doc => ({
        uid: doc.id,
        nombre: doc.data()['nombre'] || 'Sin nombre',
        especialidad: doc.data()['especialidad'] || '',
        descripcion: doc.data()['descripcion'] || '',
        contacto: doc.data()['contacto'] || '',
        redes: (doc.data()['redes'] || '').split(','),
        foto: doc.data()['foto'] || 'https://via.placeholder.com/40'
      }));
  }

  /** Refresca la tabla y emite cambios de inmediato */
  async refrescarTabla() {
    const lista = await this.obtenerProgramadores();
    this.programadoresSubject.next(lista);
  }

  /** Alias por compatibilidad */
  guardarProgramador(data: ProgramadorData, adminUser: User, uid?: string) {
    return this.registrarProgramador(data, adminUser, uid);
  }
   async eliminarProgramador(uid: string) {
    if (!uid) throw new Error('UID no proporcionado');

    const docRef = doc(this.firestore, `usuarios/${uid}`);
    await deleteDoc(docRef);

    // Refresca la tabla para emitir los cambios
    await this.refrescarTabla();
  }
  
}

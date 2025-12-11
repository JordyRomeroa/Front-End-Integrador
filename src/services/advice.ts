import { Injectable } from '@angular/core';
import { collection, doc, setDoc, updateDoc, serverTimestamp, Firestore } from '@angular/fire/firestore';

export interface Asesoria {
  mensaje: string;
  estado: string;
  mensajeRespuesta: string;
  programadorId: string;
  usuarioId: string;
  createdAt?: any;
  updatedAt?: any;
  fecha?: string;
  correoUsuario?: string;
  nombreUsuario?: string;
   
}

@Injectable({
  providedIn: 'root'
})
export class AsesoriaService {

  private asesoriasRef;

  constructor(private firestore: Firestore) {
    this.asesoriasRef = collection(this.firestore, 'asesorias');
  }

  async crearAsesoria(asesoria: Asesoria) {
    const docRef = doc(this.asesoriasRef);
    await setDoc(docRef, {
      ...asesoria,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  }

  async actualizarAsesoria(id: string, data: Partial<Asesoria>) {
    const docRef = doc(this.asesoriasRef, id);

    const allowedKeys = ['estado', 'mensaje'];
    const filteredData: any = {};
    Object.keys(data).forEach(key => {
      if (allowedKeys.includes(key)) filteredData[key] = (data as any)[key];
    });

    await updateDoc(docRef, {
      ...filteredData,
      updatedAt: serverTimestamp()
    });
  }
}

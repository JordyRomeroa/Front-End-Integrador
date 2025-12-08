import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, setDoc, getDocs, query, where, deleteDoc, updateDoc } from '@angular/fire/firestore';
import { Proyecto } from '../app/pages/interface/proyecto';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ProyectoService {
  private firestore = inject(Firestore);

  // Señal/observable para notificar cambios en proyectos
  private proyectosSubject = new BehaviorSubject<Proyecto[]>([]);
  proyectos$ = this.proyectosSubject.asObservable();

  /** Obtener todos los proyectos asignados a un programador */
  async obtenerProyectos(uidProgramador: string): Promise<Proyecto[]> {
    const proyectosCol = collection(this.firestore, 'proyectos');
    const q = query(proyectosCol, where('assignedTo', '==', uidProgramador));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Proyecto));
  }

  /** Crear un proyecto nuevo */
  async crearProyecto(proyecto: Proyecto): Promise<Proyecto> {
    const proyectosCol = collection(this.firestore, 'proyectos');
    const nuevoDoc = doc(proyectosCol);
    await setDoc(nuevoDoc, proyecto);
    await this.cargarProyectos(proyecto.assignedTo);
    return { id: nuevoDoc.id, ...proyecto };
  }

  /** Actualizar un proyecto existente */
  async actualizarProyecto(proyecto: Proyecto): Promise<void> {
    if (!proyecto.id) throw new Error('El proyecto debe tener un ID para actualizar');
    const docRef = doc(this.firestore, `proyectos/${proyecto.id}`);
    await updateDoc(docRef, {
      nombre: proyecto.nombre,
      descripcion: proyecto.descripcion,
      tipo: proyecto.tipo,
      tecnologias: proyecto.tecnologias,
      repo: proyecto.repo,
      deploy: proyecto.deploy,
      assignedTo: proyecto.assignedTo
    });
    await this.cargarProyectos(proyecto.assignedTo);
  }

  /** Eliminar un proyecto por su ID */
  async eliminarProyecto(id: string, uidProgramador: string): Promise<void> {
    const docRef = doc(this.firestore, `proyectos/${id}`);
    await deleteDoc(docRef);
    await this.cargarProyectos(uidProgramador);
  }

 async cargarProyectos(uid: string) {
  const q = query(collection(this.firestore, 'proyectos'), where('assignedTo', '==', uid));
  const snapshot = await getDocs(q);
  const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Proyecto));

  // ⚡ Usa el BehaviorSubject correcto
  this.proyectosSubject.next(lista);
}

}

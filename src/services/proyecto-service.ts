import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, setDoc, getDocs, query, where, deleteDoc, updateDoc } from '@angular/fire/firestore';
import { Proyecto } from '../app/pages/interface/proyecto';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ProyectoService {
  private firestore = inject(Firestore);

  // 🟣 Proyectos del programador (vista del programador)
  private proyectosProgramadorSubject = new BehaviorSubject<Proyecto[]>([]);
  proyectosProgramador$ = this.proyectosProgramadorSubject.asObservable();

  // 🔵 Todos los proyectos (vista admin)
  private todosProyectosSubject = new BehaviorSubject<Proyecto[]>([]);
  todosProyectos$ = this.todosProyectosSubject.asObservable();

  // ============================================================
  // 📌 1. OBTENER PROYECTOS DEL PROGRAMADOR
  // ============================================================
  async obtenerProyectos(uidProgramador: string): Promise<Proyecto[]> {
    const proyectosCol = collection(this.firestore, 'proyectos');
    const q = query(proyectosCol, where('assignedTo', '==', uidProgramador));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }) as Proyecto);
  }

  // Cargar y emitir los proyectos del programador
  async cargarProyectosProgramador(uid: string) {
    const lista = await this.obtenerProyectos(uid);
    this.proyectosProgramadorSubject.next(lista);
  }

  // ============================================================
  // 📌 2. OBTENER TODOS LOS PROYECTOS
  // ============================================================
  async obtenerTodosLosProyectos(): Promise<Proyecto[]> {
    const proyectosCol = collection(this.firestore, 'proyectos');
    const snapshot = await getDocs(proyectosCol);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }) as Proyecto);
  }

  // Cargar todos los proyectos y emitirlos
  async cargarTodosLosProyectos() {
    const lista = await this.obtenerTodosLosProyectos();
    this.todosProyectosSubject.next(lista);
  }

  // ============================================================
  // 📌 3. CREAR PROYECTO
  // ============================================================
  async crearProyecto(proyecto: Proyecto): Promise<Proyecto> {
    const proyectosCol = collection(this.firestore, 'proyectos');
    const nuevoDoc = doc(proyectosCol);
    await setDoc(nuevoDoc, proyecto);

    // Actualiza las dos vistas
    await this.cargarProyectosProgramador(proyecto.assignedTo);
    await this.cargarTodosLosProyectos();

    return { id: nuevoDoc.id, ...proyecto };
  }

  // ============================================================
  // 📌 4. ACTUALIZAR PROYECTO
  // ============================================================
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

    // Actualizar ambas listas
    await this.cargarProyectosProgramador(proyecto.assignedTo);
    await this.cargarTodosLosProyectos();
  }

  
  async eliminarProyecto(id: string, uidProgramador: string): Promise<void> {
    const docRef = doc(this.firestore, `proyectos/${id}`);
    await deleteDoc(docRef);

    await this.cargarProyectosProgramador(uidProgramador);
    await this.cargarTodosLosProyectos();
  }
  
}

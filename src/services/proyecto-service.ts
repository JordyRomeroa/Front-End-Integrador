import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http'; // Inyectamos HttpClient
import { Proyecto } from '../app/pages/interface/proyecto';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProyectoService {
  private http = inject(HttpClient);
  // URL de tu controlador de Proyectos en Spring Boot
  private API_URL = `${environment.apiUrl}/api/proyectos`;

  // 🟣 Proyectos del programador (vista del programador)
  private proyectosProgramadorSubject = new BehaviorSubject<Proyecto[]>([]);
  proyectosProgramador$ = this.proyectosProgramadorSubject.asObservable();

  // 🔵 Todos los proyectos (vista admin)
  private todosProyectosSubject = new BehaviorSubject<Proyecto[]>([]);
  todosProyectos$ = this.todosProyectosSubject.asObservable();

  // ============================================================
  // 📌 1. OBTENER PROYECTOS DEL PROGRAMADOR (MIGRADO)
  // ============================================================
  // Cambia esto
async obtenerProyectos(uidProgramador: string | number): Promise<Proyecto[]> {
  // 1. Validar que el ID sea un número válido y no "undefined"
  if (!uidProgramador || uidProgramador === 'undefined') {
    console.warn('ID de programador no válido, abortando petición.');
    return [];
  }

  try {
    const res = await firstValueFrom(
      this.http.get<Proyecto[]>(`${this.API_URL}/programador/${uidProgramador}`)
    );
    return res || [];
  } catch (error) {
    console.error('Error obteniendo proyectos del programador:', error);
    return [];
  }
}

// Cambia esto también
async cargarProyectosProgramador(uid: string | number) {
  const lista = await this.obtenerProyectos(uid);
  this.proyectosProgramadorSubject.next(lista);
}
  // ============================================================
  // 📌 2. OBTENER TODOS LOS PROYECTOS (MIGRADO)
  // ============================================================
  async obtenerTodosLosProyectos(): Promise<Proyecto[]> {
    try {
      const res = await firstValueFrom(this.http.get<Proyecto[]>(this.API_URL));
      return res || [];
    } catch (error) {
      console.error('Error obteniendo todos los proyectos:', error);
      return [];
    }
  }

  async cargarTodosLosProyectos() {
    const lista = await this.obtenerTodosLosProyectos();
    this.todosProyectosSubject.next(lista);
  }

  // ============================================================
  // 📌 3. CREAR PROYECTO (MIGRADO)
  // ============================================================
  // En crearProyecto
async crearProyecto(proyecto: any): Promise<any> {
  const nuevoProyecto = await firstValueFrom(
    this.http.post<any>(this.API_URL, proyecto)
  );

  // El operador ?? '' garantiza que nunca sea undefined
  const programadorId = proyecto.assignedToId ?? proyecto.assignedTo ?? '';
  await this.cargarProyectosProgramador(programadorId);
  await this.cargarTodosLosProyectos();

  return nuevoProyecto;
}

// En actualizarProyecto
async actualizarProyecto(proyecto: any): Promise<void> {
  const id = proyecto.id;
  if (!id) throw new Error('El proyecto debe tener un ID para actualizar');

  await firstValueFrom(
    this.http.put(`${this.API_URL}/${id}`, proyecto)
  );

  // Aquí también usamos el respaldo para evitar el undefined
  const programadorId = proyecto.assignedToId ?? proyecto.assignedTo ?? '';
  await this.cargarProyectosProgramador(programadorId);
  await this.cargarTodosLosProyectos();
}
  // ============================================================
  // 📌 4. ACTUALIZAR PROYECTO (MIGRADO)
  // ============================================================
  

  // ============================================================
  // 📌 5. ELIMINAR PROYECTO (MIGRADO)
  // ============================================================
  async eliminarProyecto(id: string, uidProgramador: string): Promise<void> {
    // Llamada DELETE al backend
    await firstValueFrom(this.http.delete(`${this.API_URL}/${id}`));

    await this.cargarProyectosProgramador(uidProgramador);
    await this.cargarTodosLosProyectos();
  }
}
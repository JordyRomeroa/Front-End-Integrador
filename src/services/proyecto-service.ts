import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http'; // Inyectamos HttpClient
import { Proyecto } from '../app/pages/interface/proyecto';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { environment } from "../environments/environment.prod";

@Injectable({ providedIn: 'root' })
export class ProyectoService {
  private http = inject(HttpClient);
  private API_URL = `${environment.apiUrl}/api/proyectos`;

  private proyectosProgramadorSubject = new BehaviorSubject<Proyecto[]>([]);
  proyectosProgramador$ = this.proyectosProgramadorSubject.asObservable();

  private todosProyectosSubject = new BehaviorSubject<Proyecto[]>([]);
  todosProyectos$ = this.todosProyectosSubject.asObservable();


async obtenerProyectos(uidProgramador: string | number): Promise<Proyecto[]> {
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
async cargarProyectosProgramador(uid: string | number) {
  const lista = await this.obtenerProyectos(uid);
  this.proyectosProgramadorSubject.next(lista);
}
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
async crearProyecto(proyecto: any): Promise<any> {
  const nuevoProyecto = await firstValueFrom(
    this.http.post<any>(this.API_URL, proyecto)
  );
  const programadorId = proyecto.assignedToId ?? proyecto.assignedTo ?? '';
  await this.cargarProyectosProgramador(programadorId);
  await this.cargarTodosLosProyectos();

  return nuevoProyecto;
}
async actualizarProyecto(proyecto: any): Promise<void> {
  const id = proyecto.id;
  if (!id) throw new Error('El proyecto debe tener un ID para actualizar');

  await firstValueFrom(
    this.http.put(`${this.API_URL}/${id}`, proyecto)
  );
  const programadorId = proyecto.assignedToId ?? proyecto.assignedTo ?? '';
  await this.cargarProyectosProgramador(programadorId);
  await this.cargarTodosLosProyectos();
}
  async eliminarProyecto(id: string, uidProgramador: string): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.API_URL}/${id}`));

    await this.cargarProyectosProgramador(uidProgramador);
    await this.cargarTodosLosProyectos();
  }
}
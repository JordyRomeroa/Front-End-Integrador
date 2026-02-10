import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AsesoriaConId } from '../app/pages/interface/asesoria';
import { environment } from '../environments/environment';
export interface Asesoria {
  mensaje: string;
  estado: string;
  mensajeRespuesta: string;
  programadorId: string;
  usuarioId: string;
  fecha?: string;
  telefono: string;
  nombreUsuario?: string;
  nombreProgramador: string;
}
@Injectable({
  providedIn: 'root'
})
export class AsesoriaService {
  private http = inject(HttpClient);
  // URL controlador Java
private API_URL = `${environment.apiUrl}/api/asesorias`;
  constructor() {}

obtenerTodas(): Observable<any[]> {
    return this.http.get<any[]>(this.API_URL);
  }
  crearAsesoria(asesoria: Asesoria): Observable<any> {
    return this.http.post(this.API_URL, asesoria);
  }
obtenerAsesoriasPorUsuario(userId: number): Observable<any[]> {
  return this.http.get<any[]>(`${this.API_URL}/usuario/${userId}`);
}
obtenerAsesoriasPorProgramador(id: number): Observable<any[]> {
  return this.http.get<any[]>(`${environment.apiUrl}/api/asesorias/programador/${id}`);
}
  actualizarAsesoria(id: string, data: Partial<Asesoria>): Observable<any> {
    return this.http.put(`${this.API_URL}/${id}`, data);
  }
}
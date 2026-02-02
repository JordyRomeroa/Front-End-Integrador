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
  // URL de tu controlador en Java
private API_URL = `${environment.apiUrl}/api/asesorias`;
  constructor() {}

  
  // Creación vía Backend
  crearAsesoria(asesoria: Asesoria): Observable<any> {
    return this.http.post(this.API_URL, asesoria);
  }
// En tu AsesoriaService (usualmente advice.ts o asesoria.service.ts)
// En advice.ts (Servicio)
obtenerAsesoriasPorUsuario(userId: number): Observable<any[]> {
  return this.http.get<any[]>(`${this.API_URL}/usuario/${userId}`);
}
obtenerAsesoriasPorProgramador(id: number): Observable<any[]> {
  // Asegúrate de que la URL coincida con tu AdviceController de Java
  return this.http.get<any[]>(`http://localhost:8080/api/asesorias/programador/${id}`);
}
  // Actualización vía Backend (PUT)
  actualizarAsesoria(id: string, data: Partial<Asesoria>): Observable<any> {
    return this.http.put(`${this.API_URL}/${id}`, data);
  }
}
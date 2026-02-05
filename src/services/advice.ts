import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs'; // Añadido map
import { AsesoriaConId } from '../app/pages/interface/asesoria';
import { environment } from '../environments/environment';

export interface Asesoria {
  id?: number;
  mensaje: string;
  estado: string;
  mensajeRespuesta: string;
  programadorId: string;
  usuarioId: string;
  fecha?: string;
  telefono: string;
  nombreUsuario?: string;
  nombreProgramador: string;
  // Campos para recibir los objetos del backend
  usuario?: { nombre: string };
  programador?: { nombre: string };
}

@Injectable({
  providedIn: 'root'
})
export class AsesoriaService {
  private http = inject(HttpClient);
  private API_URL = `${environment.apiUrl}/api/asesorias`;

  // Mantiene todos tus métodos originales con el mapeo de datos
  obtenerTodas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}`).pipe(
      map(data => data.map(as => this.transformarAsesoria(as)))
    );
  }

  crearAsesoria(asesoria: Asesoria): Observable<any> {
    return this.http.post(this.API_URL, asesoria);
  }

  obtenerAsesoriasPorUsuario(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/usuario/${userId}`).pipe(
      map(data => data.map(as => this.transformarAsesoria(as)))
    );
  }

  obtenerAsesoriasPorProgramador(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/api/asesorias/programador/${id}`).pipe(
      map(data => data.map(as => this.transformarAsesoria(as)))
    );
  }

  actualizarAsesoria(id: string, data: Partial<Asesoria>): Observable<any> {
    return this.http.put(`${this.API_URL}/${id}`, data);
  }

  /**
   * Método de apoyo para no repetir lógica.
   * Extrae los nombres de los objetos usuario/programador 
   * y los asigna a las variables que usa tu componente.
   */
  private transformarAsesoria(as: any): any {
    return {
      ...as,
      nombreUsuario: as.usuario ? as.usuario.nombre : (as.nombreUsuario || 'Usuario'),
      nombreProgramador: as.programador ? as.programador.nombre : 'Sin asignar'
    };
  }
}
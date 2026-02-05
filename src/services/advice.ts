import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../environments/environment';

// Interfaz actualizada para coincidir con el AdviceResponseDto de Java
export interface Asesoria {
  id?: number;
  mensaje: string;
  estado: string;
  mensajeRespuesta: string;
  fecha?: string;
  telefono: string;
  nombreUsuario?: string;    // Se llenará desde el objeto usuario
  nombreProgramador?: string; // Se llenará desde el objeto programador
  // Objetos anidados que vienen del Backend
  usuario?: {
    id: number;
    nombre: string;
    contacto: string;
  };
  programador?: {
    id: number;
    nombre: string;
    contacto: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AsesoriaService {
  private http = inject(HttpClient);
  private API_URL = `${environment.apiUrl}/api/asesorias`;

  /**
   * Obtiene todas las asesorías y mapea los nombres de los objetos
   * anidados a propiedades planas para facilitar su uso en la UI.
   */
  obtenerTodas(): Observable<Asesoria[]> {
    return this.http.get<Asesoria[]>(this.API_URL).pipe(
      map(asesorias => asesorias.map(as => this.mapearAsesoria(as)))
    );
  }

  obtenerAsesoriasPorUsuario(userId: number): Observable<Asesoria[]> {
    return this.http.get<Asesoria[]>(`${this.API_URL}/usuario/${userId}`).pipe(
      map(asesorias => asesorias.map(as => this.mapearAsesoria(as)))
    );
  }

  obtenerAsesoriasPorProgramador(id: number): Observable<Asesoria[]> {
    return this.http.get<Asesoria[]>(`${this.API_URL}/programador/${id}`).pipe(
      map(asesorias => asesorias.map(as => this.mapearAsesoria(as)))
    );
  }

  crearAsesoria(asesoria: any): Observable<any> {
    return this.http.post(this.API_URL, asesoria);
  }

  actualizarAsesoria(id: string, data: Partial<Asesoria>): Observable<any> {
    return this.http.put(`${this.API_URL}/${id}`, data);
  }

  /**
   * Método privado para asegurar que nombreUsuario y nombreProgramador 
   * existan aunque el Backend envíe objetos.
   */
  private mapearAsesoria(as: Asesoria): Asesoria {
    return {
      ...as,
      nombreUsuario: as.usuario ? as.usuario.nombre : (as.nombreUsuario || 'Anónimo'),
      nombreProgramador: as.programador ? as.programador.nombre : 'Sin asignar'
    };
  }
}
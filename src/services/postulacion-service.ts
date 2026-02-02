import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class PostulacionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/users`;

  // Usuario envía postulación
  enviarPostulacion(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/postular`, data);
  }

  // Admin lista todas
  obtenerTodas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/solicitudes-postulacion`);
  }
  obtenerMiSolicitud(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/mi-solicitud`);
  }

  // Admin cambia estado
  actualizarEstado(id: number, estado: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/solicitudes-postulacion/${id}/estado`, estado);
  }
}
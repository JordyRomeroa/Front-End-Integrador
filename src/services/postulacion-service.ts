import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from "../environments/environment.prod";
@Injectable({ providedIn: 'root' })
export class PostulacionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/users`;

  enviarPostulacion(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/postular`, data);
  }
  obtenerTodas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/solicitudes-postulacion`);
  }
  obtenerMiSolicitud(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/mi-solicitud`);
  }
actualizarEstado(id: number, estado: string): Observable<void> {

  return this.http.patch<void>(
    `${this.apiUrl}/solicitudes-postulacion/${id}/estado`, 
    `"${estado}"`, 
    { headers: { 'Content-Type': 'application/json' } }
  );
}
}
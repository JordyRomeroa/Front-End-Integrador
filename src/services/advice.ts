import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, map } from 'rxjs';
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
  nombreProgramador?: string;
  usuario?: { nombre: string };
  programador?: { nombre: string };
  
}

@Injectable({
  providedIn: 'root'
})
export class AsesoriaService {
  private http = inject(HttpClient);
  private API_URL = `${environment.apiUrl}/api/asesorias`;

  // --- REACCIÓN A CAMBIOS ---
  // Este Subject almacenará la última lista de asesorías cargadas
  private _asesorias$ = new BehaviorSubject<any[]>([]);
  public asesoriasActuales$ = this._asesorias$.asObservable();

  /**
   * Carga los datos y actualiza el flujo de datos (Subject)
   */
  obtenerTodas(): Observable<any[]> {
    return this.http.get<any[]>(this.API_URL).pipe(
      map(data => data.map(as => this.transformarAsesoria(as))),
      tap(lista => this._asesorias$.next(lista)) // Notifica a todos los suscriptores
    );
  }

  crearAsesoria(asesoria: Asesoria): Observable<any> {
    return this.http.post(this.API_URL, asesoria).pipe(
      tap(() => this.refrescar()) // Dispara una actualización global
    );
  }

  actualizarAsesoria(id: number, data: Partial<Asesoria>): Observable<any> {
    return this.http.put(`${this.API_URL}/${id}`, data).pipe(
      tap(() => this.refrescar()) // Dispara una actualización global
    );
  }

  // Métodos de filtrado que también notifican cambios
  obtenerAsesoriasPorUsuario(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/usuario/${userId}`).pipe(
      map(data => data.map(as => this.transformarAsesoria(as))),
      tap(lista => this._asesorias$.next(lista))
    );
  }

  obtenerAsesoriasPorProgramador(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/programador/${id}`).pipe(
      map(data => data.map(as => this.transformarAsesoria(as))),
      tap(lista => this._asesorias$.next(lista))
    );
  }

  /**
   * Fuerza a que todos los componentes suscritos vuelvan a pedir datos
   */
  private refrescar() {
    this.obtenerTodas().subscribe();
  }

  private transformarAsesoria(as: any): any {
    return {
      ...as,
      nombreUsuario: as.usuario ? as.usuario.nombre : (as.nombreUsuario || 'Usuario'),
      nombreProgramador: as.programador ? as.programador.nombre : 'Sin asignar'
    };
  }
}
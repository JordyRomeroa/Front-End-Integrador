import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http'; 
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { ProgramadorData } from '../app/pages/interface/programador';
import { ProgramadorInfo } from '../app/pages/interface/programadorInfo';
import { environment } from "../environments/environment.prod";

@Injectable({ providedIn: 'root' })
export class ProgramadorService {
  private http = inject(HttpClient);
  private API_URL = `${environment.apiUrl}/api/users`;

  private programadoresSubject = new BehaviorSubject<ProgramadorData[]>([]);
  programadores$ = this.programadoresSubject.asObservable();

  constructor() {
    this.refrescarTabla(); 
  }

  // MÉTODO AUXILIAR: Para extraer el token del objeto 'user' o 'auth_token'
  private getAuthHeaders(): HttpHeaders {
    let token = localStorage.getItem('auth_token');

    // Si no está en auth_token, lo buscamos dentro del objeto 'user' que guardas en Login
    if (!token) {
      const userData = localStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        token = parsedUser.token || parsedUser.accessToken;
      }
    }

    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * MÉTODO REGISTRAR: Ahora 100% independiente de Firebase.
   */
  async registrarProgramador(data: ProgramadorData, uid?: string) {
    const headers = this.getAuthHeaders(); // Usamos los headers dinámicos

    const body = {
      nombre: data.nombre || '',
      contacto: data.contacto || '',
      descripcion: data.descripcion || '',
      especialidad: data.especialidad || 'General',
      redes: Array.isArray(data.redes) ? data.redes : [],
      foto: data.foto || 'https://via.placeholder.com/40'
    };

    try {
      if (uid && uid !== 'undefined') { 
        console.log("Ejecutando PUT a backend:", `${this.API_URL}/${uid}`);
        const response = await firstValueFrom(
          this.http.put(`${this.API_URL}/${uid}`, body, { headers })
        );
        await this.refrescarTabla();
        return response;
      } else {
        console.log("Ejecutando POST a backend: /create-programmer");
        const response = await firstValueFrom(
          this.http.post(`${this.API_URL}/create-programmer`, body, { headers })
        );
        await this.refrescarTabla();
        return response;
      }
    } catch (error) {
      console.error("Error en la comunicación con Spring Boot:", error);
      throw error;
    }
  }

  async obtenerProgramadores(): Promise<ProgramadorData[]> {
    try {
      const res = await firstValueFrom(this.http.get<any[]>(`${this.API_URL}/programadores`));
      return res.map(p => ({
        uid: p.id || p.uid || p.idUsuario, 
        nombre: p.nombre || 'Sin nombre',
        especialidad: p.especialidad || 'General',
        descripcion: p.descripcion || '',
        contacto: p.contacto || '',
        redes: p.redes ? (typeof p.redes === 'string' ? p.redes.split(',') : p.redes) : [],
        foto: p.foto || 'https://via.placeholder.com/40'
      }));
    } catch (error) {
      console.error('Error al obtener programadores:', error);
      return [];
    }
  }

  async refrescarTabla() {
    const lista = await this.obtenerProgramadores();
    this.programadoresSubject.next(lista);
  }

  guardarProgramador(data: ProgramadorData, uid?: string) {
    return this.registrarProgramador(data, uid);
  }

  // --- MÉTODO ELIMINAR CORREGIDO CON MANEJO DE INTEGRIDAD ---
  async eliminarProgramador(uid: string) {
    if (!uid) return;
    try {
      const headers = this.getAuthHeaders();

      console.log(`Intentando eliminar programador: ${uid}`);
      
      await firstValueFrom(
        this.http.delete(`${this.API_URL}/${uid}`, { headers })
      );
      
      await this.refrescarTabla();
    } catch (error: any) {
      console.error("Error al eliminar:", error);
      
      // Si el error es 401, el token falló
      if (error.status === 401) {
         throw new Error("No tienes permisos o tu sesión expiró.");
      }
      
      // Si el error es de integridad (asociado a proyectos/asesorías)
      // Usualmente el backend lanza 500 o 409
      throw new Error("No se puede eliminar: El programador tiene proyectos o asesorías asignadas.");
    }
  }

  async camposEspecificosProgramadores(): Promise<ProgramadorInfo[]> {
    try {
      const lista = await this.obtenerProgramadores();
      return lista.map(p => ({
        uid: p.uid!,
        nombre: p.nombre,
        especialidad: p.especialidad,
        descripcion: p.descripcion,
        foto: p.foto
      }));
    } catch (err) {
      return [];
    }
  }

  async getProgramadorByUid(uid: string): Promise<ProgramadorData | null> {
    if (!uid) return null;
    try {
      const p: any = await firstValueFrom(this.http.get(`${this.API_URL}/${uid}`));
      return {
        uid: p.id || p.uid,
        nombre: p.nombre,
        especialidad: p.especialidad,
        descripcion: p.descripcion,
        contacto: p.contacto,
        redes: p.redes ? (typeof p.redes === 'string' ? p.redes.split(',') : p.redes) : [],
        foto: p.foto,
        mustChangePassword: p.mustChangePassword
      };
    } catch (err) {
      console.error("Error buscando:", err);
      return null;
    }
  }
}
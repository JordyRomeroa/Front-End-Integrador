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

  /**
   * MÉTODO REGISTRAR: Ahora 100% independiente de Firebase.
   * Se eliminó el uso de adminUser interno y se enfoca en el backend.
   */
  async registrarProgramador(data: ProgramadorData, uid?: string) {
    const token = localStorage.getItem('auth_token');
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    const body = {
      nombre: data.nombre || '',
      contacto: data.contacto || '',
      descripcion: data.descripcion || '',
      especialidad: data.especialidad || 'General',
      redes: Array.isArray(data.redes) ? data.redes : [],
      foto: data.foto || 'https://via.placeholder.com/40'
    };

    try {
      // Si recibimos un UID (numérico o string de la DB), actualizamos
      if (uid && uid !== 'undefined') { 
        console.log("Ejecutando PUT a backend:", `${this.API_URL}/${uid}`);
        const response = await firstValueFrom(
          this.http.put(`${this.API_URL}/${uid}`, body, { headers })
        );
        await this.refrescarTabla();
        return response;
      } else {
        // MODO CREAR DIRECTO EN BACKEND
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

  // --- LO DEMÁS SE MANTIENE IGUAL ---

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

  // Se quitó el parámetro adminUser aquí también para limpiar la cadena de llamadas
  guardarProgramador(data: ProgramadorData, uid?: string) {
    return this.registrarProgramador(data, uid);
  }

  async eliminarProgramador(uid: string) {
    if (!uid) return;
    try {
      const token = localStorage.getItem('auth_token');
      const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

      await firstValueFrom(
        this.http.delete(`${this.API_URL}/${uid}`, { headers })
      );
      await this.refrescarTabla();
    } catch (error) {
      console.error("Error al eliminar:", error);
      throw error;
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
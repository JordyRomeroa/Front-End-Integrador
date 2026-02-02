import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http'; 
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { ProgramadorData } from '../app/pages/interface/programador';
import { ProgramadorInfo } from '../app/pages/interface/programadorInfo';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProgramadorService {
  private http = inject(HttpClient);
  
  // URL para desarrollo local. En Render solo cambiarás esta cadena.
  private API_URL = `${environment.apiUrl}/api/users`;

  private programadoresSubject = new BehaviorSubject<ProgramadorData[]>([]);
  programadores$ = this.programadoresSubject.asObservable();

  constructor() {
    this.refrescarTabla(); 
  }

  /** * Registra o actualiza en la DB a través de Spring Boot.
   * Se mantiene adminUser por compatibilidad de firma, pero no se usa.
   */
  async registrarProgramador(data: ProgramadorData, adminUser?: any, uid?: string) {
    const body = {
      nombre: data.nombre,
      especialidad: data.especialidad,
      descripcion: data.descripcion || '',
      contacto: data.contacto, // Este es el email/identificador en tu Java
      redes: Array.isArray(data.redes) ? data.redes.join(',') : data.redes,
      foto: data.foto || 'https://via.placeholder.com/40',
      mustChangePassword: true,
    };

    console.log("LOG: Procesando en Backend. ID:", uid || 'Nuevo Registro');

    try {
      // Si el uid existe y es numérico (Neon DB ID), actualizamos
      if (uid && !isNaN(Number(uid))) { 
        return await firstValueFrom(this.http.put(`${this.API_URL}/${uid}`, body));
      } else {
        // Registro de nuevo programador
        const response = await firstValueFrom(
          this.http.post(`${this.API_URL}/create-programmer`, body)
        );
        await this.refrescarTabla();
        return response;
      }
    } catch (error) {
      console.error("Error en la comunicación con Spring Boot:", error);
      throw error;
    }
  }

 // En tu ProgramadorService.ts
async obtenerProgramadores(): Promise<ProgramadorData[]> {
  try {
    const res = await firstValueFrom(this.http.get<any[]>(`${this.API_URL}/programadores`));
    console.log(">>> Datos crudos de Java:", res); 

    return res.map(p => ({
      // Intentamos obtener el ID de cualquier forma que venga de Java
      uid: p.id || p.uid || p.idUsuario, 
      nombre: p.nombre || 'Sin nombre',
      especialidad: p.especialidad || 'General',
      descripcion: p.descripcion || '',
      contacto: p.contacto || '',
      // Si Java envía una lista de roles en lugar de un string de redes, 
      // esto evita que el split() rompa el código
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

  /** Método puente para mantener compatibilidad con tus formularios */
  guardarProgramador(data: ProgramadorData, adminUser: any, uid?: string) {
    return this.registrarProgramador(data, adminUser, uid);
  }

  /** Elimina un registro en el Backend */
  async eliminarProgramador(uid: string) {
    if (!uid) throw new Error('ID no proporcionado');
    await firstValueFrom(this.http.delete(`${this.API_URL}/${uid}`));
    await this.refrescarTabla();
  }

  /** Mapeo simplificado para vistas públicas */
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

  /** Obtiene un programador específico por ID numérico */
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
        redes: p.redes ? p.redes.split(',') : [],
        foto: p.foto,
        mustChangePassword: p.mustChangePassword
      };
    } catch (err) {
      console.error("Error buscando programador:", err);
      return null;
    }
  }
}
export interface ProgramadorData {
  uid?: string; //uid
  id?: number;
  nombre: string;
  especialidad: string;
  descripcion?: string;
  contacto: string;
  password?: string;
  redes?: string[];
  foto?: string;
   mustChangePassword?: boolean;
}
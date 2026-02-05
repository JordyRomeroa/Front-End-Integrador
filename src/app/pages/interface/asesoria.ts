import { Asesoria } from "../../../services/advice";

export interface AsesoriaConId extends Asesoria {
 id: number;
  correoUsuario?: string;
  nombreUsuario?: string;
  fecha?: string;
  telefono:string;
  titulo: string;
  descripcion: string;
  estado: string;
}

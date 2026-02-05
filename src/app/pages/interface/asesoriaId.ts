import { Asesoria } from "../../../services/advice";
export interface AsesoriaConId extends Asesoria {
  id: number;
  titulo: string;
  descripcion: string;
  estado: string;
}

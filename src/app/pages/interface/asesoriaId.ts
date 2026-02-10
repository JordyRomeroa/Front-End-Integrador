import { Asesoria } from "../../../services/advice";
export interface AsesoriaConId extends Asesoria {
  id: string;
  titulo: string;
  descripcion: string;
  estado: string;
}

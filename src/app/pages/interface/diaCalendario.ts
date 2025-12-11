import { AsesoriaConId } from "./asesoria";

export interface DiaCalendario {
  dia: number;
  asesorias: AsesoriaConId[];
  fecha?: string | Date | { toDate: () => Date };
}

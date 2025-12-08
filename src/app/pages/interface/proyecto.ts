
export interface Proyecto {
  id?: string;
  nombre: string;
  descripcion: string;
  tipo: string;
  tecnologias: string[];
  repo: string;
  deploy: string;
  assignedTo: string; // uid del programador
}
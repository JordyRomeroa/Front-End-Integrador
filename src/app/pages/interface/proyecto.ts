
export interface Proyecto {
  id?: string;
  nombre: string;
  descripcion: string;
  tipo: string;
  categoria: string;
  tecnologias: string[];
  repo: string;
  deploy: string;
  assignedTo: string; // uid del programador
}
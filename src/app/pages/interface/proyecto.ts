export interface Proyecto {
  id?: number;
  nombre: string;
  descripcion: string;
  tipo: string;
  categoria: string;
  tecnologias: string[];
  repo: string;
  deploy: string;
  assignedTo?: string;   // Opcional para que no de error al crear el objeto de envío
  assignedToId?: number; // Añade este para el Backend
}
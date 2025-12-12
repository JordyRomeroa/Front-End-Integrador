import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';


interface Member {
  name: string;
  role: string;
  description: string;
  photo: string;
  instagram?: string;
  github?: string;
  specialty?: string;
}

@Component({
  selector: 'app-equipo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './equipo.component.html',
  styleUrls: ['./equipo.component.css']
})
export class EquipoComponent {

  admins: Member[] = [
    {
      name: 'Nayeli Barbecho',
      role: 'Administrador / Backend',
      description: 'Encargada de la organización del equipo, revisión de código y optimización de procesos.',
      photo: 'https://avatars.githubusercontent.com/u/185556763?v=4',
      instagram: 'https://instagram.com/',
      github: 'https://github.com/NayeliC98'
    },
    {
      name: 'Jordy Romero',
      role: 'Administrador / Frontend',
      description: 'Responsable del diseño, UX/UI y coordinación general de los proyectos del equipo.',
      photo: 'https://avatars.githubusercontent.com/u/236733553?s=400&u=31346ca94ed28cbe136612268be685ec657698cf&v=4',
      instagram: 'https://github.com/JordyRomeroa',
      github: 'https://github.com/JordyRomeroa'
    }
  ];

  programmers: Member[] = [
    {
      name: 'Michael Lata',
      role: 'Programador',
      specialty: 'Frontend con Angular y CSS avanzado',
      description: 'Apasionada por el diseño web y la construcción de interfaces modernas.',
      photo: 'https://avatars.githubusercontent.com/u/80653319?v=4',
      instagram: 'https://www.instagram.com/ing_mixhi?igsh=bGcwcXA0aW1zaXN1',
      github: 'https://github.com/Whiteherobot'
    },
    {
      name: 'David Villa',
      role: 'Programador',
      specialty: 'Backend con Node.js y bases de datos SQL',
      description: 'Se enfoca en arquitecturas sólidas y desarrollo escalable.',
      photo: 'https://avatars.githubusercontent.com/u/129219376?v=4',
      instagram: 'https://www.instagram.com/david_villa_hdz?igsh=azJnb2hjNnFqM3pi',
      github: 'https://github.com/Davidvillahdz'
    },
    {
      name: 'Jorge Cueva',
      role: 'Programador',
      specialty: 'Full-Stack y desarrollo de APIs',
      description: 'Apoya en integración de sistemas y desarrollo de componentes reutilizables.',
      photo: 'https://avatars.githubusercontent.com/u/100741077?v=4',
      instagram: 'https://www.instagram.com/sir_yorch?igsh=NnJqeW44M2V2dmNq',
      github: 'https://github.com/SirYorch'
    }
  ];

}

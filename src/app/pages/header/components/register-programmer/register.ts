import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true, 
  imports: [CommonModule, FormsModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
})
export class Register { 
  constructor(private router: Router) {}

  cancelar() {
    this.router.navigateByUrl('/admin', { replaceUrl: true });
  }

 registrarProgramador() {
 this.router.navigateByUrl('/admin', { replaceUrl: true });

}


}

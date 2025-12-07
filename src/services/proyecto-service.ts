// proyecto.service.ts
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ProyectoService {
  private recargarSubject = new Subject<void>();
  recargar$ = this.recargarSubject.asObservable();

  triggerReload() {
    this.recargarSubject.next();
  }
}

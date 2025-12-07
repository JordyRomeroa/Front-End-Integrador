import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { doc, Firestore, getDoc } from '@angular/fire/firestore';
import { getAuth } from 'firebase/auth';

@Injectable({
  providedIn: 'root'
})

export class ProgrammerGuard implements CanActivate {
  constructor(private router: Router, private firestore: Firestore) {}

  async canActivate(): Promise<boolean> {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      this.router.navigate(['/home']);
      return false;
    }

    try {
      const docSnap = await getDoc(doc(this.firestore, `usuarios/${user.uid}`));
      if (!docSnap.exists()) {
        console.warn("Documento de usuario no encontrado");
        this.router.navigate(['/home']);
        return false;
      }

      const role = docSnap.data()?.['role'];
      if (role === 'programmer') return true;

      this.router.navigate(['/home']);
      return false;
    } catch (err) {
      console.error("Error al verificar guard:", err);
      this.router.navigate(['/home']);
      return false;
    }
  }
}

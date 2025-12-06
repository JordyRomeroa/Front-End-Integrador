import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { doc, getDoc } from '@angular/fire/firestore';
import { AuthService } from './auth-service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  async canActivate(): Promise<boolean> {
    const user = this.auth.currentUser();
    if (!user) {
      this.router.navigate(['/home']);
      return false;
    }
    const docSnap = await getDoc(doc(this.auth['firestore'], `users/${user.uid}`));
    const role = docSnap.data()?.['role'];
    if (role === 'admin') return true;
    this.router.navigate(['/home']);
    return false;
  }
}

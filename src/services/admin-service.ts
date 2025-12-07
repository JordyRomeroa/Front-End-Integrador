import { CanActivate, Router } from "@angular/router";
import { Injectable } from "@angular/core";
import { Firestore, doc, getDoc } from "@angular/fire/firestore";
import { getAuth } from "firebase/auth";
import { AuthService } from "./auth-service";

@Injectable({
  providedIn: 'root'
})

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
    const docSnap = await getDoc(doc(this.auth['firestore'], `usuarios/${user.uid}`));
    const role = docSnap.data()?.['role'];
    if (role === 'admin') return true;
    this.router.navigate(['/home']);
    return false;
  }

}

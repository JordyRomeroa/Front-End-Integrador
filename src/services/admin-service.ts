import { CanActivate, Router } from "@angular/router";
import { AuthService } from "./auth-service";
import { doc, getDoc } from "firebase/firestore";
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class ProgrammerGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  async canActivate(): Promise<boolean> {
    const user = this.auth.currentUser();
    if (!user) {
      this.router.navigate(['/home']);
      return false;
    }
    const docSnap = await getDoc(doc(this.auth['firestore'], `users/${user.uid}`));
    const role = docSnap.data()?.['role'];
    if (role === 'programmer') return true;
    this.router.navigate(['/home']);
    return false;
  }
}

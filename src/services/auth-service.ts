import { inject, Injectable, signal } from "@angular/core";
import { 
  Auth, 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  signOut, 
  user, 
  User 
} from "@angular/fire/auth";
import { Firestore, doc, getDoc, setDoc } from "@angular/fire/firestore";
import { from, Observable } from "rxjs";
import { Router } from "@angular/router";

export type Role = 'admin' | 'programmer' | 'user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth: Auth = inject(Auth);
  private firestore: Firestore = inject(Firestore);
  private router: Router = inject(Router);

  currentUser = signal<User | null>(null);
  userRole = signal<Role | null>(null);
  user$ = user(this.auth);
  roleLoaded = signal(false);

  constructor() {

    // ====== LEER LOCAL STORAGE AL ARRANCAR ======
    const storedUser = localStorage.getItem("authUser");
    const storedRole = localStorage.getItem("authRole") as Role | null;

    if (storedUser) {
      this.currentUser.set(JSON.parse(storedUser));
    }
    if (storedRole) {
      this.userRole.set(storedRole);
      this.roleLoaded.set(true);
    }

    // ====== Suscripción al estado Firebase ======
    this.user$.subscribe({
      next: (user) => {
        this.currentUser.set(user);

        if (user) {
          localStorage.setItem("authUser", JSON.stringify(user));
          this.loadUserRole(user.uid);
        } else {
          this.clearStorage();
        }
      },
      error: (err) => console.error("Error en user$:", err)
    });
  }

  // =======================
  // GETTERS
  // =======================
  getUserRole(): Role | null {
    return this.userRole();
  }

  isAuthenticated(): boolean {
    return this.currentUser() !== null;
  }

  // =======================
  // LOGIN & REGISTER
  // =======================
  register(email: string, password: string): Observable<any> {
    return from(createUserWithEmailAndPassword(this.auth, email, password));
  }

  login(email: string, password: string): Observable<any> {
    return from(signInWithEmailAndPassword(this.auth, email, password));
  }

  loginWithGoogle(): Observable<any> {
    const provider = new GoogleAuthProvider();
    return from(signInWithPopup(this.auth, provider));
  }

  logout(): Observable<void> {
    this.clearStorage();
    return from(signOut(this.auth));
  }

  // Limpia localStorage y señales
  private clearStorage() {
    localStorage.removeItem("authUser");
    localStorage.removeItem("authRole");
    this.currentUser.set(null);
    this.userRole.set(null);
    this.roleLoaded.set(false);
  }

  // =======================
  // CARGAR ROL
  // =======================
  async loadUserRole(uid: string) {
    try {
      const docRef = doc(this.firestore, `usuarios/${uid}`);
      const docSnap = await getDoc(docRef);

      let role: Role = 'user';

      if (docSnap.exists()) {
        role = docSnap.data()['role'] || 'user';
      } else {
        await setDoc(docRef, { role: 'user' });
      }

      this.userRole.set(role);
      localStorage.setItem("authRole", role);
      this.roleLoaded.set(true);

    } catch (err) {
      console.error("Error al cargar rol:", err);
      this.userRole.set('user');
      localStorage.setItem("authRole", 'user');
      this.roleLoaded.set(true);
    }
  }

  // =======================
  // ASIGNAR ROL (ADMIN)
  // =======================
  async setUserRole(uid: string, role: Role) {
    const userRef = doc(this.firestore, `usuarios/${uid}`);
    await setDoc(userRef, { role }, { merge: true });

    // Si el admin se cambia a sí mismo
    const currentUid = this.currentUser()?.uid;

    if (uid === currentUid) {
      this.userRole.set(role);
      localStorage.setItem("authRole", role);
    }
  }
}

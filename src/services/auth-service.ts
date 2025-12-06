import { inject, Injectable, signal } from "@angular/core";
import { 
  Auth, 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  signInWithRedirect, 
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

  constructor() {
    // Suscribirse al usuario Firebase
    this.user$.subscribe((user) => {
      this.currentUser.set(user);
      console.log('AuthService - Usuario Firebase:', user);

      if (user) {
        this.loadUserRole(user.uid!);
      }
    });
  }

  getUserRole(): Role | null {
    return this.userRole();
  }

  /** Registro con email/password */
  register(email: string, password: string): Observable<any> {
    return from(createUserWithEmailAndPassword(this.auth, email, password));
  }

  /** Login con email/password */
  login(email: string, password: string): Observable<any> {
    return from(signInWithEmailAndPassword(this.auth, email, password));
  }

  /** Login con Google */
  loginWithGoogle(): Observable<any> {
    const provider = new GoogleAuthProvider();
    return from(signInWithRedirect(this.auth, provider));
  }

  /** Logout */
  logout(): Observable<void> {
    return from(signOut(this.auth));
  }

  /** Verificar si el usuario está autenticado */
  isAuthenticated(): boolean {
    return this.currentUser() !== null;
  }

  roleLoaded = signal(false);

  // auth-service.ts
async loadUserRole(uid: string) {
  try {
    const docRef = doc(this.firestore, `usuarios/${uid}`);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log("Datos del documento:", data);
      this.userRole.set(data['role'] || 'user');  // Si por alguna razón role es undefined, default 'user'
    } else {
      console.log("Documento no encontrado, creando nuevo usuario con rol 'user'");
      // Crear el documento con rol por defecto
      await setDoc(docRef, { role: 'user' });
      this.userRole.set('user');
    }

    this.roleLoaded.set(true);

  } catch (error) {
    console.error("Error al cargar rol:", error);
    this.userRole.set('user'); // Default en caso de error
    this.roleLoaded.set(true);
  }
}




  /** Asignar rol (solo Admin puede usarlo) */
  async setUserRole(uid: string, role: Role) {
    const userRef = doc(this.firestore, `users/${uid}`);
    await setDoc(userRef, { role }, { merge: true });
    this.userRole.set(role);
  }
}

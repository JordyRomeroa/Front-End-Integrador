import { inject, Injectable, signal } from "@angular/core";
import { 
  Auth, 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  signOut, 
  updatePassword, 
  user, 
  User ,
  
} from "@angular/fire/auth";

import { 
  Firestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  setDoc, 
  where ,
  
} from "@angular/fire/firestore";
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

  // ====== SEÑALES ======
  firebaseUser = signal<User | null | undefined>(undefined); // Firebase real
  currentUser = signal<User | null>(null);                   // Local user
  userRole = signal<Role | null>(null);
  roleLoaded = signal(false);

  // Observable oficial de Firebase auth
  user$ = user(this.auth);

  // alias para Home
  user = this.currentUser;

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

    // ====== ESCUCHAR CAMBIOS DE FIREBASE (reactivo) ======
    this.user$.subscribe(async (usr) => {

      console.log("🔥 Firebase user$ emitió:", usr);

      // usr puede ser undefined durante inicialización → lo guardamos
      this.firebaseUser.set(usr);

      if (usr) {
        // usuario logueado
        this.currentUser.set(usr);
        localStorage.setItem("authUser", JSON.stringify(usr));

        // cargar rol solo una vez
        if (!this.roleLoaded()) {
          await this.loadUserRole(usr.uid);
        }

      } else {
        // no logueado
        this.clearStorage();
      }
    });
  }

  // ===========================================
  // GETTERS
  // ===========================================
  getUserRole(): Role | null {
    return this.userRole();
  }

  isAuthenticated(): boolean {
    return this.currentUser() !== null;
  }

  // ===========================================
  // LOGIN Y REGISTRO
  // ===========================================
  register(email: string, password: string): Observable<any> {
    return from(createUserWithEmailAndPassword(this.auth, email, password));
  }

// dentro de AuthService
mustChangePassword = signal(false);

login(email: string, password: string): Observable<any> {
  return from(
    signInWithEmailAndPassword(this.auth, email, password).then(async (cred) => {
      const uid = cred.user.uid;
      const docRef = doc(this.firestore, `usuarios/${uid}`);
      const docSnap = await getDoc(docRef);

      const mustChange = docSnap.exists() ? !!docSnap.data()['mustChangePassword'] : false;
      this.mustChangePassword.set(mustChange);

      // 🔹 Devuelve un objeto simple
      return {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: cred.user.displayName,
        mustChangePassword: mustChange
      };
    })
  );





}
async changePassword(newPassword: string): Promise<void> {
  const user = this.auth.currentUser;
  if (!user) throw new Error('Usuario no logueado');

  await updatePassword(user, newPassword);  // ⚡ correcto

  // Quitar flag mustChangePassword en Firestore
  const docRef = doc(this.firestore, `usuarios/${user.uid}`);
  await setDoc(docRef, { mustChangePassword: false }, { merge: true });
}


  async loginWithGoogle(): Promise<any> {
  const cred = await signInWithPopup(this.auth, new GoogleAuthProvider());
  const uid = cred.user.uid;
  const docRef = doc(this.firestore, `usuarios/${uid}`);
  const docSnap = await getDoc(docRef);

  const mustChange = docSnap.exists() ? !!docSnap.data()['mustChangePassword'] : false;
  this.mustChangePassword.set(mustChange);

  return {
    uid: cred.user.uid,
    email: cred.user.email,
    displayName: cred.user.displayName,
    mustChangePassword: mustChange
  };
}


  logout(): Observable<void> {
    this.clearStorage();
    return from(signOut(this.auth));
  }

  // ===========================================
  // MÉTODOS INTERNOS
  // ===========================================
  private clearStorage() {
    localStorage.removeItem("authUser");
    localStorage.removeItem("authRole");
    this.currentUser.set(null);
    this.userRole.set(null);
    this.roleLoaded.set(false);
  }

  // ===========================================
  // CARGAR ROL DEL USUARIO
  // ===========================================
  async loadUserRole(uid: string) {
    try {
      const docRef = doc(this.firestore, `usuarios/${uid}`);
      const docSnap = await getDoc(docRef);

      let role: Role = 'user';

      if (docSnap.exists()) {
        role = docSnap.data()['role'] || 'user';
      } else {
        // si no existe, crearlo
        await setDoc(docRef, { role: 'user' });
      }

      this.userRole.set(role);
      localStorage.setItem("authRole", role);
      this.roleLoaded.set(true);

    } catch (err) {
      console.error("❌ Error al cargar rol:", err);
      this.userRole.set('user');
      localStorage.setItem("authRole", 'user');
      this.roleLoaded.set(true);
    }
  }

  // ===========================================
  // ASIGNAR ROL (ADMIN)
  // ===========================================
  async setUserRole(uid: string, role: Role) {
    const ref = doc(this.firestore, `usuarios/${uid}`);
    await setDoc(ref, { role }, { merge: true });

    if (uid === this.currentUser()?.uid) {
      this.userRole.set(role);
      localStorage.setItem("authRole", role);
    }
  }

  // ===========================================
  // OBTENER PROGRAMADORES
  // ===========================================
  async getProgramadores(): Promise<{ uid: string; email: string }[]> {
    const q = query(
      collection(this.firestore, 'usuarios'),
      where('role', '==', 'programmer')
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      uid: doc.id,
      email: doc.data()['contacto'] || doc.id
    }));
  }
 waitForFirebaseUser(): Promise<User | null> {
  return new Promise(resolve => {
    const check = setInterval(() => {
      const u = this.firebaseUser();

      // Esperamos a que Firebase deje de estar en undefined
      if (u !== undefined) {
        clearInterval(check);
        resolve(u);  // u puede ser null (no logueado)
      }
    }, 20);
  });
}


waitForRoleLoaded(): Promise<void> {
  return new Promise(resolve => {
    const t = setInterval(() => {
      if (this.roleLoaded()) {
        clearInterval(t);
        resolve();
      }
    }, 50);
  });
}

}

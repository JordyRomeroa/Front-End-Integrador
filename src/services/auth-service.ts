import { HttpClient } from "@angular/common/http";
import { inject, Injectable, signal } from "@angular/core";
import { Router } from "@angular/router";
import { 
  Auth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut 
} from "@angular/fire/auth";
import { Observable, of, tap, firstValueFrom, catchError } from "rxjs";
import { environment } from "../environments/environment.prod";

export type Role = 'ROLE_ADMIN' | 'ROLE_PROGRAMMER' | 'ROLE_USER' | 'admin' | 'programmer' | 'user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
private router = inject(Router) as Router;  private auth = inject(Auth); 
  private API_URL = `${environment.apiUrl}/auth`;

  // ====== SEÑALES ======
  currentUser = signal<any | null>(null);
  userRole = signal<Role | null>(null);
  token = signal<string | null>(null);
  roleLoaded = signal(false);
  mustChangePassword = signal(false);

  constructor() {
    this.loadStorage();
  }
  private loadStorage() {
  const storedUser = localStorage.getItem("user");
  const storedToken = localStorage.getItem("auth_token");
  const storedRole = localStorage.getItem("authRole") as Role | null;

  if (storedUser) {
    const user = JSON.parse(storedUser);
    // Nos aseguramos de que el id exista 
    this.currentUser.set(user);
    this.mustChangePassword.set(user.mustChangePassword || false);
  }
    if (storedToken) this.token.set(storedToken);
    if (storedRole) {
      this.userRole.set(storedRole);
      this.roleLoaded.set(true);
    }
  }
  // COMPROBACIÓN
  getUserRole(): Role | null { return this.userRole(); }
  
  isAdmin(): boolean {
    const r = this.userRole();
    //seguridad para ignorar mayúsculas/minúsculas
    return r?.toUpperCase() === 'ROLE_ADMIN' || r?.toLowerCase() === 'admin';
  }

  isProgrammer(): boolean {
    const r = this.userRole();
    // Modificado normalizado
    return r === 'ROLE_PROGRAMMER' || r === 'programmer' || r === 'ROLE_PROGRAMMER'.toLowerCase();
  }

  login(contacto: string, password: string): Observable<any> {
    return this.http.post(`${this.API_URL}/login`, { contacto, password }).pipe(
      tap((res: any) => this.handleAuthSuccess(res))
    );
  }
  
  async loginWithGoogle(): Promise<any> {
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(this.auth, provider);
      
      const res: any = await firstValueFrom(
        this.http.post(`${this.API_URL}/google-login`, { 
          contacto: cred.user.email,
          nombre: cred.user.displayName 
        })
      );

      if (res) this.handleAuthSuccess(res);
      return res;
    } catch (error) {
      console.error("Error en Google Login:", error);
      throw error;
    }
  }
  private handleAuthSuccess(res: any) {
  // 1. NORMALIZAR ROL
  const rawRole = res.roles && res.roles.length > 0 ? res.roles[0] : 'ROLE_USER';
  let normalizedRole = rawRole.replace("ROLE_", "").toLowerCase() as Role;
  

  const userToStore = {
    ...res,
    id: res.userId, 
    uid: res.id?.toString() 
  };

  localStorage.setItem("auth_token", res.token);
  localStorage.setItem("authRole", normalizedRole);
  localStorage.setItem("user", JSON.stringify(userToStore));

  this.token.set(res.token);
  this.userRole.set(normalizedRole);
  this.currentUser.set(userToStore); 
  this.mustChangePassword.set(res.mustChangePassword || false);
  this.roleLoaded.set(true);

  console.log("Login exitoso. ID de Usuario Java:", userToStore.id);
}

  async changePassword(newPassword: string): Promise<any> {
    const user = this.currentUser();
    const contacto = user?.email || user?.contacto || user?.username;
    
    if (!contacto) {
      throw new Error("No se encontró el identificador del usuario.");
    }
    return this.updatePassword(contacto, newPassword);
  }
updateProfile(userData: any): Observable<any> {

  return this.http.put(`${environment.apiUrl}/api/users/profile/update`, userData).pipe(
    tap((res: any) => {
      this.currentUser.set(res);
      localStorage.setItem("user", JSON.stringify(res));
    })
  );
}
  async updatePassword(contacto: string, newPassword: string): Promise<any> {
    const body = { contacto, newPassword };
    return firstValueFrom(
      this.http.put(`${this.API_URL}/update-password`, body, { 
        responseType: 'text' 
      })
    );
  }
async refreshCurrentUser() {

  const res = await firstValueFrom(
    this.http.get(`${environment.apiUrl}/api/users/me`)
  );
  this.currentUser.set(res);
  localStorage.setItem("user", JSON.stringify(res)); 
  return res;
}
 logout(): Observable<void> {

    localStorage.removeItem("auth_token");
    localStorage.removeItem("authRole");
    localStorage.removeItem("user");
    
    this.token.set(null);
    this.userRole.set(null);
    this.currentUser.set(null);
    this.roleLoaded.set(false);
    signOut(this.auth);
    this.router.navigate(['/login']);
    return of(undefined);
  }
  async getNombreProgramador(uid: string): Promise<string> {
    try {
      const res: any = await firstValueFrom(
        this.http.get(`${this.API_URL}/users/${uid}`)
      );
      return res?.nombre || 'Sin nombre';
    } catch (error) {
      console.error("Error al obtener nombre del programador:", error);
      return 'Sin nombre';
    }
  }
isUser(): boolean {
  const r = this.userRole();
  return this.token() !== null && !this.isAdmin() && !this.isProgrammer();
}

isLogged(): boolean {
  return this.token() !== null;
}

register(email: string, password: string): Observable<any> {
  const body = { 
    contacto: email, 
    password: password,
    nombre: email.split('@')[0], 
    role: 'user' 
  };
  return this.http.post(`${this.API_URL}/register`, body).pipe(
    tap((res: any) => this.handleAuthSuccess(res)),
    catchError(err => {
      console.error("Error en el registro de usuario:", err);
      throw err; 
    })
  );
}
}
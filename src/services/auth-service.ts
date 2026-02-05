import { HttpClient } from "@angular/common/http";
import { inject, Injectable, signal } from "@angular/core";
import { Router } from "@angular/router";
import { 
  Auth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut 
} from "@angular/fire/auth";
import { Observable, of, tap, firstValueFrom, catchError, BehaviorSubject } from "rxjs";
import { environment } from "../environments/environment.prod";

export type Role = 'ROLE_ADMIN' | 'ROLE_PROGRAMMER' | 'ROLE_USER' | 'admin' | 'programmer' | 'user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private auth = inject(Auth); 
  private API_URL = `${environment.apiUrl}/auth`;

  // ====== FLUJOS REACTIVOS (Detección instantánea) ======
  private userSubject = new BehaviorSubject<any | null>(JSON.parse(localStorage.getItem("user") || 'null'));
  public user$ = this.userSubject.asObservable(); 

  // ====== SEÑALES (Signals) ======
  currentUser = signal<any | null>(this.userSubject.value);
  userRole = signal<Role | null>(localStorage.getItem("authRole") as Role | null);
  token = signal<string | null>(localStorage.getItem("auth_token"));
  roleLoaded = signal(!!localStorage.getItem("authRole"));
  mustChangePassword = signal(this.userSubject.value?.mustChangePassword || false);

  constructor() {
    // Sincronización constante entre el flujo observable y la señal
    this.user$.subscribe(user => {
      this.currentUser.set(user);
      if (user) {
        this.mustChangePassword.set(user.mustChangePassword || false);
      }
    });
  }

  // ====== COMPROBACIONES DE ROL ======
  getUserRole(): Role | null { return this.userRole(); }
  
  isAdmin(): boolean {
    const r = this.userRole();
    return r?.toUpperCase() === 'ROLE_ADMIN' || r?.toLowerCase() === 'admin';
  }

  isProgrammer(): boolean {
    const r = this.userRole();
    return r?.toUpperCase() === 'ROLE_PROGRAMMER' || r?.toLowerCase() === 'programmer';
  }

  isUser(): boolean {
    return this.isLogged() && !this.isAdmin() && !this.isProgrammer();
  }

  isLogged(): boolean {
    return this.token() !== null;
  }

  // ====== MÉTODOS DE AUTENTICACIÓN ======

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
        console.error("Error en el registro:", err);
        throw err; 
      })
    );
  }

  private handleAuthSuccess(res: any) {
    const rawRole = res.roles && res.roles.length > 0 ? res.roles[0] : 'ROLE_USER';
    let normalizedRole = rawRole.replace("ROLE_", "").toLowerCase() as Role;

    const userToStore = {
      ...res,
      id: res.userId, // ID de la base de datos Java
      uid: res.id?.toString() // ID de compatibilidad
    };

    localStorage.setItem("auth_token", res.token);
    localStorage.setItem("authRole", normalizedRole);
    localStorage.setItem("user", JSON.stringify(userToStore));

    // Actualización de estado síncrona y asíncrona
    this.token.set(res.token);
    this.userRole.set(normalizedRole);
    this.userSubject.next(userToStore);
    this.roleLoaded.set(true);

    console.log("Sesión iniciada con éxito para ID:", userToStore.id);
  }

  // ====== GESTIÓN DE PERFIL Y SEGURIDAD ======

  async refreshCurrentUser() {
    try {
      const res = await firstValueFrom(this.http.get(`${environment.apiUrl}/api/users/me`));
      this.userSubject.next(res);
      localStorage.setItem("user", JSON.stringify(res)); 
      return res;
    } catch (error) {
      console.error("Error al refrescar usuario:", error);
      return null;
    }
  }

  updateProfile(userData: any): Observable<any> {
    return this.http.put(`${environment.apiUrl}/api/users/profile/update`, userData).pipe(
      tap((res: any) => {
        this.userSubject.next(res);
        localStorage.setItem("user", JSON.stringify(res));
      })
    );
  }

  async changePassword(newPassword: string): Promise<any> {
    const user = this.userSubject.value;
    const contacto = user?.email || user?.contacto || user?.username;
    if (!contacto) throw new Error("No se encontró el identificador del usuario.");
    
    return this.updatePassword(contacto, newPassword);
  }

  async updatePassword(contacto: string, newPassword: string): Promise<any> {
    const body = { contacto, newPassword };
    return firstValueFrom(
      this.http.put(`${this.API_URL}/update-password`, body, { 
        responseType: 'text' 
      })
    );
  }

  // ====== UTILIDADES ======

  async getNombreProgramador(uid: string): Promise<any> {
    try {
      // Intentamos obtener el objeto completo para tener avatar, bio, etc.
      const res: any = await firstValueFrom(
        this.http.get(`${environment.apiUrl}/api/users/${uid}`)
      );
      return res; 
    } catch (error) {
      console.error("Error al obtener datos del programador:", error);
      return 'Sin nombre';
    }
  }

  logout(): Observable<void> {
    localStorage.clear();
    this.token.set(null);
    this.userRole.set(null);
    this.userSubject.next(null);
    this.roleLoaded.set(false);
    
    signOut(this.auth);
    this.router.navigate(['/login']);
    return of(undefined);
  }
}
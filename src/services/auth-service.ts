import { HttpClient } from "@angular/common/http";
import { inject, Injectable, signal } from "@angular/core";
import { Router } from "@angular/router";
import { 
  Auth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut 
} from "@angular/fire/auth";
import { Observable, of, tap, firstValueFrom } from "rxjs";
import { environment } from "../environments/environment";

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
    // Nos aseguramos de que el id exista en la señal al recargar
    this.currentUser.set(user);
    this.mustChangePassword.set(user.mustChangePassword || false);
  }
    if (storedToken) this.token.set(storedToken);
    if (storedRole) {
      this.userRole.set(storedRole);
      this.roleLoaded.set(true);
    }
  }

  // ====== MÉTODOS DE COMPROBACIÓN ======
  getUserRole(): Role | null { return this.userRole(); }
  
  isAdmin(): boolean {
    const r = this.userRole();
    // Agregamos verificación de seguridad para ignorar mayúsculas/minúsculas
    return r?.toUpperCase() === 'ROLE_ADMIN' || r?.toLowerCase() === 'admin';
  }

  isProgrammer(): boolean {
    const r = this.userRole();
    // Modificado para aceptar tanto el formato de DB como el normalizado
    return r === 'ROLE_PROGRAMMER' || r === 'programmer' || r === 'ROLE_PROGRAMMER'.toLowerCase();
  }

  // ====== LOGIN Y REGISTRO ======

  register(email: string, password: string): Observable<any> {
    return this.http.post(`${this.API_URL}/register`, { contacto: email, password });
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
  // 1. Extraemos el rol
  const rawRole = res.roles && res.roles.length > 0 ? res.roles[0] : 'ROLE_USER';
  let normalizedRole = rawRole.replace("ROLE_", "").toLowerCase() as Role;
  
  // 2. IMPORTANTE: Sincronizar ID para evitar el 'undefined'
  // Si Java envía 'id', nos aseguramos de que Angular lo reconozca.
  const userToStore = {
    ...res,
    id: res.userId, // ID numérico de Neon
    uid: res.id?.toString() // Mantenemos uid como string del ID para no romper componentes viejos
  };

  // 3. Persistencia
  localStorage.setItem("auth_token", res.token);
  localStorage.setItem("authRole", normalizedRole);
  localStorage.setItem("user", JSON.stringify(userToStore));

  // 4. Actualización de señales
  this.token.set(res.token);
  this.userRole.set(normalizedRole);
  this.currentUser.set(userToStore); // Seteamos el objeto con el ID asegurado
  this.mustChangePassword.set(res.mustChangePassword || false);
  this.roleLoaded.set(true);

  console.log("Login exitoso. ID de Usuario Java:", userToStore.id);
}

  // ====== ACTUALIZACIÓN DE CONTRASEÑA ======

  async changePassword(newPassword: string): Promise<any> {
    const user = this.currentUser();
    const contacto = user?.email || user?.contacto || user?.username;
    
    if (!contacto) {
      throw new Error("No se encontró el identificador del usuario.");
    }
    return this.updatePassword(contacto, newPassword);
  }
// En auth.service.ts añadir:

updateProfile(userData: any): Observable<any> {
  // Enviamos los datos al nuevo endpoint de actualización propia
  return this.http.put(`${environment.apiUrl}/api/users/profile/update`, userData).pipe(
    tap((res: any) => {
      // Actualizamos la señal del usuario actual con los nuevos datos
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

  // ====== OTROS MÉTODOS ======

  // En auth.service.ts
async refreshCurrentUser() {
  // Cambiamos la URL para apuntar al controlador de usuarios, no al de auth
  const res = await firstValueFrom(
    this.http.get(`${environment.apiUrl}/api/users/me`)
  );
  this.currentUser.set(res);
  localStorage.setItem("user", JSON.stringify(res)); // Actualizamos el storage también
  return res;
}

 logout(): Observable<void> {
    // EN LUGAR DE: localStorage.clear();
    // USAMOS:
    localStorage.removeItem("auth_token");
    localStorage.removeItem("authRole");
    localStorage.removeItem("user");
    
    // Al NO borrar "app_welcome_v1_...", la marca de bienvenida persistirá.

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
  // En auth-service.ts añade este método:
isUser(): boolean {
  const r = this.userRole();
  // Solo es usuario si no es admin ni programador y está logueado
  return this.token() !== null && !this.isAdmin() && !this.isProgrammer();
}
// Dentro de ec.edu.ups.icc.proyectofinal.services.AuthService

// ... otros métodos existentes

isLogged(): boolean {
  return this.token() !== null;
}


}
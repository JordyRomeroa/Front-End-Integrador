# Proyecto de Gestión de Portafolios y Asesorías

---

## 1. *Logo de la Carrera y del Proyecto* 
![Logo del Proyecto](./src/assets/logo-proyecto.png)

---

## 2. *Integrantes*

* Nayeli Gabriela Barbecho Cajamarca  
* Jordy Romero Armijos

*Enlaces al repositorio:*  
* [Repositorio Principal](https://github.com/JordyRomeroa/Front-End-Integrador)  

*Enlace al proyecto desplegado:*  
* [Proyecto en línea](https://proyecto-final-5ed91.web.app/home/inicio)

---

## 3. *Logo Proyecto*
<img src="./src/assets/logo-universidad.png" width="150">

---

## 4. *Tecnologías Utilizadas*

<img src="./src/assets/html.png" width="60">
<img src="./src/assets/Cloudinary.png" width="60">
<img src="./src/assets/javascript.png" width="60">
<img src="./src/assets/Angular.png" width="60">

### Angular + Firebase
* Angular para frontend  
* Firebase como backend serverless  

### React + Firebase
* Componentes del portafolio construidos con React  
* Firebase Authentication / Firestore 
* Claudinary:
En nuestro proyecto, usamos Firebase como base de datos, pero para almacenar las imágenes de manera más eficiente y profesional, utilizamos Cloudinary. Esto nos permitió guardar y gestionar todas las fotos de nuestro proyecto de forma segura y rápida, mejorando la experiencia tanto para el usuario como para el equipo de desarrollo
---

## 5. *Descripción del Proyecto*

> El sistema es una aplicación desarrollada en Angular que centraliza y muestra los portafolios de los miembros del equipo, permitiendo a los usuarios explorar trabajos de manera organizada y accesible. Incluye gestión de roles, control de asesorías y sincronización en tiempo real con Firebase.

---

## 6. *Roles y Funcionalidades*

### Rol Administrador
El administrador tiene control total sobre la gestión del equipo de programadores y el sistema.  

*Funciones principales:*
* Crear programadores  
* Actualizar información de programadores  
* Eliminar programadores del sistema  

### Rol Programador
El programador gestiona su perfil, proyectos y asesorías dentro de la plataforma.  

*Funciones principales:*
* Ver asesorías asignadas o disponibles  
* Aceptar o negar asesorías  
* Editar su perfil  
* Gestionar su calendario  
* Agregar proyectos a su portafolio  

### Rol Usuario General (sin iniciar sesión)
Visitante con acceso limitado a información pública.  

*Funciones principales:*
* Visualizar la página principal  
* Ver portafolios públicos del equipo  
* Conocer la información del proyecto  
* Explorar programadores registrados  
* Solicitar asesorías  

*Acceso restringido:* No puede crear, editar ni administrar contenido dentro del sistema.

---

## 7. *Módulos y Pantallas del Sistema*

* Inicio  
* Proyectos  
* Admin: Registrar Programador  
* Programador: Mis Proyectos, Solicitudes de Asesoría, Calendario, Perfil  
* Usuario: Asesoría  

---

## 8. *Flujos Principales del Usuario*

> 1. El usuario solicita una asesoría y la información se guarda automáticamente en Firebase.  
> 2. En Firestore Database se puede consultar el documento generado.  
> 3. El programador revisa la solicitud y decide aceptar o rechazarla.  
> 4. El estado de la asesoría se actualiza en tiempo real, y si es rechazada, se agrega una justificación.  
> 5. El programador puede agregar proyectos a su portafolio; los cambios se sincronizan automáticamente.  
> 6. El administrador puede actualizar o eliminar programadores, reflejando los cambios en Firestore y Authentication.  
> 7. El sistema envía notificaciones en tiempo real tanto a usuarios como a administradores.

---

## 9. *Fragmentos Técnicos Importantes*

*AboutUs Component*
```ts
ts
// Crear usuario nuevo en Firebase Auth
const cred = await createUserWithEmailAndPassword(auth2, this.contacto, this.password);
uid = cred.user.uid;

ts
// Subir imagen a Cloudinary
fotoURL = await this.subirImagenCloudinary(this.foto);
```

*Register Component*
```ts
ts
// Mensaje dinámico y cerrar modal
alert(this.programmer ? "Programador actualizado correctamente" : "Programador registrado correctamente");
this.cerrar.emit();
this.resetFormulario();
```
```ts
*Admin Component*
ts
// Verificar rol y redirigir si no es admin
const r = this.authService.userRole();
this.role.set(r);
if (!r || r !== 'admin') this.router.navigate(['/login']);

```
*Inicio Component*
```ts

// Peticiones simultáneas a GitHub usando forkJoin
const requests = this.users.map(user => this.githubService.getRepos(user));
forkJoin(requests).subscribe({
  next: ([firstUserRepos, secondUserRepos]) => {
    this.myRepos = this.getRandomRepos(firstUserRepos, 3);
    this.partnerRepos = this.getRandomRepos(secondUserRepos, 3);
    this.cd.markForCheck();
  }
});
```
*AuthService*
ts
```ts
// Creación de asesoría con timestamps automáticos
await setDoc(docRef, {
  ...asesoria,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
});
```
## 10. *Conclusiones* 
### *Logros del proyecto*
 * Se desarrolló una aplicación funcional en Angular que gestiona portafolios, asesorías y roles de usuario. * Integración completa con Firebase para Firestore, Authentication y sincronización en tiempo real. * Implementación de notificaciones, control de acceso y reactividad.
  * Plataforma que optimiza la interacción entre usuarios y programadores. 
  ### *Qué se aprendió* 
  * Uso avanzado de Angular (componentes, rutas, servicios, reactividad).
   * Integración práctica de Firebase y reglas de seguridad. 
   * Manejo de flujos reales: solicitudes, aceptación/rechazo, gestión administrativa. 
   * Arquitectura modular y escalable. 
   * Implementación de validaciones y actualizaciones dinámicas. 
  ### *Posibles mejoras futuras* 
  * Sistema de chat en tiempo real. 
  * Panel de estadísticas para administradores y programadores. 
  * Mejoras UI/UX.
   * Notificaciones push y correo automatizado. 
   * Módulo de proyectos con imágenes, demos y filtros avanzados. 
   * Pruebas unitarias y de integración.

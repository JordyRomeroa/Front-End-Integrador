## 1. **Logo de la Carrera y del Proyecto**
![Logo del Proyecto](./src/assets/logo-proyecto.png)



---


##  **Integrantes**

* Nayeli Gabriela Barbecho Cajamarca
* Jordy
* Enlaces al repositorio
*  https://github.com/JordyRomeroa
* Enlace al repositorio desplegado
*  https://github.com/Nayelic98
##  **Logo**
<img src="./src/assets/logo-universidad.png" width="150">



---

## 3. **Tecnologías Utilizadas**
<img src="./src/assets/html.png" width="60">
<img src="./src/assets/Cloudinary.png" width="60">
<img src="./src/assets/javascript.png" width="60">
<img src="./src/assets/Angular.png" width="60">



### **Angular + Firebase **

* Angular para frontend  
* Firebase como backend serverless  


### **React + Firebase**

* Componentes del portafolio construidos con React  
* Firebase Authentication / Firestore / Storage  

(Dependiendo de su sistema)

---

## 4. **Descripción del Proyecto**

Explicar en un párrafo qué hace el sistema.

Ejemplo:

> El sistema es una aplicación desarrollada en Angular que centraliza y muestra los portafolios tanto de mi compañero como los míos, permitiendo a los usuarios explorar nuestros trabajos de manera organizada y accesible.

---

## 5. **Roles y Funcionalidades**

### **Rol Administrador**

El Administrador tiene control total sobre la gestión del equipo de programadores dentro de la plataforma.  
Sus funciones permiten mantener actualizado el personal técnico y asegurar que la información mostrada al público sea correcta.

**Entre sus principales casos de uso se encuentran:**

* Crear programadores  
* Actualizar información de programadores  
* Eliminar programadores del sistema  

---

### **Rol Programador**

El Programador es un miembro activo dentro de la plataforma, con acceso a herramientas que le permiten gestionar su trabajo, imagen profesional y disponibilidad.

**Casos de uso principales:**

* Ver asesorías asignadas o disponibles  
* Aceptar o negar asesorías  
* Editar su perfil  
* Gestionar su calendario  
* Agregar proyectos a su portafolio  

---

### **Rol Usuario General (sin iniciar sesión)**

Visitante que ingresa sin registrarse. Acceso limitado a información pública.

**Casos de uso principales:**

* Visualizar la página principal  
* Ver portafolios públicos del equipo  
* Conocer la información del proyecto  
* Explorar programadores registrados  
* Pedir asesorías  

**Acceso restringido:** No puede crear, editar, actualizar ni administrar contenido dentro del sistema.

---

## 6. **Módulos y Pantallas del Sistema**

(Ejemplos — colocar las que ustedes realmente tienen)

* Login  
* Dashboard Admin  
* Gestión de usuarios  
* Gestión de proyectos  
* Solicitudes  
* Perfil de usuario  
* Panel del programador  
* Visualización de solicitudes  

---

## 7. **Flujos Principales del Usuario**

> El usuario registrado solicita una asesoría, y en ese momento la información se envía directamente a Firebase.  
>  
> Si vamos a la consola de Firebase → Firestore Database, podemos ver el documento recién generado con todos los datos registrados.  
>  
> Luego el programador revisa la solicitud y puede aceptarla o rechazarla.  
> Cuando selecciona una opción, el sistema actualiza el estado en Firebase y, si la asesoría es rechazada, se añade una justificación almacenada en Firestore.  
>  
> Otra funcionalidad es que el programador puede agregar proyectos a su portafolio.  
> Al guardar los cambios, la información se actualiza automáticamente en Firebase.  
>  
> El administrador puede actualizar o eliminar programadores y los cambios se reflejan tanto en Firestore Database como en Authentication.  
>  
> El sistema también cuenta con notificaciones: cuando una asesoría es aprobada o rechazada, el usuario recibe una notificación, y el administrador visualiza avisos en tiempo real.

---

## 8. **Fragmentos Técnicos Importantes**

(Ejemplos — reemplazar por los tuyos)

* Código de envío de correo  
* Código de guardado en WhatsApp API  
* Código de carga a Firebase  
* Código de actualización de estado  

Fragmentos concretos y breves.

---

## 9. **Conclusiones**

### **Logros del proyecto**

* Se desarrolló una aplicación funcional en Angular que gestiona portafolios, asesorías y roles de usuario.  
* Integración completa con Firebase para Firestore, Authentication y sincronización en tiempo real.  
* Implementación de notificaciones, control de acceso y reactividad.  
* Plataforma que optimiza la interacción entre usuarios y programadores.

### **Qué se aprendió**

* Uso avanzado de Angular (componentes, rutas, servicios, reactividad).  
* Integración práctica de Firebase y reglas de seguridad.  
* Manejo de flujos reales: solicitudes, aceptación/rechazo, gestión administrativa.  
* Arquitectura modular y escalable.  
* Implementación de validaciones y actualizaciones dinámicas.

### **Posibles mejoras futuras**

* Sistema de chat en tiempo real.  
* Panel de estadísticas para administradores y programadores.  
* Mejoras UI/UX.  
* Notificaciones push y correo automatizado.  
* Módulo de proyectos con imágenes, demos y filtros avanzados.  
* Pruebas unitarias y de integración.


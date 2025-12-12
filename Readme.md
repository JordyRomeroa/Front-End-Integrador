


### **1. Flujo general del sistema**

* Explicar brevemente **qué problema resuelve el sistema** y cuál es su propósito.
* Mostrar **qué ve un usuario cuando ingresa a la página sin iniciar sesión**:

  * Página principal
  * Opciones visibles
  * Navegación básica

---

### **2. Casos de uso por roles**

####  **Rol Administrador**



####  **Rol Programador**

* Iniciar sesión como programador.
* Mostrar el panel de acceso del programador (dashboard específico si existe).
* Cómo accede a las funciones administrativas asignadas a su rol.
* Qué puede editar (proyectos, solicitudes, tareas, módulos).
* Cómo guarda los cambios y dónde se ven reflejados.
* Cómo revisa solicitudes o proyectos asignados.

####  **Rol Usuario General**

* Iniciar sesión como usuario común.
* Qué opciones aparecen en su pantalla inicial.
* Cómo crear una nueva solicitud o proyecto.
* Cómo puede visualizar el estado de sus solicitudes.
* Cómo se navega por las pantallas disponibles.

---

### **3. Flujo técnico del sistema**  EJEMPLOS poner los que tienen ustedes 


Ejemplo recomendado:

> “Aquí genero un nuevo proyecto, y en este momento se registra la información en Firebase.
> Vamos a la consola de Firebase → Firestore Database y podemos ver el documento recién creado con los datos que el sistema envió.”

También deben mostrar:

* Actualizaciones en tiempo real (si aplica).
* Ejemplo puntual de código permitido:

  * Cómo se envía un correo con EmailJS.
  * Cómo se guarda un registro en Firebase.
  * Cómo se envía un mensaje por WhatsApp (si aplica).
  * Cómo ven notificaciones  (si aplica).
  

**El código mostrado debe ser muy específico**, no una clase completa ni un componente entero.
Solo fragmentos puntuales.

Ejemplo:

```ts
emailjs.send("service_id", "template_id", {
  user: form.name,
  solicitud: form.descripcion
});
```

---

### **4. Cierre del video**

* Resumen breve del sistema.
* Cuáles son los módulos principales.
* Qué tecnologías se usaron.
* Qué roles existen y qué funcionalidades cubre cada uno.

---

#  **Estructura del Informe/README del Proyecto**

El README debe tener la siguiente estructura:

---

## 1. **Logo de la Carrera y del Proyecto**

(Incluir imagen del logo institucional y el logo del equipo/proyecto si existe).

---

## 2. **Integrantes**

* Nombres completos
* Enlaces a los repositorios personales de GitHub
* Enlace al repositorio principal del proyecto

Ejemplo:

* Juan Pérez – [https://github.com/juanperez](https://github.com/juanperez)
* María López – [https://github.com/marialopez](https://github.com/marialopez)

---

## 3. **Tecnologías Utilizadas** EJEMLO

Colocar logos 


###  **Angular + Firebase + EmailJS**

* Angular para frontend
* Firebase como backend serverless
* EmailJS para envío automático de correos
* WhatsApp API para contacto directo (si aplica)

###  **React + Firebase**

* Componentes del portafolio construidos con React
* Firebase Authentication / Firestore / Storage

(Dependiendo de su sistema).

---

## 4. **Descripción del Proyecto**

Explicar en un párrafo qué hace el sistema.

Ejemplo:

> El Portafolio Administrativo es una plataforma web diseñada para gestionar solicitudes, proyectos y registros administrativos según el rol del usuario. Permite a administradores gestionar usuarios y roles, a programadores revisar y dar mantenimiento al sistema, y a usuarios generales crear y monitorear solicitudes.
> El sistema está construido con Angular/React y utiliza Firebase como backend para autenticación, almacenamiento de datos y hosting.

---

## 5. **Roles y Funcionalidades** EJEMPLOS poner los que tienen ustedes

### **Administrador**

* Gestión de usuarios
* Gestión de roles
* Revisión y aprobación de solicitudes
* Acceso completo a panel administrativo
* Edición de módulos internos

### **Programador**

* Acceso al área técnica
* Edición de proyectos y solicitudes
* Mantenimiento de datos
* Acceso limitado según permisos

### **Usuario General**

* Crear solicitudes
* Visualizar solicitudes enviadas
* Actualizar datos personales
* Recibir notificaciones y correos

---

## 6. **Módulos y Pantallas del Sistema**  EJEMPLOS poner los que tienen ustedes

Describir cada pantalla:

* Login
* Dashboard Admin
* Gestión de usuarios
* Gestión de proyectos
* Solicitudes
* Perfil de usuario
* Panel del programador
* Visualización de solicitudes

---

## 7. **Flujos Principales del Usuario**  EJEMPLOS poner los que tienen ustedes

Explicar brevemente:

* Cómo se ingresa
* Qué se puede hacer
* Qué datos se guardan
* Cómo se refleja en Firebase

Ejemplo:

> El usuario crea una solicitud, la información se envía a Firebase y se genera un documento en la colección “solicitudes”.
> Posteriormente, el administrador puede revisar su estado desde el panel administrativo.

---

## 8. **Fragmentos Técnicos Importantes**  EJEMPLOS poner los que tienen ustedes

* Código de envío de correo
* Código de guardado whatsapp

Fragmentos concretos y muy breves.

---

## 9. **Conclusiones**

* Logros del proyecto
* Qué se aprendió
* Posibles mejoras futuras


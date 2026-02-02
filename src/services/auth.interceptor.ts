import { HttpInterceptorFn } from "@angular/common/http";

// auth.interceptor.ts
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Intentamos obtener el token de donde sea que esté
  const token = localStorage.getItem('auth_token');

  console.log('>>> Intentando interceptar:', req.url);

  if (token) {
    console.log('>>> Token encontrado, añadiendo a los headers');
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(cloned);
  }

  console.warn('>>> No se encontró token para la petición:', req.url);
  return next(req);
};
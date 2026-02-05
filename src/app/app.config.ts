import { ApplicationConfig, provideZoneChangeDetection, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from '../services/auth.interceptor';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
export const firebaseConfig = {
  apiKey: "AIzaSyDHuuKDhY8D7PtV5OfFC88anLOQBfbrGn4",
  authDomain: "proyecto-final-5ed91.firebaseapp.com",
  projectId: "proyecto-final-5ed91",
  storageBucket: "proyecto-final-5ed91.firebasestorage.app",
  messagingSenderId: "1036960154226",
  appId: "1:1036960154226:web:66225a6e175e78cec6b8eb"
};
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideAnimationsAsync(),
    provideRouter(routes, withHashLocation()),
    provideHttpClient(),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),provideHttpClient(
      withInterceptors([authInterceptor]) 
    ),
    provideHttpClient(withInterceptors([authInterceptor]))
  ]
};

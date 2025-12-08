// firebase-secondary.ts
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { firebaseConfig } from '../app/app.config';
 // <-- usa el MISMO config de tu app principal

export function getSecondaryApp(): FirebaseApp {
  // Busca si ya está creada
  const existing = getApps().find(app => app.name === 'secondary');

  if (existing) return existing;

  // Crear secondary app
  return initializeApp(firebaseConfig, 'secondary');
}

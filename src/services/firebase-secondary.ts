import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { firebaseConfig } from '../app/app.config';

export function getSecondaryApp(): FirebaseApp {

  const existing = getApps().find(app => app.name === 'secondary');

  if (existing) return existing;

  return initializeApp(firebaseConfig, 'secondary');
}

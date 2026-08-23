import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

/** Configuración de Firebase leída de variables de entorno (`.env.local`). */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_APP_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_APP_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_APP_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_APP_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
// Sin setPersistence: se usa el default de Firebase (browserLocalPersistence),
// para que la sesión no expire al cerrar la app.
export const auth = getAuth(app);

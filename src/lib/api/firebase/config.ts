import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
// --- CORREÇÃO AQUI ---
// Importa da versão completa do Firestore, que suporta onSnapshot
import { getFirestore } from "firebase/firestore";
// --------------------

// Assume que as variáveis de ambiente estão configuradas corretamente
export const firebaseConfig = {
    apiKey: import.meta.env.VITE_PUBLIC_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_PUBLIC_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Inicializa o Firebase App (evita inicialização duplicada)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Exporta as instâncias de Auth e Firestore (agora a versão completa)
export const auth = getAuth(app);
export const db = getFirestore(app); // Agora usa a versão completa

export default app;

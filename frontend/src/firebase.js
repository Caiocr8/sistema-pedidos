// src/firebase.js
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  doc
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyC9e22zLbS4Aos9VVFJ9xewTMP-unj7AAg',
  authDomain: 'maria-bonita-e8fb3.firebaseapp.com',
  projectId: 'maria-bonita-e8fb3',
  storageBucket: 'maria-bonita-e8fb3.firebasestorage.app',
  messagingSenderId: '231275625493',
  appId: '1:231275625493:web:3ffa9c34a53c95b85ea21c',
  measurementId: 'G-5QK48FBCF8'
};

const app = initializeApp(firebaseConfig);

// Analytics (ignorar em ambiente sem window como SSR)
if (typeof window !== 'undefined') {
  const { getAnalytics } = await import('firebase/analytics');
  getAnalytics(app);
}

export const db = getFirestore(app);
const menuRef = collection(db, 'cardapio');

// CRUD para o cardápio
export async function salvarMenuCompleto(menuArray) {
  for (const item of menuArray) {
    await setDoc(doc(menuRef, item.id.toString()), item);
  }
}

export async function carregarMenuCompleto() {
  const snapshot = await getDocs(menuRef);
  return snapshot.docs.map(doc => ({ id: parseInt(doc.id), ...doc.data() }));
}

export async function adicionarItem(item) {
  await setDoc(doc(menuRef, item.id.toString()), item);
}

export async function removerItemPorId(id) {
  await deleteDoc(doc(menuRef, id.toString()));
}

export async function atualizarItem(id, novosDados) {
  await updateDoc(doc(menuRef, id.toString()), novosDados);
}

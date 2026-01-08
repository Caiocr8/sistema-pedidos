import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    collection,
    query,
    where,
    getDocs,
    Timestamp,
    serverTimestamp,
    Firestore,
    FieldValue,
} from 'firebase/firestore';
import { db } from '@/lib/api/firebase/config';

// --- CORREÇÃO AQUI: Adicionado os novos cargos ao tipo 'role' ---
export interface UserData {
    uid: string;
    email: string;
    displayName?: string;
    photoURL?: string;
    // Atualizado para incluir os cargos do sistema de restaurante
    role?: 'admin' | 'user' | 'manager' | 'garcom' | 'cozinha' | 'caixa';
    createdAt?: Timestamp | FieldValue;
    updatedAt?: Timestamp | FieldValue;
    phoneNumber?: string;
    isActive?: boolean;
}

const USERS_COLLECTION = 'user';

function isDbReady(dbInstance: any): dbInstance is Firestore {
    return dbInstance && typeof dbInstance === 'object' && 'type' in dbInstance && dbInstance.type === 'firestore';
}

export async function fetchUserDataFromFirestore(
    uid: string
): Promise<UserData | null> {
    if (!isDbReady(db)) {
        console.error('fetchUserDataFromFirestore: Firestore instance (db) is not ready.');
        return null;
    }

    try {
        if (!uid || typeof uid !== 'string' || uid.trim() === '') {
            console.error('Invalid UID provided');
            return null;
        }

        const userDocRef = doc(db, USERS_COLLECTION, uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            return {
                uid: userDocSnap.id,
                ...data,
            } as UserData;
        } else {
            console.warn(`No user data found in Firestore for UID: ${uid}`);
            return null;
        }
    } catch (error) {
        console.error('Error fetching user data from Firestore:', error);
        return null;
    }
}

export async function createUserInFirestore(
    uid: string,
    userData: Omit<UserData, 'uid' | 'createdAt' | 'updatedAt'>
): Promise<boolean> {
    if (!isDbReady(db)) {
        console.error('createUserInFirestore: Firestore instance (db) is not ready.');
        return false;
    }

    try {
        if (!uid || typeof uid !== 'string' || uid.trim() === '') {
            console.error('Invalid UID provided');
            return false;
        }

        const userDocRef = doc(db, USERS_COLLECTION, uid);

        // Define um papel padrão seguro se não for fornecido
        const role = userData.role || 'garcom';

        const newUserData: Partial<UserData> = {
            ...userData,
            uid,
            isActive: userData.isActive ?? true,
            role: role,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        await setDoc(userDocRef, newUserData);
        console.log(`User created successfully: ${uid}`);
        return true;
    } catch (error) {
        console.error('Error creating user in Firestore:', error);
        return false;
    }
}

export async function updateUserInFirestore(
    uid: string,
    userData: Partial<Omit<UserData, 'uid' | 'createdAt'>>
): Promise<boolean> {
    if (!isDbReady(db)) {
        console.error('updateUserInFirestore: Firestore instance (db) is not ready.');
        return false;
    }

    try {
        if (!uid || typeof uid !== 'string' || uid.trim() === '') {
            console.error('Invalid UID provided');
            return false;
        }
        const userDocRef = doc(db, USERS_COLLECTION, uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            console.error(`User not found: ${uid}`);
            return false;
        }

        const updateData = {
            ...userData,
            updatedAt: serverTimestamp(),
        };

        await updateDoc(userDocRef, updateData);
        console.log(`User updated successfully: ${uid}`);
        return true;
    } catch (error) {
        console.error('Error updating user in Firestore:', error);
        return false;
    }
}

export async function deleteUserFromFirestore(uid: string): Promise<boolean> {
    if (!isDbReady(db)) {
        console.error('deleteUserFromFirestore: Firestore instance (db) is not ready.');
        return false;
    }
    try {
        const userDocRef = doc(db, USERS_COLLECTION, uid);
        await deleteDoc(userDocRef);
        return true;
    } catch (error) {
        console.error('Error deleting user from Firestore:', error);
        return false;
    }
}
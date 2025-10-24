// app/lib/api/firebase/user.ts
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
} from 'firebase/firestore/lite';
import { db } from '@/app/lib/api/firebase/config';

// Interface para os dados do usuário
export interface UserData {
    uid: string;
    email: string;
    displayName?: string;
    photoURL?: string;
    role?: 'admin' | 'user' | 'manager';
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
    phoneNumber?: string;
    isActive?: boolean;
}

// Nome da coleção no Firestore
const USERS_COLLECTION = 'user';

/**
 * Busca os dados do usuário no Firestore
 * @param uid - ID único do usuário
 * @returns Dados do usuário ou null se não encontrado
 */
export async function fetchUserDataFromFirestore(
    uid: string
): Promise<UserData | null> {
    try {
        // Validação do UID
        if (!uid || typeof uid !== 'string' || uid.trim() === '') {
            console.error('Invalid UID provided');
            return null;
        }

        const userDocRef = doc(db, USERS_COLLECTION, uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            const data = userDocSnap.data();

            // Retorna os dados com tipagem adequada
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

        // Log mais detalhado em desenvolvimento
        if (process.env.NODE_ENV === 'development') {
            console.error('Detailed error:', {
                uid,
                error,
                message: error instanceof Error ? error.message : 'Unknown error',
            });
        }

        return null;
    }
}

/**
 * Cria um novo usuário no Firestore
 * @param uid - ID único do usuário
 * @param userData - Dados do usuário
 * @returns true se criado com sucesso, false caso contrário
 */
export async function createUserInFirestore(
    uid: string,
    userData: Omit<UserData, 'uid' | 'createdAt' | 'updatedAt'>
): Promise<boolean> {
    try {
        if (!uid || typeof uid !== 'string' || uid.trim() === '') {
            console.error('Invalid UID provided');
            return false;
        }

        const userDocRef = doc(db, USERS_COLLECTION, uid);

        // Dados padrão do usuário
        const newUserData: Partial<UserData> = {
            ...userData,
            uid,
            isActive: userData.isActive ?? true,
            role: userData.role ?? 'user',
            createdAt: serverTimestamp() as Timestamp,
            updatedAt: serverTimestamp() as Timestamp,
        };

        await setDoc(userDocRef, newUserData);
        console.log(`User created successfully: ${uid}`);
        return true;
    } catch (error) {
        console.error('Error creating user in Firestore:', error);

        if (process.env.NODE_ENV === 'development') {
            console.error('Detailed error:', {
                uid,
                userData,
                error,
                message: error instanceof Error ? error.message : 'Unknown error',
            });
        }

        return false;
    }
}

/**
 * Atualiza os dados do usuário no Firestore
 * @param uid - ID único do usuário
 * @param userData - Dados parciais do usuário para atualizar
 * @returns true se atualizado com sucesso, false caso contrário
 */
export async function updateUserInFirestore(
    uid: string,
    userData: Partial<Omit<UserData, 'uid' | 'createdAt'>>
): Promise<boolean> {
    try {
        if (!uid || typeof uid !== 'string' || uid.trim() === '') {
            console.error('Invalid UID provided');
            return false;
        }

        const userDocRef = doc(db, USERS_COLLECTION, uid);

        // Verifica se o usuário existe
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
            console.error(`User not found: ${uid}`);
            return false;
        }

        // Atualiza com timestamp
        const updateData = {
            ...userData,
            updatedAt: serverTimestamp() as Timestamp,
        };

        await updateDoc(userDocRef, updateData);
        console.log(`User updated successfully: ${uid}`);
        return true;
    } catch (error) {
        console.error('Error updating user in Firestore:', error);

        if (process.env.NODE_ENV === 'development') {
            console.error('Detailed error:', {
                uid,
                userData,
                error,
                message: error instanceof Error ? error.message : 'Unknown error',
            });
        }

        return false;
    }
}

/**
 * Deleta um usuário do Firestore
 * @param uid - ID único do usuário
 * @returns true se deletado com sucesso, false caso contrário
 */
export async function deleteUserFromFirestore(uid: string): Promise<boolean> {
    try {
        if (!uid || typeof uid !== 'string' || uid.trim() === '') {
            console.error('Invalid UID provided');
            return false;
        }

        const userDocRef = doc(db, USERS_COLLECTION, uid);

        // Verifica se o usuário existe
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
            console.error(`User not found: ${uid}`);
            return false;
        }

        await deleteDoc(userDocRef);
        console.log(`User deleted successfully: ${uid}`);
        return true;
    } catch (error) {
        console.error('Error deleting user from Firestore:', error);

        if (process.env.NODE_ENV === 'development') {
            console.error('Detailed error:', {
                uid,
                error,
                message: error instanceof Error ? error.message : 'Unknown error',
            });
        }

        return false;
    }
}

/**
 * Busca múltiplos usuários de uma vez
 * @param uids - Array de UIDs
 * @returns Array de dados dos usuários encontrados
 */
export async function fetchMultipleUsers(uids: string[]): Promise<UserData[]> {
    try {
        if (!Array.isArray(uids) || uids.length === 0) {
            console.error('Invalid UIDs array provided');
            return [];
        }

        const promises = uids.map((uid) => fetchUserDataFromFirestore(uid));
        const results = await Promise.all(promises);

        // Filtra apenas os usuários encontrados
        return results.filter((user): user is UserData => user !== null);
    } catch (error) {
        console.error('Error fetching multiple users:', error);
        return [];
    }
}

/**
 * Verifica se um usuário existe no Firestore
 * @param uid - ID único do usuário
 * @returns true se o usuário existe, false caso contrário
 */
export async function userExists(uid: string): Promise<boolean> {
    try {
        if (!uid || typeof uid !== 'string' || uid.trim() === '') {
            return false;
        }

        const userDocRef = doc(db, USERS_COLLECTION, uid);
        const userDocSnap = await getDoc(userDocRef);

        return userDocSnap.exists();
    } catch (error) {
        console.error('Error checking user existence:', error);
        return false;
    }
}

/**
 * Busca usuários por email
 * @param email - Email do usuário
 * @returns Array de usuários encontrados (geralmente 1 ou 0)
 */
export async function getUserByEmail(email: string): Promise<UserData[]> {
    try {
        if (!email || typeof email !== 'string' || email.trim() === '') {
            console.error('Invalid email provided');
            return [];
        }

        const usersRef = collection(db, USERS_COLLECTION);
        const q = query(usersRef, where('email', '==', email.toLowerCase()));
        const querySnapshot = await getDocs(q);

        const users: UserData[] = [];
        querySnapshot.forEach((doc) => {
            users.push({
                uid: doc.id,
                ...doc.data(),
            } as UserData);
        });

        return users;
    } catch (error) {
        console.error('Error fetching user by email:', error);
        return [];
    }
}

/**
 * Busca usuários por role
 * @param role - Role do usuário
 * @returns Array de usuários com a role especificada
 */
export async function getUsersByRole(
    role: 'admin' | 'user' | 'manager'
): Promise<UserData[]> {
    try {
        const usersRef = collection(db, USERS_COLLECTION);
        const q = query(usersRef, where('role', '==', role));
        const querySnapshot = await getDocs(q);

        const users: UserData[] = [];
        querySnapshot.forEach((doc) => {
            users.push({
                uid: doc.id,
                ...doc.data(),
            } as UserData);
        });

        return users;
    } catch (error) {
        console.error('Error fetching users by role:', error);
        return [];
    }
}

/**
 * Busca todos os usuários ativos
 * @returns Array de usuários ativos
 */
export async function getActiveUsers(): Promise<UserData[]> {
    try {
        const usersRef = collection(db, USERS_COLLECTION);
        const q = query(usersRef, where('isActive', '==', true));
        const querySnapshot = await getDocs(q);

        const users: UserData[] = [];
        querySnapshot.forEach((doc) => {
            users.push({
                uid: doc.id,
                ...doc.data(),
            } as UserData);
        });

        return users;
    } catch (error) {
        console.error('Error fetching active users:', error);
        return [];
    }
}

/**
 * Desativa um usuário (soft delete)
 * @param uid - ID único do usuário
 * @returns true se desativado com sucesso, false caso contrário
 */
export async function deactivateUser(uid: string): Promise<boolean> {
    return updateUserInFirestore(uid, { isActive: false });
}

/**
 * Ativa um usuário
 * @param uid - ID único do usuário
 * @returns true se ativado com sucesso, false caso contrário
 */
export async function activateUser(uid: string): Promise<boolean> {
    return updateUserInFirestore(uid, { isActive: true });
}

/**
 * Atualiza o role de um usuário
 * @param uid - ID único do usuário
 * @param role - Novo role
 * @returns true se atualizado com sucesso, false caso contrário
 */
export async function updateUserRole(
    uid: string,
    role: 'admin' | 'user' | 'manager'
): Promise<boolean> {
    return updateUserInFirestore(uid, { role });
}
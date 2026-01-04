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
    FieldValue, // Import Firestore type for checking
} from 'firebase/firestore';
import { db } from '@/lib/api/firebase/config'; // Assumes alias is working, check tsconfig.json

// Interface para os dados do usuário (mantida)
export interface UserData {
    uid: string;
    email: string;
    displayName?: string;
    photoURL?: string;
    role?: 'admin' | 'user' | 'manager';
    createdAt?: Timestamp | FieldValue;
    updatedAt?: Timestamp | FieldValue;
    phoneNumber?: string;
    isActive?: boolean;
}

// Nome da coleção no Firestore
const USERS_COLLECTION = 'user';

// --- Helper para verificar DB ---
function isDbReady(dbInstance: any): dbInstance is Firestore {
    // Check if db is an object and looks like a Firestore instance
    return dbInstance && typeof dbInstance === 'object' && 'type' in dbInstance && dbInstance.type === 'firestore';
}

/**
 * Busca os dados do usuário no Firestore
 * @param uid - ID único do usuário
 * @returns Dados do usuário ou null se não encontrado ou db não pronto
 */
export async function fetchUserDataFromFirestore(
    uid: string
): Promise<UserData | null> {
    // --- CORREÇÃO: VERIFICA DB ---
    if (!isDbReady(db)) {
        console.error('fetchUserDataFromFirestore: Firestore instance (db) is not ready.');
        // Retorna null ou lança um erro específico para a UI tratar
        // Lançar erro pode ser melhor para AuthProvider saber que falhou
        // throw new Error('Database not ready');
        return null; // Retornando null para evitar quebrar a app
    }
    // --- FIM DA CORREÇÃO ---

    try {
        if (!uid || typeof uid !== 'string' || uid.trim() === '') {
            console.error('Invalid UID provided');
            return null;
        }

        // Agora db é seguro para usar
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
    // --- CORREÇÃO: VERIFICA DB ---
    if (!isDbReady(db)) {
        console.error('createUserInFirestore: Firestore instance (db) is not ready.');
        return false;
    }
    // --- FIM DA CORREÇÃO ---

    try {
        if (!uid || typeof uid !== 'string' || uid.trim() === '') {
            console.error('Invalid UID provided');
            return false;
        }

        const userDocRef = doc(db, USERS_COLLECTION, uid);
        const newUserData: Partial<UserData> = {
            ...userData,
            uid,
            isActive: userData.isActive ?? true,
            role: userData.role ?? 'user',
            createdAt: serverTimestamp(), // Não precisa de cast aqui
            updatedAt: serverTimestamp(),
        };

        await setDoc(userDocRef, newUserData);
        console.log(`User created successfully: ${uid}`);
        return true;
    } catch (error) {
        console.error('Error creating user in Firestore:', error);
        if (process.env.NODE_ENV === 'development') {
            console.error('Detailed error:', { uid, userData, error });
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
    // --- CORREÇÃO: VERIFICA DB ---
    if (!isDbReady(db)) {
        console.error('updateUserInFirestore: Firestore instance (db) is not ready.');
        return false;
    }
    // --- FIM DA CORREÇÃO ---

    try {
        if (!uid || typeof uid !== 'string' || uid.trim() === '') {
            console.error('Invalid UID provided');
            return false;
        }
        const userDocRef = doc(db, USERS_COLLECTION, uid);
        const userDoc = await getDoc(userDocRef); // Requer 'db' pronto
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
        if (process.env.NODE_ENV === 'development') {
            console.error('Detailed error:', { uid, userData, error });
        }
        return false;
    }
}

// --- ADICIONE A VERIFICAÇÃO `if (!isDbReady(db)) { ... }` ---
// --- NO INÍCIO DAS OUTRAS FUNÇÕES QUE USAM 'db': ---
// - deleteUserFromFirestore
// - fetchMultipleUsers (chama fetchUserDataFromFirestore, que já verifica)
// - userExists
// - getUserByEmail
// - getUsersByRole
// - getActiveUsers
// - deactivateUser (chama updateUserInFirestore, que já verifica)
// - activateUser (chama updateUserInFirestore, que já verifica)
// - updateUserRole (chama updateUserInFirestore, que já verifica)

// Exemplo para deleteUserFromFirestore:
export async function deleteUserFromFirestore(uid: string): Promise<boolean> {
    if (!isDbReady(db)) {
        console.error('deleteUserFromFirestore: Firestore instance (db) is not ready.');
        return false;
    }
    try {
        // ... restante da lógica
        const userDocRef = doc(db, USERS_COLLECTION, uid);
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
        // ... log detalhado
        return false;
    }
}

// Exemplo para getUserByEmail:
export async function getUserByEmail(email: string): Promise<UserData[]> {
    if (!isDbReady(db)) {
        console.error('getUserByEmail: Firestore instance (db) is not ready.');
        return [];
    }
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
            users.push({ uid: doc.id, ...doc.data() } as UserData);
        });
        return users;
    } catch (error) {
        console.error('Error fetching user by email:', error);
        return [];
    }
}


// **IMPORTANTE:** Aplique a verificação `if (!isDbReady(db)) { ... }`
// no início de TODAS as funções exportadas restantes que usam 'db' diretamente.

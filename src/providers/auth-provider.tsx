import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/api/firebase/config';
import { useUserStore } from '@/store/user-store';
import { UserData, fetchUserDataFromFirestore } from '@/lib/api/firebase/user';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const { setUser, setLoading } = useUserStore();

    useEffect(() => {
        setLoading(true);

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    // 1. Busca os dados adicionais (cargo/role) no Firestore
                    const firestoreData = await fetchUserDataFromFirestore(firebaseUser.uid);

                    // 2. Mescla os dados do Auth com os do Firestore
                    const userData: UserData = {
                        uid: firebaseUser.uid,
                        email: firebaseUser.email || '',
                        displayName: firebaseUser.displayName || firestoreData?.displayName,
                        photoURL: firebaseUser.photoURL || firestoreData?.photoURL,
                        // Aqui está a correção: garantimos que o role venha do banco
                        role: firestoreData?.role || 'garcom', // fallback seguro
                        isActive: firestoreData?.isActive ?? true,
                    };

                    setUser(userData);
                } catch (error) {
                    console.error("Erro ao buscar dados do usuário:", error);
                    // Em caso de erro, define um usuário básico para não travar o app
                    setUser({
                        uid: firebaseUser.uid,
                        email: firebaseUser.email || '',
                        role: 'garcom', // define um padrão com poucas permissões
                    } as UserData);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [setUser, setLoading]);

    return <>{children}</>;
}
import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/api/firebase/config';
import { useUserStore } from '@/store/user-store';
import { UserData } from '@/lib/api/firebase/user'; // Importe a interface

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const { setUser, setLoading } = useUserStore();

    useEffect(() => {
        setLoading(true);

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                // Montamos um objeto que satisfaça a interface UserData
                // (Campos opcionais ficam undefined se não existirem no user do Auth)
                const userData: UserData = {
                    uid: user.uid,
                    email: user.email || '',
                    displayName: user.displayName || undefined,
                    photoURL: user.photoURL || undefined,
                    // Outros campos obrigatórios podem precisar de valor padrão se não vierem do Firestore aqui
                    // Se você usar o initializeAuth da store, isso já é tratado lá.
                    // Mas para o AuthProvider simples, isso resolve o login imediato:
                } as UserData;

                setUser(userData);
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [setUser, setLoading]);

    return <>{children}</>;
}
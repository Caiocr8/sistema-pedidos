// app/store/user-store.ts
'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { onAuthStateChanged, signOut as firebaseSignOut, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/app/lib/api/firebase/config';
import { fetchUserDataFromFirestore, UserData } from '@/app/lib/api/firebase/user';

interface UserState {
    user: UserData | null;
    isLoading: boolean;
    isAuthReady: boolean;
    error: string | null;
}

interface UserActions {
    login: (userData: UserData) => void;
    logout: () => Promise<void>;
    updateUser: (userData: Partial<UserData>) => void;
    initializeAuth: () => () => void;
}

export const useUserStore = create<UserState & UserActions>()(
    persist(
        (set, get) => ({
            user: null,
            isLoading: false,
            isAuthReady: false,
            error: null,

            login: (userData) => {
                set({ user: userData, isLoading: false, isAuthReady: true, error: null });
            },

            logout: async () => {
                try {
                    await firebaseSignOut(auth);
                    set({ user: null, isLoading: false, isAuthReady: false, error: null });
                } catch (error) {
                    console.error('Erro ao fazer logout:', error);
                    set({ error: 'Erro ao fazer logout. Tente novamente.' });
                }
            },

            updateUser: (data) => {
                const currentUser = get().user;
                if (currentUser) set({ user: { ...currentUser, ...data } });
            },

            initializeAuth: () => {
                set({ isLoading: true, isAuthReady: false });

                const unsubscribe = onAuthStateChanged(
                    auth,
                    async (firebaseUser: FirebaseUser | null) => {
                        if (firebaseUser) {
                            try {
                                const firestoreData = await fetchUserDataFromFirestore(firebaseUser.uid);
                                const userData: UserData = {
                                    uid: firebaseUser.uid,
                                    email: firebaseUser.email || '',
                                    displayName: firebaseUser.displayName || firestoreData?.displayName,
                                    photoURL: firebaseUser.photoURL || firestoreData?.photoURL,
                                    role: firestoreData?.role,
                                    phoneNumber: firestoreData?.phoneNumber,
                                    isActive: firestoreData?.isActive ?? true,
                                    createdAt: firestoreData?.createdAt,
                                    updatedAt: firestoreData?.updatedAt,
                                };
                                set({ user: userData, isLoading: false, isAuthReady: true, error: null });
                            } catch (error) {
                                console.error('Erro ao buscar dados do usuário:', error);
                                set({
                                    user: {
                                        uid: firebaseUser.uid,
                                        email: firebaseUser.email || '',
                                        displayName: firebaseUser.displayName || undefined,
                                        photoURL: firebaseUser.photoURL || undefined,
                                    },
                                    isLoading: false,
                                    isAuthReady: true,
                                    error: 'Não foi possível carregar dados completos do usuário.',
                                });
                            }
                        } else {
                            set({ user: null, isLoading: false, isAuthReady: true, error: null });
                        }
                    },
                    (error) => {
                        console.error('Erro no listener de autenticação:', error);
                        set({ user: null, isLoading: false, isAuthReady: true, error: 'Erro ao verificar autenticação.' });
                    }
                );

                return unsubscribe;
            },
        }),
        {
            name: 'user-storage',
            partialize: (state) => ({ user: state.user }),
        }
    )
);

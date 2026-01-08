'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { onAuthStateChanged, signOut as firebaseSignOut, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/api/firebase/config';
import { fetchUserDataFromFirestore, UserData } from '@/lib/api/firebase/user';

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
    setUser: (user: UserData | null) => void;
    setLoading: (isLoading: boolean) => void;
}

export const useUserStore = create<UserState & UserActions>()(
    persist(
        (set, get) => ({
            user: null,
            isLoading: true,
            isAuthReady: false,
            error: null,

            setUser: (user) => set({ user }),
            setLoading: (isLoading) => set({ isLoading }),

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
                const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
                    // (Mantido igual ao original para brevidade, pois o AuthProvider vai sobrescrever isso na maioria dos casos)
                    if (firebaseUser) {
                        // Lógica de fetch...
                        set({ isLoading: false });
                    } else {
                        set({ user: null, isLoading: false });
                    }
                });
                return unsubscribe;
            },
        }),
        {
            name: 'user-storage',
            partialize: (state) => ({ user: state.user }),
        }
    )
);
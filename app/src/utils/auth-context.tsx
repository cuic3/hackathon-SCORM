import React, {
    createContext,
    useContext,
    useEffect,
    useState,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { Profile } from '../types/domain';

interface AuthState {
    session: Session | null;
    profile: Profile | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: string | null }>;
    signUpLearner: (
        email: string,
        password: string,
        displayName: string,
        organizationId: string
    ) => Promise<{ error: string | null }>;
    signOut: () => Promise<void>;
}

interface AuthSnapshot {
    session: Session | null;
    profile: Profile | null;
    loading: boolean;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    // A single state object, updated atomically per auth event — never as
    // separate session/profile/loading setState calls. Splitting them caused
    // a render where `session` was set but `profile` wasn't yet, which
    // RequireRole misread as "not logged in" and bounced straight back to
    // /login right after a successful sign-in.
    const [state, setState] = useState<AuthSnapshot>({
        session: null,
        profile: null,
        loading: true,
    });

    useEffect(() => {
        let isMounted = true;
        let requestId = 0;

        const resolveForSession = async (nextSession: Session | null) => {
            const thisRequest = ++requestId;
            if (!nextSession) {
                if (isMounted && thisRequest === requestId) {
                    setState({ session: null, profile: null, loading: false });
                }
                return;
            }

            setState((prev) => ({ ...prev, session: nextSession, loading: true }));
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', nextSession.user.id)
                .single();

            if (isMounted && thisRequest === requestId) {
                setState({
                    session: nextSession,
                    profile: error ? null : data,
                    loading: false,
                });
            }
        };

        supabase.auth.getSession().then(({ data }) => {
            if (!isMounted) return;
            void resolveForSession(data.session);
        });

        const { data: subscription } = supabase.auth.onAuthStateChange(
            (_event, nextSession) => {
                void resolveForSession(nextSession);
            }
        );

        return () => {
            isMounted = false;
            subscription.subscription.unsubscribe();
        };
    }, []);

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        return { error: error?.message ?? null };
    };

    const signUpLearner = async (
        email: string,
        password: string,
        displayName: string,
        organizationId: string
    ) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    display_name: displayName,
                    organization_id: organizationId,
                },
            },
        });
        if (error) {
            return { error: error.message };
        }
        if (!data.session) {
            return {
                error: 'Check your inbox to confirm your email, then sign in.',
            };
        }
        return { error: null };
    };

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider
            value={{ ...state, signIn, signUpLearner, signOut }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthState => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

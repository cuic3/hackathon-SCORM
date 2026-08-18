import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createQueryBuilder } from '../test/mocks/supabase';

const authMock = {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
};
const fromMock = vi.fn();

vi.mock('./supabase', () => ({
    supabase: {
        auth: authMock,
        from: fromMock,
    },
}));

const { AuthProvider, useAuth } = await import('./auth-context');

function TestConsumer() {
    const { session, profile, loading, signIn, signOut } = useAuth();
    return (
        <div>
            <span data-testid="loading">{String(loading)}</span>
            <span data-testid="session">{session ? (session as any).user.id : 'none'}</span>
            <span data-testid="profile">{profile ? (profile as any).display_name : 'none'}</span>
            <button onClick={() => void signIn('a@b.com', 'secret')}>sign in</button>
            <button onClick={() => void signOut()}>sign out</button>
        </div>
    );
}

function renderConsumer() {
    return render(
        <AuthProvider>
            <TestConsumer />
        </AuthProvider>
    );
}

describe('AuthProvider / useAuth', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        authMock.getSession.mockResolvedValue({ data: { session: null } });
        authMock.onAuthStateChange.mockReturnValue({
            data: { subscription: { unsubscribe: vi.fn() } },
        });
        authMock.signInWithPassword.mockResolvedValue({ error: null });
        authMock.signOut.mockResolvedValue({ error: null });
        fromMock.mockReturnValue(createQueryBuilder({ data: null, error: null }));
    });

    it('starts in a loading state and settles to logged-out when there is no session', async () => {
        renderConsumer();
        await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
        expect(screen.getByTestId('session')).toHaveTextContent('none');
        expect(screen.getByTestId('profile')).toHaveTextContent('none');
    });

    it('fetches and exposes the profile for an existing session', async () => {
        authMock.getSession.mockResolvedValue({
            data: { session: { user: { id: 'user-1' } } },
        });
        fromMock.mockReturnValue(
            createQueryBuilder({ data: { id: 'user-1', display_name: 'Ada' }, error: null })
        );

        renderConsumer();
        await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
        expect(screen.getByTestId('session')).toHaveTextContent('user-1');
        expect(screen.getByTestId('profile')).toHaveTextContent('Ada');
        expect(fromMock).toHaveBeenCalledWith('profiles');
    });

    it('sets profile to null when the profile lookup errors', async () => {
        authMock.getSession.mockResolvedValue({
            data: { session: { user: { id: 'user-1' } } },
        });
        fromMock.mockReturnValue(
            createQueryBuilder({ data: null, error: { message: 'not found' } })
        );

        renderConsumer();
        await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
        expect(screen.getByTestId('session')).toHaveTextContent('user-1');
        expect(screen.getByTestId('profile')).toHaveTextContent('none');
    });

    it('reacts to onAuthStateChange events', async () => {
        let capturedCallback: ((event: string, session: unknown) => void) | undefined;
        authMock.onAuthStateChange.mockImplementation((cb) => {
            capturedCallback = cb;
            return { data: { subscription: { unsubscribe: vi.fn() } } };
        });
        fromMock.mockReturnValue(
            createQueryBuilder({ data: { id: 'user-2', display_name: 'Grace' }, error: null })
        );

        renderConsumer();
        await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
        expect(screen.getByTestId('session')).toHaveTextContent('none');

        capturedCallback?.('SIGNED_IN', { user: { id: 'user-2' } });
        await waitFor(() => expect(screen.getByTestId('session')).toHaveTextContent('user-2'));
        expect(screen.getByTestId('profile')).toHaveTextContent('Grace');
    });

    it('ignores a stale, slower-resolving profile fetch from an earlier session', async () => {
        let capturedCallback: ((event: string, session: unknown) => void) | undefined;
        authMock.onAuthStateChange.mockImplementation((cb) => {
            capturedCallback = cb;
            return { data: { subscription: { unsubscribe: vi.fn() } } };
        });

        let resolveFirst!: (value: { data: unknown; error: null }) => void;
        const firstProfileFetch = new Promise<{ data: unknown; error: null }>((resolve) => {
            resolveFirst = resolve;
        });
        fromMock
            .mockReturnValueOnce(createQueryBuilder(firstProfileFetch as never))
            .mockReturnValue(
                createQueryBuilder({ data: { id: 'user-b', display_name: 'Second' }, error: null })
            );

        renderConsumer();
        await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));

        // First sign-in kicks off a slow profile fetch...
        capturedCallback?.('SIGNED_IN', { user: { id: 'user-a' } });
        // ...then a second sign-in fires before the first fetch resolves.
        capturedCallback?.('SIGNED_IN', { user: { id: 'user-b' } });
        await waitFor(() => expect(screen.getByTestId('profile')).toHaveTextContent('Second'));

        // The stale first fetch resolving afterwards must not clobber the newer state.
        resolveFirst({ data: { id: 'user-a', display_name: 'First' }, error: null });
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(screen.getByTestId('session')).toHaveTextContent('user-b');
        expect(screen.getByTestId('profile')).toHaveTextContent('Second');
    });

    it('signIn returns null on success', async () => {
        renderConsumer();
        await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));

        userEvent.click(screen.getByText('sign in'));
        expect(authMock.signInWithPassword).toHaveBeenCalledWith({
            email: 'a@b.com',
            password: 'secret',
        });
    });

    it('signIn surfaces the error message on failure', async () => {
        authMock.signInWithPassword.mockResolvedValue({ error: { message: 'Invalid login' } });

        function ErrorConsumer() {
            const { signIn } = useAuth();
            const [error, setError] = React.useState<string | null>(null);
            return (
                <div>
                    <span data-testid="error">{error ?? 'none'}</span>
                    <button
                        onClick={async () => {
                            const { error: err } = await signIn('a@b.com', 'wrong');
                            setError(err);
                        }}
                    >
                        sign in
                    </button>
                </div>
            );
        }

        render(
            <AuthProvider>
                <ErrorConsumer />
            </AuthProvider>
        );
        userEvent.click(screen.getByText('sign in'));
        await waitFor(() =>
            expect(screen.getByTestId('error')).toHaveTextContent('Invalid login')
        );
    });

    it('signOut calls supabase.auth.signOut', async () => {
        renderConsumer();
        await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));

        userEvent.click(screen.getByText('sign out'));
        await waitFor(() => expect(authMock.signOut).toHaveBeenCalled());
    });

    it('unsubscribes from auth state changes on unmount', async () => {
        const unsubscribe = vi.fn();
        authMock.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe } } });

        const { unmount } = renderConsumer();
        await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
        unmount();
        expect(unsubscribe).toHaveBeenCalled();
    });

    it('throws when useAuth is used outside an AuthProvider', () => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
        expect(() => render(<TestConsumer />)).toThrow(
            'useAuth must be used within an AuthProvider'
        );
        consoleError.mockRestore();
    });
});

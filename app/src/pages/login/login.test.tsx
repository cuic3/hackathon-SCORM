import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Switch } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import Login from './login';
import { useAuth } from '../../utils/auth-context';

vi.mock('../../utils/auth-context', () => ({
    useAuth: vi.fn(),
}));

const mockUseAuth = vi.mocked(useAuth);

function fillCredentials() {
    fireEvent.change(screen.getByLabelText('Email'), {
        target: { value: 'learner@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
        target: { value: 'hunter2' },
    });
}

function renderLogin() {
    return render(
        <MemoryRouter initialEntries={['/login']}>
            <Switch>
                <Route exact path="/login" component={Login} />
                <Route exact path="/">
                    <p>Home page</p>
                </Route>
            </Switch>
        </MemoryRouter>
    );
}

describe('Login', () => {
    it('renders the sign-in form when logged out', () => {
        mockUseAuth.mockReturnValue({
            session: null,
            profile: null,
            loading: false,
            signIn: vi.fn(),
            signOut: vi.fn(),
        });
        renderLogin();
        expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
        expect(screen.getByLabelText('Email')).toBeInTheDocument();
        expect(screen.getByLabelText('Password')).toBeInTheDocument();
    });

    it('redirects to / when already signed in and not loading', () => {
        mockUseAuth.mockReturnValue({
            session: { user: { id: 'u1' } } as never,
            profile: null,
            loading: false,
            signIn: vi.fn(),
            signOut: vi.fn(),
        });
        renderLogin();
        expect(screen.getByText('Home page')).toBeInTheDocument();
    });

    it('renders the form (does not redirect) while auth is still loading, even with a session', () => {
        mockUseAuth.mockReturnValue({
            session: { user: { id: 'u1' } } as never,
            profile: null,
            loading: true,
            signIn: vi.fn(),
            signOut: vi.fn(),
        });
        renderLogin();
        expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    });

    it('submits the entered email and password to signIn', async () => {
        const signIn = vi.fn().mockResolvedValue({ error: null });
        mockUseAuth.mockReturnValue({
            session: null,
            profile: null,
            loading: false,
            signIn,
            signOut: vi.fn(),
        });
        renderLogin();
        fillCredentials();
        fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

        await waitFor(() =>
            expect(signIn).toHaveBeenCalledWith('learner@example.com', 'hunter2')
        );
    });

    it('shows the error message returned by signIn', async () => {
        const signIn = vi.fn().mockResolvedValue({ error: 'Invalid credentials' });
        mockUseAuth.mockReturnValue({
            session: null,
            profile: null,
            loading: false,
            signIn,
            signOut: vi.fn(),
        });
        renderLogin();
        fillCredentials();

        fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

        await waitFor(() =>
            expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials')
        );
    });

    it('shows a submitting state and disables the button while signing in', async () => {
        let resolveSignIn!: (value: { error: string | null }) => void;
        const signIn = vi.fn(
            () =>
                new Promise<{ error: string | null }>((resolve) => {
                    resolveSignIn = resolve;
                })
        );
        mockUseAuth.mockReturnValue({
            session: null,
            profile: null,
            loading: false,
            signIn,
            signOut: vi.fn(),
        });
        renderLogin();
        fillCredentials();

        fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

        expect(await screen.findByRole('button', { name: 'Signing in…' })).toBeDisabled();

        resolveSignIn({ error: null });
        await waitFor(() =>
            expect(screen.getByRole('button', { name: 'Sign in' })).not.toBeDisabled()
        );
    });

    it('clears a previous error on a fresh submit attempt', async () => {
        const signIn = vi
            .fn()
            .mockResolvedValueOnce({ error: 'Invalid credentials' })
            .mockResolvedValueOnce({ error: null });
        mockUseAuth.mockReturnValue({
            session: null,
            profile: null,
            loading: false,
            signIn,
            signOut: vi.fn(),
        });
        renderLogin();
        fillCredentials();

        fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
        await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());

        fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
        await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
    });
});

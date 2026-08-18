import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Switch } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import RequireRole, { landingRouteForRole } from './require-role';
import { useAuth } from '../../utils/auth-context';
import type { Role } from '../../types/domain';

vi.mock('../../utils/auth-context', () => ({
    useAuth: vi.fn(),
}));

const mockUseAuth = vi.mocked(useAuth);

function renderWithRouter(allow: Role[]) {
    return render(
        <MemoryRouter initialEntries={['/protected']}>
            <Switch>
                <Route exact path="/protected">
                    <RequireRole allow={allow}>
                        <p>Protected content</p>
                    </RequireRole>
                </Route>
                <Route exact path="/login">
                    <p>Login page</p>
                </Route>
                <Route exact path="/">
                    <p>Home page</p>
                </Route>
                <Route exact path="/report">
                    <p>Report page</p>
                </Route>
                <Route exact path="/admin/upload">
                    <p>Admin page</p>
                </Route>
            </Switch>
        </MemoryRouter>
    );
}

describe('landingRouteForRole', () => {
    it('routes admin to /admin/upload', () => {
        expect(landingRouteForRole('admin')).toBe('/admin/upload');
    });

    it('routes educator to /report', () => {
        expect(landingRouteForRole('educator')).toBe('/report');
    });

    it('routes learner to /', () => {
        expect(landingRouteForRole('learner')).toBe('/');
    });

    it('defaults an unrecognized role to /', () => {
        expect(landingRouteForRole('bogus' as Role)).toBe('/');
    });
});

describe('RequireRole', () => {
    it('shows a loading state while auth is resolving', () => {
        mockUseAuth.mockReturnValue({
            session: null,
            profile: null,
            loading: true,
            signIn: vi.fn(),
            signUpLearner: vi.fn(),
            signOut: vi.fn(),
        });
        renderWithRouter(['learner']);
        expect(screen.getByText('Loading…')).toBeInTheDocument();
    });

    it('redirects to /login when there is no session', () => {
        mockUseAuth.mockReturnValue({
            session: null,
            profile: null,
            loading: false,
            signIn: vi.fn(),
            signUpLearner: vi.fn(),
            signOut: vi.fn(),
        });
        renderWithRouter(['learner']);
        expect(screen.getByText('Login page')).toBeInTheDocument();
    });

    it('redirects to /login when session exists but profile has not loaded', () => {
        mockUseAuth.mockReturnValue({
            session: { user: { id: 'u1' } } as never,
            profile: null,
            loading: false,
            signIn: vi.fn(),
            signUpLearner: vi.fn(),
            signOut: vi.fn(),
        });
        renderWithRouter(['learner']);
        expect(screen.getByText('Login page')).toBeInTheDocument();
    });

    it('renders children when the profile role is allowed', () => {
        mockUseAuth.mockReturnValue({
            session: { user: { id: 'u1' } } as never,
            profile: { role: 'learner' } as never,
            loading: false,
            signIn: vi.fn(),
            signUpLearner: vi.fn(),
            signOut: vi.fn(),
        });
        renderWithRouter(['learner']);
        expect(screen.getByText('Protected content')).toBeInTheDocument();
    });

    it('redirects a disallowed role to their own landing route', () => {
        mockUseAuth.mockReturnValue({
            session: { user: { id: 'u1' } } as never,
            profile: { role: 'admin' } as never,
            loading: false,
            signIn: vi.fn(),
            signUpLearner: vi.fn(),
            signOut: vi.fn(),
        });
        renderWithRouter(['learner']);
        expect(screen.getByText('Admin page')).toBeInTheDocument();
    });

    it('redirects an educator away from a learner-only route to /report', () => {
        mockUseAuth.mockReturnValue({
            session: { user: { id: 'u1' } } as never,
            profile: { role: 'educator' } as never,
            loading: false,
            signIn: vi.fn(),
            signUpLearner: vi.fn(),
            signOut: vi.fn(),
        });
        renderWithRouter(['learner']);
        expect(screen.getByText('Report page')).toBeInTheDocument();
    });
});

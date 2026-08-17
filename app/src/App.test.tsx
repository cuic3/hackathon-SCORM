import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import App from './App';
import { useAuth } from './utils/auth-context';

vi.mock('./utils/auth-context', () => ({
    AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useAuth: vi.fn(),
}));

vi.mock('./pages/home/home', () => ({ default: () => <p>Home Page</p> }));
vi.mock('./pages/lesson/lesson', () => ({ default: () => <p>Lesson Page</p> }));
vi.mock('./pages/login/login', () => ({ default: () => <p>Login Page</p> }));
vi.mock('./pages/admin-upload/admin-upload', () => ({ default: () => <p>Admin Page</p> }));
vi.mock('./pages/report/report', () => ({ default: () => <p>Report Page</p> }));

const mockUseAuth = vi.mocked(useAuth);

function renderAppAt(path: string) {
    window.history.pushState({}, '', path);
    return render(<App />);
}

function authAs(role: 'admin' | 'learner' | 'educator' | null) {
    mockUseAuth.mockReturnValue({
        session: role ? ({ user: { id: 'u1' } } as never) : null,
        profile: role ? ({ role } as never) : null,
        loading: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
    });
}

describe('App routing', () => {
    beforeEach(() => {
        window.history.pushState({}, '', '/');
    });

    it('renders Home at "/" for a learner', () => {
        authAs('learner');
        renderAppAt('/');
        expect(screen.getByText('Home Page')).toBeInTheDocument();
    });

    it('redirects an unauthenticated visitor at "/" to the login page', () => {
        authAs(null);
        renderAppAt('/');
        expect(screen.getByText('Login Page')).toBeInTheDocument();
    });

    it('renders Lesson at "/lesson/:id" for a learner', () => {
        authAs('learner');
        renderAppAt('/lesson/abc-123');
        expect(screen.getByText('Lesson Page')).toBeInTheDocument();
    });

    it('renders AdminUpload at "/admin/upload" for an admin', () => {
        authAs('admin');
        renderAppAt('/admin/upload');
        expect(screen.getByText('Admin Page')).toBeInTheDocument();
    });

    it('bounces a learner away from "/admin/upload" to their own landing route', () => {
        authAs('learner');
        renderAppAt('/admin/upload');
        expect(screen.getByText('Home Page')).toBeInTheDocument();
    });

    it('renders Report at "/report" for an educator', () => {
        authAs('educator');
        renderAppAt('/report');
        expect(screen.getByText('Report Page')).toBeInTheDocument();
    });

    it('bounces a non-educator away from "/report"', () => {
        authAs('admin');
        renderAppAt('/report');
        expect(screen.getByText('Admin Page')).toBeInTheDocument();
    });

    it('redirects an unrecognized path back to "/"', () => {
        authAs('learner');
        renderAppAt('/this-route-does-not-exist');
        expect(screen.getByText('Home Page')).toBeInTheDocument();
    });

    it('always renders the login page at "/login", regardless of role', () => {
        authAs('admin');
        renderAppAt('/login');
        expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
});

import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import AppShell from './app-shell';
import { useAuth } from '../../utils/auth-context';

vi.mock('../../utils/auth-context', () => ({
    useAuth: vi.fn(),
}));

const mockUseAuth = vi.mocked(useAuth);

function renderShell() {
    return render(
        <MemoryRouter>
            <AppShell>
                <p>Page content</p>
            </AppShell>
        </MemoryRouter>
    );
}

describe('AppShell', () => {
    it('renders the wordmark and page content', () => {
        mockUseAuth.mockReturnValue({
            session: null,
            profile: null,
            loading: false,
            signIn: vi.fn(),
            signUpLearner: vi.fn(),
            signOut: vi.fn(),
        });
        renderShell();
        expect(screen.getByText('Clinical Learning Hub')).toBeInTheDocument();
        expect(screen.getByText('Page content')).toBeInTheDocument();
    });

    it('shows neither the profile link nor sign-out button when logged out', () => {
        mockUseAuth.mockReturnValue({
            session: null,
            profile: null,
            loading: false,
            signIn: vi.fn(),
            signUpLearner: vi.fn(),
            signOut: vi.fn(),
        });
        renderShell();
        expect(screen.queryByText('Sign out')).not.toBeInTheDocument();
    });

    it('shows the display name link and sign-out button when logged in', () => {
        mockUseAuth.mockReturnValue({
            session: { user: { id: 'u1' } } as never,
            profile: { display_name: 'Ada Lovelace', role: 'learner' } as never,
            loading: false,
            signIn: vi.fn(),
            signUpLearner: vi.fn(),
            signOut: vi.fn(),
        });
        renderShell();
        expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
        expect(screen.getByText('Sign out')).toBeInTheDocument();
    });

    it('links the display name to the role-appropriate landing route', () => {
        mockUseAuth.mockReturnValue({
            session: { user: { id: 'u1' } } as never,
            profile: { display_name: 'Admin User', role: 'admin' } as never,
            loading: false,
            signIn: vi.fn(),
            signUpLearner: vi.fn(),
            signOut: vi.fn(),
        });
        renderShell();
        expect(screen.getByText('Admin User').closest('a')).toHaveAttribute(
            'href',
            '/admin/upload'
        );
    });

    it('points the wordmark link at "/" when logged out', () => {
        mockUseAuth.mockReturnValue({
            session: null,
            profile: null,
            loading: false,
            signIn: vi.fn(),
            signUpLearner: vi.fn(),
            signOut: vi.fn(),
        });
        renderShell();
        expect(screen.getByLabelText('Clinical Learning Hub home')).toHaveAttribute('href', '/');
    });

    it('points the wordmark link at the role landing route when logged in', () => {
        mockUseAuth.mockReturnValue({
            session: { user: { id: 'u1' } } as never,
            profile: { display_name: 'Edu User', role: 'educator' } as never,
            loading: false,
            signIn: vi.fn(),
            signUpLearner: vi.fn(),
            signOut: vi.fn(),
        });
        renderShell();
        expect(screen.getByLabelText('Clinical Learning Hub home')).toHaveAttribute(
            'href',
            '/report'
        );
    });

    it('calls signOut when the sign-out button is clicked', () => {
        const signOut = vi.fn();
        mockUseAuth.mockReturnValue({
            session: { user: { id: 'u1' } } as never,
            profile: { display_name: 'Ada Lovelace', role: 'learner' } as never,
            loading: false,
            signIn: vi.fn(),
            signUpLearner: vi.fn(),
            signOut,
        });
        renderShell();
        fireEvent.click(screen.getByText('Sign out'));
        expect(signOut).toHaveBeenCalled();
    });
});

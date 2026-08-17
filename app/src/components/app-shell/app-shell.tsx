import React from 'react';
import { NavLink } from 'react-router-dom';
// @ts-ignore
import { Header } from '@els/els-react--header';
// @ts-ignore
import { Footer } from '@els/els-react--footer';
import { useAuth } from '../../utils/auth-context';
import { landingRouteForRole } from '../require-role/require-role';
import type { Role } from '../../types/domain';
import './app-shell.scss';

const AppShell = ({ children }: { children: React.ReactNode }) => {
    const { session, profile, signOut } = useAuth();

    return (
        <div className="app-shell">
            <Header
                className="app-shell__header"
                wordmark={
                    <span className="app-shell__header__wordmark">
                        CLinical Learning Hub
                    </span>
                }
                wordmarkLink={{
                    href: profile
                        ? landingRouteForRole(profile.role as Role)
                        : '/',
                    'aria-label': 'Clinical Learning Hub home',
                }}
                hideTreeAtMobile
            >
                <nav className="app-shell__nav" aria-label="Main navigation">
                    <ul className="app-shell__nav__list">
                        {profile ? (
                            <li>
                                <NavLink
                                    to={landingRouteForRole(profile.role as Role)}
                                    exact
                                    activeClassName="app-shell__nav__link--active"
                                    className="app-shell__nav__link"
                                >
                                    {profile.display_name}
                                </NavLink>
                            </li>
                        ) : null}
                        {session ? (
                            <li>
                                <button
                                    type="button"
                                    className="app-shell__nav__link app-shell__nav__link--button"
                                    onClick={() => signOut()}
                                >
                                    Sign out
                                </button>
                            </li>
                        ) : null}
                    </ul>
                </nav>
            </Header>
            <main className="app-shell__body">{children}</main>
            <Footer
                className="app-shell__footer"
                legalEntity="Elsevier Inc."
                applicationLinks={[]}
            />
        </div>
    );
};

export default AppShell;

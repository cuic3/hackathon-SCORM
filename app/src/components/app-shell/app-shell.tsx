import React from 'react';
import { NavLink } from 'react-router-dom';
// @ts-ignore
import { Header } from '@els/els-react--header';
// @ts-ignore
import { Footer } from '@els/els-react--footer';
import './app-shell.scss';

const AppShell = ({ children }: { children: React.ReactNode }) => (
    <div className="app-shell">
        <Header
            className="app-shell__header"
            wordmark={
                <span className="app-shell__header__wordmark">
                    Custom Content Uploader
                </span>
            }
            wordmarkLink={{
                href: '/',
                'aria-label': 'Custom Content Uploader home',
            }}
            hideTreeAtMobile
        >
            <nav className="app-shell__nav" aria-label="Main navigation">
                <ul className="app-shell__nav__list">
                    <li>
                        <NavLink
                            to="/"
                            exact
                            activeClassName="app-shell__nav__link--active"
                            className="app-shell__nav__link"
                        >
                            Home
                        </NavLink>
                    </li>
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

export default AppShell;

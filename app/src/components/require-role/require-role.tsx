import React from 'react';
import { Redirect } from 'react-router-dom';
import { useAuth } from '../../utils/auth-context';
import type { Role } from '../../types/domain';

export const landingRouteForRole = (role: Role): string => {
    switch (role) {
        case 'admin':
            return '/admin/upload';
        case 'educator':
            return '/report';
        case 'learner':
        default:
            return '/';
    }
};

const RequireRole = ({
    allow,
    children,
}: {
    allow: Role[];
    children: React.ReactNode;
}) => {
    const { session, profile, loading } = useAuth();

    if (loading) {
        return <p>Loading…</p>;
    }
    if (!session || !profile) {
        return <Redirect to="/login" />;
    }
    if (!allow.includes(profile.role as Role)) {
        return <Redirect to={landingRouteForRole(profile.role as Role)} />;
    }
    return <>{children}</>;
};

export default RequireRole;


import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { User, UserRole } from '../types';

interface AuthGuardProps {
    children: React.ReactNode;
    user: User | null;
    allowedRoles: UserRole[];
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children, user, allowedRoles }) => {
    const location = useLocation();

    if (!user) {
        // Redirect to the appropriate login page based on where they were trying to go
        if (location.pathname.startsWith('/admin')) {
            return <Navigate to="/admin-login" replace />;
        }
        if (location.pathname.startsWith('/cashier')) {
            return <Navigate to="/cashier-login" replace />;
        }
        return <Navigate to="/" replace />;
    }

    if (!allowedRoles.includes(user.role)) {
        // Redirect to a default safe page if they don't have the right role
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

export default AuthGuard;

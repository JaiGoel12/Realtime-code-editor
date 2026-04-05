import React from 'react';
import { SignUp } from '@clerk/clerk-react';
import { useLocation } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import { buildClerkAppearance } from '../clerkAppearance';
import { useCodeSyncTheme } from '../hooks/useCodeSyncTheme';

function redirectPath(from) {
    if (!from) return '/';
    return `${from.pathname}${from.search || ''}${from.hash || ''}`;
}

const SignUpPage = () => {
    const mode = useCodeSyncTheme();
    const location = useLocation();
    const from = location.state?.from;
    const fallbackRedirectUrl = redirectPath(from);

    return (
        <AuthLayout lede="Create an account to join sessions and invite your team.">
            <SignUp
                routing="path"
                path="/sign-up"
                signInUrl="/sign-in"
                fallbackRedirectUrl={fallbackRedirectUrl}
                appearance={buildClerkAppearance(mode)}
            />
        </AuthLayout>
    );
};

export default SignUpPage;

import React from 'react';
import { SignIn } from '@clerk/clerk-react';
import { useLocation } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import { buildClerkAppearance } from '../clerkAppearance';
import { useCodeSyncTheme } from '../hooks/useCodeSyncTheme';

function redirectPath(from) {
    if (!from) return '/';
    return `${from.pathname}${from.search || ''}${from.hash || ''}`;
}

const SignInPage = () => {
    const mode = useCodeSyncTheme();
    const location = useLocation();
    const from = location.state?.from;
    const fallbackRedirectUrl = redirectPath(from);

    return (
        <AuthLayout lede="Sign in to open your room and sync code in real time.">
            <SignIn
                routing="path"
                path="/sign-in"
                signUpUrl="/sign-up"
                fallbackRedirectUrl={fallbackRedirectUrl}
                appearance={buildClerkAppearance(mode)}
            />
        </AuthLayout>
    );
};

export default SignInPage;

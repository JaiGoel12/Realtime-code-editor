import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles/theme.css';
import './index.css';
import { applyTheme, getTheme } from './utils/theme';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { ClerkProvider } from '@clerk/clerk-react';

const PUBLISHABLE_KEY = "pk_test_Z3JhdGVmdWwtYW50ZWF0ZXItMzMuY2xlcmsuYWNjb3VudHMuZGV2JA"
if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key")
}

applyTheme(getTheme());

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      afterSignOutUrl="/"
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      appearance={{
        layout: {
          unsafe_disableDevelopmentModeWarnings: true,
        },
      }}
    >
      <App />
    </ClerkProvider>
  </React.StrictMode>
);

reportWebVitals();

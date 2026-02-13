import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { ClerkProvider } from '@clerk/clerk-react'


// Import your Publishable Key\
const PUBLISHABLE_KEY = "pk_test_Z3JhdGVmdWwtYW50ZWF0ZXItMzMuY2xlcmsuYWNjb3VudHMuZGV2JA"
if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key")
}

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <App />
    </ClerkProvider>
  </React.StrictMode>
);

reportWebVitals();

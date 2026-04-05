import React from 'react';
import '../styles/auth-layout.css';
import ThemeToggle from '../components/ThemeToggle';

/**
 * Shared shell for Clerk auth — matches home/editor ambient and glass language.
 */
function AuthLayout({ lede, children }) {
    return (
        <div className="cs-auth-page">
            <div className="cs-auth-ambient" aria-hidden>
                <div className="cs-auth-orb cs-auth-orb--a" />
                <div className="cs-auth-orb cs-auth-orb--b" />
                <div className="cs-auth-orb cs-auth-orb--c" />
                <div className="cs-auth-grid" />
                <div className="cs-auth-vignette" />
            </div>
            <div className="cs-auth-shell">
                <div className="cs-auth-panel">
                    <div className="cs-auth-top">
                        <div className="cs-auth-brand">
                            <img src="/code-sync.png" alt="" />
                            <div className="cs-auth-brand-text">
                                <span className="cs-auth-brand-eyebrow">
                                    CodeSync
                                </span>
                                <span className="cs-auth-brand-name">
                                    Live collaboration
                                </span>
                            </div>
                        </div>
                        <ThemeToggle />
                    </div>
                    {lede ? <p className="cs-auth-lede">{lede}</p> : null}
                    <div className="cs-auth-clerk">{children}</div>
                </div>
            </div>
        </div>
    );
}

export default AuthLayout;

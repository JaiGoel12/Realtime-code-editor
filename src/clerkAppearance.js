/** Outfit + CodeSync palette for Clerk `<SignIn />` / `<SignUp />`. */

const FONT = "'Outfit', system-ui, sans-serif";

const LAYOUT = {
    logoPlacement: 'none',
    animations: true,
    /** Hides the orange “Development mode” strip on dev instances (preview prod UI). */
    unsafe_disableDevelopmentModeWarnings: true,
};

const ELEMENTS_BASE = {
    rootBox: {
        width: '100%',
        maxWidth: '26.5rem',
        marginLeft: 'auto',
        marginRight: 'auto',
    },
    cardBox: {
        borderRadius: '20px',
    },
    card: {
        borderRadius: '20px',
        border: '1px solid rgba(138, 180, 248, 0.14)',
    },
    headerTitle: {
        fontFamily: FONT,
        letterSpacing: '-0.02em',
    },
    headerSubtitle: {
        fontFamily: FONT,
    },
    socialButtonsBlockButton: {
        fontFamily: FONT,
        borderRadius: '12px',
    },
    formButtonPrimary: {
        fontFamily: FONT,
        borderRadius: '12px',
        fontWeight: '600',
    },
    formFieldInput: {
        fontFamily: FONT,
        borderRadius: '12px',
    },
    footerActionLink: {
        fontFamily: FONT,
        fontWeight: '600',
    },
    identityPreviewText: {
        fontFamily: FONT,
    },
    formFieldLabel: {
        fontFamily: FONT,
    },
    dividerLine: {
        background: 'rgba(138, 180, 248, 0.2)',
    },
    dividerText: {
        fontFamily: FONT,
    },
};

/**
 * @param {'dark' | 'light'} mode
 */
export function buildClerkAppearance(mode) {
    const light = mode === 'light';

    const variables = light
        ? {
              colorPrimary: '#1558c0',
              colorTextOnPrimaryBackground: '#ffffff',
              colorDanger: '#b3261e',
              colorSuccess: '#137333',
              colorWarning: '#c26401',
              colorNeutral: '#0f172a',
              colorText: '#0f172a',
              colorTextSecondary: '#5c6b82',
              colorBackground: 'rgba(255, 255, 255, 0.97)',
              colorInputText: '#0f172a',
              colorInputBackground: 'rgba(255, 255, 255, 0.98)',
              fontFamily: FONT,
              fontFamilyButtons: FONT,
              borderRadius: '12px',
              spacingUnit: '0.875rem',
          }
        : {
              colorPrimary: '#8ab4f8',
              colorTextOnPrimaryBackground: '#0a1628',
              colorDanger: '#ff6b6b',
              colorSuccess: '#5cdb95',
              colorWarning: '#ffb74d',
              colorNeutral: '#ffffff',
              colorText: '#f0f3fa',
              colorTextSecondary: '#8b95b0',
              colorBackground: 'rgba(12, 16, 28, 0.94)',
              colorInputText: '#f0f3fa',
              colorInputBackground: 'rgba(8, 10, 20, 0.88)',
              fontFamily: FONT,
              fontFamilyButtons: FONT,
              borderRadius: '12px',
              spacingUnit: '0.875rem',
          };

    const cardShadow = light
        ? '0 22px 56px rgba(15, 23, 42, 0.09), 0 0 0 1px rgba(21, 88, 192, 0.1) inset'
        : '0 24px 64px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(138, 180, 248, 0.1) inset';

    const cardBorder = light
        ? '1px solid rgba(21, 88, 192, 0.12)'
        : '1px solid rgba(138, 180, 248, 0.16)';

    return {
        layout: LAYOUT,
        variables,
        elements: {
            ...ELEMENTS_BASE,
            card: {
                ...ELEMENTS_BASE.card,
                boxShadow: cardShadow,
                border: cardBorder,
            },
        },
    };
}

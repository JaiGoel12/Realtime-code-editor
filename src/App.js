import './App.css';
import {
    BrowserRouter,
    Routes,
    Route,
    useLocation,
    useParams,
    Navigate,
} from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Home from './pages/Home';
import EditorPage from './pages/EditorPage';
import { SignedIn, SignedOut, RedirectToSignIn, useUser } from '@clerk/clerk-react';
import { useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';

function RoomToEditorRedirect() {
    const { roomId } = useParams();
    return <Navigate to={`/editor/${roomId}`} replace />;
}

/**
 * Keeps the current URL (e.g. /room/:id) so after Clerk sign-in/sign-up
 * the user lands back here and enters the editor automatically.
 */
function ClerkGate() {
    const location = useLocation();
    const redirectUrl = `${window.location.origin}${location.pathname}${location.search}`;

    return (
        <>
            <SignedOut>
                <RedirectToSignIn redirectUrl={redirectUrl} />
            </SignedOut>
            <SignedIn>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/room/:roomId" element={<RoomToEditorRedirect />} />
                    <Route path="/editor/:roomId" element={<EditorPage />} />
                </Routes>
            </SignedIn>
        </>
    );
}

function App() {
    const { user } = useUser(); // Clerk hook to get the logged-in user

    useEffect(() => {
        if (user?.username) {
            console.log(user.username);
        }
    }, [user]);

    return (
        <>
            <div>
                <Toaster
                    position="top-right"
                    toastOptions={{
                        className: 'cs-toast-base',
                        duration: 3200,
                        style: {
                            background: 'rgba(22, 24, 38, 0.92)',
                            color: '#e8eaf4',
                        },
                        success: {
                            iconTheme: {
                                primary: '#8ab4f8',
                                secondary: '#0a1628',
                            },
                        },
                        error: {
                            iconTheme: {
                                primary: '#ff5c6c',
                                secondary: '#fff',
                            },
                        },
                    }}
                />
            </div>

            <BrowserRouter>
                <header>
                    <ClerkGate />
                </header>
            </BrowserRouter>
            <Analytics />
        </>
    );
}

export default App;

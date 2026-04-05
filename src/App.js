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
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import { SignedIn, SignedOut, useUser } from '@clerk/clerk-react';
import { useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';

function RoomToEditorRedirect() {
    const { roomId } = useParams();
    return <Navigate to={`/editor/${roomId}`} replace />;
}

/**
 * Signed-out users get themed in-app Clerk pages. `Navigate` preserves `location`
 * so after sign-in/sign-up they return to the same path (e.g. /room/:id invite flow).
 */
function ClerkGate() {
    const location = useLocation();

    return (
        <>
            <SignedOut>
                <Routes>
                    <Route path="/sign-in/*" element={<SignInPage />} />
                    <Route path="/sign-up/*" element={<SignUpPage />} />
                    <Route
                        path="*"
                        element={
                            <Navigate
                                to="/sign-in"
                                replace
                                state={{ from: location }}
                            />
                        }
                    />
                </Routes>
            </SignedOut>
            <SignedIn>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/room/:roomId" element={<RoomToEditorRedirect />} />
                    <Route path="/editor/:roomId" element={<EditorPage />} />
                    <Route
                        path="/sign-in/*"
                        element={<Navigate to="/" replace />}
                    />
                    <Route
                        path="/sign-up/*"
                        element={<Navigate to="/" replace />}
                    />
                    <Route path="*" element={<Navigate to="/" replace />} />
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

import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Home from './pages/Home';
import EditorPage from './pages/EditorPage';
import { SignedIn, SignedOut, RedirectToSignIn, useUser } from '@clerk/clerk-react';
import { useEffect, useState } from 'react';

function App() {
    const { user } = useUser(); // Clerk hook to get the logged-in user
    const [loggedUser, setLoggedUser] = useState();

    useEffect(() => {
        if (user) {
            setLoggedUser(user);
            console.log(user.username);
        }
    }, [user]);

    return (
        <>
            <div>
                <Toaster
                    position="top-right"
                    toastOptions={{
                        success: {
                            theme: {
                                primary: '#4aed88',
                            },
                        },
                    }}
                />
            </div>

            <BrowserRouter>
                <header>
                    {/* Show user button and username if logged in */}
                    <SignedOut>
                        <RedirectToSignIn />
                    </SignedOut>
                    <SignedIn>
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/editor/:roomId" element={<EditorPage />} />
                        </Routes>
                    </SignedIn>
                </header>


            </BrowserRouter>
        </>
    );
}

export default App;

import React, { useState, useEffect } from 'react';
import { v4 as uuidV4 } from 'uuid';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useUser, UserButton } from '@clerk/clerk-react';

const Home = () => {
    const navigate = useNavigate();
    const { user } = useUser();
    const [roomId, setRoomId] = useState('');
    const [username, setUsername] = useState('');

    useEffect(() => {
        if (user && user.username) {
            setUsername(user.username);
        }
    }, [user]);

    const createNewRoom = (e) => {
        e.preventDefault();
        const id = uuidV4();
        setRoomId(id);
        toast.success('Created a new room');
    };

    const joinRoom = () => {
        if (!roomId || !username) {
            toast.error('ROOM ID & username is required');
            return;
        }

        navigate(`/editor/${roomId}`, {
            state: {
                username,
            },
        });
    };

    const handleInputEnter = (e) => {
        if (e.code === 'Enter') {
            joinRoom();
        }
    };

    return (
        <div className="homePageWrapper">
            <div className="home-orb home-orb--a" aria-hidden />
            <div className="home-orb home-orb--b" aria-hidden />
            <div className="home-orb home-orb--c" aria-hidden />
            <div className="home-grid" aria-hidden />
            <div className="home-vignette" aria-hidden />

            <div className="home-shell">
                <section className="home-hero" aria-labelledby="home-title">
                    <p className="home-hero-eyebrow">CodeSync</p>
                    <h1 id="home-title" className="home-hero-title">
                        Real-time code,
                        <span className="home-hero-title-accent"> zero friction.</span>
                    </h1>
                    <div className="home-hero-beam" aria-hidden />
                    <p className="home-hero-lede">
                        Share one invite link. Teammates sign in, land in your room, and edit
                        together—instantly.
                    </p>
                    <ul className="home-hero-points">
                        <li>Invite links, not pasted IDs</li>
                        <li>Live cursors and typing presence</li>
                        <li>Built for focus, tuned for flow</li>
                    </ul>
                </section>

                <div className="home-card-area">
                    <div className="formWrapper">
                        <div className="home-top-row">
                            <img
                                className="homePageLogo homePageLogo--panel"
                                src="/code-sync.png"
                                alt=""
                            />
                            <div className="userButtonWrapper">
                                <UserButton />
                            </div>
                        </div>

                        <div className="home-badge">
                            <span className="home-badge-dot" />
                            Live session
                        </div>
                        <h2 className="mainLabel">Enter a room</h2>
                        <div className="inputGroup">
                            <input
                                type="text"
                                className="inputBox"
                                placeholder="Room ID"
                                onChange={(e) => setRoomId(e.target.value)}
                                value={roomId}
                                onKeyUp={handleInputEnter}
                            />
                            {user ? (
                                <input
                                    type="text"
                                    className="inputBox"
                                    placeholder="Username"
                                    value={username}
                                    disabled
                                />
                            ) : (
                                <input
                                    type="text"
                                    className="inputBox"
                                    placeholder="Display name"
                                    onChange={(e) => setUsername(e.target.value)}
                                    value={username}
                                    onKeyUp={handleInputEnter}
                                />
                            )}
                            <button type="button" className="btn joinBtn" onClick={joinRoom}>
                                Join room
                            </button>
                            <span className="createInfo">
                                No invite?{' '}
                                <button
                                    type="button"
                                    onClick={createNewRoom}
                                    className="createNewBtn"
                                >
                                    Create a new room
                                </button>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;

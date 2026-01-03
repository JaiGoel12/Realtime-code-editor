import React, { useState, useEffect } from 'react';
import { v4 as uuidV4 } from 'uuid';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useUser, UserButton } from '@clerk/clerk-react';

const Home = () => {
    const navigate = useNavigate();
    const { user } = useUser(); // Get user from Clerk
    const [roomId, setRoomId] = useState('');
    const [username, setUsername] = useState('');

    // Automatically set the username if the user is logged in
    useEffect(() => {
        if (user && user.username) {
            setUsername(user.username); // Set the username from Clerk
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

        // Redirect to the editor page with username as state
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
            <div className="formWrapper">
                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: '100%'  // Ensure the container spans full width
                }}>
                    <img
                        className="homePageLogo"
                        src="/code-sync.png"
                        alt="code-sync-logo"
                        style={{ height: 'auto', width: 'auto' }}  // You can specify logo size if needed
                    />
                    {user && (
                        <div className="userButtonWrapper">
                            <UserButton />
                        </div>
                    )}
                </div>

                <h4 className="mainLabel">Paste invitation ROOM ID</h4>
                <div className="inputGroup">
                    <input
                        type="text"
                        className="inputBox"
                        placeholder="ROOM ID"
                        onChange={(e) => setRoomId(e.target.value)}
                        value={roomId}
                        onKeyUp={handleInputEnter}
                    />
                    {/* Only allow editing if no username from Clerk */}
                    {user ? (
                        <input
                            type="text"
                            className="inputBox"
                            placeholder="USERNAME"
                            value={username} // Display Clerk's username
                            disabled // Disable input if username from Clerk exists
                        />
                    ) : (
                        <input
                            type="text"
                            className="inputBox"
                            placeholder="USERNAME"
                            onChange={(e) => setUsername(e.target.value)}
                            value={username}
                            onKeyUp={handleInputEnter}
                        />
                    )}
                    <button className="btn joinBtn" onClick={joinRoom}>
                        Join
                    </button>
                    <span className="createInfo">
                        If you don't have an invite then create &nbsp;
                        <a
                            onClick={createNewRoom}
                            href=""
                            className="createNewBtn"
                        >
                            new room
                        </a>
                    </span>
                </div>


            </div>
        </div>
    );
};

export default Home;

import React, { useState, useEffect } from 'react';
import Drawer from '@mui/joy/Drawer';
import { ToastContainer, toast } from 'react-toastify';
import Button from '@mui/joy/Button';
import { auth, database } from "../firebase.js";
import { ref, get, child } from "firebase/database"; // Removed unused imports
import VideoFloatButton from './VideoFloatButton.js';
import VideoRecorder from './VideoRecorder.js'; // Ensure correct import
import '../css/VideoRecorder.css'; // Use the main CSS file for both components

export default function VideoPostDrawer(props) {
    const [userName, setUserName] = useState('');
    const [photoUrl, setPhotoUrl] = useState('');
    const [isClosed, setIsClosed] = useState(true); // Tracks if the drawer is closed for VideoRecorder cleanup

    // State for Joy UI Drawer
    const [drawerOpen, setDrawerOpen] = useState(false); // Renamed state for clarity

    const videoPostedNotify = () => toast.success("Video posted!");

    // Fetch user data on mount
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                getData(user.uid); // Pass userId directly
            } else {
                setUserName('');
                setPhotoUrl('');
            }
        });
        return () => unsubscribe();
    }, []); // Empty dependency array means this runs once on mount

    const getData = async (userId) => {
        try {
            const dbRef = ref(database);
            const snapshot = await get(child(dbRef, `users/${userId}`));
            if (snapshot.exists()) {
                setUserName(snapshot.val().username);
                setPhotoUrl(snapshot.val().photoUrl);
            } else {
                console.log("No user data available");
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    };

    // Toggle drawer state
    const toggleDrawer = (open) => (event) => {
        if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
            return;
        }
        setDrawerOpen(open);
        setIsClosed(!open); // Update isClosed state for VideoRecorder
    };

    // Callback when video posting is complete in VideoRecorder
    const handleVideoPosted = () => {
        videoPostedNotify();
        toggleDrawer(false)(); // Close the drawer
    };

    // The content inside the drawer
    const drawerContent = (
        <div className='video-drawer-content'> {/* New class for content styling */}
            <div className="drawer-header">
                <h2>Record Video</h2>
                <Button variant="plain" size="lg" onClick={toggleDrawer(false)} sx={{ color: 'var(--color-light-text)' }}>
                    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path>
                    </svg>
                </Button>
            </div>
            {/* Pass isClosed and the new onVideoPosted callback to VideoRecorder */}
            <VideoRecorder
                userId={props.userId}
                userName={userName}
                photoUrl={photoUrl}
                isClosed={isClosed}
                onVideoPosted={handleVideoPosted}
            />
        </div>
    );

    return (
        <React.Fragment>
            {/* ToastContainer should only be rendered ONCE in your app, often in App.js or main layout */}
            {/* <ToastContainer autoClose={4000} position="bottom-center" hideProgressBar={true} theme='dark' /> */}

            <VideoFloatButton onClick={toggleDrawer(true)} />

            <Drawer
                size='lg' // Use 'lg' for larger size or adjust based on your needs
                key={'right'}
                anchor={'right'} // Open from the bottom
                open={drawerOpen}
                onClose={toggleDrawer(false)}
                // Overlay for dark background and animation
                slotProps={{
                    root: { sx: { zIndex: 1200 } }, // Ensure drawer is above other content
                    backdrop: { sx: { backgroundColor: 'rgba(0, 0, 0, 0.95)' } },
                    content: {
                        sx: {
                            backgroundColor: 'var(--color-darkest)', // Apply theme background
                            borderRadius: '16px 16px 0 0', // Rounded top corners
                            maxHeight: '90vh', // Limit drawer height
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden', // Hide overflow during animations
                            color: 'var(--color-light-text)',
                        },
                    },
                }}
            >
                {drawerContent}
            </Drawer>
        </React.Fragment>
    );
}
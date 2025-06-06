import React, { useState, useEffect, useRef } from 'react';
import Drawer from '@mui/joy/Drawer';
import ButtonGroup from '@mui/joy/ButtonGroup';
import Button from '@mui/joy/Button';
// import image from '../images/download.avif' // If not used directly, remove
import { auth, database } from "../firebase.js";
import { ref, set, serverTimestamp, push, get, child } from "firebase/database";
import { getStorage, ref as storageREF } from "firebase/storage";
import { uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { ToastContainer, toast } from 'react-toastify';
import { FormControl, Input, FormLabel } from '@mui/joy'; // Import Input and FormLabel for better form elements
import { CircularProgress } from '@mui/joy'; // For a more subtle loading spinner

import '../css/Drawer.css'; // Make sure this CSS file exists and is linked

export default function DrawerAnchor(props) {
    const [songTitle, setSongTitle] = useState('');
    const [selectedFile, setSelectedFile] = useState(null); // Renamed for clarity
    const [isLoading, setIsLoading] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false); // State for drawer open/close
    const [currentUserUid, setCurrentUserUid] = useState(null); // Store current user UID

    const fileInputRef = useRef(null); // Ref for the file input element

    const storage = getStorage();

    // Authenticate user and get UID
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                setCurrentUserUid(user.uid);
                // If you need other user data like username/photoUrl for display
                // you might call a getData function here, similar to VideoPostDrawer
            } else {
                setCurrentUserUid(null);
            }
        });
        return () => unsubscribe();
    }, []);

    const songPostedNotify = () => toast.success("Song posted successfully!");
    const waitNotify = () => toast.info("Uploading track...");
    const selectFileNotify = () => toast.warn("Please select an audio file to upload.");
    const enterTitleNotify = () => toast.warn("Please enter a song title.");


    const toggleDrawer = (open) => (event) => {
        if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
            return;
        }
        setDrawerOpen(open);
        // Reset state when closing the drawer
        if (!open) {
            setSongTitle('');
            setSelectedFile(null);
            setIsLoading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = ''; // Clear file input
            }
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('audio/')) {
            setSelectedFile(file);
        } else {
            setSelectedFile(null);
            toast.error("Please select a valid audio file.");
            if (fileInputRef.current) {
                fileInputRef.current.value = ''; // Clear input if invalid file
            }
        }
    };

    const handlePostSong = async () => {
        if (!songTitle.trim()) {
            enterTitleNotify();
            return;
        }
        if (!selectedFile) {
            selectFileNotify();
            return;
        }
        if (!currentUserUid) {
            toast.error("User not authenticated. Please log in.");
            return;
        }

        setIsLoading(true);
        waitNotify();

        const uniqueFileName = `${currentUserUid}_${Date.now()}_${selectedFile.name}`;
        const storageRef = storageREF(storage, `songs/${currentUserUid}/${uniqueFileName}`);
        const uploadTask = uploadBytesResumable(storageRef, selectedFile);

        uploadTask.on(
            "state_changed",
            (snapshot) => {
                // You can add progress bar here if needed
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log('Upload is ' + progress + '% done');
            },
            (error) => {
                setIsLoading(false);
                console.error("Upload error:", error);
                toast.error(`Upload failed: ${error.message}`);
            },
            async () => {
                // Upload complete
                try {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    await saveSongMetadata(downloadURL);
                } catch (error) {
                    setIsLoading(false);
                    console.error("Error getting download URL or saving metadata:", error);

        toast.error(`Failed to post song: ${error ? (error.message || String(error)) : 'Unknown error'}`);
                }
            }
        );
    };
// Inside src/components/DrawerAnchor.js

const saveSongMetadata = async (url) => {
    setIsLoading(true); // Ensure loading state is true at the start
    songPostedNotify(); // Initial toast for "Song posted!" - maybe change to "Saving song..."

    try {
        // --- Step 1: Prepare data and references ---
        if (!currentUserUid) {
            console.error("DEBUG: currentUserUid is null. Cannot proceed with song metadata save.");
            toast.error("User not authenticated. Please log in.");
            setIsLoading(false);
            return;
        }

        const songsRef = ref(database, `songs`); // path: /songs
        const userSongsRef = ref(database, `user-songs/${currentUserUid}`); // path: /user-songs/{userId}

        console.log(`DEBUG: songsRef path: ${songsRef.toString()}`);
        console.log(`DEBUG: userSongsRef path: ${userSongsRef.toString()}`);
        console.log(`DEBUG: Current User UID: ${currentUserUid}`);

        const newSong = {
            songTitle: songTitle.trim(),
            songUrl: url,
            songArtist: props.username || 'Unknown Artist',
            userId: currentUserUid,
            time: serverTimestamp()
        };
        console.log("DEBUG: newSong object:", newSong);

        // --- Step 2: Save song metadata to /songs ---
        console.log("DEBUG: Attempting to push new song to /songs...");
        const newSongRef = push(songsRef); // Get a new unique key
        const songKey = newSongRef.key; // This is the unique key generated by Firebase
        console.log(`DEBUG: Generated songKey: ${songKey}`);

        if (!songKey) {
            console.error("DEBUG: songKey is null or undefined after push(songsRef). This indicates an issue with Firebase key generation.");
            toast.error("Failed to generate a unique song ID.");
            setIsLoading(false);
            return;
        }

        await set(newSongRef, newSong); // Set song data at the generated key
        console.log(`DEBUG: Song metadata successfully saved to /songs/${songKey}`);

        // --- Step 3: Link songKey to user's songs in /user-songs/{userId} ---
        console.log(`DEBUG: Attempting to push songKey (${songKey}) to user-songs/${currentUserUid}...`);
        
        // The problematic line:
        // push() without a value creates a new unique ID and sets its value to null.
        // We want to add the songKey *as the value* to a new unique ID under user-songs.
        // So, we need: await set(push(userSongsRef), songKey);
        
        await set(push(userSongsRef), songKey);
        console.log(`DEBUG: Song key ${songKey} successfully pushed to user-songs/${currentUserUid}`);

        // --- Step 4: Finalize and clean up ---
        setIsLoading(false);
        toast.success("Song posted successfully! Close window :)"); // More specific success message
        toggleDrawer(false)(); // Close the drawer

    } catch (error) {
          setIsLoading(false);
        console.error("Overall error in saveSongMetadata:", error);
        // This line is the critical one for the TypeError
        toast.error(`Failed to post song: ${error ? (error.message || String(error)) : 'Unknown error'}`);
    }
};
   
    const drawerContent = (
        <div className='music-drawer-content'> {/* New class for content styling */}
            <div className="drawer-header">
                <h2>Post a Track</h2>
                <Button variant="plain" size="lg" onClick={toggleDrawer(false)} sx={{ color: 'var(--color-light-text)' }}>
                    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path>
                    </svg>
                </Button>
            </div>

            <div className='drawer-body'>
                {/* User photo - ensure props.photoUrl is passed correctly from parent */}
                {props.photoUrl && <img className='upload-song-photo' src={props.photoUrl} alt="User Avatar" />}

                {/* Song Title Input */}
                <FormControl sx={{ width: '80%', maxWidth: '350px', marginBottom: '15px' }}>
                    <FormLabel>Song Title</FormLabel>
                    <Input
                        placeholder="Enter song title"
                        value={songTitle}
                        onChange={(e) => setSongTitle(e.target.value)}
                        sx={{ '--Input-decoratorChildHeight': '45px' }}
                    />
                </FormControl>

                {/* File Input */}
                <FormControl sx={{ width: '80%', maxWidth: '350px', marginBottom: '20px' }}>
                    <FormLabel>Audio File</FormLabel>
                    <Input
                        type='file'
                        accept="audio/*"
                        onChange={handleFileSelect}
                        slotProps={{
                            input: {
                                ref: fileInputRef, // Attach ref here
                                style: {
                                    color: 'var(--color-light-text)',
                                    cursor: 'pointer',
                                    padding: '10px 0',
                                    '&::file-selector-button': { // Style the file input button (browser specific)
                                        backgroundColor: 'var(--color-mid)',
                                        color: 'var(--color-white)',
                                        border: 'none',
                                        padding: '8px 15px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        marginRight: '15px',
                                        transition: 'background-color 0.2s ease',
                                    },
                                    '&::file-selector-button:hover': {
                                        backgroundColor: 'var(--color-blue-accent)',
                                    },
                                }
                            }
                        }}
                    />
                    {selectedFile && <p className="selected-file-name">Selected: {selectedFile.name}</p>}
                </FormControl>

                {/* Post Button */}
                <Button
                    onClick={handlePostSong}
                    disabled={isLoading || !songTitle.trim() || !selectedFile}
                    sx={{
                        width: '80%',
                        maxWidth: '200px',
                        padding: '12px 20px',
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        backgroundColor: 'var(--color-green-accent)',
                        color: 'var(--color-white)',
                        '&:hover': {
                            backgroundColor: '#45a049',
                        },
                        '&:disabled': {
                            backgroundColor: '#666',
                            color: '#bbb',
                        }
                    }}
                >
                    {isLoading ? (
                        <CircularProgress size="sm" sx={{ color: 'var(--color-white)' }} />
                    ) : (
                        'Post Track'
                    )}
                </Button>

                {isLoading && (
                    <div className="uploading-text" style={{ marginTop: '20px' }}>
                        Uploading<span className="dots"></span>
                    </div>
                )}
            </div>
        </div>
    );


    return (
        <React.Fragment>
            <ToastContainer
                autoClose={4000}
                position="bottom-center"
                hideProgressBar={true}
                theme='dark'
            />

            {/* Button to open the drawer */}
            <ButtonGroup variant="solid">
                <Button onClick={toggleDrawer(true)}>
                    + Post a Track
                </Button>
            </ButtonGroup>

            {/* The Drawer component */}
            <Drawer
                size='lg' // Adjust size as needed, 'lg' for larger content
                anchor={'right'} // Keeping it right as per original, but can be 'bottom'
                open={drawerOpen}
                onClose={toggleDrawer(false)}
                slotProps={{
                    root: { sx: { zIndex: 1300 } }, // Ensure drawer is above other content
                    backdrop: { sx: { backgroundColor: 'rgba(0, 0, 0, 0.95)' } },
                    content: {
                        sx: {
                            backgroundColor: 'var(--color-darkest)', // Apply theme background
                            borderRadius: '16px 0 0 16px', // Rounded left corners for right drawer
                            maxWidth: '450px', // Max width for the drawer
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
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
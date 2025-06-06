import React, { useEffect, useState, useRef } from 'react';
import { useParams, useLocation } from 'react-router';
import { database } from '../firebase'; // Assuming '../firebase' points to your Firebase config
import { ref, get, onValue } from 'firebase/database'; // Using onValue for real-time comments, get for song details
import '../css/SongDetailScreen.css'; // You'll create this CSS file

export default function SongDetailScreen() {
    const { songId } = useParams(); // Get songId from the URL
    const location = useLocation(); // To get the URL hash for comment scrolling

    const [song, setSong] = useState(null);
    const [comments, setComments] = useState([]);
    const [loadingSong, setLoadingSong] = useState(true);
    const [loadingComments, setLoadingComments] = useState(true);
    const [error, setError] = useState(null);

    const commentsContainerRef = useRef(null); // Ref for the comments section

    // 1. Fetch Song Details
    useEffect(() => {
        if (!songId) {
            setError("No song ID provided.");
            setLoadingSong(false);
            return;
        }

        const songRef = ref(database, `songs/${songId}`); // Adjust path to your songs data
        get(songRef)
            .then((snapshot) => {
                if (snapshot.exists()) {
                    setSong(snapshot.val());
                } else {
                    setError("Song not found.");
                }
            })
            .catch((err) => {
                console.error("Error fetching song:", err);
                setError("Failed to load song details.");
            })
            .finally(() => {
                setLoadingSong(false);
            });
    }, [songId]);

    // 2. Fetch and Listen for Comments (real-time)
    useEffect(() => {
        if (!songId) return;

        const commentsRef = ref(database, `songs/${songId}/comments`); // Adjust path to comments
        const unsubscribeComments = onValue(commentsRef, (snapshot) => {
            if (snapshot.exists()) {
                const loadedComments = [];
                snapshot.forEach((childSnapshot) => {
                    loadedComments.push({
                        id: childSnapshot.key, // Firebase key as comment ID
                        ...childSnapshot.val(),
                    });
                });
                setComments(loadedComments);
            } else {
                setComments([]);
            }
            setLoadingComments(false);
        }, (err) => {
            console.error("Error fetching comments:", err);
            setError("Failed to load comments.");
            setLoadingComments(false);
        });

        // Cleanup listener on unmount
        return () => unsubscribeComments();
    }, [songId]);

    // 3. Handle Scrolling to Specific Comment (from URL hash)
    useEffect(() => {
        if (location.hash && commentsContainerRef.current) {
            const elementId = location.hash.replace('#', ''); // e.g., 'comment-someId'
            // Wait for comments to render, then scroll
            const timer = setTimeout(() => {
                const targetElement = document.getElementById(elementId);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else {
                    console.warn(`Element with ID ${elementId} not found for scrolling.`);
                }
            }, 500); // Small delay to ensure elements are rendered

            return () => clearTimeout(timer); // Cleanup timeout
        }
    }, [location.hash, comments]); // Re-run when hash or comments change

    if (loadingSong || loadingComments) {
        return (
            <div className="song-detail-container loading">
                <p className="loading-text">Loading Song...</p>
                {/* Add a spinner if you have one */}
            </div>
        );
    }

    if (error) {
        return (
            <div className="song-detail-container error">
                <p className="error-text">Error: {error}</p>
            </div>
        );
    }

    if (!song) {
        return (
            <div className="song-detail-container not-found">
                <p className="not-found-text">Song not found.</p>
            </div>
        );
    }

    return (
        <div className="song-detail-container">
            <h1 className="song-title">{song.title}</h1>
            <p className="song-artist">by {song.artistName || 'Unknown Artist'}</p>

            <div className="song-cover-art-wrapper">
                <img src={song.coverArtUrl || 'path/to/default-cover.png'} alt={song.title} className="song-cover-art" />
            </div>

            <div className="audio-player-controls">
                {/* Basic HTML5 Audio Player */}
                {song.audioUrl ? (
                    <audio controls src={song.audioUrl}>
                        Your browser does not support the audio element.
                    </audio>
                ) : (
                    <p className="no-audio-text">Audio not available.</p>
                )}
            </div>

            {/* Other song details */}
            <p className="song-description">{song.description}</p>
            {/* Add like button, share button, etc. */}

            <h2 className="comments-section-title">Comments</h2>
            <div className="comments-list" ref={commentsContainerRef}>
                {loadingComments ? (
                    <p className="loading-comments">Loading comments...</p>
                ) : comments.length > 0 ? (
                    comments.map((comment) => (
                        <div key={comment.id} id={`comment-${comment.id}`} className="comment-item">
                            <img src={comment.userPhotoUrl || 'path/to/default-avatar.png'} alt="User" className="comment-avatar" />
                            <div className="comment-content">
                                <p className="comment-user-name">{comment.userName}</p>
                                <p className="comment-text">{comment.text}</p>
                                <p className="comment-time">{/* Format comment.timestamp */}</p>
                                {/* Add like/reply actions for comments */}
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="no-comments-text">No comments yet. Be the first!</p>
                )}
                {/* Add comment input field here */}
            </div>
        </div>
    );
}
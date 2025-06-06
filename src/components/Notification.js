import React, { useEffect, useState, useCallback } from 'react';
import blank from '../images/blank-picture.png'; // Assuming this path is correct for your web assets
import '../css/Notification.css'; // Keep your CSS file for styling
import { auth, database } from "../firebase.js";
import { ref, remove } from "firebase/database";
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useNavigate } from 'react-router'; // Import useNavigate for navigation

export default function Notification(props) {
    const navigate = useNavigate(); // Hook to get the navigation object

    // Function to format time distance (using date-fns)
    const formatVideoTime = useCallback((timestamp) => {
        if (!timestamp) return 'N/A';
        let date;
        // Handle Firebase Timestamp objects (if coming from Firestore)
        if (typeof timestamp === 'object' && timestamp._seconds && timestamp._nanoseconds) {
            date = new Date(timestamp._seconds * 1000 + timestamp._nanoseconds / 1000000);
        } else if (typeof timestamp === 'string') {
            try {
                date = parseISO(timestamp); // Tries to parse ISO 8601 strings
            } catch (e) {
                date = new Date(timestamp); // Fallback for other string formats
            }
        } else {
            date = new Date(timestamp); // Direct Date object or number
        }

        if (isNaN(date.getTime())) {
            console.warn("Invalid date for formatting:", timestamp);
            return 'Invalid Time';
        }
        return formatDistanceToNow(date, { addSuffix: true });
    }, []);

    // Function to delete a notification
    function deleteNotification() {
        remove(ref(database, `notifications/${props.recieverUserId}/${props.notiId}`))
            .then(() => {
                // Instead of window.location.reload(), pass a callback to the parent
                // The parent component (Notifications) will then update its state
                if (props.onDelete) {
                    props.onDelete(props.notiId); // Tell parent which noti was deleted
                }
            })
            .catch((error) => {
                console.error("Error deleting notification: ", error);
                alert("Could not delete notification. Please try again."); // Simple user feedback
            });
    }

    // Function to handle clicking on a notification and navigate
    const handleNotificationClick = () => {
        let path = '';
        // Determine the navigation path based on notification type/content
        if (props.notiText && props.notiText.includes('commented on your')) {
            // Assuming comments are related to songs/videos. You need to pass `videoId` or `songId` as a prop.
            if (props.videoId) {
                path = `/video/${props.videoId}`; // Example path: /video/someVideoId
            } else if (props.songId) {
                path = `/song/${props.songId}`; // Example path: /song/someSongId
            }
            // If you want to scroll to a specific comment, you'd handle that on the target page (e.g., using a URL hash #commentId)
            if (props.commentId && path) {
                path += `#comment-${props.commentId}`;
            }

        } else if (props.notiText && props.notiText.includes('liked your')) {
            // Check if it's a video/song like or a comment like
            if (props.type === 'video_like' || props.type === 'song_like') {
                if (props.videoId) {
                    path = `/video/${props.videoId}`;
                } else if (props.songId) {
                    path = `/song/${props.songId}`;
                }
            } else if (props.type === 'comment_like') {
                // If a comment was liked, navigate to the video/song and scroll to the comment
                if (props.videoId) {
                    path = `/video/${props.videoId}`;
                } else if (props.songId) {
                    path = `/song/${props.songId}`;
                }
                if (props.commentId && path) {
                    path += `#comment-${props.commentId}`;
                }
            }
        }
        // Add more conditions for other notification types (e.g., 'followed you' -> `/profile/${props.userId}`)

        if (path) {
            //navigate(path);
        } else {
            console.log('No specific navigation path defined for this notification type:', props.notiText);
            // Optionally navigate to a default notifications page or profile
            // navigate('/notifications');
        }
    };

    return (
        <div className="notification-item" onClick={handleNotificationClick}> {/* Clickable notification */}
            <button className="close-btn" onClick={(e) => { e.stopPropagation(); deleteNotification(); }}>×</button>
            <img className="notification-profile-pic" src={props.photoUrl || blank} alt="Profile" />
            <div className="notification-text-content">
                <p className="name">{props.userName}</p>
                <p className="meta">{props.accountType}</p>
                <p className="action">
                    {props.notiText}{' '}
                    <span className="highlight-text">
                        "{props.comment ? props.comment : props.quote}"
                    </span>
                </p>
                <p className="meta">• {formatVideoTime(props.time)}</p>
            </div>
        </div>
    );
}
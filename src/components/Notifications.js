import React, { useEffect, useState } from 'react';
import Notification from '../components/Notification.js'; // Ensure path is correct
import '../css/NotificationsPage.css'; // New CSS file for the overall page
import { auth, database } from "../firebase.js";
import { ref, get, onValue } from "firebase/database"; // Added onValue for real-time updates
import { useParams } from 'react-router'; // Keep useParams for web routing

export default function Notifications() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const { UID } = useParams(); // Get UID from URL params

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged((user) => {
            if (!user) {
                console.log('User not logged in');
                setLoading(false);
                // Optionally redirect to login or show a message
            } else {
                const targetUID = UID || user.uid; // Use UID from URL or current user's UID
                if (!targetUID) {
                    console.error("No user ID available for notifications.");
                    setLoading(false);
                    return;
                }

                // Use onValue for real-time updates of notifications
                const notificationsRef = ref(database, `notifications/${targetUID}`);
                const unsubscribeDb = onValue(notificationsRef, (snapshot) => {
                    if (snapshot.exists()) {
                        const loadedNotifications = [];
                        snapshot.forEach((snap) => {
                            const data = snap.val();
                            loadedNotifications.push({
                                ...data,
                                notiId: snap.key, // Add the notification ID (Firebase key)
                            });
                        });
                        // Sort by time, newest first
                        loadedNotifications.sort((a, b) => {
                            const timeA = typeof a.time === 'object' && a.time._seconds ? a.time._seconds : new Date(a.time).getTime() / 1000;
                            const timeB = typeof b.time === 'object' && b.time._seconds ? b.time._seconds : new Date(b.time).getTime() / 1000;
                            return timeB - timeA;
                        });
                        setNotifications(loadedNotifications);
                        console.log(loadedNotifications)
                    } else {
                        console.log("No notifications found for this user!");
                        setNotifications([]); // Clear notifications if none exist
                    }
                    setLoading(false);
                }, (error) => {
                    console.error("Error fetching notifications: ", error);
                    alert("Error loading notifications. Please try again.");
                    setLoading(false);
                });

                // Cleanup listener on component unmount
                return () => {
                    unsubscribeDb();
                };
            }
        });

        // Cleanup auth listener on unmount
        return () => {
            unsubscribeAuth();
        };
    }, [UID]); // Re-run effect if UID from URL changes

    // Callback to remove a notification from state after it's deleted from Firebase
    const handleNotificationDelete = (deletedNotiId) => {
        setNotifications(prevNotifications =>
            prevNotifications.filter(noti => noti.notiId !== deletedNotiId)
        );
    };

    if (loading) {
        return (
            <div className="notifications-page-container loading">
                <p className="loading-text">Loading Notifications...</p>
                {/* You can add a loading spinner here if you have one */}
            </div>
        );
    }

    return (
        <div className="notifications-page-container">
            <h1 className="notifications-page-title">Notifications</h1>

            {notifications.length > 0 ? (
                <div className="notification-list-wrapper">
                    {notifications.map((noti) => (
                        <Notification
                            key={noti.notiId} // Crucial for list rendering
                            {...noti} // Pass all notification data as props
                            recieverUserId={UID} // Ensure receiver ID is passed
                            onDelete={handleNotificationDelete} // Pass the delete callback
                        />
                    ))}
                </div>
            ) : (
                <div className="no-notifications-message">
                    <p>You have no notifications yet.</p>
                </div>
            )}
        </div>
    );
}
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router'; // Corrected import for react-router-dom
import { useParams } from 'react-router'; // Corrected import for react-router-dom
import { signOut } from "firebase/auth";
import { ref, get, child } from "firebase/database"; // Removed set, update, push as they are not used in Navbar
import { auth, database } from "../firebase.js";
import '../css/Navbar.css';
import blank from '../images/blank-picture.png'; // Re-using blank image

export default function Navbar() {
    const [userId, setUserId] = useState('');
    const [photoUrl, setPhotoUrl] = useState('');
    const [notiCount, setNotiCount] = useState(0); // Initialize as 0 for number consistency
    const [isMenuOpen, setIsMenuOpen] = useState(false); // State to control mobile menu open/close

    const navigate = useNavigate();
    const location = useLocation(); // Keep for potential future use if needed

    const { UID } = useParams(); // Keep if Navbar needs to react to UID in URL, though not directly used for user's own data

    // Effect to listen for Firebase Auth state changes
    useEffect(() => {
      console.log(location.pathname)
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                setUserId(user.uid);
                getData(user.uid);
                getNotiCount(user.uid);
            } else {
                console.log('No user logged in');
                setUserId(''); // Clear userId if no user
                setPhotoUrl(''); // Clear photoUrl
                setNotiCount(0); // Reset notification count
            }
        });
        return () => unsubscribe(); // Cleanup subscription on unmount
    }, []); // Empty dependency array means this runs once on mount

    function getData(id) {
        const dbRef = ref(database);
        get(child(dbRef, `users/${id}`)).then((snapshot) => {
            if (snapshot.exists()) {
                setPhotoUrl(snapshot.val().photoUrl || blank); // Default to blank if photoUrl is empty
            } else {
                console.log("No user data available for:", id);
                setPhotoUrl(blank); // Ensure blank image is set if no data
            }
        }).catch((error) => {
            console.error("Error fetching user data:", error);
            setPhotoUrl(blank); // Fallback on error
        });
    }

    function getNotiCount(id) {
        get(ref(database, `notifications/${id}`))
            .then((snapshot) => {
                if (snapshot.exists()) {
                    setNotiCount(snapshot.size);
                } else {
                    setNotiCount(0); // Set to 0 if no notifications
                }
            })
            .catch((error) => {
                console.error("Error fetching notification count: ", error);
                setNotiCount(0); // Reset on error
            });
    }

    function signUserOut() {
        signOut(auth).then(() => {
            console.log("User signed out successfully");
            setUserId(''); // Clear userId state
            navigate('/login'); // Redirect to login page
        }).catch((error) => {
            console.error("Sign out error:", error);
        });
    }

    // Function to toggle the mobile menu state
    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    // Helper to close menu on navigation (important for mobile UX)
    const handleNavLinkClick = (path) => {
        setIsMenuOpen(false); // Close the menu
        navigate(path);
    };

    return (
        <div className='nav-wrapper'> {/* New wrapper for overall fixed positioning */}
            <nav className={location.pathname === '/' ? "app-navbar-home" : "app-navbar"}>
                <div className="nav-inner-container">
                    {/* Brand/Logo */}
                    <a className='navbar-brand-custom' onClick={() => handleNavLinkClick('/')}>
                     TH{/* You might want to change this to your app's name */}
                    </a>

                    {/* Mobile Menu Toggle Button */}
                    <button
                        className={`menu-toggle ${isMenuOpen ? 'open' : ''}`}
                        onClick={toggleMenu}
                        aria-label="Toggle navigation"
                        aria-expanded={isMenuOpen ? "true" : "false"}
                    >
                        <span className="menu-icon"></span>
                    </button>

                    {/* Navigation Links Container */}
                    <div className={`nav-links-container ${isMenuOpen ? 'menu-open' : ''}`}>
                        <ul className="nav-list">
                            <li className="list-item">
                                <a className="nav-link-custom" onClick={() => handleNavLinkClick(`/home/${userId}`)} aria-current="page">Home</a>
                            </li>
                            <li className="list-item">
                                <a className="nav-link-custom" onClick={() => handleNavLinkClick(`/artist/${userId}`)}>Artist</a>
                            </li>
                            <li className="list-item">
                                <a className="nav-link-custom" onClick={() => handleNavLinkClick(`/producers/${userId}`)}>Producers</a>
                            </li>
                                 <li className="list-item">
                                {userId ? (
                                    <a className="nav-link-custom" onClick={() => handleNavLinkClick(`/videofeed/${userId}`)}>
                                        Videos
                                    </a>
                                ) : null}
                            </li>
                            <li className="list-item">
                                {userId ? (
                                    <a className="nav-link-custom" onClick={() => handleNavLinkClick(`/songofthemonth`)}>
                                        Song Of The Month
                                    </a>
                                ) : null}
                            </li>
                       
                            <li className="list-item">
                                {userId ? (
                                    <a className="nav-link-custom" onClick={() => handleNavLinkClick(`/notifications/${userId}`)}>
                                        Notifications <ins className="notification-count">{notiCount > 0 ? notiCount : null}</ins>
                                    </a>
                                ) : null}
                            </li>
                            <li className="list-item">
                                {userId ? (
                                    <a className="nav-link-custom" onClick={signUserOut}>Sign out</a>
                                ) : (
                                    <a className="nav-link-custom" onClick={() => handleNavLinkClick(`/login`)}>Login</a>
                                )}
                            </li>
                        </ul>
                        {/* Profile Image (Moved inside nav-links-container for mobile display, can adjust CSS) */}
                        {userId ? (
                            <img
                                className='profile-thumb' // Renamed from 'profile' to avoid general class name
                                src={photoUrl || blank}
                                alt="User Profile"
                                onClick={() => handleNavLinkClick(`/profile/${userId}`)}
                            />
                        ) : null}
                    </div>
                </div>
            </nav>
        </div>
    );
}
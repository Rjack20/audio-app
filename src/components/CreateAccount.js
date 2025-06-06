import React, { useState, useEffect } from 'react';
import { auth, database } from "../firebase.js";
import { ref, set } from "firebase/database";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from 'react-router'; // Use react-router-dom for useNavigate

import '../css/CreateAccount.css'; // Your CSS file

export default function CreateAccount() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignup, setIsSignup] = useState(false); // Controls if it's signup or login form
    const [passwordError, setPasswordError] = useState('');
    const [authError, setAuthError] = useState(''); // New state for Firebase auth errors

    const navigate = useNavigate();

    // Clean up password error when email/password changes or form toggles
    useEffect(() => {
        setPasswordError('');
        setAuthError('');
    }, [email, password, isSignup]);

    const handleEmailChange = (e) => {
        setEmail(e.target.value);
    };

    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
    };

    const saveUser = (userId, userEmail) => {
        const userData = {
            userId: userId,
            email: userEmail,
            username: '',      // Initial empty username
            accountType: '',   // Initial empty account type
            photoUrl: '',      // Initial empty photo URL
            bio: ''            // Initial empty bio
        };
        set(ref(database, 'users/' + userId), userData)
            .then(() => {
                console.log("User data saved to database successfully!");
            })
            .catch((error) => {
                console.error("Error saving user data: ", error);
            });
    };

    const handleCreateUser = () => {
        setPasswordError(''); // Clear previous password errors
        setAuthError('');     // Clear previous auth errors

        if (password.length < 6) {
            setPasswordError('Password must be at least 6 characters.');
            return;
        }

        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                console.log('Sign up successful:', user.uid);
                saveUser(user.uid, user.email); // Save initial user data to Realtime Database
                navigate(`/setup/${user.uid}`); // Navigate to setup profile page
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                console.error("Firebase Sign Up Error:", errorCode, errorMessage);
                // Display user-friendly error messages
                switch (errorCode) {
                    case 'auth/email-already-in-use':
                        setAuthError('This email is already in use.');
                        break;
                    case 'auth/invalid-email':
                        setAuthError('The email address is not valid.');
                        break;
                    case 'auth/weak-password':
                        setAuthError('The password is too weak.');
                        break;
                    default:
                        setAuthError('Account creation failed. Please try again.');
                }
            });
    };

    const handleSignIn = () => {
        setAuthError(''); // Clear previous auth errors

        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                console.log('Sign in successful:', user.uid);
                navigate(`/home/${user.uid}`); // Navigate to home page
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                console.error("Firebase Sign In Error:", errorCode, errorMessage);
                // Display user-friendly error messages
                switch (errorCode) {
                    case 'auth/invalid-email':
                        setAuthError('Invalid email address.');
                        break;
                    case 'auth/invalid-credential': // More generic for incorrect email/password
                    case 'auth/user-not-found':
                    case 'auth/wrong-password':
                        setAuthError('Incorrect email or password.');
                        break;
                    default:
                        setAuthError('Login failed. Please check your credentials.');
                }
            });
    };

    const handleSubmit = (e) => {
        e.preventDefault(); // Prevent default form submission behavior (page reload)
        if (isSignup) {
            handleCreateUser();
        } else {
            handleSignIn();
        }
    };

    return (
        <div className="form-container-wrapper"> {/* Added a wrapper for overall styling */}
            <form onSubmit={handleSubmit} className="form-container">
                <h2>{isSignup ? 'Create Account' : 'Login'}</h2>

                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        placeholder="Enter your email"
                        required
                        value={email}
                        onChange={handleEmailChange}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        placeholder="Enter your password"
                        required
                        value={password}
                        onChange={handlePasswordChange}
                    />
                    {passwordError && <small className="error-message">{passwordError}</small>}
                    {authError && <small className="error-message">{authError}</small>} {/* Display auth errors */}
                </div>

                <button type="submit" className="btn">
                    {isSignup ? 'Sign Up' : 'Log In'}
                </button>

                <div className="toggle-form">
                    {isSignup ? (
                        <>
                            Already have an account?{' '}
                            <span onClick={() => setIsSignup(false)}>Log In</span>
                        </>
                    ) : (
                        <>
                            Don't have an account?{' '}
                            <span onClick={() => setIsSignup(true)}>Sign Up</span>
                        </>
                    )}
                </div>
            </form>
        </div>
    );
}
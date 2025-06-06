import React, { useEffect, useState } from 'react';
import blank from '../images/blank-picture.png'; // Assuming this path is correct
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router'; // Use react-router-dom for web
import { auth, database } from "../firebase.js";
import { ref, update } from "firebase/database";
import { getStorage, ref as storageREF, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import '../css/SetupProfile.css'; // Make sure this path is correct
import Spinner from './Spinner.js'; // Assuming you have this component

const steps = ['name', 'picture', 'account', 'confirm'];

export default function SetupProfile() {
    const [stepIndex, setStepIndex] = useState(0);
    const [accountType, setAccountType] = useState('');
    const [username, setUsername] = useState('');
    const [image, setImage] = useState(null); // Local URL for preview
    const [isSaving, setIsSaving] = useState(false);
    const [photoUrl, setPhotoUrl] = useState(''); // Firebase Storage URL

    const { UID } = useParams();
    const storage = getStorage();
    const navigate = useNavigate();

    // Removed the useEffect for accountType, as it's not strictly necessary for rendering

    const next = () => {
        // Add validation before moving to the next step
        if (stepIndex === 0 && !username.trim()) {
            alert("Please enter a username.");
            return;
        }
        if (stepIndex === 1 && !photoUrl) { // Check for actual Firebase URL
             alert("Please upload a profile picture.");
             return;
        }
        if (stepIndex === 2 && !accountType) {
            alert("Please select an account type.");
            return;
        }

        if (stepIndex < steps.length - 1) {
            setStepIndex(prevIndex => prevIndex + 1);
        } else {
            console.log("Setup complete (handled by save)! Should not reach here typically.");
        }
    };

    const back = () => {
        if (stepIndex > 0) {
            setStepIndex(prevIndex => prevIndex - 1);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Create local URL for immediate preview
            const imageUrl = URL.createObjectURL(file);
            setImage(imageUrl);
            // Upload to Firebase Storage
            handleUpload(file);
        }
    };

    const handleUpload = (file) => {
        if (!file) return;

        const storageRef = storageREF(storage, `profile-image/${UID}/${file.name}`); // Changed folder name for clarity
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
            "state_changed",
            (snapshot) => {
                // You can add a progress bar here if needed
                const prog = Math.round(
                    (snapshot.bytesTransferred / snapshot.totalBytes) * 100
                );
                console.log(`Upload is ${prog}% done`);
            },
            (error) => {
                console.error("Upload error:", error);
                alert("Failed to upload image. Please try again.");
            },
            () => {
                getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                    setPhotoUrl(downloadURL); // This is the URL saved to Firebase DB
                    console.log("Profile picture uploaded. URL:", downloadURL);
                });
            }
        );
    };

    function saveData() {
        setIsSaving(true);

        const userData = {
            username: username,
            photoUrl: photoUrl,
            accountType: accountType
        };

        update(ref(database, 'users/' + UID), userData)
            .then(() => {
                setIsSaving(false);
                console.log("User profile saved successfully!");
                navigate(`/home/${UID}`); // Navigate to home after successful setup
            })
            .catch((error) => {
                setIsSaving(false);
                console.error("Error saving user profile: ", error);
                alert("Failed to save profile. Please try again.");
            });
    }

    const renderStep = () => {
        switch (steps[stepIndex]) {
            case 'name':
                return (
                    <motion.div
                        key="name"
                        className="setup-step" // Apply main step styling
                        initial={{ x: 300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -300, opacity: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <h2 className="step-title">Step 1: Enter Username</h2>
                        <input
                            type="text"
                            placeholder="Your unique username"
                            className="text-input" // Apply custom input styling
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </motion.div>
                );

            case 'picture':
                return (
                    <motion.div
                        key="picture"
                        className="setup-step"
                        initial={{ x: 300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -300, opacity: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <h2 className="step-title">Step 2: Upload a Profile Picture</h2>
                        <img className="profile-preview-pic" src={image || blank} alt="Profile Preview" />
                        <label htmlFor="file-upload" className="custom-file-upload">
                           Choose Photo
                        </label>
                        <input
                            id="file-upload"
                            type="file"
                            accept="image/*" // Only allow image files
                            onChange={handleFileChange}
                            style={{ display: 'none' }} // Hide default input
                        />
                        {photoUrl && <p className="upload-success-text">Image uploaded!</p>}
                    </motion.div>
                );

            case 'account':
                return (
                    <motion.div
                        key="account"
                        className="setup-step"
                        initial={{ x: 300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -300, opacity: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <h2 className="step-title">Step 3: Choose Your Title</h2>
                        <div className="radio-group">
                            <label className="radio-label">
                                <input
                                    type="radio"
                                    name="accountType"
                                    value="Artist"
                                    checked={accountType === 'Artist'}
                                    onChange={() => setAccountType('Artist')}
                                    className="custom-radio"
                                />
                                Artist
                            </label>
                            <label className="radio-label">
                                <input
                                    type="radio"
                                    name="accountType"
                                    value="Producer"
                                    checked={accountType === 'Producer'}
                                    onChange={() => setAccountType('Producer')}
                                    className="custom-radio"
                                />
                                Producer
                            </label>
                            <label className="radio-label">
                                <input
                                    type="radio"
                                    name="accountType"
                                    value="N/a"
                                    checked={accountType === 'N/a'}
                                    onChange={() => setAccountType('N/a')}
                                    className="custom-radio"
                                />
                                N/a (Listener/Fan)
                            </label>
                        </div>
                    </motion.div>
                );

            case 'confirm':
                return (
                    <motion.div
                        key="confirm"
                        className="setup-step confirmation-step"
                        initial={{ x: 300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -300, opacity: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <h2 className="step-title">All Set!</h2>
                        <p className="confirmation-text">You're almost ready to dive in!</p>
                        <div className="summary-details">
                            <p><strong>Username:</strong> <span className="summary-value">{username || 'Not set'}</span></p>
                            <p><strong>Title:</strong> <span className="summary-value">{accountType || 'Not set'}</span></p>
                            <p><strong>Profile Picture:</strong></p>
                            <img className="summary-profile-pic" src={photoUrl || blank} alt="Profile" />
                        </div>
                        <p className="confirmation-instruction">Review your details and click 'Finish' to complete your setup.</p>
                    </motion.div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="setup-profile-container">
            <h1 className="main-title">Setup Your Profile</h1>

            <div className="setup-card">
                <AnimatePresence mode="wait">
                    {renderStep()}
                </AnimatePresence>

                <div className="navigation-buttons">
                    <button
                        onClick={back}
                        disabled={stepIndex === 0 || isSaving}
                        className="nav-button back-button"
                    >
                        Back
                    </button>
                    {stepIndex === steps.length - 1 ? (
                        <button
                            onClick={saveData}
                            disabled={isSaving}
                            className="nav-button finish-button"
                        >
                            {isSaving ? 'Saving...' : 'Finish'}
                        </button>
                    ) : (
                        <button
                            onClick={next}
                            disabled={isSaving}
                            className="nav-button next-button"
                        >
                            Next
                        </button>
                    )}
                </div>
            </div>
            {isSaving && <Spinner saving={isSaving} />} {/* Spinner outside the card, centered */}
        </div>
    );
}
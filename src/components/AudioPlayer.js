import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ref, set, update, push, get, child } from "firebase/database";
import { getStorage, ref as storageREF } from "firebase/storage";
import { uploadBytesResumable, getDownloadURL } from "firebase/storage";
import AudioPost from '../components/AudioPost.js'
import { auth, database } from "../firebase.js";
import play from '../images/play.png'
import stop from '../images/stop.png'
import blank from '../images/blank-picture.png'
import '../css/AudioPlayer.css'
import Spinner from './Spinner.js';
import { ToastContainer, toast } from 'react-toastify';


const AudioPlayer = (props) => {
    const audioRef = useRef(null);
    const progressRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isUser, setIsUser] = useState(false)
    const [duration, setDuration] = useState(0);
    const [isDeleting, setDeleting] = useState(false);
    const [rotate, setRotate] = useState(false);
    const [rotateStop, setRotateStop] = useState(false);
    const navigate = useNavigate();

    // Handle timeupdate
    useEffect(() => {

console.log(props.userId)

        const audio = audioRef.current;
        const updateProgress = () => {
            if (!isDragging) {
                const percent = (audio.currentTime / audio.duration) * 100;

                setCurrentTime(audio.currentTime)
                setDuration(audio.duration)

                setProgress(percent || 0);
            }
        };
        audio.addEventListener('timeupdate', updateProgress);
        return () => audio.removeEventListener('timeupdate', updateProgress);
    }, [isDragging]);



    useEffect(() => {

        auth.onAuthStateChanged((user) => {

            if (user.uid === props.userId) {
                setIsUser(true)
            }

        })

    }, [])



    // Stop playback if no longer active
    useEffect(() => {
        if (!props.isActive && audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    }, [props.isActive]);




    const handleClick = () => {
        setRotate(true);

        // Reset animation so it can trigger again next time
        setTimeout(() => setRotate(false), 1000); // Match animation duration
    };
    const handleStopClick = () => {
        setRotateStop(true);

        // Reset animation so it can trigger again next time
        setTimeout(() => setRotateStop(false), 1000); // Match animation duration
    };
    const formatTime = (time) => {
        if (isNaN(time)) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60)
            .toString()
            .padStart(2, '0');
        return `${minutes}:${seconds}`;
    };



    const handlePlay = () => {
        if (audioRef.current) {
            props.onPlay(); // Notify parent
            audioRef.current.play();
            handleClick()
        }
    };

    const handlePause = () => {
        audioRef.current.pause();
        props.onStop();
        handleStopClick()

    };

    const handleMouseDown = () => setIsDragging(true);

    const handleMouseUp = (e) => {
        const rect = progressRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = rect.width;
        const percent = Math.min(Math.max(clickX / width, 0), 1);
        const newTime = percent * audioRef.current.duration;

        audioRef.current.currentTime = newTime;
        setProgress(percent * 100);
        setIsDragging(false);
    };

    const handleMouseMove = (e) => {
        if (isDragging) {
            const rect = progressRef.current.getBoundingClientRect();
            const moveX = e.clientX - rect.left;
            const width = rect.width;
            const percent = Math.min(Math.max(moveX / width, 0), 1);
            setProgress(percent * 100);
        }
    };

    const deleteSongNotify = () => toast.success("Track removed");
    const deleteSongFailedNotify = () => toast.info("Error: failed to removed track");


    async function deleteSongAndAllReferences(userId, songId) {
        if (!userId || !songId) {
            console.error("deleteSongAndAllReferences: userId and songId are required.");
            throw new Error("Missing userId or songId for song deletion.");
        }

        const confirmDelete = window.confirm("Are you sure you want to delete this song and all its associated data?");

        if (confirmDelete) {
            setDeleting(true)
            const updates = {};

            // ***************************************************************
        

            // 1. Delete the song reference under the user's songs
            updates[`user-songs/${props.userId}/${props.songId}`] = null; // Using the generated path

            // 2. Delete the main song data
            updates[`songs/${songId}`] = null;

            // ... (rest of your deletion logic for comments, likes, etc.) ...
            const commentsRef = ref(database, `comments/${songId}`);
            let commentIds = [];
            try {
                const commentsSnapshot = await get(commentsRef);
                if (commentsSnapshot.exists()) {
                    commentsSnapshot.forEach((commentChild) => {
                        commentIds.push(commentChild.key);
                    });
                }
            } catch (error) {
                console.warn(`Warning: Could not fetch comments for song ${songId}. They might not be deleted.`, error);
            }
            updates[`comments/${songId}`] = null;

            commentIds.forEach(commentId => {
                updates[`comment-likes/${commentId}`] = null;
            });

            updates[`song-likes/${songId}`] = null;

            console.log(`Attempting to delete song ${songId} with the following full update payload:`, updates);

            try {
                await update(ref(database, '/'), updates);
                setDeleting(false);
                deleteSongNotify();
                console.log(`Song ${songId} and all its references deleted successfully.`);
            } catch (error) {
                setDeleting(false);
                deleteSongFailedNotify();
                console.error(`Error deleting song ${songId} and its references:`, error);
                // No need to re-throw here if you're handling all UI feedback within this function
            }

        } else {
            console.log("Song deletion cancelled by user.");
        }
    }


    return (
        <div className="audio-player-container">
           {isDeleting && (<Spinner deleting={isDeleting} />)} 
            <div className="audio-card-image">
                <img src={props.photoUrl ? props.photoUrl : null} alt="Song" />
            </div>
            <div className="audio-card-content">
                <p className="artist-username">{props.songArtist}</p>
                <p className="song-title">{props.songTitle}</p>

                <div className="controls">
                    <img
                        style={{ width: "16px", height: "16px" }}
                        className={rotate ? 'rotate-once' : ''}
                        src={play}
                        alt="Play"
                        onClick={handlePlay}
                    />
                    <img
                        style={{ width: "16px", height: "16px" }}
                        className={rotateStop ? 'rotate-once' : ''}
                        src={stop}
                        alt="Stop"
                        onClick={handlePause}
                    />
                </div>

                <audio ref={audioRef} src={props.songUrl} />

                <div
                    ref={progressRef}
                    className="progress-bar"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={() => setIsDragging(false)}
                >
                    <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>

                <div className="time-display">
                    {formatTime(currentTime)} / {formatTime(duration)}
                </div>
                {isUser && (<p className='remove-song' onClick={() => { deleteSongAndAllReferences(props.userId, props.songId) }}>x</p>)}

            </div>

        </div>
    );
};




const AudioList = (props) => {
    const [activeIndex, setActiveIndex] = useState(null);
    const [songs, setSongs] = useState([]);


    useEffect(() => {
        setSongs(props.songs)
    }, [])


    return (
        <div>
            {props.songs.map((song, index) => (
                <AudioPlayer
                    key={props.key}
                    songId={song.songId}
                    profileUserId={props.profileUserId}
                    photoUrl={props.photoUrl}
                    songUrl={song.songUrl}
                    songArtist={song.songArtist}
                    songTitle={song.songTitle}
                    accountType={song.accountType}
                    userId={song.userId}
                    isActive={index === activeIndex}
                    onPlay={() => setActiveIndex(index)}
                    onStop={() => index === activeIndex && setActiveIndex(null)}
                />
            ))}

        </div>
    );
};

export default AudioList;

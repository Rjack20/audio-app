import React, { useEffect, useState, useRef } from 'react'
import '../css/AudioPost.css'
import image from '../images/download.avif'
import { useNavigate } from 'react-router';
import AudioPlayer from '../components/AudioPlayer.js'
import heart from '../images/heart.png'
import play from '../images/play.png'
import stop from '../images/stop.png'

import { auth, database } from "../firebase.js";
import { ref, remove, set, update, push, get, child } from "firebase/database";
import commentlogo from '../images/gray-chat.png'
import { useParams } from 'react-router';
import '../css/MusicButton.css'
import '../css/MusicCard.css'
import Comment from '../components/Comment.js'


function AudioPost(props) {
    const [userId, setUserId] = useState('')
    const [photoUrl, setPhotoUrl] = useState('')
    const [comment, setComment] = useState('')
    const [isUser, setIsUser] = useState(false)

    const [profileType, setProfileType] = useState('')
    const [username, setUserName] = useState('')
    const navigate = useNavigate();
    const { UID } = useParams();

    // audio variables
    const audioRef = useRef(null);
    const progressRef = useRef(null);

    const [rotate, setRotate] = useState(false);
    const [rotateStop, setRotateStop] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const progressPercent = duration ? (currentTime / duration) * 100 : 0;



    useEffect(() => {

        
            auth.onAuthStateChanged((user) => {
              if (!user) {
                console.log('no user')
              } else {

                if(user.id == props.userId){
                    setIsUser(true)
                }
                setUserId(user.uid)
                getData(user.uid)
              }
            })
        getData()
        getComment()
    }, [])

    useEffect(() => {
        const audio = audioRef.current;

        const updateTime = () => {
            setCurrentTime(audio.currentTime);
        };

        const setAudioDuration = () => {
            setDuration(audio.duration);
        };

        if (audio) {
            audio.addEventListener('timeupdate', updateTime);
            audio.addEventListener('loadedmetadata', setAudioDuration);
        }

        return () => {
            if (audio) {
                audio.removeEventListener('timeupdate', updateTime);
                audio.removeEventListener('loadedmetadata', setAudioDuration);
            }
        };
    }, []);


    // Stop playback if no longer active
    useEffect(() => {
        if (!props.isActive && audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    }, [props.isActive]);




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
            audioRef.current?.play();
            handleClick()
            props.onPlay();
        }
    };


    const handleStop = () => {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setCurrentTime(0);
        handleStopClick()
        props.onStop();
    };

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

    function getComment() {
        const list = []
        const dbRef = ref(database);
        get(child(dbRef, `comments/${props.songId}`))
            .then((snapshot) => {
                if (snapshot.exists()) {

                    snapshot.forEach((snap) => {

                        const data = {}

                        data.comment = snap.val().comment
                        data.time = snap.val().time
                        data.photoUrl = snap.val().photoUrl
                        data.songUserId = snap.val().songUserId
                        data.userId = snap.val().userId
                        data.userName = snap.val().userName
                        data.commentId = snap.key




                        list.push(data)
                    })
                    setComment(list[0])

                } else {
                    console.log("No data available");
                }
            }).catch((error) => {
                console.error('Lexis', error);
            });



    }

    function getData() {
        const dbRef = ref(database);
        get(child(dbRef, `users/${props.userId}`)).then((snapshot) => {
            if (snapshot.exists()) {
                setUserId(snapshot.val().userId)
                setProfileType(snapshot.val().accountType)
                setPhotoUrl(snapshot.val().photoUrl)
            } else {
                console.log("No data available");
            }
        }).catch((error) => {
            console.error(error);
        });
    }

    
function timeAgo(date) {
 
    
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min${minutes > 1 ? "s" : ""} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
}







    return (
        <div>


            <div class="media-card">
                <audio ref={audioRef} src={props.songUrl} />

                <img src={photoUrl} alt="Album Art" class="media-album-art" onClick={() => {
                    navigate(`/song/${props.songId}/${props.userId}`)
                }} />
                <div class="media-controls">
                    <div class="media-song-info">
                        <p class="media-artist-name" onClick={() => {
                    window.location.replace(`/profile/${props.userId}`)

                        }}>{props.songArtist}</p>
                        <p class="media-artist-title" onClick={() => {
                        window.location.replace(`/profile/${props.userId}`)

                        }} >{profileType}</p>

                        <p class="media-song-title" onClick={() => {
                            navigate(`/song/${props.songId}/${props.userId}`)
                        }}>{props.songTitle}</p>
                        <p style={{ fontSize: "12px", color: 'gray' }}>Uploaded: {timeAgo(new Date(props.time))}</p>
                        <div className='action-buttons' >
                            <div>
                                <img className='music-card-comment1' style={{ width: "16px" }} src={commentlogo} onClick={() => {
                                    navigate(`/song/${props.songId}/${props.userId}`)
                                }} />

                            </div>
                            <div>
                                <img className='music-card-like' style={{ width: "16px" }} src={heart} onClick={() => {
                                    navigate(`/song/${props.songId}/${props.userId}`)
                                }} />

                            </div>
                        </div>
                    </div>

                    <div class="media-button-row">
                        <img className={rotate ? 'rotate-once' : ''} style={{ width: "16px", marginLeft: "5px", cursor: "pointer" }} src={play} onClick={handlePlay}></img>
                        <img className={rotateStop ? 'rotate-once' : ''} style={{ width: "16px", marginLeft: "5px", cursor: "pointer" }} src={stop} onClick={handleStop}></img>

                    </div>
                    <div style={{ height: '10px', backgroundColor: '#ddd', marginTop: '10px', width: '100%', borderRadius: '5px', overflow: 'hidden' }}>
                        <div
                            style={{
                                height: '100%',
                                width: `${progressPercent}%`,
                                backgroundColor: '#007bff',
                                transition: 'width 0.2s ease',
                            }}
                        />
                    </div>
                    <div style={{ color: "gray" }}>{formatTime(currentTime)} / {formatTime(duration)}</div>


                </div>
               
            </div>

            {comment ? <Comment
                comment={comment.comment}
                photoUrl={comment.photoUrl}
                userName={comment.userName}
                commentId={comment.commentId}
                songId={props.songId}
                songUserId={props.userId}
                userId={comment.userId}
                songTitle={props.songTitle}
                time={comment.time}

            /> : null}

        </div>

    );
}

export default AudioPost;

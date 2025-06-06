
import React, { useRef, useState, useEffect } from 'react';
import '../css/VideoPost.css'
import videoPost from '../images/video-post.png'
import { useNavigate } from 'react-router';

export default function VideoPost(props) {
    const [isMuted, setIsMuted] = useState(true);
    const videoRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.muted = isMuted;
            videoRef.current.play().catch((e) => {
                console.log('Autoplay prevented:', e);
            });
        }
    }, [props.videoUrl, isMuted]);

    const toggleMute = () => {
        setIsMuted(!isMuted);
    };

    const handleProfileClick = (e) => {
        e.stopPropagation();
        navigate(`/profile/${props.userId}`)

    };

    const handleUsernameClick = (e) => {
        e.stopPropagation();

        navigate(`/profile/${props.userId}`)
    };


    return (
        <div className='video-post-container'>
            <div className="video-icon-overlay"><img src={videoPost} /></div> {/* You can use an emoji or an actual icon */}
            <video className='video' ref={videoRef} autoPlay muted={isMuted} playsInline loop src={props.videoUrl} onClick={toggleMute} ></video>
            {props.path == null ? <div>
                <img className='video-image-profile' src={props.photoUrl} onClick={(e) => { handleProfileClick(e) }} />
                <p className='video-post-name' onClick={(e) => { handleUsernameClick(e) }}>{props.userName}</p>
            </div>
                : null}

        </div>
    )
}

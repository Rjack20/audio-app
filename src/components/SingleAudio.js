import React, { useRef, useState, useEffect } from 'react';
import play from '../images/play.png'
import stop from '../images/stop.png'
import '../css/SingleAudio.css'

const SingleAudio = (props) => {
    const audioRef = useRef(null);
    const progressRef = useRef(null);

    const [rotate, setRotate] = useState(false);
    const [rotateStop, setRotateStop] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const progressPercent = duration ? (currentTime / duration) * 100 : 0;


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



    const handlePlay = () => {
        if (audioRef.current) {
            audioRef.current?.play();
            handleClick()
        }
    };

    const handleStop = () => {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setCurrentTime(0);
        handleStopClick()
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
    const formatTime = (time) => {
        if (isNaN(time)) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60)
            .toString()
            .padStart(2, '0');
        return `${minutes}:${seconds}`;
    };


    return (
        <div style={{ marginLeft: "30px", marginRight: "30px" }} className='single-audio-player-container '>

            <audio ref={audioRef} src={props.songUrl} />
            <div className='single-controls'>
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
            {formatTime(currentTime)} / {formatTime(duration)}

        </div>
    );
};

export default SingleAudio;
import React, { useRef, useState, useEffect } from "react";
import { uploadBytesResumable, getStorage, getDownloadURL } from "firebase/storage";
import { ref as storageRef, uploadBytes } from 'firebase/storage';
import { getDatabase, serverTimestamp, get, ref, push, set } from 'firebase/database';
import { ToastContainer, toast } from 'react-toastify';

import { auth, database } from "../firebase.js";
import { ClipLoader } from "react-spinners"
import uploadAndPostVideo from "./UploadAndPostVideo.js";
import '../css/VideoRecorder.css'
import { FormControl, FormLabel, Input } from '@mui/joy';

function VideoRecorder(props) {
  const [stream, setStream] = useState(null);
  const [recordedVideoURL, setRecordedVideoURL] = useState(null);
  const [time, setTime] = useState(0);
  const [ready, setReady] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecordedOnce, setHasRecordedOnce] = useState(false);
  const [filter, setFilter] = useState("none");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [recordedBlob, setRecordedBlob] = useState(null);

  const videoRef = useRef(null);
  const recordedVideoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);




  const fakeRedirectToHome = () => {
    window.location.reload()
  };



  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((mediaStream) => {
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setReady(true);
    });
  }, []);


  useEffect(() => {
    if (hasRecordedOnce && props.isClosed) {
      setRecordedVideoURL(null)
    }

  }, [props.isClosed]);


  useEffect(() => {
    if (!stream) return;

    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstart = () => {
      setRecordedVideoURL(null);
      setTime(0);
      setIsRecording(true);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      chunksRef.current = [];
      const url = URL.createObjectURL(blob);
      setRecordedBlob(blob)
      setRecordedVideoURL(url);
      setIsRecording(false);
      setTime(0);
      setHasRecordedOnce(true);

      setTimeout(() => {
        if (recordedVideoRef.current) {
          recordedVideoRef.current.load();
          recordedVideoRef.current.loop = true;
          recordedVideoRef.current.play().catch(() => { });
        }
      }, 100);
    };

    return () => {
      mediaRecorderRef.current = null;
    };
  }, [stream]);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [videoRef, stream]);

  const startRecording = () => {
    if (!mediaRecorderRef.current) return;
    if (isRecording) return;

    if (hasRecordedOnce) {
      fakeRedirectToHome();
      return;
    }

    chunksRef.current = [];
    mediaRecorderRef.current.start();

    timerRef.current = setInterval(() => {
      setTime((t) => {
        if (t >= 29) {
          stopRecording();
          return 30;
        }
        return t + 1;
      });
    }, 1000);
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current || !isRecording) return;

    clearInterval(timerRef.current);
    mediaRecorderRef.current.stop();
  };
  const uploadCompleteNotify = () => toast.success("Post Complete)");
  const noFileNotify = () => toast.success("NO file)");


  // Video Upload
  const handleUpload = async () => {


    if (recordedVideoRef.current) recordedVideoRef.current.pause();



    if (!recordedBlob) {
      noFileNotify()
      return
    }
    setIsLoading(true)
    await uploadAndPostVideo();

  };

  const uploadAndPostVideo = async (file) => {
    try {
      const storage = getStorage();
      const db = getDatabase();

      const timestamp = Date.now();
      const videoPath = `videos/${props.userId}/${timestamp}/${recordedBlob}`;
      const videoStorageRef = storageRef(storage, videoPath);

      // Step 1: Upload video to Firebase Storage
      await uploadBytes(videoStorageRef, recordedBlob);

      // Step 2: Get download URL
      const downloadURL = await getDownloadURL(videoStorageRef);

      // Step 3: Save metadata to Realtime Database

      const videosRef = ref(db, 'videos');

      const newVideoRef = await push(videosRef, {
        videoUrl: downloadURL,
        userName: props.userName,
        userId: props.userId,
        photoUrl: props.photoUrl,
        description: description ? description : '',
        time: serverTimestamp()
      });

      const videoKey = newVideoRef.key;

      // Step 4: Link under /user-videos/userId/videoKey
      const userVideoRef = ref(db, `user-videos/${props.userId}/${videoKey}`);
      await set(userVideoRef, true);
      setIsLoading(false)
      uploadCompleteNotify()
      window.location.reload()

      console.log(`✅ Video uploaded and saved. Video ID: ${videoKey}`);
    } catch (error) {
      console.error('❌ Error uploading and posting video:', error);
    }
  };


  const RADIUS = 54;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const progress = (time / 30) * CIRCUMFERENCE;

  return (
    <div className="recorder-container">

      <ToastContainer
        autoClose={4000}
        position="bottom-center"
        hideProgressBar={true}
        theme='dark'
      />
      {/* Filter selector */}
                 <div className="filter-dropdown-container"> {/* New wrapper div for styling */}
                    <label htmlFor="filter" className="filter-label"> {/* New class for label */}
                        Filter:
                    </label>
                    <select
                        id="filter"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="custom-filter-select" // <--- ADD THIS CLASS
                    >
                        <option value="none">None</option>
                        <option value="grayscale(100%)">Grayscale</option>
                        <option value="sepia(100%)">Sepia</option>
                        <option value="brightness(150%)">Brightness</option>
                        <option value="hue-rotate(270deg) saturate(250%)">Electric Shift</option>
                        <option value="contrast(150%)">Contrast</option>
                        {/* Removed Opacity as it usually reduces visibility too much for a filter */}
                        <option value="invert(100%)">Invert</option>
                        <option value="saturate(200%)">Saturate</option>
                    </select>
                </div>
      {/* Filter selector */}

      {/*Video Playback */}
      {!recordedVideoURL && ready && (
        <video
          ref={videoRef}
          autoPlay
          muted
          className="video-preview"
          controls={false}
          style={{ filter }}
        />
      )}

      {recordedVideoURL && (
        <video
          ref={recordedVideoRef}
          src={recordedVideoURL}
          on
          loop
          className="video-preview"
          controls={false}
          style={{ filter }}
        />
      )}
      {/*Video Playback */}


      {/*Record Button*/}
      {isRecording && <div className="countdown-label">{30 - time}s</div>}

      <div

        onMouseDown={startRecording}
        onMouseUp={stopRecording}
        onTouchStart={startRecording}
        onTouchEnd={stopRecording}
      >


        <svg
          width="55px"
          height="55px"
          viewBox="0 0 120 120"

          style={{ margin: "6px" }}
        >
          <circle
            stroke="#ddd"
            fill="transparent"
            strokeWidth="8"
            r={RADIUS}
            cx="60"
            cy="60"
          />

          <text
            x="60px"
            y="65px"
            textAnchor="middle"
            fontSize="17px"
            fill="white"
            fontFamily="Arial, sans-serif"
          >
            {isRecording ? "Recording" : "Hold"}
          </text>
          <circle
            stroke="red"
            fill="transparent"
            strokeWidth="8"
            r={RADIUS}
            cx="60"
            cy="60"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE - progress}
            strokeLinecap="round"
            style={{ transition: isRecording ? "stroke-dashoffset 1s linear" : "none" }}
          />
        </svg>

      </div>
      {/*Record Button*/}

      {/*Post Button*/}
      <div>
        {recordedVideoURL && (
          <button className="post-button" onClick={handleUpload} disabled={isLoading}>

            
            
              Post
            

          </button>
        )}
      </div>


      {/*Post Button*/}
      <FormControl>
        <Input placeholder="Description..." value={description} onChange={(e) => setDescription(e.target.value)} />
      </FormControl>
      {isLoading ? <div> <ClipLoader cssOverride={{ margin: "6px" }} color="#ffffff" />
        Just a min, Posting.... </div> : null

      }

    </div>
  );
}

export default VideoRecorder;

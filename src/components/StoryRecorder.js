import React, { useRef, useState, useEffect } from 'react';

export default  function StoryRecorder(){
   const [stream, setStream] = useState(null);
  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunks = useRef([]);
  const liveVideoRef = useRef(null);
  const recordedVideoRef = useRef(null);


  useEffect(() => {
    async function getMedia() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true, // Make sure audio is requested
        });
        setStream(mediaStream);
        if (liveVideoRef.current) {
          liveVideoRef.current.srcObject = mediaStream;
          liveVideoRef.current.play(); // Ensure playback starts
        }
      } catch (err) {
        console.error("Failed to get media:", err);
      }
    }
    getMedia();
  }, []);


  const startRecording = () => {
    if (!stream) return;

    chunks.current = [];
    const mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.current.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks.current, { type: "video/webm" });
      setRecordedBlob(blob);
    };

    mediaRecorder.start();
    mediaRecorderRef.current = mediaRecorder;
    setRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  };

  return (
    <div style={{ position: "relative", width: 360, height: 640 }}>
      {!recordedBlob ? (
        <video
          ref={liveVideoRef}
          style={{ width: 360, height: 640, backgroundColor: "black" }}
          autoPlay
          playsInline
          // Remove muted so audio plays live
          muted={false}
          controls={false}
        />
      ) : (
        <video
          ref={recordedVideoRef}
          style={{ width: 360, height: 640, backgroundColor: "black" }}
          src={URL.createObjectURL(recordedBlob ? recordedBlob : null)}
          controls
          autoPlay
          loop
        />
      )}

      <button
        style={{
          position: "absolute",
          bottom: 20,
          left: "50%",
          transform: "translateX(-50%)",
          width: 64,
          height: 64,
          borderRadius: "50%",
          backgroundColor: recording ? "red" : "gray",
          border: "none",
          fontSize: 24,
          color: "white",
        }}
        onMouseDown={startRecording}
        onMouseUp={stopRecording}
        onTouchStart={startRecording}
        onTouchEnd={stopRecording}
      >
        ●
      </button>
    </div>
  );
}
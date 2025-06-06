import React, { useEffect, useState } from 'react'
import { ref, get, child } from "firebase/database";
import { database } from "../firebase.js";
import { useNavigate } from 'react-router';

import VideoPost from './VideoPost.js';

export default function VideoFeed() {
  const [videos, setVideos] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const navigate = useNavigate();


  useEffect(() => {
    getVideos();
  }, []);

  function getVideos() {
    const list = [];
    const dbRef = ref(database);
    get(child(dbRef, `videos`))
      .then((snapshot) => {
        if (snapshot.exists()) {
          snapshot.forEach((snap) => {
            const data = {
              videoUrl: snap.val().videoUrl,
              userName: snap.val().userName,
              description: snap.val().description,
              time: snap.val().time,
              userId: snap.val().userId,
              photoUrl: snap.val().photoUrl,

              videoId: snap.key


            };
            list.push(data);
          });
          setVideos(list);
        } else {
          console.log("No data available");
        }
      })
      .catch((error) => {
        console.error('Users', error);
      });
  }

  return (
    <div className="video-grid">

      {videos.map((video, index) => (
        <div key={index} onClick={() => navigate('/watch', { state: { videos, index } })}>
          <VideoPost videoId={video.videoId} time={video.time} userId={video.userId} userName={video.userName} photoUrl={video.photoUrl} videoUrl={video.videoUrl} />
        </div>
      ))}
    </div>
  );
}

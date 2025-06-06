import React, { useEffect, useState } from 'react'
import MusicCard from './MusicCard';
import { useNavigate } from 'react-router';
import { ref, set, update, push, get, child } from "firebase/database";
import { auth, database } from "../firebase.js";
import '../css/BrowseMusic.css'
import AudioPost from './AudioPost.js';
import { useParams } from 'react-router';
import VideoFloatButton from './VideoFloatButton.js';
import VideoPostDrawer from './VideoPostDrawer.js';


export default function BrowseMusic() {
  const [currentUser, setCurrentUser] = useState('')
  const [songs, setSongs] = useState([])
  const [timeline, setTimelinePosts] = useState([])
  const [loading, setLoading] = useState(true);
    const [activeIndex, setActiveIndex] = useState(null);
  const { UID } = useParams();




  const navigate = useNavigate();







  useEffect(() => {


    auth.onAuthStateChanged((user) => {
      if (!user) {
        console.log('no user')
      } else {
        setCurrentUser(user.uid)

      }

      //getUsersId()


    })


  }, [])




  useEffect(() => {

    getSongs()


  }, []);

  function getSongs() {
    const list = []
    const data = {}
    const dbRef = ref(database);
    get(child(dbRef, `songs`))
      .then((snapshot) => {
        if (snapshot.exists()) {

          snapshot.forEach((snap) => {

            const data = {
              songArtist: snap.val().songArtist,
              songUrl: snap.val().songUrl,
              songId: snap.key,
              userId: snap.val().userId,
              songTitle: snap.val().songTitle,
              time:  snap.val().time
            };





            list.push(data)
          })
          setSongs(list)

        } else {
          console.log("No data available");
        }
      })
      .catch((error) => {
        console.error('Users', error);
      });




  }

  return (
    <div className='browse-music-container' style={{ marginTop: "45px" }}>
   <VideoPostDrawer userId={UID}/>
   {songs ? songs.map((song, index) => (

          <AudioPost
            key={index}
            songTitle={song.songTitle}
            songArtist={song.songArtist}
            songUrl={song.songUrl}
            userId={song.userId}
            songId={song.songId}
            UID={UID}
            time={song.time}
             isActive={index === activeIndex}
            onPlay={() => setActiveIndex(index)}
            onStop={() => index === activeIndex && setActiveIndex(null)}



          />
        )) : null}
    </div>
  );

}

import React, { useState, useRef, useEffect } from 'react'
import { ref, set, update, push, get, child } from "firebase/database";
import { useParams } from 'react-router';
import { useNavigate } from 'react-router';
import { auth, database } from "../firebase.js";
import AudioPost from './AudioPost.js';

export default function Artist() {
  const [currentUser, setCurrentUser] = useState('')
  const [songs, setSongs] = useState([]);
  const [activeIndex, setActiveIndex] = useState(null);

  const { UID } = useParams();


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
            if (snap.val().title === 'Artist') {
              const data = {
                songArtist: snap.val().songArtist,
                songUrl: snap.val().songUrl,
                songId: snap.key,
                userId: snap.val().userId,
                songTitle: snap.val().songTitle,
                title: snap.val().title,
                time: snap.val().time
              };


              list.push(data)
            }







          })
          setSongs(list)
          console.log(list)
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


      {songs ? songs.map((song, index) => (

        <AudioPost
          key={index}
          songTitle={song.songTitle}
          songArtist={song.songArtist}
          songUrl={song.songUrl}
          userId={song.userId}
          songId={song.songId}
          time={song.time}
          isActive={index === activeIndex}
          onPlay={() => setActiveIndex(index)}
          onStop={() => index === activeIndex && setActiveIndex(null)}



        />
      )) : null}
    </div>
  )
}
